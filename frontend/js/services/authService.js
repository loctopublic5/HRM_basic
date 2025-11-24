import { apiPost } from '../utils/apiHelper.js';

const SESSION_KEY = 'hrm_user_session';

class AuthService {
    static async login(username, password) {
        // SAI (Cũ): apiPost('?resource=auth&action=login', ...)
        // ĐÚNG: apiPost('auth', data, params)
        const user = await apiPost('auth', { username, password }, { action: 'login' });
        
        if (user) {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        }
        return user;
    }

    static async logout() {
        try {
            // Sửa lại tương tự cho logout
            await apiPost('auth', {}, { action: 'logout' });
        } catch (e) {
            console.warn('Logout API warning:', e);
        } finally {
            sessionStorage.removeItem(SESSION_KEY);
        }
    }

    static isLoggedIn() {
        return !!sessionStorage.getItem(SESSION_KEY);
    }

    static getCurrentUser() {
        const data = sessionStorage.getItem(SESSION_KEY);
        return data ? JSON.parse(data) : null;
    }
}

export default AuthService;