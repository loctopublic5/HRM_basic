

import { apiGet, apiPost, apiPut, apiDelete } from '../helpers/apiHelper.js';

/**
 * Lấy danh sách tất cả các ca làm việc.
 * @returns {Promise<Array>}
 */
export async function getAllShifts() {
    // Gọi API: GET /api.php?resource=shifts
    return await apiGet('shifts');
}

/**
 * Thêm ca làm việc mới.
 */
export async function addShift(data) {
    return await apiPost('shifts', data);
}

/**
 * Cập nhật ca làm việc.
 */
export async function updateShift(id, data) {
    return await apiPut('shifts', id, data);
}

/**
 * Xóa ca làm việc.
 */
export async function deleteShift(id) {
    return await apiDelete('shifts', id);
}
