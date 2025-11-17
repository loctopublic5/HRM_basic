
// Import các hàm apiPost và apiGet từ "trợ lý" API
import { apiPost } from './apiHelper.js';

const USER_SESSION_KEY = 'hrm_user_session';

/**
 * Gọi API để đăng nhập.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<object>} Thông tin user nếu thành công.
 */
export async function login(username, password) {
    // Gọi 'POST ...?resource=auth&action=login'
    const user = await apiPost('auth', { username, password }, { action: 'login' });
    
    // Nếu API gọi thành công (không ném lỗi), lưu session vào trình duyệt
    if (user) {
        saveUserSession(user);
    }
    return user;
}

/**
 * Gọi API để đăng xuất.
 */
export async function logout() {
    // Gọi 'POST ...?resource=auth&action=logout'
    await apiPost('auth', {}, { action: 'logout' });
    
    // Xóa session khỏi trình duyệt
    clearUserSession();
}

// --- Các hàm tiện ích (Helper) cho sessionStorage ---

/**
 * Lưu thông tin user vào sessionStorage.
 * @param {object} user 
 */
export function saveUserSession(user) {
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
}

/**
 * Xóa thông tin user khỏi sessionStorage.
 */
export function clearUserSession() {
    sessionStorage.removeItem(USER_SESSION_KEY);
}

/**
 * Kiểm tra xem người dùng đã đăng nhập (phía client) hay chưa.
 * @returns {boolean}
 */
export function isLoggedIn() {
    return sessionStorage.getItem(USER_SESSION_KEY) !== null;
}

/**
 * Lấy thông tin user từ sessionStorage.
 * @returns {object | null}
 */
export function getUserSession() {
    const user = sessionStorage.getItem(USER_SESSION_KEY);
    return user ? JSON.parse(user) : null;
}

