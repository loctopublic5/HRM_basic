/**
 * frontend/js/app.js
 * Entry Point & Router
 */
import UI from './utils/uiHelper.js';
import AuthService from './services/authService.js';
import AuthController from './controllers/authController.js';
import AuthView from './views/authView.js';

// Import Controllers
import EmployeeController from './controllers/employeeController.js';

// --- MODULE REGISTRY ---
// Ánh xạ từ data-module (HTML) sang Controller
const MODULE_REGISTRY = {
    'employeeManagement': EmployeeController,
    'dashboard': null, // Chưa implement
    'departments': null,
    'positions': null
};

class App {
    constructor() {
        this.sidebar = document.querySelector('.sidebar-nav');
        this.mainContent = document.getElementById('main-content');
        this.pageTitle = document.getElementById('page-title'); // Giả sử bạn có thẻ này ở header
        
        this.initApp();
    }

    // 1. Logic Khởi chạy (Auth Guard)
    initApp() {
        if (!AuthService.isLoggedIn()) {
            // Case 1: Chưa đăng nhập -> Hiện Login
            AuthController.init();
        } else {
            // Case 2: Đã đăng nhập -> Hiện Dashboard & Load Module
            AuthView.toggleLoginView(false);
            
            // Hiển thị User Info
            this.updateUserInfo();
            
            // Gắn sự kiện Sidebar (Switch module)
            this.setupNavigation();
            
            // Gắn sự kiện Logout
            this.setupLogout();

            // Mặc định load Employee (hoặc Dashboard)
            this.activateSidebar('employeeManagement');
            this.loadModule('employeeManagement');
        }
    }

    // 2. Logic Điều hướng (Switch Module)
    setupNavigation() {
        if (!this.sidebar) return;

        this.sidebar.addEventListener('click', (e) => {
            // Event Delegation: Tìm thẻ <a> gần nhất
            const link = e.target.closest('.nav-link');
            if (!link || !link.dataset.module) return;

            e.preventDefault();

            // Nếu đang ở module này rồi thì không load lại
            if (link.classList.contains('active')) return;

            const moduleName = link.dataset.module;
            
            // Cập nhật UI Sidebar
            this.activateSidebar(moduleName);
            
            // Tải Module
            this.loadModule(moduleName);
        });
    }

    activateSidebar(moduleName) {
        // Xóa active cũ
        const links = this.sidebar.querySelectorAll('.nav-link');
        links.forEach(l => l.classList.remove('active'));
        
        // Thêm active mới
        const target = this.sidebar.querySelector(`[data-module="${moduleName}"]`);
        if (target) target.classList.add('active');
    }

    // 3. Logic Load Module & Error Handling (Yêu cầu của bạn)
    async loadModule(moduleName) {
        console.log(`Loading Module: ${moduleName}`);

        // B1: Show Loading
        UI.showLoading(this.mainContent);

        // B2: Dọn dẹp nội dung cũ (Quan trọng để tránh xung đột event)
        // this.mainContent.innerHTML = ''; // UI.showLoading đã làm việc này

        try {
            const controller = MODULE_REGISTRY[moduleName];

            if (controller) {
                // B3: Gọi Controller Init (Dependency Injection container)
                await controller.init(this.mainContent);
                
                // Cập nhật Title Header (Optional)
                if (this.pageTitle) this.pageTitle.innerText = this.getModuleTitle(moduleName);
            } else {
                // Module chưa đăng ký hoặc chưa implement
                this.renderComingSoon(moduleName);
            }
        } catch (error) {
            // B4: XỬ LÝ LỖI KHI VẼ MODULE (Yêu cầu của bạn)
            console.error(`Error loading module ${moduleName}:`, error);
            this.renderErrorState(error.message);
        }
    }

    // Helpers UI
    updateUserInfo() {
        const user = AuthService.getCurrentUser();
        const display = document.getElementById('user-display-name'); // ID giả định trên Header
        if (display && user) display.innerText = user.username;
    }

    setupLogout() {
        const btn = document.getElementById('logout-btn');
        if (btn) {
            // Clone để xóa event cũ tránh duplicate
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', async () => {
                if (await UI.confirm('Bạn muốn đăng xuất?')) {
                    await AuthService.logout();
                    window.location.reload();
                }
            });
        }
    }

    getModuleTitle(key) {
        const map = {
            'employeeManagement': 'Quản lý Nhân viên',
            'dashboard': 'Tổng quan',
            'departments': 'Quản lý Phòng ban'
        };
        return map[key] || 'HRM System';
    }

    renderComingSoon(name) {
        this.mainContent.innerHTML = `
            <div class="content-card" style="text-align: center; padding: 4rem;">
                <i class="fa-solid fa-person-digging" style="font-size: 3rem; color: var(--warning); margin-bottom: 1rem;"></i>
                <h3>Module "${name}" đang phát triển</h3>
                <p class="text-muted">Vui lòng quay lại sau.</p>
            </div>
        `;
    }

    renderErrorState(msg) {
        this.mainContent.innerHTML = `
            <div class="content-card" style="text-align: center; padding: 4rem;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                <h3 class="text-danger">Lỗi tải giao diện</h3>
                <p>${msg}</p>
                <button class="btn btn-outline" onclick="window.location.reload()">Tải lại trang</button>
            </div>
        `;
    }
}

// Khởi chạy App
document.addEventListener('DOMContentLoaded', () => {
    new App();
});