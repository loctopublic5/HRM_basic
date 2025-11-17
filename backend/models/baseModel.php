<?php
// Luôn require file database trước
require_once __DIR__ . '/../config/database.php';

abstract class BaseModel {
    // Thuộc tính protected để lớp con có thể truy cập
    protected PDO $pdo;

    /**
     * Constructor: Tự động lấy kết nối PDO và gán vào $this->pdo.
     */
    public function __construct() {
        // Lấy instance Singleton của Database, sau đó lấy kết nối PDO
        $this->pdo = Database::getInstance()->getConnection();
    }
/**
     * [HÀM MỚI]
     * Cung cấp quyền truy cập vào kết nối PDO cho các Controller
     * để thực hiện các giao dịch (transactions).
     * @return PDO
     */
    public function getPdo(): PDO {
        return $this->pdo;
    }
}
?>