<?php
// backend/controllers/BaseController.php

/**
 * Class BaseController - Lớp cơ sở VÀ LÀ lớp tiện ích.
 */
class BaseController { // <-- 1. Bỏ từ khóa "abstract"

    /**
     * Gửi phản hồi JSON về client.
     * (Sửa thành public để có thể gọi từ bên ngoài)
     */
    public function sendResponse($data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE); 
        exit;
    }

    /**
     * Gửi phản hồi lỗi JSON về client.
     * (Sửa thành public để có thể gọi từ api.php)
     */
    public function sendError(string $message, int $statusCode = 400): void {
        $this->sendResponse(['error' => $message], $statusCode);
    }

    /**
     * Lấy dữ liệu từ Request Body
     * (Để protected vì chỉ các Controller con mới cần dùng)
     */
    protected function getRequestBody(): ?object {
        $json = file_get_contents('php://input');
        $data = json_decode($json);
        return $data;
    }
}
?>