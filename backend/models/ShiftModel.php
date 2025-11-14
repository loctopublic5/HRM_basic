<?php
// backend/models/ShiftModel.php

class ShiftModel extends BaseModel {
    
    /**
     * Tên bảng CSDL mà Model này quản lý.
     * @var string
     */
    protected string $tableName = 'work_shifts';

    /**
     * Lấy tất cả các ca làm việc đang hoạt động (is_active = 1).
     * @return array Danh sách các ca làm việc.
     */
    public function getAll(): array {
        $query = "SELECT id, shift_name, total_standard_hours 
                  FROM " . $this->tableName . " 
                  WHERE is_active = 1 
                  ORDER BY shift_name ASC";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Thêm một ca làm việc mới.
     * @param object $data Dữ liệu từ request body (chứa 'shift_name', 'total_standard_hours').
     * @return array Dữ liệu ca làm việc vừa được tạo.
     * @throws Exception Nếu tạo thất bại.
     */
    public function create(object $data): array {
        $shiftName = htmlspecialchars(strip_tags($data->shift_name));
        $totalHours = floatval($data->total_standard_hours);

        // (Tùy chọn) Bạn có thể thêm logic kiểm tra trùng tên ca ở đây nếu muốn
        
        $query = "INSERT INTO " . $this->tableName . " 
                    (shift_name, total_standard_hours, is_active) 
                  VALUES 
                    (:shift_name, :total_standard_hours, 1)";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':shift_name', $shiftName);
        $stmt->bindParam(':total_standard_hours', $totalHours);

        if ($stmt->execute()) {
            $id = $this->pdo->lastInsertId(); // Lấy ID tự tăng vừa được tạo
            return [
                'id' => (int)$id, 
                'shift_name' => $shiftName, 
                'total_standard_hours' => $totalHours
            ];
        }
        
        throw new Exception('Lỗi máy chủ: Không thể tạo ca làm việc.', 500);
    }

    /**
     * Cập nhật một ca làm việc.
     * @param int $id ID ca làm việc.
     * @param object $data Dữ liệu mới.
     * @return bool True nếu cập nhật thành công.
     */
    public function update(int $id, object $data): bool {
        $shiftName = htmlspecialchars(strip_tags($data->shift_name));
        $totalHours = floatval($data->total_standard_hours);

        $query = "UPDATE " . $this->tableName . " 
                SET 
                    shift_name = :shift_name, 
                    total_standard_hours = :total_standard_hours
                WHERE 
                id = :id AND is_active = 1";      
        $stmt = $this->pdo->prepare($query);
        
        $stmt->bindParam(':shift_name', $shiftName);
        $stmt->bindParam(':total_standard_hours', $totalHours);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    /**
     * Xóa mềm một ca làm việc.
     * @param int $id ID ca làm việc.
     * @return bool True nếu thành công.
     */
    public function softDelete(int $id): bool {
        $query = "UPDATE " . $this->tableName . " SET is_active = 0 WHERE id = :id";
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
?>