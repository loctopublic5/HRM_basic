import { getPositionsByDepartmentId, getPositionById } from './positionModule.js';
import { getAllEmployees } from './employeeDbModule.js';
import { 
    getAllDepartments, 
    addDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentById
} from './departmentModule.js';
import { renderPagination, handlePaginationClick } from './paginationComponent.js';

// --- BIẾN TRẠNG THÁI CHO MODULE ---
let currentView = 'list';
let selectedDepartmentId = null;

// State cho view danh sách phòng ban
let listCurrentPage = 1;
const LIST_ITEMS_PER_PAGE = 5;

// State cho view chi tiết nhân viên
let detailCurrentPage = 1;
const DETAIL_ITEMS_PER_PAGE = 10;
let detailSortBy = 'name';
let detailSortOrder = 'asc';

/**
 * HÀM RENDER VIEW DANH SÁCH PHÒNG BAN
 */
async function renderListView(container) {
    const allDepartments = await getAllDepartments();
    const totalPages = Math.ceil(allDepartments.length / LIST_ITEMS_PER_PAGE) || 1;
    const paginatedDepartments = allDepartments.slice((listCurrentPage - 1) * LIST_ITEMS_PER_PAGE, listCurrentPage * LIST_ITEMS_PER_PAGE);
    const paginationHtml = renderPagination(listCurrentPage, totalPages);
    
    container.innerHTML = `
        <div class="page-header"><h2>Quản lý Phòng ban</h2></div>
        <form id="add-dept-form">
            <input type="text" id="new-dept-name" placeholder="Tên phòng ban mới" required>
            <button type-="submit">Thêm mới</button>
        </form>
        <hr>
        <h3>Danh sách Phòng ban</h3>
        <table id="departments-table">
            <thead>
                <tr><th>ID</th><th>Tên Phòng ban</th><th>Hành động</th></tr>
            </thead>
            <tbody>
                ${paginatedDepartments.map(dept => `
                    <tr>
                        <td>${dept.id}</td>
                        <td>${dept.name}</td>
                        <td class="actions">
                            <button class="details-btn" data-id="${dept.id}">Chi tiết</button>
                            <button class="dept-edit-btn" data-id="${dept.id}">Sửa</button>
                            <button class="dept-delete-btn" data-id="${dept.id}">Xóa</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${paginationHtml}
    `;
}

/**
 * HÀM RENDER VIEW CHI TIẾT PHÒNG BAN
 */
async function renderDetailsView(container, departmentId) {
    const department = await getDepartmentById(departmentId);
    if (!department) {
        container.innerHTML = `<h2>Không tìm thấy phòng ban</h2><button id="back-to-depts">Quay lại</button>`;
        return;
    }

    const allEmployees = getAllEmployees();
    let employeesInDept = allEmployees.filter(emp => emp.departmentId === departmentId);

    employeesInDept.sort((a, b) => {
        if (a[detailSortBy] < b[detailSortBy]) return detailSortOrder === 'asc' ? -1 : 1;
        if (a[detailSortBy] > b[detailSortBy]) return detailSortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(employeesInDept.length / DETAIL_ITEMS_PER_PAGE) || 1;
    const paginatedEmployees = employeesInDept.slice((detailCurrentPage - 1) * DETAIL_ITEMS_PER_PAGE, detailCurrentPage * DETAIL_ITEMS_PER_PAGE);
    const paginationHtml = renderPagination(detailCurrentPage, totalPages);
    
    container.innerHTML = `
        <div class="page-header">
            <h2>Danh sách Nhân viên - Phòng ${department.name}</h2>
            <button id="back-to-depts">Quay lại</button>
        </div>
        <table class="table-standard">
            <thead>
                <tr>
                    <th data-sort="id">ID Nhân viên</th>
                    <th data-sort="name">Tên ${detailSortBy === 'name' ? (detailSortOrder === 'desc' ? '▾' : '▴') : ''}</th>
                    <th>Vị trí</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedEmployees.map(emp => {
                    const position = getPositionById(emp.positionId);
                    return `
                        <tr>
                            <td>${emp.id}</td>
                            <td>${emp.name}</td>
                            <td>${position ? position.title : 'N/A'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        ${paginationHtml}
    `;
}
/**
 * HÀM CHÍNH (EXPORT): Gắn sự kiện 1 lần và render nội dung.
 */
function render(container) {
    if (!container.dataset.departmentEventsAttached) {
        container.addEventListener('submit', event => {
            if (event.target.id === 'add-dept-form') {
                event.preventDefault();
                const newNameInput = event.target.querySelector('#new-dept-name');
                const newName = newNameInput.value.trim();
                if (newName) {
                    const allDepartments = getAllDepartments();
                    const isDuplicate = allDepartments.some(dept => dept.name.toLowerCase() === newName.toLowerCase());
                    if (isDuplicate) {
                        alert(`Tên phòng ban "${newName}" đã tồn tại.`);
                        return;
                    }
                    addDepartment(newName);
                    listCurrentPage = 1;
                    renderListView(container); // SỬA LỖI: Gọi đúng hàm render view
                }
            }
        });

        container.addEventListener('click', event => {
            if (currentView === 'list') {
                const editBtn = event.target.closest('.dept-edit-btn'); // SỬA LỖI: Tên class đúng
                if (editBtn) {
                    const departmentId = editBtn.dataset.id;
                    const currentName = editBtn.closest('tr').children[1].textContent;
                    const newName = prompt('Nhập tên mới cho phòng ban:', currentName);
                    if (newName && newName.trim() !== '') {
                        updateDepartment(departmentId, newName.trim());
                        renderListView(container); // SỬA LỖI: Gọi đúng hàm render view
                    }
                    return;
                }

                const deleteBtn = event.target.closest('.dept-delete-btn'); // SỬA LỖI: Tên class đúng
                if (deleteBtn) {
                    const departmentId = deleteBtn.dataset.id;
                    const relatedPositions = getPositionsByDepartmentId(departmentId);
                    if (relatedPositions.length > 0) {
                        alert('Lỗi: Không thể xóa phòng ban này...');
                        return;
                    }
                    if (confirm(`Bạn có chắc chắn muốn xóa phòng ban có ID: ${departmentId}?`)) {
                        deleteDepartment(departmentId);
                        const newTotalPages = Math.ceil(getAllDepartments().length / LIST_ITEMS_PER_PAGE) || 1;
                        if (listCurrentPage > newTotalPages) { // SỬA LỖI: Dùng listCurrentPage
                            listCurrentPage = newTotalPages;
                        }
                        renderListView(container); // SỬA LỖI: Gọi đúng hàm render view
                    }
                    return;
                }
                
                const detailsBtn = event.target.closest('.details-btn');
                if (detailsBtn) {
                    currentView = 'details';
                    selectedDepartmentId = detailsBtn.dataset.id;
                    detailCurrentPage = 1; detailSortBy = 'name'; detailSortOrder = 'asc';
                    render(container);
                    return;
                }

                
                
                const totalPages = Math.ceil(getAllDepartments().length / LIST_ITEMS_PER_PAGE) || 1;
                handlePaginationClick(event, { currentPage: listCurrentPage, totalPages }, (newPage) => {
                    listCurrentPage = newPage;
                    renderListView(container);
                });

                } else if (currentView === 'details') {
                const backBtn = event.target.closest('#back-to-depts');
                if (backBtn) {
                    currentView = 'list';
                    selectedDepartmentId = null;
                    render(container); // Gọi render chính để quay về
                    return;
                }

                const sortHeader = event.target.closest('[data-sort]');
                if (sortHeader) {
                    const newSortBy = sortHeader.dataset.sort;
                    if (detailSortBy === newSortBy) {
                        detailSortOrder = detailSortOrder === 'asc' ? 'desc' : 'asc';
                    } else {
                        detailSortBy = newSortBy;
                        detailSortOrder = 'asc';
                    }
                    detailCurrentPage = 1;
                    renderDetailsView(container, selectedDepartmentId);
                    return;
                }
                
                const totalPages = Math.ceil(getAllEmployees().filter(e => e.departmentId === selectedDepartmentId).length / DETAIL_ITEMS_PER_PAGE) || 1;
                handlePaginationClick(event, { currentPage: detailCurrentPage, totalPages }, (newPage) => {
                    detailCurrentPage = newPage;
                    renderDetailsView(container, selectedDepartmentId);
                });
            }
        });
        container.dataset.departmentEventsAttached = 'true';
    }

    // Router nội bộ
    if (currentView === 'list') {
        renderListView(container);
    } else if (currentView === 'details') {
        renderDetailsView(container, selectedDepartmentId);
    }
}

export { render };