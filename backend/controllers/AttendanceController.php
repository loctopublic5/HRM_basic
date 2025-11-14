<?php
// backend/controllers/AttendanceController.php

// BaseController đã được nạp bởi autoloader
// Nạp Model mà Controller này sẽ sử dụng
require_once __DIR__ . '/../models/AttendanceModel.php';

/**
 * AttendanceController xử lý các request API liên quan đến chấm công.
 */
class AttendanceController extends BaseController {
    
    private AttendanceModel $model;

    public function __construct() {
        $this->model = new AttendanceModel();
    }

    /**
     * Xử lý: POST /api.php?resource=attendance
     * (Hàm 1: Check In)
     */
    public function checkIn(): void {
        try {
            $data = $this->getRequestBody();
            if (empty($data->employee_id)) {
                $this->sendError('Thiếu employee_id để check-in.', 400);
                return;
            }

            // Gọi Model để thực hiện check-in
            $success = $this->model->checkIn($data->employee_id);
            
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Check-in thành công.'], 201); // 201 Created
            }

        } catch (Throwable $t) {
            // Bắt các lỗi 409 (đã check-in) hoặc 400 (chưa có ca) từ Model
            $statusCode = in_array($t->getCode(), [400, 409]) ? $t->getCode() : 500;
            $this->sendError($t->getMessage(), $statusCode);
        }
    }

    /**
     * Xử lý: PUT /api.php?resource=attendance
     * (Hàm 2: Check Out)
     */
    public function checkOut(): void {
        try {
            $data = $this->getRequestBody();
            if (empty($data->employee_id)) {
                $this->sendError('Thiếu employee_id để check-out.', 400);
                return;
            }

            // Gọi Model để thực hiện check-out
            $success = $this->model->checkOut($data->employee_id);

            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Check-out thành công, đã tính toán giờ làm.']);
            }
            
        } catch (Throwable $t) {
            // Bắt lỗi 400 (chưa check-in) từ Model
            $statusCode = ($t->getCode() === 400) ? 400 : 500;
            $this->sendError($t->getMessage(), $statusCode);
        }
    }

    /**
     * Xử lý: GET /api.php?resource=attendance&employee_id=...&month=...&year=...
     * (Hàm 3: Lấy Thống kê Tháng)
     */
    public function getMonthlySummary(): void {
        try {
            // 1. Validation (Xác thực) đầu vào từ $_GET
            if (empty($_GET['employee_id']) || empty($_GET['month']) || empty($_GET['year'])) {
                $this->sendError('Cần cung cấp đầy đủ employee_id, month, và year.', 400);
                return;
            }

            $employeeId = (string)$_GET['employee_id'];
            $month = (int)$_GET['month'];
            $year = (int)$_GET['year'];

            if ($month < 1 || $month > 12 || $year < 2000) {
                $this->sendError('Tháng hoặc năm không hợp lệ.', 400);
                return;
            }

            // 2. Gọi Model
            $summary = $this->model->getMonthlyAttendanceSummary($employeeId, $month, $year);
            
            // 3. Trả về kết quả
            $this->sendResponse($summary, 200);

        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi lấy thống kê: ' . $t->getMessage(), 500);
        }
    }
}
?>