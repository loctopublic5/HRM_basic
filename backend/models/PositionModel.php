<?php
class PositionModel extends BaseModel {
    
    /**
     * Tên bảng CSDL mà Model này quản lý.
     * @var string
     */
    protected string $tableName = 'positions';

    /**
     * Lấy tất cả các vị trí đang hoạt động (is_active = 1).
     * @return array Danh sách các vị trí.
     */
    public function getAll(): array {
        // Chúng ta JOIN với bảng departments để lấy tên phòng ban
        // Điều này rất hữu ích cho việc hiển thị ở frontend
        $query = "SELECT 
                    p.id, 
                    p.title, 
                    p.description, 
                    p.salary_base, 
                    p.department_id, 
                    d.name as department_name 
                FROM " . $this->tableName . " p
                LEFT JOIN departments d ON p.department_id = d.id
                WHERE p.is_active = 1 AND (d.is_active = 1 OR d.is_active IS NULL)
                ORDER BY p.title ASC";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Lấy một vị trí theo ID (và phải đang hoạt động).
     * @param string $id ID của vị trí.
     * @return array|null Dữ liệu vị trí hoặc null nếu không tìm thấy.
     */
    public function getById(string $id): ?array {
        $query = "SELECT * FROM " . $this->tableName . " WHERE id = :id AND is_active = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        return $result === false ? null : $result;
    }
    
    /**
     * Lấy tất cả vị trí thuộc về một phòng ban cụ thể.
     * (Hàm này rất quan trọng cho form Thêm/Sửa Nhân viên sau này).
     * @param string $departmentId ID của phòng ban.
     * @return array Danh sách các vị trí.
     */
    public function getAllByDepartment(string $departmentId): array {
        $query = "SELECT id, title, salary_base 
                FROM " . $this->tableName . " 
                WHERE department_id = :department_id AND is_active = 1 
                ORDER BY title ASC";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':department_id' => $departmentId]);
        return $stmt->fetchAll();
    }

    /**
     * Thêm một vị trí mới.
     * @param object $data Dữ liệu từ request body.
     * @return array Dữ liệu vị trí vừa được tạo.
     * @throws Exception Nếu tên đã tồn tại trong phòng ban hoặc tạo thất bại.
     */
    public function create(object $data): array {
        // Làm sạch dữ liệu
        $title = htmlspecialchars(strip_tags($data->title));
        $description = htmlspecialchars(strip_tags($data->description ?? ''));
        $salaryBase = floatval($data->salaryBase);
        $departmentId = htmlspecialchars(strip_tags($data->departmentId));

        // Validation: Kiểm tra trùng tên trong cùng phòng ban
        if ($this->findByTitleAndDepartment($title, $departmentId)) {
            throw new Exception('Tên vị trí đã tồn tại trong phòng ban này.', 409);
        }

        $id = 'pos_' . time();
        $query = "INSERT INTO " . $this->tableName . " (id, title, description, salary_base, department_id) 
                VALUES (:id, :title, :description, :salary_base, :department_id)";
        
        $stmt = $this->pdo->prepare($query);
        
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':salary_base', $salaryBase);
        $stmt->bindParam(':department_id', $departmentId);

        if ($stmt->execute()) {
            return [
                'id' => $id, 
                'title' => $title, 
                'salary_base' => $salaryBase, 
                'department_id' => $departmentId
            ];
        }
        
        throw new Exception('Lỗi máy chủ: Không thể tạo vị trí.', 500);
    }

    /**
     * Cập nhật một vị trí.
     * @param string $id ID vị trí cần cập nhật.
     * @param object $data Dữ liệu từ request body.
     * @return bool True nếu cập nhật thành công.
     */
    public function update(string $id, object $data): bool {
        $title = htmlspecialchars(strip_tags($data->title));
        $description = htmlspecialchars(strip_tags($data->description ?? ''));
        $salaryBase = floatval($data->salaryBase);
        $departmentId = htmlspecialchars(strip_tags($data->departmentId));
        
        // Validation: Kiểm tra trùng tên
        $existing = $this->findByTitleAndDepartment($title, $departmentId);
        if ($existing && $existing['id'] !== $id) {
            throw new Exception('Tên vị trí đã tồn tại trong phòng ban này.', 409);
        }

        $query = "UPDATE " . $this->tableName . " 
                SET title = :title, 
                    description = :description, 
                    salary_base = :salary_base, 
                    department_id = :department_id 
                WHERE id = :id AND is_active = 1";
                
        $stmt = $this->pdo->prepare($query);
        
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':salary_base', $salaryBase);
        $stmt->bindParam(':department_id', $departmentId);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    /**
     * Xóa mềm một vị trí.
     * @param string $id ID vị trí cần xóa.
     * @return bool True nếu thành công.
     */
    public function softDelete(string $id): bool {
        $query = "UPDATE " . $this->tableName . " SET is_active = 0 WHERE id = :id";
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    /**
     * (Hàm nội bộ) Tìm vị trí theo Tên và Phòng ban.
     * @param string $title
     * @param string $departmentId
     * @return array|null
     */
    private function findByTitleAndDepartment(string $title, string $departmentId): ?array {
        $query = "SELECT id FROM " . $this->tableName . " 
                WHERE title = :title 
                AND department_id = :department_id 
                AND is_active = 1";
                
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':title' => $title, ':department_id' => $departmentId]);
        $result = $stmt->fetch();
        return $result === false ? null : $result;
    }
}
?>
