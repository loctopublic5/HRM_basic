// === modules/attendanceUiModule.js (Phiên bản Giao diện Nâng cao) ===

import { getAllEmployees } from './employeeDbModule.js';
import { checkIn, checkOut, getTodaysAttendanceForEmployee } from './attendanceModule.js';
import { renderPagination, handlePaginationClick } from './paginationComponent.js';

// --- BIẾN TRẠNG THÁI CHO PHÂN TRANG ---
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

/**
 * Hàm này CHỈ làm nhiệm vụ vẽ lại nội dung động của trang.
 * @param {HTMLElement} container 
 */
function renderAttendancePage(container) {
    const allEmployees = getAllEmployees();

    const totalPages = Math.ceil(allEmployees.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedEmployees = allEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const paginationHtml = renderPagination(currentPage, totalPages);

    container.innerHTML = `
        <div class="page-header">
            <h2>Chấm công hôm nay (${new Date().toLocaleDateString('vi-VN')})</h2>
        </div>
        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Nhân viên</th>
                    <th>Trạng thái</th>
                    <th>Thời gian Cập nhật</th>
                    <th>Tổng giờ làm</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedEmployees.map(emp => {
                    const todaysRecord = getTodaysAttendanceForEmployee(emp.id);
                    
                    let statusHtml = '<span class="tag tag-neutral">Chưa chấm công</span>';
                    let lastUpdateTime = '—';
                    let totalHours = '—';
                    let actionButtonHtml = `<button class="action-btn" data-employee-id="${emp.id}" data-action="check-in">Check In</button>`;

                    if (todaysRecord) {
                        if (todaysRecord.checkOut) {
                            // --- LOGIC HIỂN THỊ TRẠNG THÁI MỚI ---
                            let statusMessage = 'Đúng giờ';
                            switch (todaysRecord.status) {
                                case 'late':
                                    statusMessage = `Đi trễ ${todaysRecord.lateMinutes}m`;
                                    break;
                                case 'early_leave':
                                    statusMessage = `Về sớm ${todaysRecord.earlyLeaveMinutes}m`;
                                    break;
                                case 'late_and_early':
                                    statusMessage = `Trễ & Về sớm`;
                                    break;
                            }
                            
                            statusHtml = `<span class="tag tag-${todaysRecord.status}">${statusMessage}</span>`;
                            lastUpdateTime = new Date(todaysRecord.checkOut).toLocaleTimeString('vi-VN');
                            totalHours = `${todaysRecord.workDuration.toFixed(1)} giờ`;
                            actionButtonHtml = '<span>Đã hoàn thành</span>';

                        } else {
                            // Trạng thái đang làm việc
                            statusHtml = '<span class="tag tag-working">● Đang làm việc</span>';
                            lastUpdateTime = new Date(todaysRecord.checkIn).toLocaleTimeString('vi-VN');
                            actionButtonHtml = `<button class="action-btn" data-employee-id="${emp.id}" data-action="check-out">Check Out</button>`;
                        }
                    }
                    
                    return `
                        <tr>
                            <td><div class="employee-info"><strong>${emp.name}</strong><small>${emp.id}</small></div></td>
                            <td>${statusHtml}</td>
                            <td>${lastUpdateTime}</td>
                            <td>${totalHours}</td>
                            <td>${actionButtonHtml}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        ${paginationHtml}
    `;
}

/**
 * Hàm render chính, chịu trách nhiệm gắn sự kiện một lần duy nhất.
 */
function render(container) {
    if (!container.dataset.attendanceEventsAttached) {
        container.addEventListener('click', event => {
            const actionButton = event.target.closest('.action-btn');
            if (actionButton && actionButton.dataset.employeeId) {
                const employeeId = actionButton.dataset.employeeId;
                const action = actionButton.dataset.action;
                let success = false;
                if (action === 'check-in') success = checkIn(employeeId);
                if (action === 'check-out') success = checkOut(employeeId);
                if (success) renderAttendancePage(container);
                return;
            }

            handlePaginationClick(event, { 
                currentPage, 
                totalPages: Math.ceil(getAllEmployees().length / ITEMS_PER_PAGE) || 1
            }, (newPage) => {
                currentPage = newPage;
                renderAttendancePage(container);
            });
        });
        container.dataset.attendanceEventsAttached = 'true';
    }
    renderAttendancePage(container);
}

export { render };