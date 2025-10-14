const EMPLOYEES_STORAGE_KEY = 'hrm_employees';

// Dữ liệu mẫu để khởi tạo nếu localStorage trống
const mockEmployees = [
    { 
        id: `EMP${Date.now()}`, 
        name: 'Nguyễn Văn A', 
        departmentId: 'dept_it', 
        positionId: 'pos_dev', 
        permanentAllowance: 0, 
        hireDate: '2023-01-15' 
    },
    { 
        id: `EMP${Date.now() + 1}`, 
        name: 'Trần Thị B', 
        departmentId: 'dept_hr', 
        positionId: 'pos_recruiter', 
        permanentAllowance: 0,
        hireDate: '2022-08-20' 
    },
    { 
        id: `EMP${Date.now() + 2}`, 
        name: 'Lê Văn C', 
        departmentId: 'dept_mkt', 
        positionId: 'pos_manager', 
        permanentAllowance: 0,
        hireDate: '2021-05-10' 
    },
];

/**
 * Lấy tất cả nhân viên từ localStorage.
 * @returns {Array} Mảng các đối tượng nhân viên.
 */
function getAllEmployees() {
    const data = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    // Nếu không có dữ liệu, trả về mảng rỗng
    // JSON.parse chuyển đổi một chuỗi JSON thành một đối tượng JavaScript
    return data ? JSON.parse(data) : [];
}

/**
 * Lưu một mảng nhân viên vào localStorage.
 * @param {Array} employees Mảng các đối tượng nhân viên cần lưu.
 */
function saveEmployees(employees) {
    // JSON.stringify chuyển đổi một đối tượng JavaScript thành chuỗi JSON
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
}

/**
 * Lấy thông tin một nhân viên bằng ID.
 * @param {string} id ID của nhân viên cần tìm.
 * @returns {Object|null} Đối tượng nhân viên hoặc null nếu không tìm thấy.
 */
function getEmployeeById(id) {
    const employees = getAllEmployees();
    return employees.find(emp => emp.id === id) || null;
}

function addEmployee(employeeData) {
    const employees = getAllEmployees();
    const newEmployee = {
        id: `EMP_${Date.now()}`,
        name: employeeData.name,
        departmentId: employeeData.departmentId,
        positionId: employeeData.positionId,
        hireDate: employeeData.hireDate,
        permanentAllowance: 0, // Luôn bắt đầu bằng 0
    };
    employees.push(newEmployee);
    saveEmployees(employees);
}

// --- HÀM MỚI ---
function updateEmployee(id, updates) {
    const employees = getAllEmployees();
    const index = employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
        // Chỉ cho phép cập nhật các trường này từ form quản lý nhân viên
        const allowedUpdates = {
            name: updates.name,
            departmentId: updates.departmentId,
            positionId: updates.positionId,
            hireDate: updates.hireDate,
        };
        employees[index] = { ...employees[index], ...allowedUpdates };
        saveEmployees(employees);
    }
}

// --- HÀM MỚI ---
function deleteEmployee(id) {
    let employees = getAllEmployees();
    employees = employees.filter(emp => emp.id !== id);
    saveEmployees(employees);
}

// --- Logic Khởi tạo ---
// IIFE (Immediately Invoked Function Expression) để chạy logic này ngay lập tức khi module được load
(function init() {
    const employees = getAllEmployees();
    // Nếu không có nhân viên nào trong storage, hãy khởi tạo với dữ liệu mẫu
    if (employees.length === 0) {
        saveEmployees(mockEmployees);
        console.log('Khởi tạo dữ liệu nhân viên mẫu thành công!');
    }
})();

/**
 * Cập nhật Phụ cấp Cố định cho một nhân viên.
 * @param {string} employeeId 
 * @param {number} amountToAdd - Số tiền tăng thêm.
 */
function updateEmployeeAllowance(employeeId, amountToAdd) {
    const employees = getAllEmployees();
    const index = employees.findIndex(emp => emp.id === employeeId);
    if (index !== -1) {
        employees[index].permanentAllowance += amountToAdd;
        saveEmployees(employees);
    }
}

// Export các hàm để các module khác có thể sử dụng
export { getAllEmployees, saveEmployees, getEmployeeById
, addEmployee, updateEmployee, deleteEmployee, updateEmployeeAllowance
};