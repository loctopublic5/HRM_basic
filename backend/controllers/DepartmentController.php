<?php
// backend/controllers/DepartmentController.php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/DepartmentModel.php';

class DepartmentController extends BaseController {
    private DepartmentModel $model;

    public function __construct() {
        $this->model = new DepartmentModel();
    }

    /**
     * Xử lý request GET /departments
     * Lấy danh sách tất cả phòng ban.
     */
    public function listAllDepartments(): void {
        try {
            $departments = $this->model->getAll();
            $this->sendResponse($departments, 200);
        } catch (Exception $e) {
            $this->sendError('Lỗi máy chủ khi lấy danh sách phòng ban.', 500);
        }
    }

    /**
     * Xử lý request POST /departments
     * Thêm một phòng ban mới.
     */
    public function addDepartment(): void {
        $data = $this->getRequestBody(); // Lấy dữ liệu JSON từ body

        if (empty($data->name)) {
            $this->sendError('Tên phòng ban là bắt buộc.', 400);
            return;
        }

        try {
            $newDepartment = $this->model->create($data);
            $this->sendResponse($newDepartment, 201); // 201 Created
        } catch (Exception $e) {
            // Bắt lỗi (ví dụ: tên trùng) từ Model
            $this->sendError($e->getMessage(), 409); // 409 Conflict
        }
    }

    /**
     * Xử lý request PUT /departments?id={id}
     * Cập nhật một phòng ban.
     */
    public function updateDepartment(string $id): void {
        $data = $this->getRequestBody();
        if (empty($data->name)) {
            $this->sendError('Tên phòng ban là bắt buộc.', 400);
            return;
        }

        try {
            if ($this->model->update($id, $data)) {
                $this->sendResponse(['message' => 'Cập nhật phòng ban thành công.']);
            } else {
                $this->sendError('Cập nhật thất bại hoặc không tìm thấy phòng ban.', 404);
            }
        } catch (Exception $e) {
            $this->sendError('Lỗi máy chủ khi cập nhật.', 500);
        }
    }

    /**
     * Xử lý request DELETE /departments?id={id}
     * Xóa mềm một phòng ban.
     */
    public function deleteDepartment(string $id): void {
        try {
            if ($this->model->softDelete($id)) {
                $this->sendResponse(['message' => 'Xóa mềm phòng ban thành công.']);
            } else {
                $this->sendError('Xóa thất bại hoặc không tìm thấy phòng ban.', 404);
            }
        } catch (Exception $e) {
            $this->sendError('Lỗi máy chủ khi xóa.', 500);
        }
    }
}
?>