import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiHelper.js';

class PositionService {
    // ... (Giữ nguyên các hàm getPositions, getPositionById, create, update, delete) ...
    static async getPositions(params = {}) {
        const response = await apiGet('positions', params);
        return Array.isArray(response) ? response : (response.data || []);
    }

    static async getPositionById(id) {
        const response = await apiGet('positions', { id });
        return response.data || response;
    }

    static async createPosition(data) {
        return await apiPost('positions', data);
    }

    static async updatePosition(id, data) {
        return await apiPut('positions', id, data);
    }

    static async deletePosition(id) {
        return await apiDelete('positions', id);
    }

    static async getEmployeesByPosition(posId) {
        const response = await apiGet('employees', { posId: posId });
        return Array.isArray(response.data) ? response.data : [];
    }

    static async getDepartments() {
        const response = await apiGet('departments');
        return Array.isArray(response) ? response : (response.data || []);
    }
}

export default PositionService;