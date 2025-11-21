// === frontend/app.js ===

// --- 1. IMPORTS (Cập nhật đường dẫn đúng vào thư mục services và ui) ---

// Services
import * as Auth from './modules/services/authModule.js';

// UI Modules
import * as EmployeeManagementUI from './modules/ui/employeeManagementModule.js';
import * as DepartmentUI from './modules/ui/departmentUiModule.js';
import * as PositionUI from './modules/ui/positionUiModule.js';
import * as AttendanceUI from './modules/ui/attendanceUiModule.js';
import * as SalaryUI from './modules/ui/salaryUiModule.js';
import * as LeaveUI from './modules/ui/leaveUiModule.js';
import * as PerformanceUI from './modules/ui/performanceUiModule.js';


// --- 2. BIẾN TOÀN CỤC ---
let loginView, appContainer, mainContent;

/**
 * Hàm "gác cổng" chính của ứng dụng.
 */
function initializeApp() {
    if (Auth.isLoggedIn()) {
        loginView.style.display = 'none';
        appContainer.style.display = 'grid'; // Layout mới dùng grid
        setupDashboard();
        // Mặc định vào trang Quản lý Nhân viên
        navigate('employeeManagement');
    } else {
        loginView.style.display = 'flex';
        appContainer.style.display = 'none';
        setupLoginForm();
    }
}

/**
 * Cài đặt sự kiện cho form đăng nhập.
 */
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    const loginError = document.getElementById('login-error');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    let isSubmitting = false;

    loginForm.onsubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        isSubmitting = true;
        submitButton.disabled = true;
        submitButton.textContent = 'Đang xử lý...';
        loginError.textContent = '';

        const username = event.target.username.value;
        const password = event.target.password.value;
        
        try {
            const user = await Auth.login(username, password);
            // Nếu login thành công (không throw error), khởi động lại app
            console.log('Đăng nhập thành công:', user);
            initializeApp(); 
        } catch (error) {
            loginError.textContent = error.message;
            isSubmitting = false;
            submitButton.disabled = false;
            submitButton.textContent = 'Đăng nhập';
        }
    };
}

/**
 * Cài đặt sự kiện cho dashboard (Menu, Logout, Toggle).
 */
function setupDashboard() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    // 1. Điều hướng
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            // Lấy data-module từ thẻ a (hoặc thẻ cha nếu click vào icon)
            const linkElement = event.target.closest('a');
            if (linkElement) {
                const moduleName = linkElement.dataset.module;
                navigate(moduleName);
            }
        });
    });

    // 2. Menu User
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            userMenuDropdown.classList.toggle('active');
        });
    }

    // 3. Đăng xuất
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault(); // Ngăn chặn hành vi mặc định của thẻ a
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                try {
                    await Auth.logout();
                } catch (error) {
                    console.error('Lỗi logout:', error);
                    Auth.clearUserSession();
                }
                initializeApp();
            }
        });
    }

    // 4. Thu gọn Sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            appContainer.classList.toggle('sidebar-collapsed');
            // Đổi icon nếu cần (tùy thuộc CSS của bạn đã xử lý chưa)
        });
    }
}

/**
 * Hàm điều hướng trung tâm (Router).
 * @param {string} module - Tên module lấy từ data-module trong HTML.
 */
function navigate(module) {
    // 1. Cập nhật trạng thái Active trên Menu
    const allLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    allLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.querySelector(`.sidebar-nav a[data-module="${module}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // 2. Render Module tương ứng
    console.log('Navigating to:', module); // Debug log

    switch (module) {
        // Quản lý Nhân viên
        case 'employeeManagement':
            EmployeeManagementUI.render(mainContent);
            break;
        
        // Quản lý Phòng ban
        // LƯU Ý: Tên case phải khớp với data-module trong index.html
        case 'manageDepartments': 
            DepartmentUI.render(mainContent);
            break;

        // Quản lý Vị trí
        case 'managePositions': 
            PositionUI.render(mainContent);
            break;

        // Chấm công
        case 'attendance':
            AttendanceUI.render(mainContent);
            break;

        // Quản lý Lương
        case 'salaryManagement':
            SalaryUI.render(mainContent);
            break;

        // Quản lý Nghỉ phép
        case 'leaveManagement':
            LeaveUI.render(mainContent);
            break;

        // Quản lý Hiệu suất
        case 'performanceManagement':
            PerformanceUI.render(mainContent);
            break;
            

        default:
            mainContent.innerHTML = `<div style="padding: 20px; text-align: center;">
                <h2>Module "${module}" chưa được triển khai</h2>
                <p>Vui lòng kiểm tra lại data-module trong file index.html hoặc case trong app.js</p>
            </div>`;
            break;
    }
}

// Đóng dropdown khi click ra ngoài
window.addEventListener('click', () => {
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    if (userMenuDropdown && userMenuDropdown.classList.contains('active')) {
        userMenuDropdown.classList.remove('active');
    }
});

// --- KHỞI CHẠY ỨNG DỤNG ---
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM đã sẵn sàng, bắt đầu khởi chạy ứng dụng!');
    
    // Gán các element toàn cục
    loginView = document.getElementById('login-view');
    appContainer = document.getElementById('app');
    mainContent = document.getElementById('main-content');
    
    initializeApp();
});