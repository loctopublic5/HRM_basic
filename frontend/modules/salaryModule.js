import { getPositionById } from './positionModule.js';
import {  getEmployeeById } from './employeeDbModule.js';

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
    
    return true;
}

/**
 * Tính toán chi tiết lương cơ bản của một nhân viên.
 * Trả về lương gốc, tổng phụ cấp cho vị trí hiện tại, và tổng lương.
 * @param {object} employee - Đối tượng nhân viên.
 * @returns {{salaryBase: number, currentAllowance: number, totalSalary: number}}
 */
export function calculateSalaryDetails(employee) {
    if (!employee) return { salaryBase: 0, currentAllowance: 0, totalSalary: 0 };

    // 1. Lấy lương cơ bản từ vị trí hiện tại
    const position = getPositionById(employee.positionId);
    const salaryBase = position ? position.salaryBase : 0;
    
    // 2. Lấy tất cả các bản ghi điều chỉnh của nhân viên
    const allAdjustments = getAdjustmentsForEmployee(employee.id);

    // 3. Lọc và tính tổng các khoản 'allowance' CHỈ cho vị trí HIỆN TẠI
    const currentAllowance = allAdjustments
        .filter(adj => adj.type === 'allowance' && adj.positionId === employee.positionId)
        .reduce((sum, adj) => sum + adj.amount, 0);
    
    // 4. Trả về đối tượng chi tiết
    return {
        salaryBase,
        currentAllowance,
        totalSalary: salaryBase + currentAllowance
    };
}

