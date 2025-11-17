// --- Imports ---
import * as Auth from './modules/services/authModule.js';
import * as EmployeeManagementUI from './modules/ui/employeeManagementModule.js';
import * as DepartmentUI from './modules/ui/departmentUiModule.js';
import * as PositionUI from './modules/ui/positionUiModule.js';
import * as AttendanceUI from './modules/ui/attendanceUiModule.js';
import * as SalaryUI from './modules/ui/salaryUiModule.js';
import * as LeaveUI from './modules/ui/leaveUiModule.js';
import * as PerformanceUI from './modules/ui/performanceUiModule.js';
import * as searchUi from './modules/ui/searchUiModule.js';


let loginView, appContainer, mainContent; 

/**
 * Hàm "gác cổng" chính của ứng dụng.
 */
function initializeApp() {
    if (Auth.isLoggedIn()) {
        loginView.style.display = 'none';
        appContainer.style.display = 'grid'; 
        setupDashboard();
        navigate('employeeManagement');
    } else {
        loginView.style.display = 'flex';
        appContainer.style.display = 'none';
        setupLoginForm();
    }
}

/**
 * Cài đặt các event listener cho form đăng nhập.
 */
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    console.log('Tìm thấy form đăng nhập:', loginForm); 
    if (!loginForm) return;

    const loginError = document.getElementById('login-error');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    let isSubmitting = false;

    // Gắn listener một lần duy nhất
    loginForm.onsubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        isSubmitting = true;
        submitButton.disabled = true;
        submitButton.textContent = 'Đang xử lý...';
        loginError.textContent = ''; // Xóa lỗi cũ

        const username = event.target.username.value;
        const password = event.target.password.value;
        
        try {
            // 1. Gọi hàm login bất đồng bộ mới
            // Hàm này (trong authModule) sẽ tự động gọi apiPost và saveUserSession
            const user = await Auth.login(username, password);

            // 2. Nếu thành công (không có lỗi nào được ném ra)
            console.log('Đăng nhập thành công:', user.username);
            initializeApp(); // Khởi động lại ứng dụng ở trạng thái đã đăng nhập

        } catch (error) {
            // 3. Nếu thất bại (apiHelper ném lỗi, ví dụ: 401, 500)
            console.error('Lỗi đăng nhập:', error.message);
            // Hiển thị lỗi trả về từ server (ví dụ: "Tên đăng nhập hoặc mật khẩu không đúng.")
            loginError.textContent = error.message;
            
            // 4. Khôi phục lại form
            isSubmitting = false;
            submitButton.disabled = false;
            submitButton.textContent = 'Đăng nhập';
        }
    };
}

/**
 * Cài đặt các event listener cho dashboard (menu, nút logout).
 */
function setupDashboard() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    // Gắn sự kiện cho các link điều hướng
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            // dùng .closest('a') để đảm bảo luôn lấy đúng thẻ a dù click vào icon hay text
            const moduleName = event.target.closest('a').dataset.module;
            navigate(moduleName);
        });
    });

    // Gắn sự kiện cho menu người dùng
    userMenuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        userMenuDropdown.classList.toggle('active');
    });

    // Gắn sự kiện cho nút đăng xuất
    
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', async () => { // <-- SỬA LÀ 'sidebarLogoutBtn'
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                try {
                    await Auth.logout(); 
                } catch (error) {
                    console.error('Lỗi khi gọi API logout:', error.message);
                    Auth.clearUserSession(); 
                }
                initializeApp();
            }
        });
    }

    // Gắn sự kiện cho nút thu gọn sidebar
    if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        appContainer.classList.toggle('sidebar-collapsed');
        const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
        
        // Tìm icon và span bên trong nút
        const icon = sidebarToggle.querySelector('i');
        const text = sidebarToggle.querySelector('span');

        if (isCollapsed) {
            // Khi đã thu gọn: Ẩn chữ, đổi icon thành mũi tên sang phải
            text.style.display = 'none'; // Hoặc bạn có thể dùng CSS như đã làm
            icon.classList.remove('fa-angles-left');
            icon.classList.add('fa-angles-right');
        } else {
            // Khi mở rộng: Hiện lại chữ, đổi icon về mũi tên sang trái
            text.style.display = 'inline';
            icon.classList.remove('fa-angles-right');
            icon.classList.add('fa-angles-left');
        }
    });
    }
}

/**
 * Hàm điều hướng, render các module con vào main-content.
 */


// --- Hàm xử lý điều hướng ---
function navigate(module) {
    const allLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    allLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.querySelector(`.sidebar-nav a[data-module="${module}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    switch (module) {
        case 'employeeManagement':
            EmployeeManagementUI.render(mainContent);
            break;
        case 'search':
            searchUi.render(mainContent);
            break;
        case 'managePositions': 
            PositionUI.render(mainContent);
            break;
        case 'manageDepartments':
            DepartmentUI.render(mainContent);
            break;
        case 'attendance':
            AttendanceUI.render(mainContent);
            break;
        case 'salaryManagement':
            SalaryUI.render(mainContent);
            break;
        case 'leaveManagement':
            LeaveUI.render(mainContent);
            break;
        case "performanceManagement":
            PerformanceUI.render(mainContent);
            break;
        default:
            mainContent.innerHTML = '<h2>Module chưa được triển khai</h2>';
            break;
    }
}

// Đóng dropdown khi click ra ngoài window
window.addEventListener('click', () => {
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    if (userMenuDropdown && userMenuDropdown.classList.contains('active')) {
        userMenuDropdown.classList.remove('active');
    }
});

// --- Tải module mặc định khi vào trang ---
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM đã sẵn sàng, bắt đầu khởi chạy ứng dụng!');

    loginView = document.getElementById('login-view');
    appContainer = document.getElementById('app');
    mainContent = document.getElementById('main-content');

    initializeApp();
});