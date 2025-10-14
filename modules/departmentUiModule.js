// === modules/departmentUiModule.js ===

import { getPositionsByDepartmentId } from './positionModule.js';
import { 
    getAllDepartments, 
    addDepartment,
    updateDepartment,
    deleteDepartment 
} from './departmentModule.js';

// --- BIẾN TRẠNG THÁI CHO PHÂN TRANG ---
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

function render(container) {
    const allDepartments = getAllDepartments();

    // --- LOGIC PHÂN TRANG ---
    const totalPages = Math.ceil(allDepartments.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedDepartments = allDepartments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // --- HTML TỐI GIẢN CHO PHÂN TRANG ---
    const paginationHtml = `
        <div class="pagination">
            <button data-action="prev" ${currentPage === 1 ? 'disabled' : ''}>Trang trước</button>
            <span>Trang ${currentPage} / ${totalPages > 0 ? totalPages : 1}</span>
            <button data-action="next" ${currentPage >= totalPages ? 'disabled' : ''}>Trang sau</button>
        </div>
    `;

    // HTML cho form thêm mới và bảng danh sách
    const html = `
        <h2>Quản lý Phòng ban</h2>
        <form id="add-dept-form" class="small-form">
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
        ${totalPages > 0 ? paginationHtml : ''}
    `;
    container.innerHTML = html;

    // --- Xử lý sự kiện ---
    const addForm = document.getElementById('add-dept-form');
    const departmentsTable = document.getElementById('departments-table');
    const paginationContainer = container.querySelector('.pagination');

    addForm.addEventListener('submit', event => {
        event.preventDefault();
        const newNameInput = document.getElementById('new-dept-name');
        const newName = newNameInput.value.trim();
        if (newName) {
            addDepartment(newName);
            render(container);
        }
    });

    departmentsTable.addEventListener('click', event => {
        const target = event.target;
        const departmentId = target.dataset.id;
        if (!departmentId) return;

        if (target.classList.contains('edit-btn')) {
            const currentName = target.closest('tr').children[1].textContent;
            const newName = prompt('Nhập tên mới cho phòng ban:', currentName);
            if (newName && newName.trim() !== '') {
                updateDepartment(departmentId, newName.trim());
                render(container);
            }
        }

        if (target.classList.contains('delete-btn')) {
            const relatedPositions = getPositionsByDepartmentId(departmentId);
            if (relatedPositions.length > 0) {
                alert('Lỗi: Không thể xóa phòng ban này vì vẫn còn các vị trí công việc liên quan.');
                return;
            }
            if (confirm(`Bạn có chắc chắn muốn xóa phòng ban có ID: ${departmentId}?`)) {
                deleteDepartment(departmentId);
                // Logic kiểm tra để lùi trang nếu cần
                if (getAllDepartments().slice((currentPage - 1) * ITEMS_PER_PAGE).length === 0 && currentPage > 1) {
                    currentPage--;
                }
                render(container);
            }
        }
    });

    if (paginationContainer) {
        paginationContainer.addEventListener('click', event => {
            const action = event.target.dataset.action;
            if (action === 'prev' && currentPage > 1) {
                currentPage--;
                render(container);
            }
            if (action === 'next' && currentPage < totalPages) {
                currentPage++;
                render(container);
            }
        });
    }
}

export { render };