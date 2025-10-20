import { getPositionById } from './positionModule.js';
import { getEmployeeById } from './employeeDbModule.js';

const ADJUSTMENTS_STORAGE_KEY = 'hrm_salary_adjustments';

/**
 * Lấy tất cả các bản ghi điều chỉnh lương.
 * @returns {Array}
 */
function getAllAdjustments() {
    const data = localStorage.getItem(ADJUSTMENTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Lưu lại các bản ghi điều chỉnh lương.
 * @param {Array} adjustments 
 */
function saveAdjustments(adjustments) {
    localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(adjustments));
}

/**
 * Lấy các bản ghi điều chỉnh của một nhân viên.
 * @param {string} employeeId 
 * @returns {Array}
 */
export function getAdjustmentsForEmployee(employeeId) {
    return getAllAdjustments().filter(adj => adj.employeeId === employeeId);
}

/**
 * Thêm một bản ghi điều chỉnh lương mới.
 * @param {object} adjustmentData - { employeeId, type, amount, description }
 */
export function addAdjustment({ employeeId, type, amount, description }) {
    // Tìm nhân viên để lấy positionId hiện tại của họ
    const employee = getEmployeeById(employeeId);
    if (!employee) {
        console.error("Không tìm thấy nhân viên để thêm điều chỉnh lương.");
        return false;
    }

    const allAdjustments = getAllAdjustments();
    const newAdjustment = {
        id: `adj_${Date.now()}`,
        employeeId,
        type,
        amount: parseInt(amount),
        description,
        date: new Date().toISOString().split('T')[0],
        positionId: employee.positionId // <-- LƯU LẠI VỊ TRÍ TẠI THỜI ĐIỂM TĂNG LƯƠNG
    };

    allAdjustments.push(newAdjustment);
    saveAdjustments(allAdjustments);
    
    // Khối "if (type === 'allowance')" đã được xóa bỏ hoàn toàn.
    
    return true;
}

/**
 * Tính toán tổng lương cơ bản hiện tại của nhân viên (base + allowance).
 * @param {object} employee - Đối tượng nhân viên đầy đủ.
 * @returns {number} Tổng lương cơ bản.
 */
export function calculateCurrentTotalSalary(employee) {
    if (!employee) return 0;

    // 1. Lấy lương cơ bản từ vị trí hiện tại của nhân viên
    const position = getPositionById(employee.positionId);
    const salaryBase = position ? position.salaryBase : 0;
    
    // 2. Lấy tất cả các bản ghi điều chỉnh của nhân viên này
    const allAdjustments = getAdjustmentsForEmployee(employee.id);

    // 3. Lọc và tính tổng các khoản 'allowance' CHỈ cho vị trí HIỆN TẠI
    const currentPositionAllowances = allAdjustments
        .filter(adj => adj.type === 'allowance' && adj.positionId === employee.positionId)
        .reduce((sum, adj) => sum + adj.amount, 0);
    
    // 4. Trả về tổng cuối cùng
    return salaryBase + currentPositionAllowances;
}

