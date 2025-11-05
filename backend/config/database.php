<?php
require_once __DIR__ . '/config.php';

class Database {
    private static ?Database $instance = null;
    private PDO $pdo;

    private function __construct() {
        $host = DB_HOST;
        $dbName = DB_NAME;
        $user = DB_USER;
        $pass = DB_PASS;
        $charset = DB_CHARSET;

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
            http_response_code(503); // Service Unavailable
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'error' => 'Database connection failed.',
                'message' => (defined('APP_ENV') && APP_ENV === 'development') ? $e->getMessage() : 'Please contact administrator.'
            ]);
            exit;
        }
    }
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection(): PDO {
        return $this->pdo;
    }

    private function __clone() {}
    public function __wakeup() {}
}
?>