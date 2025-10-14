const ATTENDANCE_STORAGE_KEY = 'hrm_attendance';

// === CÁC HÀM TIỆN ÍCH VỀ THỜI GIAN ===

/**
 * Lấy ngày hôm nay dưới dạng chuỗi 'YYYY-MM-DD'
 * @returns {string}
 */
function getTodayDateString() {
    // toISOString() trả về dạng '2025-10-14T10:30:00.000Z', chúng ta chỉ cần phần trước chữ 'T'
    return new Date().toISOString().split('T')[0];
}

// === CÁC HÀM CHÍNH ===

/**
 * Lấy tất cả bản ghi chấm công.
 * @returns {Array}
 */
function getAllAttendanceRecords() {
    const data = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Lưu lại toàn bộ bản ghi chấm công.
 * @param {Array} records 
 */
function saveAttendanceRecords(records) {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
}

/**
 * Lấy bản ghi chấm công của một nhân viên trong ngày hôm nay.
 * @param {string} employeeId
 * @returns {object | undefined}
 */
function getTodaysAttendanceForEmployee(employeeId) {
    const records = getAllAttendanceRecords();
    const today = getTodayDateString();
    return records.find(rec => rec.employeeId === employeeId && rec.date === today);
}

/**
 * Thực hiện check-in cho nhân viên.
 * @param {string} employeeId 
 * @returns {boolean} True nếu thành công, false nếu đã check-in rồi.
 */
function checkIn(employeeId) {
    const todaysRecord = getTodaysAttendanceForEmployee(employeeId);
    if (todaysRecord) {
        alert('Nhân viên này đã check-in trong ngày hôm nay rồi.');
        return false;
    }

    const allRecords = getAllAttendanceRecords();
    const newRecord = {
        id: `att_${Date.now()}`,
        employeeId: employeeId,
        date: getTodayDateString(),
        checkIn: new Date().toISOString(),
        checkOut: null,
    };

    allRecords.push(newRecord);
    saveAttendanceRecords(allRecords);
    return true;
}

/**
 * Thực hiện check-out cho nhân viên.
 * @param {string} employeeId 
 * @returns {boolean} True nếu thành công, false nếu chưa check-in.
 */
function checkOut(employeeId) {
    const todaysRecord = getTodaysAttendanceForEmployee(employeeId);
    if (!todaysRecord || todaysRecord.checkOut) {
        alert('Nhân viên này chưa check-in hoặc đã check-out rồi.');
        return false;
    }

    const allRecords = getAllAttendanceRecords();
    const recordIndex = allRecords.findIndex(rec => rec.id === todaysRecord.id);

    if (recordIndex !== -1) {
        allRecords[recordIndex].checkOut = new Date().toISOString();
        saveAttendanceRecords(allRecords);
        return true;
    }
    return false;
}

/**
 * Tính toán tổng số giờ làm việc giữa hai mốc thời gian.
 * @param {string | null} checkInISO - Thời gian check-in dưới dạng chuỗi ISO.
 * @param {string | null} checkOutISO - Thời gian check-out dưới dạng chuỗi ISO.
 * @returns {string} Chuỗi định dạng "Xh Ym" hoặc "—" nếu chưa đủ dữ liệu.
 */
function calculateWorkHours(checkInISO, checkOutISO) {
    if (!checkInISO || !checkOutISO) {
        return '—';
    }

    const checkInTime = new Date(checkInISO);
    const checkOutTime = new Date(checkOutISO);

    // Tính chênh lệch bằng mili giây
    let diffMs = checkOutTime - checkInTime;

    // Chuyển đổi sang giờ, phút
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    diffMs -= diffHours * (1000 * 60 * 60);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
}


// Cập nhật dòng export để thêm hàm mới
export { checkIn, checkOut, getTodaysAttendanceForEmployee, calculateWorkHours };