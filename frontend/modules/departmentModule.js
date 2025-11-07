

// 1. Định nghĩa URL API
// Đảm bảo URL này khớp với tên thư mục dự án của bạn trong htdocs
const API_BASE_URL = 'http://localhost/hrm_project/backend/api.php';

/**
 * 2. Lấy tất cả phòng ban từ API.
 * Hàm này giờ là 'async' (bất đồng bộ).
 */
export async function getAllDepartments() {
    try {
        const response = await fetch(`${API_BASE_URL}?resource=departments`, {
            method: 'GET'
        });
        
        // 3. Kiểm tra lỗi mạng hoặc lỗi server
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data; // Trả về mảng JSON
    } catch (error) {
        console.error('Lỗi khi tải danh sách phòng ban:', error);
        alert('Không thể tải dữ liệu phòng ban. ' + error.message);
        return []; // Luôn trả về mảng rỗng để UI không bị "vỡ"
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name }) // 4. Gửi dữ liệu JSON
        });
        
        const result = await response.json();
        
        // 5. Kiểm tra lỗi nghiệp vụ (ví dụ: tên trùng)
        if (!response.ok) {
            throw new Error(result.error || 'Thêm phòng ban thất bại.');
        }
        
        return true; // Thành công
    } catch (error) {
        console.error('Lỗi khi thêm phòng ban:', error);
        alert(error.message);
        return false; // Thất bại
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
        console.error('Lỗi khi cập nhật phòng ban:', error);
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
        console.error('Lỗi khi xóa phòng ban:', error);
        alert(error.message);
        return false;
    }
}

/**
 * Lấy một phòng ban theo ID.
 * (Hàm này cũng cần chuyển sang async)
 */
export async function getDepartmentById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}?resource=departments&id=${id}`);
        if (!response.ok) {
            throw new Error('Lỗi khi tải thông tin phòng ban.');
        }
        return await response.json();
    } catch (error) {
        console.error('getDepartmentById error:', error);
        return null;
    }
}