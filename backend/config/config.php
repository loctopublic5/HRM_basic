<?php
// backend/config/config.php

/**
 * Tải các biến môi trường từ file .env ở thư mục gốc.
 */
class Config {
    
    public static function load(): void {
        
        // --- GIẢI PHÁP SỬA LỖI ĐƯỜNG DẪN ---
        //
        // 1. __DIR__ sẽ trả về đường dẫn thư mục hiện tại của file này:
        //    'C:\xampp\htdocs\hrm-project\backend\config'
        //
        // 2. dirname(__DIR__) sẽ đi lên 1 cấp:
        //    'C:\xampp\htdocs\hrm-project\backend'
        //
        // 3. dirname(__DIR__, 2) (hoặc dirname(dirname(__DIR__))) sẽ đi lên 2 cấp:
        //    'C:\xampp\htdocs\hrm-project' (THƯ MỤC GỐC)
        //
        $envPath = dirname(__DIR__, 2) . '/.env'; 

        if (!file_exists($envPath)) {
            // Trả về lỗi rõ ràng để gỡ lỗi
            self::jsonErrorResponse('File .env not found. Đường dẫn đang kiểm tra: ' . $envPath);
        }

        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            self::jsonErrorResponse('Không thể đọc file .env.');
        }

        foreach ($lines as $line) {
            // Bỏ qua các dòng comment (bắt đầu bằng ; hoặc #)
            if (strpos(trim($line), ';') === 0 || strpos(trim($line), '#') === 0) {
                continue;
            }

            // Tách dòng thành tên biến và giá trị
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);

                // Bỏ dấu nháy (nếu có)
                if (strlen($value) > 1 && $value[0] === '"' && $value[strlen($value) - 1] === '"') {
                    $value = substr($value, 1, -1);
                }

                // Nạp vào môi trường
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }

    /**
     * Hàm tiện ích trả lỗi JSON nếu config thất bại.
     */
    private static function jsonErrorResponse($message): void {
        http_response_code(500); // Lỗi 500 Internal Server Error
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status' => 'error',
            'message' => 'Application Configuration Error: ' . $message
        ]);
        exit;
    }
}

// Tự động chạy hàm load khi file này được require
Config::load();
?>
