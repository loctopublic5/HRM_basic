<?php
// backend/controllers/AuthController.php

// BaseController đã được nạp bởi autoloader trong api.php
// Nạp AuthModel
require_once __DIR__ . '/../models/AuthModel.php';

/**
 * AuthController xử lý các request API liên quan đến Xác thực (Đăng nhập/Đăng xuất).
 */
class AuthController extends BaseController {
    
    private AuthModel $model;

    public function __construct() {
        $this->model = new AuthModel();
    }

    /**
     * Xử lý: POST /api.php?resource=auth&action=login
     * Thực hiện đăng nhập.
     */
    public function handleLogin(): void {
        try {
            // 1. Lấy dữ liệu (username, password) từ body
            $data = $this->getRequestBody();

            // 2. Validate (Xác thực) dữ liệu đầu vào
            if (empty($data->username) || empty($data->password)) {
                $this->sendError('Tên đăng nhập và mật khẩu là bắt buộc.', 400); // 400 Bad Request
                return;
            }

            // 3. Gọi Model để xác thực
            $user = $this->model->login($data->username, $data->password);

            // 4. Xử lý kết quả
            if ($user === false) {
                // ĐĂNG NHẬP THẤT BẠI
                $this->sendError('Tên đăng nhập hoặc mật khẩu không đúng.', 401); // 401 Unauthorized
                return;
            }

            // 5. ĐĂNG NHẬP THÀNH CÔNG: Khởi tạo Session
            // Phải gọi session_start() TRƯỚC khi gán giá trị
            session_start();
            
            // Lưu thông tin an toàn (đã loại bỏ hash) vào session
            $_SESSION['user'] = [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role']
            ];
            
            // Gửi thông tin user về cho frontend (để hiển thị "Chào, Admin!")
            $this->sendResponse($user, 200);

        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi đăng nhập: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: POST /api.php?resource=auth&action=logout
     * Thực hiện đăng xuất.
     */
    public function handleLogout(): void {
        try {
            // 1. Khởi động session hiện tại để có thể hủy nó
            session_start();

            // 2. Xóa tất cả các biến session
            session_unset();

            // 3. Hủy file session trên server
            session_destroy();
            
            // (Tùy chọn nhưng nên làm) Xóa cookie PHPSESSID khỏi trình duyệt
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params["path"], $params["domain"],
                    $params["secure"], $params["httponly"]
                );
            }

            // 4. Gửi phản hồi thành công
            $this->sendResponse(['success' => true, 'message' => 'Đăng xuất thành công.']);

        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi đăng xuất: ' . $t->getMessage(), 500);
        }
    }
}
?>