<?php
require_once __DIR__ . '/../models/SalaryModel.php';
require_once __DIR__ . '/../models/EmployeeModel.php';

class SalaryController extends BaseController {
    
    private SalaryModel $salaryModel;
    private EmployeeModel $employeeModel;

    /**
     * Hàm khởi tạo, tạo các thể hiện của Model.
     */
    public function __construct() {
        $this->salaryModel = new SalaryModel();
        $this->employeeModel = new EmployeeModel(); // Cần để lấy position_id
    }

    /**
     * Xử lý: POST /api.php?resource=salary
     * (Hàm 1: Thêm một bản ghi điều chỉnh lương)
     */
    public function handleAddAdjustment(): void {
        try {
            $data = $this->getRequestBody();

            // 1. Validation dữ liệu đầu vào cơ bản
            if (empty($data->employee_id) || empty($data->change_type) || empty($data->amount) || empty($data->effective_date) || empty($data->reason)) {
                $this->sendError('Vui lòng cung cấp đầy đủ thông tin: employee_id, change_type, amount, effective_date, và reason.', 400);
                return;
            }

            // 2. Lấy thông tin bổ sung
            $employee = $this->employeeModel->getById($data->employee_id);
            if (!$employee) {
                $this->sendError('Không tìm thấy nhân viên với ID cung cấp.', 404);
                return;
            }
            
            // 3. Chuẩn bị dữ liệu để gửi cho Model
            $adjustmentData = [
                'employee_id' => $employee['id'],
                'position_id' => $employee['position_id'], // Lấy position_id HIỆN TẠI của nhân viên
                'change_type' => $data->change_type,
                'amount' => $data->amount,
                'effective_date' => $data->effective_date,
                'reason' => $data->reason,
                'created_by_user_id' => 1 // Tạm thời hardcode user ID là 1 (admin)
            ];

            // 4. Gọi Model để tạo
            $success = $this->salaryModel->addAdjustment((object)$adjustmentData);
            
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Đã thêm điều chỉnh lương thành công.'], 201); // 201 Created
            } else {
                $this->sendError('Không thể thêm bản ghi điều chỉnh.', 500);
            }

        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi thêm điều chỉnh lương: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: GET /api.php?resource=salary&employee_id={id}
     * (Hàm 2: Lấy "Hồ sơ Lương" (Profile) của nhân viên)
     */
    public function getSalaryProfile(string $employeeId): void {
        try {
            $profile = $this->salaryModel->calculateEmployeeSalaryProfile($employeeId);
            
            if ($profile) {
                $this->sendResponse($profile, 200);
            } else {
                $this->sendError('Không tìm thấy hồ sơ lương cho nhân viên này.', 404);
            }
        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi tính toán hồ sơ lương: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: GET /api.php?resource=salary&employee_id={id}&history=true
     * (Hàm 3: Lấy lịch sử giao dịch lương)
     */
    public function getHistory(string $employeeId): void {
        try {
            $history = $this->salaryModel->getSalaryHistoryForEmployee($employeeId);
            $this->sendResponse($history, 200);
        } catch (Throwable $t) {
            $this->sendError('Lỗi máy chủ khi lấy lịch sử lương: ' . $t->getMessage(), 500);
        }
    }
}
?>
