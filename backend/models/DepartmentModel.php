<?php
require_once __DIR__ . '/BaseModel.php';

class DepartmentModel extends BaseModel {
    protected string $tableName = 'departments';

    /**
     * Lấy tất cả phòng ban đang hoạt động (is_active = 1).
     */
    public function getAll(): array {
        $query = "SELECT id, name FROM " . $this->tableName . " WHERE is_active = 1 ORDER BY name ASC";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Lấy một phòng ban theo ID (và phải đang hoạt động).
     */
    public function getById(string $id): ?array {
        $query = "SELECT id, name FROM " . $this->tableName . " WHERE id = :id AND is_active = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        return $result === false ? null : $result;
    }

    /**
     * Kiểm tra xem tên phòng ban đã tồn tại hay chưa.
     */
    private function findByName(string $name): ?array {
        $query = "SELECT id FROM " . $this->tableName . " WHERE name = :name AND is_active = 1";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([':name' => $name]);
        $result = $stmt->fetch();
        return $result === false ? null : $result;
    }

    /**
     * Thêm một phòng ban mới.
     */
    public function create(object $data): array {
        // Validation: Kiểm tra tên trùng
        if ($this->findByName($data->name)) {
            throw new Exception('Tên phòng ban đã tồn tại.');
        }

        $id = 'dept_' . time(); // Tạo ID duy nhất
        $query = "INSERT INTO " . $this->tableName . " (id, name) VALUES (:id, :name)";
        $stmt = $this->pdo->prepare($query);
        
        // Làm sạch dữ liệu
        $name = htmlspecialchars(strip_tags($data->name));

        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':name', $name);

        if ($stmt->execute()) {
            // Trả về dữ liệu vừa tạo
            return ['id' => $id, 'name' => $name, 'is_active' => 1];
        }
        throw new Exception('Lỗi khi tạo phòng ban.');
    }

    /**
     * Cập nhật tên phòng ban.
     */
    public function update(string $id, object $data): bool {
        $query = "UPDATE " . $this->tableName . " SET name = :name WHERE id = :id AND is_active = 1";
        $stmt = $this->pdo->prepare($query);
        
        $name = htmlspecialchars(strip_tags($data->name));
        
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    /**
     * Xóa mềm một phòng ban.
     */
    public function softDelete(string $id): bool {
        $query = "UPDATE " . $this->tableName . " SET is_active = 0 WHERE id = :id";
        $stmt = $this->pdo->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}
?>
