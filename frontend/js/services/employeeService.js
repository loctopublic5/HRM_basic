import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiHelper.js';

class EmployeeService {
    /**
     * Helper nội bộ: Chuẩn hóa phản hồi từ API
     * Mục đích: Đảm bảo luôn trả về Array cho các danh sách (Department, Position...)
     */
    static _unwrapList(response) {
        if (Array.isArray(response)) {
            return response; // Đã là mảng chuẩn
        }
        if (response && Array.isArray(response.data)) {
            return response.data; // Bọc trong key 'data'
        }
        // Trường hợp lỗi hoặc rỗng, trả về mảng rỗng để không crash map()
        console.warn('Service Warning: Expected Array but got:', response);
        return [];
    }

    /**
     * Lấy danh sách nhân viên
     * Backend trả về: { data: [...], pagination: {...} }
     * Chúng ta giữ nguyên cấu trúc này vì Controller cần cả pagination
     */
    static async getEmployees(params) {
        const response = await apiGet('employees', params);
        
        // Defensive Coding: Đảm bảo cấu trúc luôn đúng
        return {
            data: Array.isArray(response.data) ? response.data : [],
            pagination: response.pagination || {}
        };
    }

    static async getEmployeeById(id) {
        const response = await apiGet('employees', { id });
        // Nếu trả về { data: {...} } thì lấy data, không thì lấy nguyên cục
        return response.data || response;
    }

    static async createEmployee(data) {
        return await apiPost('employees', data);
    }

    static async updateEmployee(id, data) {
        return await apiPut('employees', id, data);
    }

    static async deleteEmployee(id) {
        return await apiDelete('employees', id);
    }

    // --- Helpers: Lấy danh mục (Áp dụng _unwrapList) ---
    
    static async getDepartments() {
        const response = await apiGet('departments');
        return this._unwrapList(response);
    }

    static async getPositions() {
        const response = await apiGet('positions');
        return this._unwrapList(response);
    }
    
    static async getShifts() {
        const response = await apiGet('shifts');
        return this._unwrapList(response);
    }
}

export default EmployeeService;