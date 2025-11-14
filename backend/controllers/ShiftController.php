<?php
// backend/controllers/ShiftController.php

require_once __DIR__ . '/../models/ShiftModel.php';

/**
 * ShiftController xử lý các request API liên quan đến ca làm việc.
 */
class ShiftController extends BaseController {
    
    private ShiftModel $model;

    public function __construct() {
        $this->model = new ShiftModel();
    }

    /**
     * Xử lý: GET /api.php?resource=shifts
     * Lấy danh sách tất cả các ca.
     */
    public function listAll(): void {
        try {
            $shifts = $this->model->getAll();
            $this->sendResponse($shifts);
        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi lấy danh sách ca làm việc: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: POST /api.php?resource=shifts
     * Thêm một ca mới.
     */
    public function add(): void {
        $data = $this->getRequestBody(); 

        if (empty($data->shift_name) || empty($data->total_standard_hours)) {
            $this->sendError('Vui lòng cung cấp "shift_name" và "total_standard_hours".', 400);
            return;
        }

        try {
            $newShift = $this->model->create($data);
            $this->sendResponse($newShift, 201); // 201 Created
        } catch (Throwable $t) {
            $this->sendError($t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: PUT /api.php?resource=shifts&id={id}
     * Cập nhật một ca.
     */
    public function update(int $id): void {
        $data = $this->getRequestBody();
        if (empty($id) || empty($data->shift_name) || empty($data->total_standard_hours)) {
            $this->sendError('ID, shift_name, và total_standard_hours là bắt buộc.', 400);
            return;
        }

        try {
            $success = $this->model->update($id, $data);
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Cập nhật ca làm việc thành công.']);
            } else {
                $this->sendError('Cập nhật thất bại hoặc không tìm thấy ca làm việc.', 404);
            }
        } catch (Throwable $t) {
            $this->sendError($t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: DELETE /api.php?resource=shifts&id={id}
     * Xóa mềm một ca.
     */
    public function softDelete(int $id): void {
        if (empty($id)) {
            $this->sendError('ID ca làm việc là bắt buộc.', 400);
            return;
        }

        try {
            $success = $this->model->softDelete($id);
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Xóa mềm ca làm việc thành công.']);
            } else {
                $this->sendError('Xóa thất bại hoặc không tìm thấy ca làm việc.', 404);
            }
        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi xóa: ' . $t->getMessage(), 500);
        }
    }
}
?>