import CONFIG from '../config.js';
import UI from './uiHelper.js';
/**
 * Hàm nội bộ: Làm sạch tên resource để tránh lỗi Double Query String
 * Ví dụ: '?resource=employees' -> 'employees'
 * Ví dụ: '/employees' -> 'employees'
 */
function sanitizeResource(resource) {
    if (!resource) return '';
    // Xóa ?resource= ở đầu (nếu có)
    let clean = resource.replace(/^\?resource=/, '');
    // Xóa dấu / ở đầu (nếu có)
    clean = clean.replace(/^\//, '');
    return clean;
}
/**
 * Hàm nội bộ: Xử lý phản hồi từ Fetch API
 * - Kiểm tra status code (ok / not ok).
 * - Parse JSON lỗi hoặc Text lỗi (nếu server trả HTML 500).
 * - Xử lý trường hợp 204 No Content.
 */
async function handleResponse(response) {
    // 1. Nếu Request thất bại (Status != 2xx)
    if (!response.ok) {
        let errorData;
        try {
            // Cố gắng đọc lỗi dạng JSON từ Backend (ví dụ: { "error": "Tên trùng" })
            errorData = await response.json();
        } catch (e) {
            // Nếu không phải JSON (ví dụ Server lỗi 500 trả về trang HTML, hoặc mất mạng)
            // Ta sẽ đọc text thô để debug hoặc hiển thị lỗi chung
            const errorText = await response.text();
            errorData = { error: `HTTP Error ${response.status}: ${response.statusText}` };
            console.error('Non-JSON Error Response:', errorText);
        }
        
        // Ném lỗi ra để khối catch bên ngoài bắt được
        throw new Error(errorData.error || `Lỗi không xác định (${response.status})`);
    }

    // 2. Xử lý thành công nhưng không có nội dung (204 No Content)
    // Thường gặp ở API Delete hoặc Update không trả về data
    if (response.status === 204) {
        return { success: true };
    }

    // 3. Xử lý thành công có dữ liệu (200, 201)
    return await response.json();
}

/**
 * GET Request
 * Dùng cho: Lấy danh sách, Lấy chi tiết, Tìm kiếm
 * @param {string} resource - Tên resource (vd: 'employees')
 * @param {object} params - Object chứa query params (vd: { page: 1, limit: 10 })
 */
export async function apiGet(resource, params = {}) {
    // 1. Bật Loading
    UI.showLoading();

    try {
        // 2. Xây dựng URL với Query String
        const url = new URL(CONFIG.API_URL);
        url.searchParams.append('resource', resource);

        // Duyệt qua params object để nối vào URL
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });

        // 3. Gọi Fetch
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        // 4. Xử lý kết quả
        return await handleResponse(response);

    } catch (error) {
        // Log lỗi và ném tiếp để Controller xử lý (hiển thị Toast)
        console.error(`[API GET] Error on ${resource}:`, error);
        throw error;
    } finally {
        // 5. Tắt Loading (Luôn chạy dù thành công hay thất bại)
        UI.hideLoading();
    }
}

/**
 * POST Request
 * Dùng cho: Tạo mới (Create), Login
 * @param {string} resource 
 * @param {object} body - Dữ liệu cần gửi
 * @param {object} params - Query params phụ (nếu có)
 */
export async function apiPost(resource, body, params = {}) {
    UI.showLoading();

    try {
        const url = new URL(CONFIG.API_URL);
        url.searchParams.append('resource', resource);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        return await handleResponse(response);

    } catch (error) {
        console.error(`[API POST] Error on ${resource}:`, error);
        throw error;
    } finally {
        UI.hideLoading();
    }
}

/**
 * PUT Request
 * Dùng cho: Cập nhật (Update)
 * @param {string} resource 
 * @param {string|number} id - ID của đối tượng cần sửa
 * @param {object} body - Dữ liệu cần sửa
 */
export async function apiPut(resource, id, body) {
    UI.showLoading();

    try {
        const url = new URL(CONFIG.API_URL);
        url.searchParams.append('resource', resource);
        url.searchParams.append('id', id);

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        return await handleResponse(response);

    } catch (error) {
        console.error(`[API PUT] Error on ${resource}/${id}:`, error);
        throw error;
    } finally {
        UI.hideLoading();
    }
}

/**
 * DELETE Request
 * Dùng cho: Xóa (Delete)
 * @param {string} resource 
 * @param {string|number} id 
 */
export async function apiDelete(resource, id) {
    UI.showLoading();

    try {
        const url = new URL(CONFIG.API_URL);
        url.searchParams.append('resource', resource);
        url.searchParams.append('id', id);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });

        return await handleResponse(response);

    } catch (error) {
        console.error(`[API DELETE] Error on ${resource}/${id}:`, error);
        throw error;
    } finally {
        UI.hideLoading();
    }
}