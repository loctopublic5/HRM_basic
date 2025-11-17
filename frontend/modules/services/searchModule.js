import { getAllEmployees } from './employeeDbModule.js';

/**
 * Lấy danh sách gợi ý tên nhân viên dựa trên chuỗi tìm kiếm.
 * @param {string} nameQuery - Chuỗi người dùng đang gõ.
 * @returns {Array<string>} Mảng các tên phù hợp (tối đa 5).
 */
export function getAutocompleteSuggestions(nameQuery) {
    if (!nameQuery || nameQuery.trim().length < 1) {
        return []; // Không gợi ý nếu chuỗi rỗng hoặc quá ngắn
    }

    const lowerCaseQuery = nameQuery.trim().toLowerCase();
    const allEmployees = getAllEmployees();

    const suggestions = allEmployees
        .filter(emp => emp.name.toLowerCase().includes(lowerCaseQuery))
        .map(emp => emp.name) // Chỉ lấy tên
        .slice(0, 5); // Giới hạn số lượng gợi ý

    // Loại bỏ các tên trùng lặp (nếu có) và trả về
    return [...new Set(suggestions)]; 
}

/**
 * Tìm kiếm nhân viên dựa trên các tiêu chí.
 * @param {object} criteria - Đối tượng chứa tiêu chí tìm kiếm { nameQuery, deptId, posId }.
 * @returns {Array<object>} Mảng các đối tượng nhân viên phù hợp.
 */
export function searchEmployees({ nameQuery, deptId, posId }) {
    const lowerCaseNameQuery = nameQuery ? nameQuery.trim().toLowerCase() : '';
    let results = getAllEmployees();

    // 1. Lọc theo tên (nếu có)
    if (lowerCaseNameQuery) {
        results = results.filter(emp => 
            emp.name.toLowerCase().includes(lowerCaseNameQuery)
        );
    }

    // 2. Lọc tiếp theo phòng ban (nếu có)
    if (deptId) {
        results = results.filter(emp => emp.departmentId === deptId);
    }

    // 3. Lọc tiếp theo vị trí (nếu có)
    if (posId) {
        results = results.filter(emp => emp.positionId === posId);
    }

    return results;
}