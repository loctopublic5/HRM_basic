// === modules/departmentUiModule.js (Phiên bản Hoàn chỉnh, có Phân trang) ===

import { getPositionsByDepartmentId } from './positionModule.js';
import { 
    getAllDepartments, 
    addDepartment,
    updateDepartment,
    deleteDepartment 
} from './departmentModule.js';
import { renderPagination, handlePaginationClick } from './paginationComponent.js';

// --- BIẾN TRẠNG THÁI CHO PHÂN TRANG ---
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

/**
 * HÀM NỘI BỘ: Chỉ làm nhiệm vụ vẽ lại nội dung động.
 * @param {HTMLElement} container 
 */
function renderPageContent(container) {
    // SỬA LỖI: Gọi hàm để lấy mảng dữ liệu
    const allDepartments = getAllDepartments();

    // SỬA LỖI: Dùng allDepartments.length và allDepartments.slice
    const totalPages = Math.ceil(allDepartments.length / ITEMS_PER_PAGE) || 1;
    const paginatedDepartments = allDepartments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const paginationHtml = renderPagination(currentPage, totalPages);

    container.innerHTML = `
        <div class="page-header">
            <h2>Quản lý Phòng ban</h2>
        </div>
        <form id="add-dept-form">
            <input type="text" id="new-dept-name" placeholder="Tên phòng ban mới" required>
            <button type="submit">Thêm mới</button>
        </form>
        <hr>
        <h3>Danh sách Phòng ban</h3>
        <table id="departments-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tên Phòng ban</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedDepartments.map(dept => `
                    <tr>
                        <td>${dept.id}</td>
                        <td>${dept.name}</td>
                        <td class="actions">
                            <button class="edit-btn" data-id="${dept.id}">Sửa</button>
                            <button class="delete-btn" data-id="${dept.id}">Xóa</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${paginationHtml}
    `;
}

/**
 * HÀM CHÍNH (EXPORT): Gắn sự kiện 1 lần và render nội dung.
 * @param {HTMLElement} container 
 */
function render(container) {
    // Gắn sự kiện một lần duy nhất khi module được tải
    if (!container.dataset.departmentEventsAttached) {
        
        container.addEventListener('submit', event => {
            if (event.target.id === 'add-dept-form') {
                event.preventDefault();
                const newNameInput = event.target.querySelector('#new-dept-name');
                const newName = newNameInput.value.trim();
                if (newName) {
                    addDepartment(newName);
                    currentPage = 1; // Quay về trang 1 sau khi thêm
                    renderPageContent(container);
                }
            }
        });

        container.addEventListener('click', event => {
            const target = event.target;
            
            // Xử lý nút Sửa/Xóa
            const editBtn = target.closest('.edit-btn');
            if (editBtn) {
                const departmentId = editBtn.dataset.id;
                const currentName = editBtn.closest('tr').children[1].textContent;
                const newName = prompt('Nhập tên mới cho phòng ban:', currentName);
                if (newName && newName.trim() !== '') {
                    updateDepartment(departmentId, newName.trim());
                    renderPageContent(container);
                }
                return;
            }

            const deleteBtn = target.closest('.delete-btn');
            if (deleteBtn) {
                const departmentId = deleteBtn.dataset.id;
                const relatedPositions = getPositionsByDepartmentId(departmentId);
                if (relatedPositions.length > 0) {
                    alert('Lỗi: Không thể xóa phòng ban này vì vẫn còn các vị trí công việc liên quan.');
                    return;
                }
                if (confirm(`Bạn có chắc chắn muốn xóa phòng ban có ID: ${departmentId}?`)) {
                    deleteDepartment(departmentId);
                    const newTotalPages = Math.ceil(getAllDepartments().length / ITEMS_PER_PAGE) || 1;
                    if (currentPage > newTotalPages) {
                        currentPage = newTotalPages;
                    }
                    renderPageContent(container);
                }
                return;
            }
            
            // Xử lý phân trang bằng component
            const totalPages = Math.ceil(getAllDepartments().length / ITEMS_PER_PAGE) || 1;
            handlePaginationClick(event, { currentPage, totalPages }, (newPage) => {
                currentPage = newPage;
                renderPageContent(container);
            });
        });

        container.dataset.departmentEventsAttached = 'true';
    }

    // Luôn vẽ lại nội dung khi được gọi
    renderPageContent(container);
}

export { render };