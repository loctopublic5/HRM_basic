import UI from '../utils/uiHelper.js';

class AuthView {
    constructor() {
        this.loginView = document.getElementById('login-view');
        this.appView = document.getElementById('app'); // Container chính của App
    }

    renderLoginForm() {
        this.loginView.innerHTML = `
            <div class="card" style="width: 400px; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="color: var(--primary); margin-bottom: 0.5rem;">HRM Enterprise</h2>
                    <p style="color: var(--text-muted);">Đăng nhập hệ thống</p>
                </div>
                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label">Tên đăng nhập</label>
                        <input type="text" name="username" class="form-control" placeholder="admin" required autofocus>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Mật khẩu</label>
                        <input type="password" name="password" class="form-control" placeholder="••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">
                        <i class="fa-solid fa-right-to-bracket"></i> Đăng nhập
                    </button>
                </form>
            </div>
        `;
    }

    /**
     * Chuyển đổi giữa màn hình Login và Main App
     * @param {boolean} showLogin - True: Hiện Login, False: Hiện App
     */
    toggleLoginView(showLogin) {
        if (showLogin) {
            this.loginView.classList.remove('d-none'); // CSS d-none: display: none
            this.loginView.style.display = 'flex'; // Căn giữa
            this.appView.classList.add('d-none');
        } else {
            this.loginView.classList.add('d-none');
            this.appView.classList.remove('d-none');
            this.appView.style.display = 'grid'; // Grid layout
        }
    }

    bindLoginEvent(handler) {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                handler(formData.get('username'), formData.get('password'));
            });
        }
    }

    showError(msg) {
        UI.toast(msg, 'error');
    }
}

export default new AuthView();