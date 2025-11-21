
import { 
    getDepartments,      
    createDepartment,    
    updateDepartment,
    deleteDepartment,
    getDepartmentById
} from '../services/departmentModule.js'; 
import { getEmployeesByDepartment } from '../services/employeeDbModule.js';
import { renderPagination, handlePaginationClick } from '../helpers/paginationComponent.js';

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
    // Hiển thị Loading Spinner
    container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 300px;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
            <span style="margin-left: 15px; color: #666; font-weight: 500;">Đang tải danh sách phòng ban...</span>
        </div>
    `;

    try {
        // SỬA LỖI: Gọi hàm getDepartments()
        const allDepartments = await getDepartments();
        const totalPages = Math.ceil(allDepartments.length / LIST_ITEMS_PER_PAGE) || 1;
        const paginatedDepartments = allDepartments.slice((listCurrentPage - 1) * LIST_ITEMS_PER_PAGE, listCurrentPage * LIST_ITEMS_PER_PAGE);
        const paginationHtml = renderPagination(listCurrentPage, totalPages);
        
        container.innerHTML = `
            <div class="content-card">
                <div class="card-header">
                    <h2 class="module-title">Quản lý Phòng ban</h2>
                    <div class="action-bar">
                        <form id="add-dept-form" class="search-group">
                            <input type="text" id="new-dept-name" class="form-control" placeholder="Nhập tên phòng ban mới..." required>
                            <button type="submit" class="btn btn-success">
                                <i class="fa-solid fa-plus"></i> Thêm mới
                            </button>
                        </form>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table id="departments-table" class="table-standard">
                            <thead>
                                <tr>
                                    <th style="width: 100px;">ID</th>
                                    <th>Tên Phòng ban</th>
                                    <th style="text-align: center; width: 250px;">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paginatedDepartments.length > 0 ? paginatedDepartments.map(dept => `
                                    <tr>
                                        <td style="font-family: monospace; color: #666;">${dept.id}</td>
                                        <td style="font-weight: 600; color: var(--color-primary);">${dept.name}</td>
                                        <td class="actions" style="text-align: center;">
                                            <button class="btn btn-sm btn-outline details-btn" data-id="${dept.id}" title="Xem danh sách nhân viên">
                                                <i class="fa-solid fa-eye" style="color: #17a2b8;"></i> Chi tiết
                                            </button>
                                            <button class="btn btn-sm btn-outline dept-edit-btn" data-id="${dept.id}" title="Sửa tên">
                                                <i class="fa-solid fa-pen" style="color: #f39c12;"></i> Sửa
                                            </button>
                                            <button class="btn btn-sm btn-outline dept-delete-btn" data-id="${dept.id}" title="Xóa">
                                                <i class="fa-solid fa-trash" style="color: #e74c3c;"></i> Xóa
                                            </button>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="3" style="text-align: center; padding: 3rem; color: #999;">
                                            <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                                            Chưa có phòng ban nào.
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card-footer">
                    ${paginationHtml}
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Lỗi khi render danh sách phòng ban:", error);
        container.innerHTML = `<div class="error-message" style="padding: 2rem;">Lỗi tải dữ liệu: ${error.message}</div>`;
    }
}

/**
 * HÀM RENDER VIEW CHI TIẾT PHÒNG BAN
 */
async function renderDetailsView(container, departmentId) {
    container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 300px;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
            <span style="margin-left: 15px; color: #666; font-weight: 500;">Đang tải dữ liệu nhân viên...</span>
        </div>
    `;

    try {
        const department = await getDepartmentById(departmentId);
        
        if (!department) {
            container.innerHTML = `
                <div class="content-card" style="padding: 2rem; text-align: center;">
                    <h3 style="color: #e74c3c;">Không tìm thấy phòng ban</h3>
                    <button id="back-to-depts" class="btn btn-primary" style="margin-top: 1rem;">Quay lại</button>
                </div>`;
            return;
        }

        const result = await getEmployeesByDepartment(departmentId, detailCurrentPage, DETAIL_ITEMS_PER_PAGE);
        
        const employeesInDept = result.data || []; 
        const pagination = result.pagination || { totalPages: 1, currentPage: 1 }; 

        const paginationHtml = renderPagination(pagination.currentPage, pagination.totalPages);
        
        container.innerHTML = `
            <div class="content-card">
                <div class="card-header">
                    <div class="action-bar">
                        <h2 class="module-title" style="margin: 0;">
                            <span style="color: #666; font-weight: normal;">Phòng ban:</span> ${department.name}
                        </h2>
                        <button id="back-to-depts" class="btn btn-outline">
                            <i class="fa-solid fa-arrow-left"></i> Quay lại danh sách
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table-standard">
                            <thead>
                                <tr>
                                    <th data-sort="id" style="cursor: pointer;">ID Nhân viên</th>
                                    <th data-sort="name" style="cursor: pointer;">
                                        Họ và Tên ${detailSortBy === 'name' ? (detailSortOrder === 'desc' ? '▾' : '▴') : ''}
                                    </th>
                                    <th>Vị trí</th>
                                    <th>Ngày vào làm</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${employeesInDept.length > 0 ? employeesInDept.map(emp => {
                                    const positionTitle = emp.position_title || 'N/A';
                                    const hireDate = emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('vi-VN') : 'N/A';
                                    
                                    return `
                                        <tr>
                                            <td style="font-family: monospace; color: #666;">${emp.id}</td>
                                            <td style="font-weight: 600; color: var(--color-primary);">${emp.name}</td>
                                            <td><span class="badge badge-info">${positionTitle}</span></td>
                                            <td>${hireDate}</td>
                                        </tr>
                                    `;
                                }).join('') : `
                                    <tr>
                                        <td colspan="4" style="text-align: center; padding: 3rem; color: #999;">
                                            <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 15px; display: block; color: #e0e6ed;"></i>
                                            <p>Chưa có nhân viên nào trong phòng ban này.</p>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card-footer">
                    ${paginationHtml}
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="content-card" style="padding: 2rem;">
                <p class="error-message">Lỗi khi tải chi tiết: ${error.message}</p> 
                <button id="back-to-depts" class="btn btn-primary">Quay lại</button>
            </div>`;
    }
}

/**
 * HÀM RENDER CHÍNH
 */
export async function render(container) {
    if (!container.dataset.departmentEventsAttached) {
        
        container.addEventListener('submit', async (event) => {
            if (event.target.id === 'add-dept-form') {
                event.preventDefault();
                const newNameInput = event.target.querySelector('#new-dept-name');
                const newName = newNameInput.value.trim();
                if (newName) {
                    // SỬA LỖI: Gọi getDepartments() thay vì getAllDepartments()
                    const allDepartments = await getDepartments(); 
                    const isDuplicate = allDepartments.some(dept => dept.name.toLowerCase() === newName.toLowerCase());
                    if (isDuplicate) {
                        alert(`Tên phòng ban "${newName}" đã tồn tại.`);
                        return;
                    }
                    // SỬA LỖI: Gọi createDepartment() thay vì addDepartment()
                    if (await createDepartment(newName)) {
                        listCurrentPage = 1;
                        await renderListView(container);
                    }
                }
            }
        });

        container.addEventListener('click', async (event) => {
            const target = event.target;

            // --- LOGIC CHO MÀN HÌNH DANH SÁCH ---
            if (currentView === 'list') {
                const detailsBtn = target.closest('.details-btn');
                if (detailsBtn) {
                    currentView = 'details';
                    selectedDepartmentId = detailsBtn.dataset.id;
                    detailCurrentPage = 1; 
                    await renderDetailsView(container, selectedDepartmentId);
                    return;
                }

                const editBtn = target.closest('.dept-edit-btn');
                if (editBtn) {
                    const departmentId = editBtn.dataset.id;
                    const currentName = editBtn.closest('tr').querySelector('td:nth-child(2)').textContent; // Lấy text từ cột tên
                    const newName = prompt('Nhập tên mới cho phòng ban:', currentName);
                    if (newName && newName.trim() !== '') {
                        await updateDepartment(departmentId, newName.trim());
                        await renderListView(container);
                    }
                    return;
                }

                const deleteBtn = target.closest('.dept-delete-btn');
                if (deleteBtn) {
                    const departmentId = deleteBtn.dataset.id;
                    if (confirm(`Bạn có chắc chắn muốn xóa phòng ban này?`)) {
                        const success = await deleteDepartment(departmentId);
                        if (success) {
                             const allDepts = await getDepartments(); // Sửa lỗi gọi hàm
                             const newTotalPages = Math.ceil(allDepts.length / LIST_ITEMS_PER_PAGE) || 1;
                             if (listCurrentPage > newTotalPages) listCurrentPage = newTotalPages;
                             await renderListView(container);
                        }
                    }
                    return;
                }
                
                const paginationBtn = target.closest('.pagination button');
                if (paginationBtn) {
                     const allDepts = await getDepartments(); // Sửa lỗi gọi hàm
                     const totalPages = Math.ceil(allDepts.length / LIST_ITEMS_PER_PAGE) || 1;
                     handlePaginationClick(event, { currentPage: listCurrentPage, totalPages }, async (newPage) => {
                        listCurrentPage = newPage;
                        await renderListView(container);
                    });
                }

            // --- LOGIC CHO MÀN HÌNH CHI TIẾT ---
            } else if (currentView === 'details') {
                const backBtn = target.closest('#back-to-depts');
                if (backBtn) {
                    currentView = 'list';
                    selectedDepartmentId = null;
                    await renderListView(container);
                    return;
                }
                
                const paginationBtn = target.closest('.pagination button');
                if (paginationBtn) {
                     const result = await getEmployeesByDepartment(selectedDepartmentId, detailCurrentPage, DETAIL_ITEMS_PER_PAGE);
                     const totalPages = result.pagination ? result.pagination.totalPages : 1;

                     handlePaginationClick(event, { currentPage: detailCurrentPage, totalPages }, async (newPage) => {
                        detailCurrentPage = newPage;
                        await renderDetailsView(container, selectedDepartmentId);
                    });
                }
            }
        });

        container.dataset.departmentEventsAttached = 'true';
    }

    if (currentView === 'list') {
        await renderListView(container);
    } else if (currentView === 'details') {
        await renderDetailsView(container, selectedDepartmentId);
    }
}