import { getAllDepartments } from './departmentModule.js';
import { 
    getAllPositions, 
    addPosition,
    updatePosition,
    deletePosition
} from './positionModule.js';
import { renderPagination, handlePaginationClick } from './paginationComponent.js';

// --- BIẾN TRẠNG THÁI CHO MODULE ---
let isEditing = false;
let currentPositionId = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

/**
 * HÀM NỘI BỘ: Chỉ làm nhiệm vụ vẽ lại nội dung động.
 * @param {HTMLElement} container 
 */
function renderPageContent(container) {
    const allPositions = getAllPositions();
    const departments = getAllDepartments();
    const departmentMap = departments.reduce((map, dept) => ({...map, [dept.id]: dept.name}), {});

    const totalPages = Math.ceil(allPositions.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPositions = allPositions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const positionToEdit = isEditing ? allPositions.find(p => p.id === currentPositionId) : null;
    const departmentOptions = departments.map(dept => 
        `<option value="${dept.id}" ${positionToEdit && dept.id === positionToEdit.departmentId ? 'selected' : ''}>
            ${dept.name}
        </option>`
    ).join('');

    const paginationHtml = renderPagination(currentPage, totalPages);

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
        ${paginationHtml}
    `;
}

/**
 * @param {HTMLElement} container 
 */
function render(container) {
    if (!container.dataset.positionEventsAttached) {
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
                renderPageContent(container);
            }
        });

        container.addEventListener('click', (event) => {
            const target = event.target;

            const editBtn = target.closest('.edit-btn');
            if (editBtn) {
                isEditing = true;
                currentPositionId = editBtn.dataset.id;
                renderPageContent(container);
                return;
            }

            const deleteBtn = target.closest('.delete-btn');
            if (deleteBtn) {
                if (confirm(`Bạn có chắc chắn muốn xóa vị trí có ID: ${deleteBtn.dataset.id}?`)) {
                    deletePosition(deleteBtn.dataset.id);
                    const newTotalPages = Math.ceil(getAllPositions().length / ITEMS_PER_PAGE) || 1;
                    if (currentPage > newTotalPages) currentPage = newTotalPages;
                    renderPageContent(container);
                }
                return;
            }

            const cancelBtn = target.closest('#cancel-edit');
            if (cancelBtn) {
                isEditing = false;
                currentPositionId = null;
                renderPageContent(container);
                return;
            }

            const totalPages = Math.ceil(getAllPositions().length / ITEMS_PER_PAGE) || 1;
            handlePaginationClick(event, { currentPage, totalPages }, (newPage) => {
                currentPage = newPage;
                renderPageContent(container);
            });
        });

        container.dataset.positionEventsAttached = 'true';
    }

    renderPageContent(container);
}

export { render };