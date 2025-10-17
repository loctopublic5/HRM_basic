import { getAllEmployees } from './employeeDbModule.js';
import { addLeaveRequest, getAllLeaveRequests, updateLeaveStatus, getLeaveBalance } from './leaveModule.js';
import { renderPagination, handlePaginationClick } from './paginationComponent.js';

// --- BIẾN TRẠNG THÁI CHO PHÂN TRANG ---
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

/**
 * Hàm này chỉ vẽ lại nội dung động của trang (form và bảng).
 * @param {HTMLElement} container - Vùng chứa nội dung của module.
 */
function renderPageContent(container) {
    const employees = getAllEmployees();
    const allRequests = getAllLeaveRequests();

    const totalPages = Math.ceil(allRequests.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRequests = allRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const paginationHtml = renderPagination(currentPage, totalPages);

    container.innerHTML = `
        <div class="page-header"><h2>Quản lý Nghỉ phép</h2></div>
        
        <h4>Tạo yêu cầu mới (Admin)</h4>
        <form id="leave-request-form">
            <select name="employeeId" required>
                <option value="">-- Chọn nhân viên --</option>
                ${employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('')}
            </select>
            <div class="leave-balance-display">
                Số ngày phép năm còn lại: <strong id="leave-balance-display">—</strong>
            </div>
            <input type="date" name="startDate" required>
            <input type="date" name="endDate" required>
            <select name="type" required>
                <option value="annual">Phép năm</option>
                <option value="sick">Nghỉ ốm</option>
            </select>
            <input type="text" name="reason" placeholder="Lý do nghỉ phép" required>
            <button type="submit">Tạo yêu cầu</button>
        </form>
        <hr>
        <h4>Danh sách yêu cầu</h4>
        <table id="leave-requests-table">
            <thead>
                <tr><th>Nhân viên</th><th>Thời gian nghỉ</th><th>Loại</th><th>Trạng thái</th><th>Hành động</th></tr>
            </thead>
            <tbody>
                ${paginatedRequests.map(req => { 
                    const employee = employees.find(emp => emp.id === req.employeeId);
                    const actionsHtml = req.status === 'pending'
                        ? `<button class="approve-btn" data-leave-id="${req.id}">Duyệt</button>
                        <button class="reject-btn" data-leave-id="${req.id}">Từ chối</button>`
                        : '<span>-</span>';
                    return `
                        <tr>
                            <td>${employee ? employee.name : 'N/A'}</td>
                            <td>${req.startDate} - ${req.endDate}</td>
                            <td>${req.type === 'annual' ? 'Phép năm' : 'Nghỉ ốm'}</td>
                            <td><span class="status-${req.status}">${req.status}</span></td>
                            <td class="actions">${actionsHtml}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        ${paginationHtml}
    `;

    // Cập nhật lại listener cho dropdown nhân viên mỗi khi render
    const employeeSelect = container.querySelector('select[name="employeeId"]');
    if (employeeSelect) {
        employeeSelect.addEventListener('change', () => {
            const balanceDisplay = document.getElementById('leave-balance-display');
            const selectedEmployeeId = employeeSelect.value;
            if (selectedEmployeeId) {
                balanceDisplay.textContent = `${getLeaveBalance(selectedEmployeeId)} ngày`;
            } else {
                balanceDisplay.textContent = '—';
            }
        });
    }
}

/**
 * Hàm render chính, chịu trách nhiệm gắn sự kiện một lần duy nhất.
 * @param {HTMLElement} container 
 */
function render(container) {
    if (!container.dataset.leaveEventsAttached) {
        container.addEventListener('submit', event => {
            if (event.target.id === 'leave-request-form') {
                event.preventDefault();
                const formData = new FormData(event.target);
                const requestData = Object.fromEntries(formData.entries());
                if (addLeaveRequest(requestData)) {
                    currentPage = 1;
                    renderPageContent(container);
                }
            }
        });

        container.addEventListener('click', event => {
            const target = event.target;
            
            const leaveId = target.dataset.leaveId;
            if (leaveId) {
                let success = false;
                if (target.classList.contains('approve-btn')) success = updateLeaveStatus(leaveId, 'approved');
                if (target.classList.contains('reject-btn')) success = updateLeaveStatus(leaveId, 'rejected');
                if (success) renderPageContent(container);
                return;
            }

            const totalPages = Math.ceil(getAllLeaveRequests().length / ITEMS_PER_PAGE) || 1;
            handlePaginationClick(event, { currentPage, totalPages }, (newPage) => {
                currentPage = newPage;
                renderPageContent(container);
            });
        });

        container.dataset.leaveEventsAttached = 'true';
    }

    renderPageContent(container);
}

export { render };