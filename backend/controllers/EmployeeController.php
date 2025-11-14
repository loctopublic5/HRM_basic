<?php
require_once __DIR__ . '/../models/EmployeeModel.php';
require_once __DIR__ . '/../models/PositionModel.php'; 

class EmployeeController extends BaseController {
    
    private EmployeeModel $employeeModel;
    private PositionModel $positionModel; // Thêm PositionModel để validate

    public function __construct() {
        $this->employeeModel = new EmployeeModel();
        $this->positionModel = new PositionModel(); // Khởi tạo
    }

    /**
     * Xử lý: GET /api.php?resource=employees
     * Lấy danh sách nhân viên (có phân trang và sắp xếp).
     */
    public function listEmployees(): void {
        try {
            // Lấy các tham số phân trang/sắp xếp từ URL
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 10);
            $sortBy = (string)($_GET['sortBy'] ?? 'name');
            $sortOrder = (string)($_GET['sortOrder'] ?? 'ASC');

            $data = $this->employeeModel->getAll($page, $limit, $sortBy, $sortOrder);
            $total = $this->employeeModel->getTotalEmployees();

            $response = [
                'data' => $data,
                'pagination' => [
                    'currentPage' => $page,
                    'limit' => $limit,
                    'totalItems' => $total,
                    'totalPages' => ceil($total / $limit)
                ]
            ];
            $this->sendResponse($response);

        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi lấy danh sách nhân viên: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: GET /api.php?resource=employees&action=search
     * Tìm kiếm nhân viên.
     */
    public function searchEmployees(): void {
        try {
            // Lấy các tiêu chí tìm kiếm từ URL
            $criteria = [
                'name' => (string)($_GET['name'] ?? ''),
                'deptId' => (string)($_GET['deptId'] ?? ''),
                'posId' => (string)($_GET['posId'] ?? '')
            ];
            
            // Lấy các tham số phân trang/sắp xếp
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 10);
            $sortBy = (string)($_GET['sortBy'] ?? 'name');
            $sortOrder = (string)($_GET['sortOrder'] ?? 'ASC');

            $result = $this->employeeModel->search($criteria, $page, $limit, $sortBy, $sortOrder);

            $response = [
                'data' => $result['data'],
                'pagination' => [
                    'currentPage' => $result['page'],
                    'limit' => $result['limit'],
                    'totalItems' => $result['total'],
                    'totalPages' => ceil($result['total'] / $result['limit'])
                ]
            ];
            $this->sendResponse($response);

        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi tìm kiếm nhân viên: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: POST /api.php?resource=employees
     * Thêm một nhân viên mới.
     */
    public function addEmployee(): void {
        $data = $this->getRequestBody();

        // 1. Validation cơ bản
        if (empty($data->name) || empty($data->hireDate) || empty($data->positionId) || empty($data->shiftId)) {
            $this->sendError('Vui lòng cung cấp đầy đủ Tên, Ngày vào làm, Vị trí, và Ca làm việc.', 400);
            return;
        }

        try {
            // 2. Validation Nghiệp vụ (Kiểm tra xem Vị trí có tồn tại không)
            $position = $this->positionModel->getById($data->positionId);
            if (!$position) {
                $this->sendError('Vị trí công việc không hợp lệ hoặc không tồn tại.', 400);
                return;
            }
            
            // (Bạn có thể thêm logic kiểm tra tên trùng ở đây nếu muốn)

            // 3. Gọi Model để tạo
            $newEmployee = $this->employeeModel->create($data);
            $this->sendResponse($newEmployee, 201); // 201 Created

        } catch (PDOException $pdoe) {
            // Bắt lỗi CSDL (ví dụ: Khóa ngoại bị vi phạm)
            $this->sendError('Lỗi CSDL: ' . $pdoe->getMessage(), 500);
        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi thêm nhân viên: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: PUT /api.php?resource=employees&id={id}
     * Cập nhật một nhân viên.
     */
    public function updateEmployee(string $id): void {
        $data = $this->getRequestBody();
        
        if (empty($id) || empty($data->name) || empty($data->hireDate) || empty($data->positionId) || empty($data->shiftId)) {
            $this->sendError('ID, Tên, Ngày vào làm, Vị trí và Ca làm việc là bắt buộc.', 400);
            return;
        }

        try {
            // Validation Nghiệp vụ
            $position = $this->positionModel->getById($data->positionId);
            if (!$position) {
                $this->sendError('Vị trí công việc mới không hợp lệ.', 400);
                return;
            }
            


            $success = $this->employeeModel->update($id, $data);
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Cập nhật nhân viên thành công.']);
            } else {
                $this->sendError('Cập nhật thất bại hoặc không tìm thấy nhân viên.', 404);
            }
        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi cập nhật: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: DELETE /api.php?resource=employees&id={id}
     * Xóa mềm một nhân viên.
     */
    public function deleteEmployee(string $id): void {
        if (empty($id)) {
            $this->sendError('ID nhân viên là bắt buộc.', 400);
            return;
        }

        try {
            $success = $this->employeeModel->softDelete($id);
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Xóa mềm nhân viên thành công.']);
            } else {
                $this->sendError('Xóa thất bại hoặc không tìm thấy nhân viên.', 404);
            }
        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi xóa: ' . $t->getMessage(), 500);
        }
    }
}
?>
