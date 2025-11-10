<?php
// backend/api.php - Cổng vào API duy nhất

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Tải Lõi Ứng dụng
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/models/BaseModel.php';
require_once __DIR__ . '/controllers/BaseController.php';

// Autoloader
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

// Bắt lỗi Toàn cục
try {
    // Phân tích URL
    $resource = trim($_GET['resource'] ?? '', '/');
    
    $id = trim($_GET['id'] ?? '');
    if ($id === '') $id = null;

    $deptId = trim($_GET['deptId'] ?? ''); 
    if ($deptId === '') $deptId = null;

    $method = $_SERVER['REQUEST_METHOD'];

    // Routing Logic
    switch ($resource) {
        
        case 'departments':
            $controller = new DepartmentController();
            
            if ($method === 'GET' && $id === null) $controller->listAllDepartments(); 
            elseif ($method === 'GET' && $id !== null) $controller->getDepartmentById($id);
            elseif ($method === 'POST') $controller->addDepartment();
            elseif ($method === 'PUT' && $id !== null) $controller->updateDepartment($id);
            elseif ($method === 'DELETE' && $id !== null) $controller->deleteDepartment($id);
            else (new BaseController())->sendError('Phương thức hoặc tham số không hợp lệ.', 405);
            break;

        case 'positions':
            $controller = new PositionController();
            
            if ($method === 'GET' && $id === null && $deptId === null) $controller->listAll();
            elseif ($method === 'GET' && $id !== null) $controller->getById($id);
            elseif ($method === 'GET' && $deptId !== null) $controller->listByDepartment($deptId);
            elseif ($method === 'POST') $controller->add();
            elseif ($method === 'PUT' && $id !== null) $controller->update($id);
            elseif ($method === 'DELETE' && $id !== null) $controller->softDelete($id);
            else (new BaseController())->sendError('Phương thức hoặc tham số không hợp lệ.', 405);
            break;
        case 'employees':
            $controller = new EmployeeController(); // Autoloader sẽ nạp file

            if ($method === 'GET') {
                if (isset($_GET['name']) || isset($_GET['deptId']) || isset($_GET['posId'])) {
                    $controller->searchEmployees();
                } else {
                    $controller->listEmployees();
                }
            }
            elseif ($method === 'POST') {
                $controller->addEmployee();
            } 
            elseif ($method === 'PUT' && $id !== null) {
                $controller->updateEmployee($id);
            } 
            elseif ($method === 'DELETE' && $id !== null) {
                $controller->deleteEmployee($id);
            } 
            else {
                (new BaseController())->sendError('Phương thức hoặc tham số không hợp lệ.', 405);
            }
            break;
        case 'salary':
            $controller = new SalaryController(); 
            
            if ($method === 'GET' && isset($_GET['employee_id'])) {
                // Kiểm tra xem có phải yêu cầu lấy 'history' không
                if (isset($_GET['history']) && $_GET['history'] === 'true') {
                    // GET ...?resource=salary&employee_id=...&history=true
                    $controller->getHistory($_GET['employee_id']);
                } else {
                    // GET ...?resource=salary&employee_id=... (Lấy hồ sơ lương)
                    $controller->getSalaryProfile($_GET['employee_id']);
                }
            }
            elseif ($method === 'POST') {
                // POST ...?resource=salary (Body chứa thông tin điều chỉnh)
                $controller->handleAddAdjustment();
            }
            else {
                (new BaseController())->sendError('Phương thức hoặc tham số không hợp lệ cho "salary".', 405);
            }
            break;

        default:
            (new BaseController())->sendError('Resource not found', 404);
            break;
    }

} catch (PDOException $dbException) {
    error_log('API Database Error: ' . $dbException->getMessage());
    (new BaseController())->sendError('Database processing error.', 500);
} catch (Throwable $t) {
    error_log('API General Error: ' . $t->getMessage());
    (new BaseController())->sendError('An internal server error occurred: ' . $t->getMessage(), 500);
}
?>