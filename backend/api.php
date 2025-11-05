<?php
// --- 1. Kích hoạt Báo lỗi (Chỉ cho Môi trường Phát triển) ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- 2. Thiết lập CORS Headers ---
header("Access-Control-Allow-Origin: http://localhost:5500");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- 3. Xử lý OPTIONS (Pre-flight) Request ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- 4. Tải Lõi Ứng dụng ---
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/models/BaseModel.php';
require_once __DIR__ . '/controllers/BaseController.php';

// --- 5. Autoloader (Tự động nạp Controller và Model khi cần) ---
// (Nên đặt Autoloader ở ngoài khối try...catch)
spl_autoload_register(function ($className) {
    $paths = [
        __DIR__ . '/controllers/' . $className . '.php',
        __DIR__ . '/models/' . $className . '.php',
    ];
    foreach ($paths as $filePath) {
        if (file_exists($filePath)) {
            require_once $filePath;
            return;
        }
    }
});

// --- 6. Bắt lỗi Toàn cục (Global Error Handling) ---

try {
    // Phân tích URL
    $resource = trim($_GET['resource'] ?? '', '/');
    $id = trim($_GET['id'] ?? null);
    $method = $_SERVER['REQUEST_METHOD'];

    // --- 7. Routing Logic ---
    switch ($resource) {
        case 'departments':
            $controller = new DepartmentController();
            
            if ($method === 'GET' && $id === null) {
                $controller->listAllDepartments();
            } 
            elseif ($method === 'POST') {
                $controller->addDepartment();
            } 
            elseif ($method === 'PUT' && $id !== null) {
                $controller->updateDepartment($id);
            } 
            elseif ($method === 'DELETE' && $id !== null) {
                $controller->deleteDepartment($id);
            } 
            else {
                (new BaseController())->sendError('Phương thức hoặc tham số không hợp lệ.', 405);
            }
            break;

        default:
            (new BaseController())->sendError('Resource not found', 404);
            break;
    }

} catch (PDOException $dbException) {
    // Bắt lỗi liên quan đến Database
    error_log('API Database Error: ' . $dbException->getMessage());
    (new BaseController())->sendError('Database processing error.', 500);
} catch (Exception $e) {
    // Bắt tất cả các lỗi khác
    error_log('API General Error: ' . $e->getMessage());
    (new BaseController())->sendError('An internal server error occurred: ' . $e->getMessage(), 500);
}
?>

