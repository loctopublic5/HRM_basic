// === modules/positionUiModule.js (Phiên bản có Phân trang) ===

import { getAllDepartments } from './departmentModule.js';
import { 
    getAllPositions, 
    addPosition,
    updatePosition,
    deletePosition
} from './positionModule.js';

// --- BIẾN TRẠNG THÁI CHO MODULE ---
let isEditing = false;
let currentPositionId = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 5; // 5 vị trí mỗi trang

function render(container) {
    const allPositions = getAllPositions();
    const departments = getAllDepartments();
    const departmentMap = departments.reduce((map, dept) => ({...map, [dept.id]: dept.name}), {});

    // --- LOGIC PHÂN TRANG ---
    const totalPages = Math.ceil(allPositions.length / ITEMS_PER_PAGE);
    const paginatedPositions = allPositions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const positionToEdit = isEditing ? allPositions.find(p => p.id === currentPositionId) : null;
    const departmentOptions = departments.map(dept => 
        `<option value="${dept.id}" ${positionToEdit && dept.id === positionToEdit.departmentId ? 'selected' : ''}>
            ${dept.name}
        </option>`
    ).join('');

    const paginationHtml = `
        <div class="pagination">
            <button data-action="prev" ${currentPage === 1 ? 'disabled' : ''}>Trang trước</button>
            <span>Trang ${currentPage} / ${totalPages > 0 ? totalPages : 1}</span>
            <button data-action="next" ${currentPage >= totalPages ? 'disabled' : ''}>Trang sau</button>
        </div>
    `;

    // --- HTML CHÍNH ---
    container.innerHTML = `
        <h2>${isEditing ? `Chỉnh sửa Vị trí: ${positionToEdit.title}` : 'Thêm Vị trí mới'}</h2>
        <form id="position-form">
            <select name="departmentId" required>
                <option value="">-- Chọn phòng ban --</option>
                ${departmentOptions}
            </select>
            <input type="text" name="title" placeholder="Tên vị trí" value="${positionToEdit ? positionToEdit.title : ''}" required>
            <input type="text" name="description" placeholder="Mô tả" value="${positionToEdit ? positionToEdit.description : ''}" required>
            <input type="number" name="salaryBase" placeholder="Lương cơ bản (VND)" value="${positionToEdit ? positionToEdit.salaryBase : ''}" required>
            <button type="submit">${isEditing ? 'Lưu thay đổi' : 'Thêm mới'}</button>
            ${isEditing ? '<button type="button" id="cancel-edit">Hủy</button>' : ''}
        </form>
        <hr>
        <h3>Danh sách Vị trí</h3>
        <table id="positions-table">
            <thead>
                <tr>
                    <th>ID</th><th>Tên Vị trí</th><th>Phòng ban</th><th>Lương cơ bản</th><th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedPositions.map(pos => `
                    <tr>
                        <td>${pos.id}</td>
                        <td>${pos.title}</td>
                        <td>${departmentMap[pos.departmentId] || 'N/A'}</td>
                        <td>${(pos.salaryBase || 0).toLocaleString('vi-VN')} VND</td>
                        <td class="actions">
                            <button class="edit-btn" data-id="${pos.id}">Sửa</button>
                            <button class="delete-btn" data-id="${pos.id}">Xóa</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${totalPages > 1 ? paginationHtml : ''}
    `;

    // --- GẮN SỰ KIỆN (CHỈ 1 LẦN) ---
    if (!container.dataset.positionEventsAttached) {
        container.addEventListener('click', (event) => {
            const target = event.target;
            
            // Xử lý nút Sửa/Xóa
            const editBtn = target.closest('.edit-btn');
            if (editBtn) {
                isEditing = true;
                currentPositionId = editBtn.dataset.id;
                render(container);
                return;
            }

            const deleteBtn = target.closest('.delete-btn');
            if (deleteBtn) {
                if (confirm(`Bạn có chắc chắn muốn xóa vị trí có ID: ${deleteBtn.dataset.id}?`)) {
                    deletePosition(deleteBtn.dataset.id);
                    if (getAllPositions().slice((currentPage - 1) * ITEMS_PER_PAGE).length === 0 && currentPage > 1) {
                        currentPage--;
                    }
                    render(container);
                }
                return;
            }

            // Xử lý nút Hủy
            const cancelBtn = target.closest('#cancel-edit');
            if (cancelBtn) {
                isEditing = false;
                currentPositionId = null;
                render(container);
                return;
            }

            // Xử lý nút Phân trang
            const paginationBtn = target.closest('.pagination button');
            if (paginationBtn) {
                const action = paginationBtn.dataset.action;
                if (action === 'prev') currentPage--;
                if (action === 'next') currentPage++;
                render(container);
            }
        });

        container.addEventListener('submit', event => {
            if (event.target.id === 'position-form') {
                event.preventDefault();
                const formData = new FormData(event.target);
                const title = formData.get('title').trim();
                const description = formData.get('description').trim();
                const departmentId = formData.get('departmentId');
                const salaryBase = formData.get('salaryBase');

                if (!title || !departmentId || !salaryBase) { 
                    alert('Vui lòng điền đầy đủ thông tin.'); return; 
                }

                if (isEditing) {
                    updatePosition(currentPositionId, { title, description, departmentId, salaryBase });
                } else {
                    addPosition(title, description, departmentId, salaryBase);
                }
                
                isEditing = false;
                currentPositionId = null;
                render(container);
            }
        });

        container.dataset.positionEventsAttached = 'true';
    }
}

export { render };