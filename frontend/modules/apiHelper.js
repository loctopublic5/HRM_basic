// 1. Tự động thêm Base URL
// URL này trỏ đến file router duy nhất của backend
const API_BASE_URL = 'http://localhost/hrm-project/backend/api.php';

/**
 * Hàm nội bộ, xử lý tất cả các phản hồi (response) từ fetch.
 * @param {Response} response - Đối tượng response từ fetch.
 * @returns {Promise<any>} Dữ liệu JSON đã được parse.
 * @throws {Error} Ném ra lỗi nếu server trả về status không phải 2xx.
 */
async function handleResponse(response) {
    // 3. Tự động xử lý lỗi
    if (!response.ok) {
        let errorData;
        try {
            // Cố gắng đọc lỗi JSON từ server (ví dụ: {"error": "Tên đã tồn tại"})
            errorData = await response.json();
        } catch (e) {
            // Nếu server trả về lỗi 500 HTML, không phải JSON
            errorData = { error: `Lỗi HTTP: ${response.status} ${response.statusText}` };
        }
        // Ném lỗi để hàm gọi (trong try...catch) có thể bắt được
        throw new Error(errorData.error || 'Đã xảy ra lỗi không xác định');
    }
    
    // Nếu response.status là 204 (No Content), không cần .json()
    if (response.status === 204) {
        return { success: true };
    }
    
    // Tự động parse JSON nếu thành công
    return response.json();
}

/**
 * Thực hiện một request GET (Dùng cho Lấy danh sách, Lấy 1, Tìm kiếm).
 * @param {string} resource - Tên tài nguyên (ví dụ: 'departments', 'employees').
 * @param {object} params - Các tham số URL (ví dụ: { id: 1, history: true }).
 * @returns {Promise<any>}
 */
export async function apiGet(resource, params = {}) {
    const url = new URL(API_BASE_URL);
    url.searchParams.append('resource', resource);
    for (const key in params) {
        // Chỉ thêm tham số nếu nó có giá trị
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.append(key, params[key]);
        }
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`API GET Error (${resource}):`, error.message);
        throw error; // Ném lỗi ra ngoài để module gọi (ví dụ: UI Module) xử lý
    }
}

/**
 * Thực hiện một request POST (Dùng cho Tạo mới).
 * @param {string} resource - Tên tài nguyên.
 * @param {object} data - Dữ liệu JavaScript để gửi (sẽ được stringify).
 * @param {object} params - Các tham số URL (ví dụ: { action: 'login' }).
 * @returns {Promise<any>}
 */
export async function apiPost(resource, data, params = {}) {
    const url = new URL(API_BASE_URL);
    url.searchParams.append('resource', resource);
    for (const key in params) {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.append(key, params[key]);
        }
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            // 2. Tự động thêm Headers
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`API POST Error (${resource}):`, error.message);
        throw error;
    }
}

/**
 * Thực hiện một request PUT (Dùng cho Cập nhật).
 * @param {string} resource - Tên tài nguyên.
 * @param {string|number} id - ID của tài nguyên cần cập nhật.
 * @param {object} data - Dữ liệu JavaScript để gửi.
 * @returns {Promise<any>}
 */
export async function apiPut(resource, id, data) {
    const url = new URL(API_BASE_URL);
    url.searchParams.append('resource', resource);
    url.searchParams.append('id', id);

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`API PUT Error (${resource}/${id}):`, error.message);
        throw error;
    }
}

/**
 * Thực hiện một request DELETE (Dùng cho Xóa).
 * @param {string} resource - Tên tài nguyên.
 * @param {string|number} id - ID của tài nguyên cần xóa.
 * @returns {Promise<any>}
 */
export async function apiDelete(resource, id) {
    const url = new URL(API_BASE_URL);
    url.searchParams.append('resource', resource);
    url.searchParams.append('id', id);
    
    try {
        const response = await fetch(url, {
            method: 'DELETE'
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`API DELETE Error (${resource}/${id}):`, error.message);
        throw error;
    }
}