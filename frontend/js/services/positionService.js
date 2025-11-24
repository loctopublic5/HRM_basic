
import { apiGet, apiPost, apiPut, apiDelete } from '../helpers/apiHelper.js';

/**
 * Lấy danh sách tất cả vị trí.
 * @returns {Promise<Array>}
 */
export async function getPositions() {
    // Gọi API: GET /api.php?resource=positions
    return await apiGet('positions');
}

/**
 * Thêm vị trí mới.
 * @param {object} data - { title, description, salaryBase, departmentId }
 */
export async function createPosition(data) {
    return await apiPost('positions', data);
}

/**
 * Cập nhật vị trí.
 * @param {string} id 
 * @param {object} data 
 */
export async function updatePosition(id, data) {
    return await apiPut('positions', id, data);
}

/**
 * Xóa (mềm) vị trí.
 * @param {string} id 
 */
export async function deletePosition(id) {
    return await apiDelete('positions', id);
}

/**
 * Lấy chi tiết 1 vị trí (nếu cần cho form Sửa)
 * @param {string} id 
 */
export async function getPositionById(id) {
    return await apiGet('positions', { id });
}

/**
 * Lấy danh sách vị trí theo phòng ban (Dùng cho dropdown phụ thuộc)
 * @param {string} deptId 
 */
export async function getPositionsByDepartmentId(deptId) {
    return await apiGet('positions', { deptId });
}