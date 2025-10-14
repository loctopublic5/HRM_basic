import { getAllEmployees } from './employeeDbModule.js';
import { checkIn, checkOut, getTodaysAttendanceForEmployee, calculateWorkHours } from './attendanceModule.js';

// --- BIẾN TRẠNG THÁI CHO PHÂN TRANG ---
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

/**
 * Hàm này CHỈ làm nhiệm vụ vẽ lại nội dung bảng và các nút phân trang.
 * @param {HTMLElement} container 
 */
function renderAttendancePage(container) {
    const allEmployees = getAllEmployees();

    // --- LOGIC PHÂN TRANG ---
    const totalPages = Math.ceil(allEmployees.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedEmployees = allEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const paginationHtml = `
        <div class="pagination">
            <button data-action="prev" ${currentPage === 1 ? 'disabled' : ''}>Trang trước</button>
            <span>Trang ${currentPage} / ${totalPages > 0 ? totalPages : 1}</span>
            <button data-action="next" ${currentPage >= totalPages ? 'disabled' : ''}>Trang sau</button>
        </div>
    `;

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
                    let statusHtml = '<span class="status-neutral">○ Chưa chấm công</span>';
                    let lastUpdateTime = '—';
                    let totalHours = '—';
                    let actionButtonHtml = `<button class="action-btn" data-employee-id="${emp.id}" data-action="check-in">Check In</button>`;

                    if (todaysRecord) {
                        if (todaysRecord.checkOut) {
                            statusHtml = '<span class="status-out">■ Đã ra</span>';
                            lastUpdateTime = new Date(todaysRecord.checkOut).toLocaleTimeString('vi-VN');
                            totalHours = calculateWorkHours(todaysRecord.checkIn, todaysRecord.checkOut);
                            actionButtonHtml = '<span>Đã hoàn thành</span>';
                        } else {
                            statusHtml = '<span class="status-in">● Đã vào</span>';
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
        ${totalPages > 1 ? paginationHtml : ''}
    `;
}

/**
 * Hàm render chính, tạo layout và gắn sự kiện một lần duy nhất.
 * @param {HTMLElement} container 
 */
function render(container) {
    // Gắn sự kiện MỘT LẦN DUY NHẤT bằng Event Delegation trên container chính
    if (!container.dataset.attendanceEventsAttached) {
        container.addEventListener('click', (event) => {
            const target = event.target;
            
            // Xử lý nút check-in/check-out
            const actionButton = target.closest('.action-btn');
            if (actionButton) {
                const employeeId = actionButton.dataset.employeeId;
                const action = actionButton.dataset.action;
                let success = false;
                if (action === 'check-in') success = checkIn(employeeId);
                if (action === 'check-out') success = checkOut(employeeId);
                if (success) renderAttendancePage(container); // Vẽ lại nội dung
                return; // Dừng lại sau khi xử lý
            }

            // Xử lý nút phân trang
            const paginationButton = target.closest('.pagination button');
            if (paginationButton) {
                const action = paginationButton.dataset.action;
                const totalPages = Math.ceil(getAllEmployees().length / ITEMS_PER_PAGE);
                if (action === 'prev' && currentPage > 1) {
                    currentPage--;
                    renderAttendancePage(container);
                }
                if (action === 'next' && currentPage < totalPages) {
                    currentPage++;
                    renderAttendancePage(container);
                }
            }
        });
        container.dataset.attendanceEventsAttached = 'true';
    }

    // Luôn render nội dung khi hàm được gọi
    renderAttendancePage(container);
}

export { render };