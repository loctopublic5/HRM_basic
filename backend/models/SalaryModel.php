<?php
class SalaryModel extends BaseModel {
    
    /**
     * Tên bảng CSDL mà Model này quản lý.
     * @var string
     */
    protected string $tableName = 'salary_history';

    /**
     * Thêm một bản ghi điều chỉnh lương mới.
     * @param object $data Dữ liệu từ Controller.
     * @return bool True nếu thành công.
     * @throws Exception Nếu tạo thất bại.
     */
    public function addAdjustment(object $data): bool {
        $query = "INSERT INTO " . $this->tableName . " 
                    (employee_id, position_id, change_type, amount, effective_date, reason, created_by_user_id, is_active) 
                VALUES 
                    (:employee_id, :position_id, :change_type, :amount, :effective_date, :reason, :created_by_user_id, 1)";
        
        $stmt = $this->pdo->prepare($query);

        // Làm sạch dữ liệu cơ bản
        $employeeId = htmlspecialchars(strip_tags($data->employee_id));
        $positionId = htmlspecialchars(strip_tags($data->position_id));
        $changeType = htmlspecialchars(strip_tags($data->change_type));
        $amount = floatval($data->amount); // Đảm bảo là số
        $effectiveDate = htmlspecialchars(strip_tags($data->effective_date));
        $reason = htmlspecialchars(strip_tags($data->reason));
        $userId = $data->created_by_user_id; // Giả sử đã an toàn (sẽ lấy từ session sau)

        // Bind các tham số
        $stmt->bindParam(':employee_id', $employeeId);
        $stmt->bindParam(':position_id', $positionId);
        $stmt->bindParam(':change_type', $changeType);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':effective_date', $effectiveDate);
        $stmt->bindParam(':reason', $reason);
        $stmt->bindParam(':created_by_user_id', $userId);

        if ($stmt->execute()) {
            return true;
        }
        
        throw new Exception('Lỗi máy chủ: Không thể thêm bản ghi lương.', 500);
    }

    /**
     * Lấy tất cả lịch sử điều chỉnh lương của một nhân viên.
     * @param string $employeeId ID của nhân viên.
     * @return array Danh sách lịch sử.
     */
    public function getSalaryHistoryForEmployee(string $employeeId): array {
        $query = "SELECT 
                    sh.effective_date, 
                    sh.change_type, 
                    sh.amount, 
                    sh.reason,
                    p.title as position_name
                FROM " . $this->tableName . " sh
                LEFT JOIN positions p ON sh.position_id = p.id
                WHERE 
                    sh.employee_id = :employee_id AND sh.is_active = 1
                ORDER BY 
                    sh.effective_date DESC";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':employee_id' => $employeeId]);
        return $stmt->fetchAll();
    }

    /**
     * Tính toán "Hồ sơ Lương" (Salary Profile) của một nhân viên.
     * @param string $employeeId ID của nhân viên.
     * @return array|null Hồ sơ lương hoặc null nếu không tìm thấy nhân viên.
     */
    public function calculateEmployeeSalaryProfile(string $employeeId): ?array {
        // Câu truy vấn này dùng JOIN và GROUP BY
        $query = "
            SELECT 
                -- 1. Lấy thông tin cơ bản
                e.id AS employee_id,
                e.name AS employee_name,
                p.title AS position_title,
                p.salary_base,
                
                -- 2. Dùng SUM(CASE...WHEN...) để tính tổng phụ cấp
                -- Chỉ tính tổng các khoản 'allowance'
                -- VÀ phải khớp với 'position_id' HIỆN TẠI của nhân viên
                COALESCE(SUM(CASE 
                    WHEN sh.change_type = 'allowance' AND sh.position_id = e.position_id 
                    THEN sh.amount 
                    ELSE 0 
                END), 0) AS total_allowance
                
            FROM 
                employees e
            LEFT JOIN 
                positions p ON e.position_id = p.id
            LEFT JOIN 
                salary_history sh ON e.id = sh.employee_id AND sh.is_active = 1
            WHERE 
                e.id = :employee_id AND e.is_active = 1
            GROUP BY
                e.id, e.name, p.title, p.salary_base
        ";

        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':employee_id' => $employeeId]);
        $profile = $stmt->fetch();

        if ($profile === false) {
            return null; // Không tìm thấy nhân viên
        }

        // 3. Tính toán tổng lương cuối cùng
        $profile['final_salary'] = (float)$profile['salary_base'] + (float)$profile['total_allowance'];
        
        return $profile;
    }
}
?>
