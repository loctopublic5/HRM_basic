<?php
// backend/models/DepartmentModel.php

/**
 * DepartmentModel kế thừa từ BaseModel,
 * chịu trách nhiệm tương tác với bảng 'departments' trong CSDL.
 */
class DepartmentModel extends BaseModel {
    
    /**
     * Tên bảng CSDL mà Model này quản lý.
     * @var string
     */
    protected string $tableName = 'departments';

    /**
     * Lấy tất cả phòng ban đang hoạt động (is_active = 1).
     * @return array Danh sách các phòng ban.
     */
    public function getAll(): array {
        // Câu truy vấn luôn lọc theo 'is_active = 1' (logic Xóa Mềm)
        $query = "SELECT id, name FROM " . $this->tableName . " WHERE is_active = 1 ORDER BY name ASC";
        
        // $this->pdo đã có sẵn từ BaseModel
        $stmt = $this->pdo->prepare($query); 
        $stmt->execute();
        
        // Trả về tất cả các hàng
        return $stmt->fetchAll(); 
    }

    /**
     * Lấy một phòng ban theo ID (và phải đang hoạt động).
     * @param string $id ID của phòng ban.
     * @return array|null Dữ liệu phòng ban hoặc null nếu không tìm thấy.
     */
    public function getById(string $id): ?array {
        $query = "SELECT id, name FROM " . $this->tableName . " WHERE id = :id AND is_active = 1";
        
        $stmt = $this->pdo->prepare($query);
        // Gửi dữ liệu một cách an toàn
        $stmt->execute([':id' => $id]); 
        
        // Lấy 1 hàng
        $result = $stmt->fetch(); 
        
        // fetch() trả về false nếu không tìm thấy
        return $result === false ? null : $result;
    }

    /**
     * Thêm một phòng ban mới.
     * @param object $data Dữ liệu từ request body (chứa 'name').
     * @return array Dữ liệu phòng ban vừa được tạo.
     * @throws Exception Nếu tên đã tồn tại hoặc tạo thất bại.
     */
    public function create(object $data): array {
        $name = htmlspecialchars(strip_tags($data->name)); // Làm sạch dữ liệu

        // Validation: Kiểm tra tên trùng (yêu cầu của bạn)
        if ($this->findByName($name)) {
            // Ném lỗi, Controller sẽ bắt được
            throw new Exception('Tên phòng ban đã tồn tại.', 409); // 409 Conflict
        }

        $id = 'dept_' . time(); // Tạo ID duy nhất (giống logic localStorage)
        $query = "INSERT INTO " . $this->tableName . " (id, name) VALUES (:id, :name)"; // is_active mặc định là 1
        
        $stmt = $this->pdo->prepare($query);
        
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':name', $name);

        if ($stmt->execute()) {
            // Trả về bản ghi vừa tạo để Controller có thể gửi về cho frontend
            return ['id' => $id, 'name' => $name]; 
        }
        
        throw new Exception('Lỗi máy chủ: Không thể tạo phòng ban.', 500);
    }

    /**
     * Cập nhật tên phòng ban.
     * @param string $id ID phòng ban cần cập nhật.
     * @param object $data Dữ liệu từ request body (chứa 'name').
     * @return bool True nếu cập nhật thành công.
     */
    public function update(string $id, object $data): bool {
        $name = htmlspecialchars(strip_tags($data->name));
        
        // Validation: Kiểm tra xem tên mới có bị trùng với một phòng ban KHÁC không
        $existing = $this->findByName($name);
        if ($existing && $existing['id'] !== $id) {
             throw new Exception('Tên phòng ban đã tồn tại.', 409);
        }

        $query = "UPDATE " . $this->tableName . " SET name = :name WHERE id = :id AND is_active = 1";
        $stmt = $this->pdo->prepare($query);
        
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    /**
     * Xóa mềm một phòng ban.
     * @param string $id ID phòng ban cần xóa.
     * @return bool True nếu thành công.
     */
    public function softDelete(string $id): bool {
        $query = "UPDATE " . $this->tableName . " SET is_active = 0 WHERE id = :id";
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    /**
     * (Hàm nội bộ) Tìm phòng ban theo tên để kiểm tra trùng lặp.
     * @param string $name Tên phòng ban.
     * @return array|null
     */
    private function findByName(string $name): ?array {
        // Vẫn kiểm tra is_active = 1, vì chúng ta có thể muốn tạo lại phòng ban đã từng bị xóa
        $query = "SELECT id FROM " . $this->tableName . " WHERE name = :name AND is_active = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':name' => $name]);
        $result = $stmt->fetch();
        return $result === false ? null : $result;
    }
}
?>
