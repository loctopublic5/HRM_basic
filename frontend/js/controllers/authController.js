import AuthService from '../services/authService.js';
import AuthView from '../views/authView.js';
import UI from '../utils/uiHelper.js';

class AuthController {
    init() {
        AuthView.renderLoginForm();
        AuthView.toggleLoginView(true);
        AuthView.bindLoginEvent(this.handleLogin.bind(this));
    }

    async handleLogin(username, password) {
        // Validation Client-side
        if (!username || !password) {
            AuthView.showError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
            return;
        }

        UI.showLoading(document.body); // Loading toàn màn hình

        try {
            const user = await AuthService.login(username, password);
            UI.toast(`Xin chào ${user.username || 'Admin'}`, 'success');
            
            // Reload trang để App.js chạy lại init() và điều hướng vào Dashboard
            window.location.reload(); 
        } catch (error) {
            AuthView.showError(error.message);
        } finally {
            UI.hideLoading();
        }
    }
}

export default new AuthController();