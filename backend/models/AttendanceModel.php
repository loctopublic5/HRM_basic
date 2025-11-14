<?php
class AttendanceModel extends BaseModel {
    
    protected string $tableName = 'attendance_logs';

    private function findOpenSession(string $employeeId): ?array {
        $query = "SELECT * FROM " . $this->tableName . " 
                WHERE employee_id = :employee_id AND check_out_time IS NULL AND is_active = 1
                LIMIT 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':employee_id' => $employeeId]);
        $result = $stmt->fetch();
        return $result === false ? null : $result;
    }

    /**
     * (Hàm nội bộ) Lấy chi tiết ca làm từ bảng work_shifts.
     */
    private function getShiftDetails(int $shiftId): ?array {
        $stmt = $this->pdo->prepare("SELECT * FROM work_shifts WHERE id = :id AND is_active = 1");
        $stmt->execute([':id' => $shiftId]);
        $result = $stmt->fetch();
        return $result === false ? null : $result;
    }

    // --- HÀM NGHIỆP VỤ (CẬP NHẬT) ---

    /**
     * HÀM 1: Xử lý Check In (ĐÃ TÁI CẤU TRÚC - Bước 4.A)
     * Tự động tìm ca làm việc (shift_id) mặc định của nhân viên.
     * @param string $employeeId
     * @return bool
     * @throws Exception
     */
    public function checkIn(string $employeeId): bool {
        // 1. Kiểm tra phiên đang mở (logic cũ, vẫn đúng)
        $openSession = $this->findOpenSession($employeeId);
        if ($openSession) {
            throw new Exception('Bạn phải check-out phiên làm việc trước đó trước khi check-in mới.', 409);
        }
        
        $todayString = date('Y-m-d');

        // 2. TÌM CA LÀM VIỆC MẶC ĐỊNH (Logic Mới)
        $empStmt = $this->pdo->prepare("SELECT shift_id FROM employees WHERE id = :id AND is_active = 1");
        $empStmt->execute([':id' => $employeeId]);
        $employee = $empStmt->fetch();
        
        if (!$employee || empty($employee['shift_id'])) {
            throw new Exception('Nhân viên này chưa được gán ca làm việc mặc định.', 400);
        }
        $shiftId = $employee['shift_id'];

        // 3. Tạo bản ghi chấm công (Thêm shift_id)
        $query = "INSERT INTO " . $this->tableName . " 
                    (employee_id, shift_id, date, check_in_time, check_out_time, status, is_active) 
                VALUES 
                    (:employee_id, :shift_id, :date, NOW(), NULL, NULL, 1)";
        
        $stmt = $this->pdo->prepare($query);
        return $stmt->execute([
            ':employee_id' => $employeeId,
            ':shift_id' => $shiftId, // Ghi lại ca làm vào log
            ':date' => $todayString
        ]);
    }

/**
     * Hàm 2: Xử lý Check Out (Logic "thông minh" - ĐÃ SỬA LỖI).
     * CHỈ TÍNH VÀ LƯU SỐ GIỜ DƯƠNG CỦA PHIÊN LÀM VIỆC.
     * @param string $employeeId
     * @return bool
     * @throws Exception
     */
    public function checkOut(string $employeeId): bool {
        // 1. Tìm phiên làm việc "đang mở"
        $openSession = $this->findOpenSession($employeeId);
        if (!$openSession) {
            throw new Exception('Bạn chưa check-in hoặc đã check-out rồi.', 400);
        }

        // 2. Tạo 2 đối tượng DateTime
        $checkInTime = new DateTime($openSession['check_in_time']);
        $checkOutTime = new DateTime(); // Lấy thời gian ngay bây giờ

        // 3. Tính chênh lệch của CHỈ PHIÊN này (tính bằng giây)
        $intervalInSeconds = $checkOutTime->getTimestamp() - $checkInTime->getTimestamp();
        
        // 4. Chuyển đổi giây sang giờ (SỐ DƯƠNG, ví dụ: 2.5)
        $workDuration = round($intervalInSeconds / 3600, 2); 

        // 5. Cập nhật bản ghi với SỐ DƯƠNG
        $query = "UPDATE " . $this->tableName . " 
                SET 
                    check_out_time = NOW(),
                    work_duration = :work_duration,
                    status = 'Hợp lệ'
                WHERE 
                    id = :id";
        
        $stmt = $this->pdo->prepare($query);
        return $stmt->execute([
            ':work_duration' => $workDuration, 
            ':id' => $openSession['id']
        ]);
    }

/**
     * Hàm 3: API Thống kê (NÂNG CẤP LOGIC NGHỈ TRƯA).
     * @param string $employeeId
     * @param int $month (1-12)
     * @param int $year
     * @return array
     * @throws Exception
     */
    public function getMonthlyAttendanceSummary(string $employeeId, int $month, int $year): array {
        
        // 1. Lấy giờ chuẩn của nhân viên (Giữ nguyên)
        $shiftQuery = "
            SELECT ws.total_standard_hours 
            FROM employees e
            JOIN work_shifts ws ON e.shift_id = ws.id
            WHERE e.id = :employee_id AND e.is_active = 1 AND ws.is_active = 1
        ";
        $shiftStmt = $this->pdo->prepare($shiftQuery);
        $shiftStmt->execute([':employee_id' => $employeeId]);
        $shift = $shiftStmt->fetch();
        $standardWorkHoursPerDay = $shift ? (float)$shift['total_standard_hours'] : 8.0;

        // 2. SQL TỔNG HỢP THEO NGÀY (Cần SỬA LẠI - Thêm shift_id)
        // Chúng ta cần shift_id để biết ca đó nghỉ trưa bao lâu
        $query = "
            SELECT 
                date,
                shift_id, -- Lấy shift_id của ngày đó
                SUM(work_duration) as total_daily_hours_worked,
                MIN(check_in_time) as first_check_in,
                MAX(check_out_time) as last_check_out
            FROM " . $this->tableName . "
            WHERE 
                employee_id = :employee_id 
                AND MONTH(date) = :month 
                AND YEAR(date) = :year
                AND status = 'Hợp lệ' AND is_active = 1
            GROUP BY 
                date, shift_id -- Thêm shift_id vào GROUP BY
            ORDER BY
                date ASC
        ";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':employee_id' => $employeeId, ':month' => $month, ':year' => $year]);
        $dailySummaries = $stmt->fetchAll();

        // 3. LOGIC PHP (Đã nâng cấp)
        $totalOvertimeHours = 0; $totalUndertimeHours = 0; $totalLateIncidents = 0; $totalEarlyLeaveIncidents = 0;
        $totalWorkDays = count($dailySummaries);

        foreach ($dailySummaries as $day) {
            // Lấy TỔNG giờ làm (đã SUM từ SQL)
            $dailyHoursSum = (float)$day['total_daily_hours_worked'];

            // Lấy chi tiết ca làm (bao gồm cả giờ nghỉ)
            $shiftDetails = $this->getShiftDetails($day['shift_id']);
            if (!$shiftDetails) continue; // Bỏ qua nếu ca làm không hợp lệ

            // SỬ DỤNG GIỜ NGHỈ TỪ CA LÀM (THAY VÌ HARDCODE 1.0)
            $breakHours = (float)$shiftDetails['break_hours']; 

            $firstCheckIn = new DateTime($day['first_check_in']);
            $lastCheckOut = new DateTime($day['last_check_out']);
            $totalTimeAtWork = ($lastCheckOut->getTimestamp() - $firstCheckIn->getTimestamp()) / 3600;

            $dailyHoursNet = $dailyHoursSum;
            
            // Logic trừ nghỉ trưa "thông minh"
            if ($totalTimeAtWork > 5.0) {
                $dailyHoursNet = $dailyHoursSum - $breakHours; 
            }
            
            // 4. SO SÁNH VỚI GIỜ CHUẨN
            if ($dailyHoursNet > $standardWorkHoursPerDay) {
                $totalOvertimeHours += ($dailyHoursNet - $standardWorkHoursPerDay);
            } else {
                $totalUndertimeHours += ($standardWorkHoursPerDay - $dailyHoursNet);
            }
        }

        // 5. Trả về kết quả tổng hợp
        return [
            "employee_id" => $employeeId, "month" => $month, "year" => $year,
            "standard_work_hours_per_day" => $standardWorkHoursPerDay,
            "total_overtime_hours" => round($totalOvertimeHours, 2),
            "total_undertime_hours" => round($totalUndertimeHours, 2),
            "total_late_incidents" => $totalLateIncidents,
            "total_early_leave_incidents" => 0, // Sẽ thêm logic này sau
            "total_work_days" => $totalWorkDays
        ];
    }
}
?>