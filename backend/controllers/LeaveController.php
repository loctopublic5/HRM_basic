<?php
require_once __DIR__ . '/../models/LeaveModel.php';
require_once __DIR__ . '/../models/AttendanceModel.php';
require_once __DIR__ . '/../models/EmployeeModel.php'; 

class LeaveController extends BaseController {
    
    private LeaveModel $leaveModel;
    private AttendanceModel $attendanceModel;
    private EmployeeModel $employeeModel;
    private PDO $pdo; // Thuộc tính để giữ kết nối PDO cho transactions

    public function __construct() {
        $this->leaveModel = new LeaveModel();
        $this->attendanceModel = new AttendanceModel();
        $this->employeeModel = new EmployeeModel();
        
        // Lấy kết nối PDO từ BaseModel (thông qua LeaveModel)
        $this->pdo = $this->leaveModel->getPdo();
    }

    /**
     * Xử lý: POST /api.php?resource=leaves
     * (Hàm 1: Tạo yêu cầu nghỉ phép mới)
     */
    public function handleRequestLeave(): void {
        try {
            $data = $this->getRequestBody();

            // Validation cơ bản
            if (empty($data->employee_id) || empty($data->leave_type) || empty($data->start_date) || empty($data->end_date)) {
                $this->sendError('Thiếu thông tin bắt buộc (employee_id, leave_type, start_date, end_date).', 400);
                return;
            }

            $success = $this->leaveModel->create($data);
            
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Tạo yêu cầu nghỉ phép thành công.'], 201);
            }

        } catch (Throwable $t) {
            $this->sendError($t->getMessage(), $t->getCode() === 400 ? 400 : 500);
        }
    }

    /**
     * Xử lý: PUT /api.php?resource=leaves&id={id}&action=approve
     * (Hàm 2: Duyệt yêu cầu - Hàm "thông minh" nhất)
     */
    public function handleApproveRequest(int $leaveId): void {
        // ID người duyệt (tạm thời hardcode admin)
        $approverUserId = 1; 

        // Bắt đầu Giao dịch (Transaction)
        try {
            $this->pdo->beginTransaction();

            // 1. Cập nhật trạng thái 'leaves' -> 'approved'
            $successUpdate = $this->leaveModel->updateStatus($leaveId, 'approved', $approverUserId);
            if (!$successUpdate) {
                throw new Exception('Không tìm thấy yêu cầu nghỉ phép để duyệt.', 404);
            }

            // 2. Lấy thông tin chi tiết của yêu cầu vừa duyệt
            $request = $this->leaveModel->getById($leaveId);
            if (!$request) {
                throw new Exception('Không thể lấy chi tiết yêu cầu vừa duyệt.', 404);
            }
            
            // 3. Lấy ca làm việc (shift_id) của nhân viên
            $employee = $this->employeeModel->getById($request['employee_id']);
            if (!$employee || empty($employee['shift_id'])) {
                throw new Exception('Không tìm thấy nhân viên hoặc nhân viên chưa có ca làm việc.', 400);
            }

            // 4. "Thông báo" cho AttendanceModel: Tạo log nghỉ phép
            // (Xử lý cho từng ngày trong khoảng nghỉ phép)
            $startDate = new DateTime($request['start_date']);
            $endDate = new DateTime($request['end_date']);
            $interval = new DateInterval('P1D'); // P1D = 1 ngày
            $period = new DatePeriod($startDate, $interval, $endDate->modify('+1 day')); // +1 day để bao gồm cả ngày kết thúc

            foreach ($period as $date) {
                $this->attendanceModel->createExcusedAbsenceLog(
                    $request['employee_id'],
                    $date->format('Y-m-d'),
                    $employee['shift_id'],
                    $request['leave_type']
                );
            }

            // 5. Nếu tất cả đều thành công: LƯU VĨNH VIỄN
            $this->pdo->commit();
            $this->sendResponse(['success' => true, 'message' => 'Đã duyệt nghỉ phép và đồng bộ chấm công thành công.']);

        } catch (Throwable $t) {
            // 6. Nếu có bất kỳ lỗi nào: HỦY BỎ TẤT CẢ
            $this->pdo->rollBack();
            $this->sendError('Đã xảy ra lỗi trong quá trình duyệt: ' . $t->getMessage(), 500);
        }
    }

    /**
     * Xử lý: PUT /api.php?resource=leaves&id={id}&action=reject
     * (Hàm đơn giản, không cần transaction)
     */
    public function handleRejectRequest(int $leaveId): void {
        try {
            $success = $this->leaveModel->updateStatus($leaveId, 'rejected', 1);
            if ($success) {
                $this->sendResponse(['success' => true, 'message' => 'Đã từ chối yêu cầu nghỉ phép.']);
            } else {
                $this->sendError('Không tìm thấy yêu cầu để từ chối.', 404);
            }
        } catch (Throwable $t) {
            $this->sendError($t->getMessage(), 500);
        }
    }
    
    /**
     * Xử lý: GET /api.php?resource=leaves&pending=true
     * (Lấy các yêu cầu đang chờ duyệt)
     */
    public function getPendingRequests(): void {
        try {
            $requests = $this->leaveModel->getPendingRequests();
            $this->sendResponse($requests);
        } catch (Throwable $t) {
            $this->sendError($t->getMessage(), 500);
        }
    }
    
    /**
     * Xử lý: GET /api.php?resource=leaves&employee_id={id}
     * (Lấy lịch sử của 1 nhân viên)
     */
    public function getEmployeeHistory(string $employeeId): void {
        try {
            $history = $this->leaveModel->getLeaveHistory($employeeId);
            $this->sendResponse($history);
        } catch (Throwable $t) {
            $this->sendError($t->getMessage(), 500);
        }
    }
}
?>
