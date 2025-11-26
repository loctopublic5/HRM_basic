import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiHelper.js';

class DepartmentService {
    /**
     * Lấy danh sách tất cả phòng ban
     */
    static async getAll() {
        const response = await apiGet('departments');
        // Đảm bảo luôn trả về mảng
        return Array.isArray(response) ? response : (response.data || []);
    }

    static async getById(id) {
        return await apiGet('departments', { id });
    }

    static async create(data) {
        return await apiPost('departments', data);
    }

    static async update(id, data) {
        return await apiPut('departments', id, data);
    }

    static async delete(id) {
        return await apiDelete('departments', id);
    }

    /**
     * Lấy danh sách nhân viên thuộc một phòng ban cụ thể
     * Dùng cho tính năng "Xem Chi tiết"
     * @param {string} deptId 
     */
    static async getEmployeesByDepartment(deptId) {
        // Gọi API employees với tham số lọc deptId
        // Backend EmployeeController đã hỗ trợ search theo deptId
        const response = await apiGet('employees', { deptId: deptId });
        return Array.isArray(response.data) ? response.data : [];
    }
}

export default DepartmentService;