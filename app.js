// --- Imports ---
import * as Auth from './modules/authModule.js';
import * as EmployeeManagementUI from './modules/employeeManagementModule.js';
import * as DepartmentUI from './modules/departmentUiModule.js';
import * as PositionUI from './modules/positionUiModule.js';
import * as AttendanceUI from './modules/attendanceUiModule.js';
import * as SalaryUI from './modules/salaryUiModule.js';
import * as LeaveUI from './modules/leaveUiModule.js';
import * as PerformanceUI from './modules/performanceUiModule.js';

// --- Lấy các Element chính ---
const loginView = document.getElementById('login-view');
const appContainer = document.getElementById('app');
const mainContent = document.getElementById('main-content');

/**
 * Hàm "gác cổng" chính của ứng dụng.
 */
function initializeApp() {
    if (Auth.isLoggedIn()) {
        loginView.style.display = 'none';
        appContainer.style.display = 'flex';
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
    const loginForm = document.getElementById('my-unique-login-form');
    console.log('Tìm thấy form đăng nhập:', loginForm); 
    if (!loginForm) return;

    const loginError = document.getElementById('login-error');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    let isSubmitting = false;

    // Gắn listener một lần duy nhất
    loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    isSubmitting = true;
    submitButton.disabled = true;
        submitButton.disabled = true;
        submitButton.textContent = 'Đang xử lý...';
        loginError.textContent = '';

        const username = event.target.username.value;
        const password = event.target.password.value;
        
        const success = await Auth.login(username, password);

        if (success) {
            initializeApp();
        } else {
            loginError.textContent = 'Tên đăng nhập hoặc mật khẩu không đúng.';
            isSubmitting = false;
            submitButton.disabled = false;
            submitButton.textContent = 'Đăng nhập';
        }
    });
}

/**
 * Cài đặt các event listener cho dashboard (menu, nút logout).
 */
function setupDashboard() {
    const navLinks = document.querySelectorAll('#sidebar-nav a'); // Biến navLinks được khai báo an toàn ở đây
    const logoutBtn = document.getElementById('logout-btn');

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const moduleName = event.target.dataset.module;
            navigate(moduleName);
        });
    });

    logoutBtn.addEventListener('click', () => {
        Auth.logout();
        initializeApp();
    });
}

/**
 * Hàm điều hướng, render các module con vào main-content.
 */


// --- Hàm xử lý điều hướng ---
function navigate(module) {
    switch (module) {
        case 'employeeManagement':
            EmployeeManagementUI.render(mainContent);
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


// --- Tải module mặc định khi vào trang ---
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM đã sẵn sàng, bắt đầu khởi chạy ứng dụng!');
    initializeApp();
});