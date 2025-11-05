<?php
// backend/api.php - Cổng vào API duy nhất

// --- 1. Kích hoạt Báo lỗi (Chỉ cho Môi trường Phát triển) ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- 2. Thiết lập CORS Headers ---
header("Access-Control-Allow-Origin: *"); // Hoặc domain frontend của bạn
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
// Tải file nạp config (define)
require_once __DIR__ . '/config/config.php';
// Tải các base class (database.php sẽ được BaseModel tự nạp)
require_once __DIR__ . '/models/BaseModel.php';
require_once __DIR__ . '/controllers/BaseController.php';

// --- 5. Autoloader (Tự động nạp Controller và Model khi cần) ---
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
    // --- 7. Phân tích URL ---
    $resource = trim($_GET['resource'] ?? '', '/');
    $id = trim($_GET['id'] ?? ''); // Lấy giá trị, mặc định là chuỗi rỗng
    if ($id === '') {
        $id = null; // Chuẩn hóa về null
    }

    $method = $_SERVER['REQUEST_METHOD'];

    // --- 8. Routing Logic ---
    switch ($resource) {
        
        // --- ĐOẠN CODE CẬP NHẬT CHO 'departments' ---
        case 'departments':
            $controller = new DepartmentController(); // Autoloader sẽ tự nạp file
            
            if ($method === 'GET' && $id === null) {
                // GET .../api.php?resource=departments
                $controller->listAllDepartments();
            } 
            elseif ($method === 'GET' && $id !== null) {
                // GET .../api.php?resource=departments&id=dept_it
                $controller->getDepartmentById($id);
            }
            elseif ($method === 'POST') {
                // POST .../api.php?resource=departments
                $controller->addDepartment();
            } 
            elseif ($method === 'PUT' && $id !== null) {
                // PUT .../api.php?resource=departments&id=dept_it
                $controller->updateDepartment($id);
            } 
            elseif ($method === 'DELETE' && $id !== null) {
                // DELETE .../api.php?resource=departments&id=dept_it
                $controller->deleteDepartment($id);
            } 
            else {
                // Bất kỳ phương thức nào khác (hoặc thiếu ID cho PUT/DELETE)
                (new BaseController())->sendError('Phương thức hoặc tham số không hợp lệ.', 405);
            }
            break;
        // --- KẾT THÚC CẬP NHẬT ---

        case 'employees':
             // $controller = new EmployeeController(); 
            (new BaseController())->sendError('Employee routes not fully implemented yet', 501);
            break;

        default:
            (new BaseController())->sendError('Resource not found', 404);
            break;
    }

} catch (PDOException $dbException) {
    // Bắt lỗi liên quan đến Database
    error_log('API Database Error: ' . $dbException->getMessage());
    (new BaseController())->sendError('Database processing error.', 500);
} catch (Throwable $t) {
    // Bắt tất cả các lỗi khác (bao gồm cả Fatal Error như Class not found)
    error_log('API General Error: ' . $t->getMessage());
    (new BaseController())->sendError('An internal server error occurred: ' . $t->getMessage(), 500);
}
?>