import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiHelper.js';

class EmployeeService {
    /**
     * Lấy danh sách nhân viên (có phân trang, search, filter)
     */
    static async getEmployees(params) {
        const response = await apiGet('employees', params);
        return {
            data: Array.isArray(response.data) ? response.data : [],
            pagination: response.pagination || {}
        };
    }

    /**
     * Lấy chi tiết 1 nhân viên (API getById mới đã có department_id)
     */
    static async getEmployeeById(id) {
        const response = await apiGet('employees', { id });
        // Backend trả về trực tiếp object nhân viên hoặc bọc trong data
        return response.data || response;
    }

    /**
     * Tạo mới (Payload sẽ có departmentId từ Form)
     */
    static async createEmployee(data) {
        return await apiPost('employees', data);
    }

    /**
     * Cập nhật
     */
    static async updateEmployee(id, data) {
        return await apiPut('employees', id, data);
    }

    static async deleteEmployee(id) {
        return await apiDelete('employees', id);
    }

    // --- Helpers: Lấy danh mục dùng chung ---
    
    static async getDepartments() {
        const response = await apiGet('departments');
        return Array.isArray(response) ? response : (response.data || []);
    }

    static async getPositions() {
        const response = await apiGet('positions');
        return Array.isArray(response) ? response : (response.data || []);
    }
    
    static async getShifts() {
        const response = await apiGet('shifts');
        return Array.isArray(response) ? response : (response.data || []);
    }
}

export default EmployeeService;