// === modules/departmentModule.js (SAU) ===

const API_BASE_URL = 'http://localhost/hrm_project/backend/api.php';

/**
 * Lấy tất cả phòng ban đang hoạt động từ API.
 */
export async function getAllDepartments() {
    try {
        const response = await fetch(`${API_BASE_URL}?resource=departments`, {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error('Lỗi khi tải danh sách phòng ban.');
        }
        return await response.json();
    } catch (error) {
        console.error('getAllDepartments error:', error);
        alert(error.message);
        return []; // Luôn trả về mảng để tránh lỗi ở UI
    }
}

/**
 * Thêm một phòng ban mới qua API.
 * @param {string} name Tên phòng ban mới.
 */
export async function addDepartment(name) {
    try {
        const response = await fetch(`${API_BASE_URL}?resource=departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        const result = await response.json();
        
        if (!response.ok) {
            // Ném lỗi trả về từ server (ví dụ: "Tên phòng ban đã tồn tại.")
            throw new Error(result.error || 'Thêm phòng ban thất bại.');
        }
        return true;
    } catch (error) {
        console.error('addDepartment error:', error);
        alert(error.message); // Hiển thị lỗi cho người dùng
        return false;
    }
}

/**
 * Cập nhật phòng ban qua API.
 * @param {string} id ID phòng ban.
 * @param {string} newName Tên mới.
 */
export async function updateDepartment(id, newName) {
    try {
        const response = await fetch(`${API_BASE_URL}?resource=departments&id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Cập nhật thất bại.');
        }
        return true;
    } catch (error) {
        console.error('updateDepartment error:', error);
        alert(error.message);
        return false;
    }
}

/**
 * Xóa mềm phòng ban qua API.
 * @param {string} id ID phòng ban.
 */
export async function deleteDepartment(id) {
    try {
        const response = await fetch(`${API_BASE_URL}?resource=departments&id=${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Xóa thất bại.');
        }
        return true;
    } catch (error) {
        console.error('deleteDepartment error:', error);
        alert(error.message);
        return false;
    }
}

// (Bạn sẽ cần thêm hàm getDepartmentById(id) nếu module UI cần)