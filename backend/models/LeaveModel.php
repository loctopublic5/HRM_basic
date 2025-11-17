<?php
class LeaveModel extends BaseModel {
    
    protected string $tableName = 'leave_requests';

    /**
     * Hàm 1: Tạo yêu cầu nghỉ phép mới (requestLeave)
     * Mặc định status sẽ là 'pending'.
     * @param object $data Dữ liệu từ request body.
     * @return bool True nếu tạo thành công.
     * @throws Exception
     */
    public function create(object $data): bool {
        // 1. Validation dữ liệu
        $startDate = $data->start_date;
        $endDate = $data->end_date;

        if (strtotime($endDate) < strtotime($startDate)) {
            throw new Exception("Ngày kết thúc không thể trước ngày bắt đầu.", 400);
        }

        // 2. Chuẩn bị câu truy vấn
        $query = "INSERT INTO " . $this->tableName . " 
                    (employee_id, leave_type, start_date, end_date, reason, status, is_active) 
                VALUES 
                    (:employee_id, :leave_type, :start_date, :end_date, :reason, 'pending', 1)";
        
        $stmt = $this->pdo->prepare($query);

        // 3. Làm sạch và Bind dữ liệu
        $employeeId = htmlspecialchars(strip_tags($data->employee_id));
        $leaveType = htmlspecialchars(strip_tags($data->leave_type));
        $reason = htmlspecialchars(strip_tags($data->reason));

        $stmt->bindParam(':employee_id', $employeeId);
        $stmt->bindParam(':leave_type', $leaveType);
        $stmt->bindParam(':start_date', $startDate);
        $stmt->bindParam(':end_date', $endDate);
        $stmt->bindParam(':reason', $reason);

        if ($stmt->execute()) {
            return true;
        }
        throw new Exception("Lỗi máy chủ: Không thể tạo yêu cầu nghỉ phép.", 500);
    }

    /**
     * Hàm 2: Lấy lịch sử nghỉ phép của một nhân viên.
     * @param string $employeeId
     * @return array
     */
    public function getLeaveHistory(string $employeeId): array {
        $query = "SELECT * FROM " . $this->tableName . " 
                WHERE employee_id = :employee_id AND is_active = 1 
                ORDER BY created_at DESC";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':employee_id' => $employeeId]);
        return $stmt->fetchAll();
    }

    /**
     * Hàm 3: Lấy danh sách các yêu cầu đang chờ duyệt (cho Admin).
     * Có JOIN với bảng employees để lấy tên nhân viên.
     * @return array
     */
    public function getPendingRequests(): array {
        $query = "SELECT 
                    lr.*, 
                    e.name as employee_name 
                FROM " . $this->tableName . " lr
                JOIN employees e ON lr.employee_id = e.id
                WHERE lr.status = 'pending' AND lr.is_active = 1
                ORDER BY lr.start_date ASC";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * (Hàm Hỗ trợ) Lấy chi tiết một yêu cầu theo ID.
     * Cần thiết cho bước 'Duyệt' để biết thông tin ngày tháng mà insert vào Attendance.
     */
    public function getById(int $id): ?array {
        $query = "SELECT * FROM " . $this->tableName . " WHERE id = :id AND is_active = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        return $result === false ? null : $result;
    }

    /**
     * (Hàm Hỗ trợ) Cập nhật trạng thái (Duyệt/Từ chối).
     * @param int $id ID yêu cầu.
     * @param string $status 'approved' hoặc 'rejected'.
     * @param int $approverId ID của người duyệt (admin).
     */
    public function updateStatus(int $id, string $status, int $approverId): bool {
        $query = "UPDATE " . $this->tableName . " 
                SET status = :status, approved_by_user_id = :approver_id 
                WHERE id = :id";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':approver_id', $approverId);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }
}
?>