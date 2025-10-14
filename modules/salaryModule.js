// === modules/salaryModule.js (Phiên bản mới) ===

import { updateEmployeeAllowance } from './employeeDbModule.js';


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
    const allAdjustments = getAllAdjustments();
    const newAdjustment = {
        id: `adj_${Date.now()}`,
        employeeId,
        type, // 'bonus' hoặc 'allowance'
        amount: parseInt(amount),
        description,
        date: new Date().toISOString().split('T')[0] // Lưu ngày thực hiện
    };

    allAdjustments.push(newAdjustment);
    saveAdjustments(allAdjustments);

    // Nếu là khoản tăng lương vĩnh viễn, cập nhật cả thông tin nhân viên
    if (type === 'allowance') {
        updateEmployeeAllowance(employeeId, parseInt(amount));
        console.log(`Đã cập nhật phụ cấp cho nhân viên ${employeeId}`);
    }


    
    return true;
}
