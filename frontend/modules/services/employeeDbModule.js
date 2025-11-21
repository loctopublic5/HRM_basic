
import { apiGet, apiPost, apiPut, apiDelete } from '../helpers/apiHelper.js';

/**
 * Lấy danh sách nhân viên (có phân trang, sắp xếp).
 * @param {number} page
 * @param {number} limit
 * @param {string} sortBy
 * @param {string} sortOrder
 * @returns {Promise<object>} Đối tượng chứa { data, pagination }
 */
export async function getEmployees(page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc') {
    // Gọi GET ...?resource=employees&page=1&limit=10...
    return await apiGet('employees', { page, limit, sortBy, sortOrder });
}

/**
 * Tìm kiếm nhân viên.
 * @param {object} criteria - { name, deptId, posId }
 * @returns {Promise<object>} Đối tượng chứa { data, pagination }
 */
export async function searchEmployees(criteria) {
    // criteria = { name: "A", deptId: "dept_it", posId: "" }
    // apiGet sẽ tự động bỏ qua các key có giá trị rỗng hoặc null
    return await apiGet('employees', criteria);
}

/**
 * Lấy chi tiết một nhân viên.
 * (Chúng ta sẽ cần hàm này cho form Sửa)
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getEmployeeById(id) {
    // Gọi GET ...?resource=employees&id=...
    return await apiGet('employees', { id });
}

/**
 * Tạo nhân viên mới.
 * @param {object} data - { name, hireDate, positionId, shift_id }
 * @returns {Promise<object>}
 */
export async function createEmployee(data) {
    return await apiPost('employees', data);
}

/**
 * Cập nhật nhân viên.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateEmployee(id, data) {
    return await apiPut('employees', id, data);
}

/**
 * Xóa mềm nhân viên.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deleteEmployee(id) {
    return await apiDelete('employees', id);
}
/**
 * [MỚI] Lấy danh sách nhân viên thuộc một phòng ban cụ thể từ Server.
 * Sử dụng API search có sẵn của Backend.
 * @param {string} departmentId 
 * @param {number} page 
 * @param {number} limit 
 * @returns {Promise<object>} { data: [], pagination: {} }
 */
export async function getEmployeesByDepartment(departmentId, page = 1, limit = 10) {
    // Gọi API: GET /api.php?resource=employees&deptId=...&page=...&limit=...
    // Tận dụng controller searchEmployees của Backend đã làm
    return await apiGet('employees', { 
        deptId: departmentId,
        page: page,
        limit: limit
    });
}