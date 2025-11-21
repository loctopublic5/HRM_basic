const ATTENDANCE_STORAGE_KEY = 'hrm_attendance';

// --- CÁC HÀM NỘI BỘ (HELPER FUNCTIONS) ---

function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

function getAllAttendanceRecords() {
    const data = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAttendanceRecords(records) {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
}

/**
 * Phân tích thời gian check-in/out để tính toán trạng thái ngày làm việc.
 * @param {string} checkInISO
 * @param {string} checkOutISO
 * @returns {object}
 */
function calculateWorkdayStatus(checkInISO, checkOutISO) {
    if (!checkInISO || !checkOutISO) {
        return { workDuration: 0, status: 'incomplete', lateMinutes: 0, earlyLeaveMinutes: 0 };
    }
    const checkInDate = new Date(checkInISO);
    const checkOutDate = new Date(checkOutISO);

    const shiftStart = new Date(checkInDate);
    shiftStart.setHours(8, 0, 0, 0);

    const shiftEnd = new Date(checkInDate);
    shiftEnd.setHours(17, 0, 0, 0);

    const lateMinutes = Math.ceil(Math.max(0, (checkInDate - shiftStart) / (1000 * 60)));
    const earlyLeaveMinutes = Math.ceil(Math.max(0, (shiftEnd - checkOutDate) / (1000 * 60)));

    let totalWorkMs = checkOutDate - checkInDate;
    const FIVE_HOURS_IN_MS = 5 * 60 * 60 * 1000;
    const ONE_HOUR_IN_MS = 60 * 60 * 1000;

    if (totalWorkMs > FIVE_HOURS_IN_MS) {
        totalWorkMs -= ONE_HOUR_IN_MS;
    }
    
    const workDuration = totalWorkMs / (1000 * 60 * 60);

    let status = 'on_time';
    if (lateMinutes > 0 && earlyLeaveMinutes > 0) {
        status = 'late_and_early';
    } else if (lateMinutes > 0) {
        status = 'late';
    } else if (earlyLeaveMinutes > 0) {
        status = 'early_leave';
    }

    return {
        workDuration: parseFloat(workDuration.toFixed(2)),
        status,
        lateMinutes,
        earlyLeaveMinutes
    };
}


// --- CÁC HÀM CÔNG KHAI (PUBLIC API) ---

/**
 * Lấy bản ghi chấm công của một nhân viên trong ngày hôm nay.
 */
function getTodaysAttendanceForEmployee(employeeId) {
    const records = getAllAttendanceRecords();
    const today = getTodayDateString();
    return records.find(rec => rec.employeeId === employeeId && rec.date === today);
}

/**
 * Thực hiện check-in cho nhân viên.
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
 */
function checkOut(employeeId) {
    const allRecords = getAllAttendanceRecords();
    const today = getTodayDateString();
    
    const recordIndex = allRecords.findIndex(rec => 
        rec.employeeId === employeeId && 
        rec.date === today && 
        rec.checkOut === null
    );

    if (recordIndex === -1) {
        alert('Nhân viên này chưa check-in hoặc đã check-out rồi.');
        return false;
    }

    allRecords[recordIndex].checkOut = new Date().toISOString();
    
    const statusData = calculateWorkdayStatus(
        allRecords[recordIndex].checkIn, 
        allRecords[recordIndex].checkOut
    );

    Object.assign(allRecords[recordIndex], statusData);
    
    saveAttendanceRecords(allRecords);
    return true;
}

/**
 * Đếm số ngày làm việc có check-out hợp lệ của một nhân viên trong tháng.
 */
function getWorkdaysInMonth(employeeId, month, year) {
    const allRecords = getAllAttendanceRecords();
    const monthString = String(month).padStart(2, '0');
    const yearString = String(year);

    const workedDays = allRecords.filter(rec => 
        rec.employeeId === employeeId &&
        rec.date.startsWith(`${yearString}-${monthString}`) &&
        rec.checkOut !== null
    );
    return workedDays.length;
}


// --- EXPORT ---
// Chỉ "trưng bày" các hàm mà lớp giao diện cần sử dụng.
export { 
    checkIn, 
    checkOut, 
    getTodaysAttendanceForEmployee,
    getWorkdaysInMonth 
};