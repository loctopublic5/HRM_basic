<?php
// backend/config/database.php

/**
 * Class Database sử dụng Singleton Pattern để quản lý kết nối PDO.
 */
class Database {
    private static ?Database $instance = null;
    private PDO $pdo;

    /**
     * Constructor private: Đọc biến môi trường và tạo kết nối PDO.
     */
    private function __construct() {
        // Lấy thông tin cấu hình từ biến môi trường (đã được nạp bởi config.php)
        $host = getenv('DB_HOST') ?: 'localhost';
        $dbName = getenv('DB_NAME') ?: 'hrm_app_db';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
        $charset = getenv('DB_CHARSET') ?: 'utf8mb4';

        $dsn = "mysql:host=$host;dbname=$dbName;charset=$charset";
        $options = [
            // Yêu cầu 1: Ném Exception khi có lỗi SQL
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            // Yêu cầu 2: Trả về mảng liên kết (associative array)
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Tắt chế độ mô phỏng prepared statements (an toàn hơn)
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            // Tạo kết nối PDO
            $this->pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            // YÊU CẦU: Chết và trả về lỗi JSON nếu kết nối thất bại
            http_response_code(503); // Service Unavailable
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'error' => 'Database connection failed.',
                'message' => $e->getMessage() // Chỉ hiển thị message khi đang phát triển
            ]);
            exit;
        }
    }

    /**
     * Phương thức static để lấy thể hiện (instance) duy nhất.
     */
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    /**
     * Trả về đối tượng kết nối PDO để các Model sử dụng.
     */
    public function getConnection(): PDO {
        return $this->pdo;
    }

    // Ngăn chặn clone và wakeup để đảm bảo Singleton
    private function __clone() {}
    public function __wakeup() {}
}
?>