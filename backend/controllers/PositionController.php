<?php

require_once __DIR__ . '/../models/PositionModel.php';

class PositionController extends BaseController {
    
    private PositionModel $model;

    public function __construct() {
        $this->model = new PositionModel();
    }

    /**
     * Xử lý: GET /api.php?resource=positions
     */
    public function listAll(): void {
        try {
            $positions = $this->model->getAll();
            $this->sendResponse($positions);
        } catch (Throwable $t) { // Bắt tất cả lỗi
            $this->sendError('Lỗi máy chủ khi lấy danh sách vị trí: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: GET /api.php?resource=positions&id={id}
     */
    public function getById(string $id): void {
        try {
            $position = $this->model->getById($id);
            if ($position) {
                $this->sendResponse($position);
            } else {
                $this->sendError('Không tìm thấy vị trí.', 404);
            }
        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: GET /api.php?resource=positions&deptId={deptId}
     */
    public function listByDepartment(string $deptId): void {
        try {
            $positions = $this->model->getAllByDepartment($deptId);
            $this->sendResponse($positions);
        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi lấy danh sách vị trí theo phòng ban: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: POST /api.php?resource=positions
     */
    public function add(): void {
        $data = $this->getRequestBody(); 

        if (empty($data->title) || empty($data->salaryBase) || empty($data->departmentId)) {
            $this->sendError('Vui lòng cung cấp đầy đủ: title, salaryBase, và departmentId.', 400);
            return;
        }

        try {
            $newPosition = $this->model->create($data);
            $this->sendResponse($newPosition, 201);
        } catch (Throwable $t) { // Bắt tất cả lỗi
            // Lấy mã lỗi, nếu là 409 (tên trùng) thì dùng 409, ngược lại dùng 500
            $statusCode = ($t->getCode() === 409) ? 409 : 500;
            $this->sendError($t->getMessage(), $statusCode);
        }
    }

    /**
     * Xử lý: PUT /api.php?resource=positions&id={id}
     */
    public function update(string $id): void {
        $data = $this->getRequestBody();
        if (empty($id) || empty($data->title) || empty($data->salaryBase) || empty($data->departmentId)) {
            $this->sendError('ID, title, salaryBase, và departmentId là bắt buộc.', 400);
            return;
        }

        try {
            $success = $this->model->update($id, $data);
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Cập nhật vị trí thành công.']);
            } else {
                $this->sendError('Cập nhật thất bại hoặc không tìm thấy vị trí.', 404);
            }
        } catch (Throwable $t) {
            $statusCode = ($t->getCode() === 409) ? 409 : 500;
            $this->sendError($t->getMessage(), $statusCode);
        }
    }

    /**
     * Xử lý: DELETE /api.php?resource=positions&id={id}
     */
    public function softDelete(string $id): void {
        if (empty($id)) {
            $this->sendError('ID vị trí là bắt buộc.', 400);
            return;
        }

        try {
            $success = $this->model->softDelete($id);
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Xóa mềm vị trí thành công.']);
            } else {
                $this->sendError('Xóa thất bại hoặc không tìm thấy vị trí.', 404);
            }
        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi xóa: ' . $t->getMessage(), 500);
        }
    }
}
?>