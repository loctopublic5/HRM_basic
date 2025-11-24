
import { apiGet, apiPost, apiPut, apiDelete } from '../helpers/apiHelper.js';

/**
 * Lấy danh sách tất cả phòng ban.
 * @returns {Promise<Array>}
 */
export async function getDepartments() {
    // Gọi API: GET /api.php?resource=departments
    return await apiGet('departments');
}

/**
 * Thêm phòng ban mới.
 * @param {string} name - Tên phòng ban
 */
export async function createDepartment(name) {
    return await apiPost('departments', { name });
}

/**
 * Cập nhật tên phòng ban.
 * @param {string} id 
 * @param {string} name 
 */
export async function updateDepartment(id, name) {
    return await apiPut('departments', id, { name });
}

/**
 * Xóa (mềm) phòng ban.
 * @param {string} id a
 */
export async function deleteDepartment(id) {
    return await apiDelete('departments', id);
}

/**
 * Lấy thông tin chi tiết 1 phòng ban (nếu cần cho trang chi tiết)
 * @param {string} id 
 */
export async function getDepartmentById(id) {
    return await apiGet('departments', { id });
}