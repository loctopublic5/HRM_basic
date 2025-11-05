<?php
require_once __DIR__ . '/../models/DepartmentModel.php';

/**
 * DepartmentController kế thừa từ BaseController,
 * chịu trách nhiệm xử lý các request API liên quan đến phòng ban.
 */
class DepartmentController extends BaseController {
    
    /**
     * Thuộc tính để lưu trữ một thể hiện (instance) của DepartmentModel.
     * @var DepartmentModel
     */
    private DepartmentModel $model;

    /**
     * Hàm khởi tạo, tự động chạy khi new DepartmentController()
     * và tạo một thể hiện của DepartmentModel.
     */
    public function __construct() {
        $this->model = new DepartmentModel();
    }

    /**
     * Xử lý request: GET /api.php?resource=departments
     * Lấy danh sách tất cả phòng ban.
     */
    public function listAllDepartments(): void {
        try {
            // 1. Gọi Model để lấy dữ liệu
            $departments = $this->model->getAll();
            
            // 2. Gửi phản hồi thành công
            $this->sendResponse($departments, 200); // 200 OK
        } catch (Exception $e) {
            // 3. Bắt lỗi nếu có và gửi phản hồi lỗi 500
            $this->sendError('Lỗi máy chủ khi lấy danh sách phòng ban: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Xử lý request: GET /api.php?resource=departments&id={id}
     * Lấy một phòng ban cụ thể.
     */
    public function getDepartmentById(string $id): void {
        try {
            $department = $this->model->getById($id);
            if ($department) {
                $this->sendResponse($department, 200);
            } else {
                // Nếu Model trả về null (không tìm thấy)
                $this->sendError('Không tìm thấy phòng ban.', 404); // 404 Not Found
            }
        } catch (Exception $e) {
            $this->sendError('Lỗi máy chủ: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Xử lý request: POST /api.php?resource=departments
     * Thêm một phòng ban mới.
     */
    public function addDepartment(): void {
        // 1. Lấy dữ liệu JSON từ body request
        $data = $this->getRequestBody(); 

        // 2. Kiểm tra dữ liệu đầu vào đơn giản
        if (empty($data->name)) {
            $this->sendError('Tên phòng ban là bắt buộc.', 400); // 400 Bad Request
            return;
        }

        try {
            // 3. Gọi Model để tạo mới
            $newDepartment = $this->model->create($data);
            
            // 4. Gửi phản hồi thành công
            $this->sendResponse($newDepartment, 201); // 201 Created
        } catch (Exception $e) {
            // 5. Bắt lỗi (ví dụ: lỗi tên trùng 409 hoặc lỗi 500)
            $statusCode = $e->getCode() === 409 ? 409 : 500;
            $this->sendError($e->getMessage(), $statusCode);
        }
    }

    /**
     * Xử lý request: PUT /api.php?resource=departments&id={id}
     * Cập nhật một phòng ban.
     */
    public function updateDepartment(string $id): void {
        $data = $this->getRequestBody();
        if (empty($id) || empty($data->name)) {
            $this->sendError('ID và Tên phòng ban là bắt buộc.', 400);
            return;
        }

        try {
            $success = $this->model->update($id, $data);
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Cập nhật phòng ban thành công.']);
            } else {
                $this->sendError('Cập nhật thất bại hoặc không tìm thấy phòng ban.', 404);
            }
        } catch (Exception $e) {
            // Bắt lỗi (ví dụ: tên trùng 409)
            $statusCode = $e->getCode() === 409 ? 409 : 500;
            $this->sendError($e->getMessage(), $statusCode);
        }
    }

    /**
     * Xử lý request: DELETE /api.php?resource=departments&id={id}
     * Xóa mềm một phòng ban.
     */
    public function deleteDepartment(string $id): void {
        if (empty($id)) {
            $this->sendError('ID phòng ban là bắt buộc.', 400);
            return;
        }

        try {
            $success = $this->model->softDelete($id);
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Xóa mềm phòng ban thành công.']);
            } else {
                $this->sendError('Xóa thất bại hoặc không tìm thấy phòng ban.', 404);
            }
        } catch (Exception $e) {
            $this->sendError('Lỗi máy chủ khi xóa: ' . $e->getMessage(), 500);
        }
    }
}
?>
