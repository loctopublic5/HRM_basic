const LEAVE_STORAGE_KEY = 'hrm_leave_requests';
const DEFAULT_ANNUAL_LEAVE_DAYS = 15; // Giả sử mỗi nhân viên có 15 ngày phép năm

function getAllLeaveRequests() {
    const data = localStorage.getItem(LEAVE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveLeaveRequests(requests) {
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(requests));
}

/**
 * Admin thêm một yêu cầu nghỉ phép mới cho nhân viên.
 */
function addLeaveRequest(requestData) {
    if (new Date(requestData.endDate) < new Date(requestData.startDate)) {
        alert('Lỗi: Ngày kết thúc không thể trước ngày bắt đầu.');
        return false;
    }
    const allRequests = getAllLeaveRequests();
    const newRequest = {
        id: `leave_${Date.now()}`,
        status: 'pending', // Mặc định là 'chờ duyệt'
        ...requestData
    };
    allRequests.push(newRequest);
    saveLeaveRequests(allRequests);
    return true;
}

/**
 * Cập nhật trạng thái của một yêu cầu nghỉ phép.
 */
function updateLeaveStatus(leaveId, newStatus) {
    const allRequests = getAllLeaveRequests();
    const index = allRequests.findIndex(req => req.id === leaveId);
    if (index !== -1) {
        allRequests[index].status = newStatus;
        saveLeaveRequests(allRequests);
        return true;
    }
    return false;
}

/**
 * Tính số ngày phép năm còn lại của nhân viên.
 */
function getLeaveBalance(employeeId) {
    const allRequests = getAllLeaveRequests();
    const approvedAnnualLeave = allRequests.filter(req => 
        req.employeeId === employeeId &&
        req.type === 'annual' &&
        req.status === 'approved'
    );

    const daysTaken = approvedAnnualLeave.reduce((total, req) => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 để tính cả ngày bắt đầu
        return total + diffDays;
    }, 0);

    return DEFAULT_ANNUAL_LEAVE_DAYS - daysTaken;
}

export{
    getAllLeaveRequests, getLeaveBalance, addLeaveRequest, updateLeaveStatus
}