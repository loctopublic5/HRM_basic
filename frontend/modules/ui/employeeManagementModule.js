
import { getDepartments } from '../services/departmentService.js';
import { getPositions } from '../services/positionService.js';
import { getAllShifts } from '../services/shiftService.js';
import { getEmployees, searchEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeById } from '../services/employeeService.js';
import { calculateSalaryDetails } from '../services/salaryService.js';
import { renderPagination, handlePaginationClick } from '../helpers/paginationComponent.js';
import { isNotEmpty, isNameUnique } from '../helpers/validators.js';

// --- Module State ---
let departments = [];
let positions = [];
let shifts = [];
let employees = [];
let paginationInfo = {};

let currentPage = 1;
const ITEMS_PER_PAGE = 5;
let sortBy = 'name';
let sortOrder = 'asc';
let isEditing = false;
let currentEmployeeId = null;

// ================================================================
// 1. RENDER & INIT LOGIC
// ================================================================

/**
 * HÀM RENDER CHÍNH (Exported)
 */
export async function render(container) {
    // Gắn sự kiện một lần duy nhất
    if (!container.dataset.employeeEventsAttached) {
        bindEvents(container);
        container.dataset.employeeEventsAttached = 'true';
    }
    // Tải dữ liệu và vẽ giao diện
    await loadInitialData(container);
}

/**
 * Tải dữ liệu ban đầu (Tương đương hàm init)
 */
async function loadInitialData(container) {
    // Hiển thị loading
    container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="height: 200px; display: flex; justify-content: center; align-items: center;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite;"></div>
            <span style="margin-left: 10px; color: #666;">Đang tải dữ liệu...</span>
        </div>`;
    
    try {
        // Sử dụng Promise.all để tải song song
        const [empData, depts, pos, shfts] = await Promise.all([
            getEmployees(currentPage, ITEMS_PER_PAGE, sortBy, sortOrder),
            getDepartments(),
            getPositions(),
            getAllShifts()
        ]);
        
        // Cập nhật state
        employees = empData.data;
        paginationInfo = empData.pagination;
        departments = depts;
        positions = pos;
        shifts = shfts;
        
        // Vẽ khung sườn và dữ liệu
        renderPageContent(container);

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="error-message">Lỗi tải dữ liệu: ${error.message}</p>`;
    }
}

/**
 * Vẽ toàn bộ nội dung module (Khung sườn + Dữ liệu)
 */
function renderPageContent(container) {
    // 1. Inject Khung sườn HTML
    container.innerHTML = getTemplate();

    // 2. Điền dữ liệu vào Dropdown Tìm kiếm
    const deptSelect = container.querySelector('#search-dept');
    const posSelect = container.querySelector('#search-pos');
    
    // Reset và điền options
    if (deptSelect) {
        deptSelect.innerHTML = '<option value="">-- Tất cả Phòng ban --</option>' + 
            departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    }
    if (posSelect) {
        posSelect.innerHTML = '<option value="">-- Tất cả Vị trí --</option>' + 
            positions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
    }

    // 3. Render các dòng dữ liệu vào bảng
    renderTableRows(employees, container);

    // 4. Render phân trang
    renderPaginationSection(container);
}

// ================================================================
// 2. TEMPLATES & UI HELPERS
// ================================================================

/**
 * Trả về chuỗi HTML khung sườn chuẩn (Design System)
 */
function getTemplate() {
    return `
    <div class="content-card">
        <!-- Header: Tiêu đề & Toolbar -->
        <div class="card-header">
            <h2 class="module-title">Quản lý Nhân viên</h2>

            <div class="action-bar">
                <!-- Bộ lọc (Search Form) -->
                <form id="search-employee-form" class="filter-group">
                    <input type="text" id="search-name" name="name" class="form-control" placeholder="Tìm theo tên..." autocomplete="off" style="flex: 2;">
                    <datalist id="employee-names"></datalist>
                    
                    <select id="search-dept" name="departmentId" class="form-select" style="flex: 1;">
                        <option value="">Đang tải...</option>
                    </select>
                    
                    <select id="search-pos" name="positionId" class="form-select" style="flex: 1;">
                        <option value="">Đang tải...</option>
                    </select>
                    
                    <button type="submit" class="btn btn-primary">
                        <i class="fa-solid fa-magnifying-glass"></i> Tìm
                    </button>
                </form>

                <!-- Nút hành động -->
                <div class="action-group">
                    <button id="add-employee-btn" class="btn btn-success">
                        <i class="fa-solid fa-plus"></i> Thêm mới
                    </button>
                </div>
            </div>
        </div>

        <!-- Body: Bảng dữ liệu -->
        <div class="card-body">
            <div class="table-responsive">
                <table class="table-standard" id="employee-table">
                    <thead>
                        <tr>
                            <th>Họ và Tên</th>
                            <th>Phòng ban</th>
                            <th>Vị trí</th>
                            <th>Lương Thực nhận</th>
                            <th>Ngày vào làm</th>
                            <th style="text-align: center;">Hành động</th>
                        </tr>
                    </thead>
                    <tbody id="employee-table-body">
                        <!-- Các dòng <tr> sẽ được render vào đây -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Footer: Phân trang -->
        <div class="card-footer" id="pagination-container"></div>
    </div>

    <!-- Modal Container (Ẩn) -->
    <div id="employee-modal" class="modal" style="display: none;">
            <div class="modal-content">
            <span id="close-modal-btn" class="close-btn">&times;</span>
            <div id="modal-body"></div>
        </div>
    </div>
    `;
}

/**
 * Tạo các dòng <tr> và chèn vào tbody
 */
function renderTableRows(employeeList, container) {
    const tbody = container.querySelector('#employee-table-body');
    
    if (!employeeList || employeeList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #999;">
                    <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
                    Không tìm thấy dữ liệu nhân viên.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = employeeList.map(emp => {
        // Xử lý hiển thị an toàn
        const deptName = emp.department_name 
            ? `<span class="badge badge-info">${emp.department_name}</span>` 
            : '<span class="badge badge-warning">Chưa phân bổ</span>';
        
        const posTitle = emp.position_title || 'N/A';
        
        // Tính lương
        const { totalSalary } = calculateSalaryDetails(emp);
        const formattedSalary = totalSalary.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        const hireDate = new Date(emp.hire_date).toLocaleDateString('vi-VN');

        return `
            <tr>
                <td style="font-weight: 600; color: var(--color-primary);">${emp.name}</td>
                <td>${deptName}</td>
                <td>${posTitle}</td>
                <td style="font-family: monospace; font-weight: bold;">${formattedSalary}</td>
                <td>${hireDate}</td>
                <td style="text-align: center;">
                    <button class="btn btn-sm btn-outline epl-edit-btn" data-id="${emp.id}" title="Sửa">
                        <i class="fa-solid fa-pen" style="color: #f39c12;"></i>
                    </button>
                    <button class="btn btn-sm btn-outline epl-delete-btn" data-id="${emp.id}" title="Xóa">
                        <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPaginationSection(container) {
    const paginationContainer = container.querySelector('#pagination-container');
    const totalPages = Math.ceil((paginationInfo.totalItems || employees.length) / ITEMS_PER_PAGE) || 1;
    paginationContainer.innerHTML = renderPagination(currentPage, totalPages);
}


// ================================================================
// 3. EVENT HANDLING (Xử lý sự kiện)
// ================================================================

function bindEvents(container) {
    console.log('Gắn sự kiện cho Module Employee...');

    container.addEventListener('click', (event) => {
        const target = event.target;

        // Nút Thêm
        if (target.closest('#add-employee-btn')) {
            handleOpenModal(container);
        }
        // Nút Đóng Modal
        if (target.id === 'close-modal-btn') handleCloseModal(container);
        
        // Nút Sửa
        const editBtn = target.closest('.epl-edit-btn');
        if (editBtn) handleOpenModal(container, editBtn.dataset.id);
        
        // Nút Xóa
        const deleteBtn = target.closest('.epl-delete-btn');
        if (deleteBtn) handleDelete(deleteBtn.dataset.id, container);
        
        // Phân trang
        handlePagination(event, container);
    });

    container.addEventListener('submit', (event) => {
        if (event.target.id === 'search-employee-form') {
            event.preventDefault();
            handleSearch(event, container);
        }
        if (event.target.id === 'employee-form') {
            event.preventDefault();
            handleFormSubmit(event, container);
        }
    });

    // Xử lý Dropdown động trong Modal (khi thay đổi Department)
    container.addEventListener('change', (event) => {
        if (event.target.name === 'departmentId' && container.querySelector('#employee-modal').style.display === 'block') {
            const modalBody = container.querySelector('#modal-body');
            // Cần truyền container modal hoặc tìm lại select position trong modal
            const posSelect = modalBody.querySelector('select[name="positionId"]');
            if(posSelect) updatePositionOptions(event.target.value, posSelect);
        }
    });
}

// --- LOGIC NGHIỆP VỤ CHI TIẾT ---

// Logic cập nhật dropdown vị trí khi chọn phòng ban
function updatePositionOptions(departmentId, positionSelectElement) {
    if (!departmentId) {
        positionSelectElement.innerHTML = '<option value="">-- Chọn vị trí --</option>';
        return;
    }
    const filteredPositions = positions.filter(p => p.department_id === departmentId);
    positionSelectElement.innerHTML = '<option value="">-- Chọn vị trí --</option>' + 
        filteredPositions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
}

async function handleSearch(event, container) {
    const formData = new FormData(event.target);
    const criteria = {
        name: formData.get('name') || null,
        deptId: formData.get('departmentId') || null,
        posId: formData.get('positionId') || null,
    };
    
    try {
        const result = await searchEmployees(criteria);
        employees = result.data;
        paginationInfo = result.pagination || { totalItems: employees.length };
        currentPage = 1;
        
        renderTableRows(employees, container);
        renderPaginationSection(container);
    } catch (error) {
        alert('Lỗi tìm kiếm: ' + error.message);
    }
}

async function handlePagination(event, container) {
    const totalPages = Math.ceil((paginationInfo.totalItems || employees.length) / ITEMS_PER_PAGE);
    
    handlePaginationClick(event, { currentPage, totalPages }, async (newPage) => {
        currentPage = newPage;
        try {
            const empData = await getEmployees(currentPage, ITEMS_PER_PAGE, sortBy, sortOrder);
            employees = empData.data;
            paginationInfo = empData.pagination;
            
            renderTableRows(employees, container);
            renderPaginationSection(container);
        } catch (error) {
             console.error(error);
        }
    });
}

async function handleOpenModal(container, employeeId = null) {
    isEditing = employeeId !== null;
    currentEmployeeId = employeeId;
    
    let employeeData = {};
    if (isEditing) {
        try {
            employeeData = await getEmployeeById(employeeId);
        } catch (error) {
            alert('Lỗi tải dữ liệu: ' + error.message);
            return;
        }
    }
    
    const modalBody = container.querySelector('#modal-body');
    const today = new Date().toISOString().split('T')[0];

    // Render Form trong Modal sử dụng class form-control, form-select chuẩn
    modalBody.innerHTML = `
        <h3 class="module-title" style="margin-bottom: 1rem; text-align: center; font-size: 1.2rem;">
            ${isEditing ? 'Chỉnh sửa Hồ sơ' : 'Tiếp nhận Nhân viên mới'}
        </h3>
        <form id="employee-form">
            <div class="form-group">
                <label>Họ và Tên:</label>
                <input type="text" name="name" class="form-control" value="${employeeData.name || ''}" required>
            </div>
            <div class="form-group">
                <label>Ngày vào làm:</label>
                <input type="date" name="hireDate" class="form-control" value="${employeeData.hire_date || today}" required>
            </div>
            <div class="form-group">
                <label>Phòng ban:</label>
                <select name="departmentId" class="form-select" required>
                    <option value="">-- Chọn phòng ban --</option>
                    ${departments.map(d => `<option value="${d.id}" ${d.id === employeeData.department_id ? 'selected' : ''}>${d.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Vị trí:</label>
                <select name="positionId" class="form-select" required>
                    <option value="">-- Chọn vị trí --</option>
                     <!-- Sẽ được fill khi chọn phòng ban -->
                     ${positions.map(p => `<option value="${p.id}" ${p.id === employeeData.position_id ? 'selected' : ''}>${p.title}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                 <label>Ca làm việc:</label>
                 <select name="shift_id" class="form-select" required>
                    <option value="">-- Chọn ca làm --</option>
                    ${shifts.map(s => `<option value="${s.id}" ${s.id === employeeData.shift_id ? 'selected' : ''}>${s.shift_name}</option>`).join('')}
                 </select>
            </div>

            <div style="margin-top: 1.5rem; text-align: right; border-top: 1px solid #eee; padding-top: 1rem;">
                 <button type="button" class="btn btn-outline" onclick="document.getElementById('employee-modal').style.display='none'">Hủy</button>
                 <button type="submit" class="btn btn-primary">${isEditing ? 'Lưu hồ sơ' : 'Thêm mới'}</button>
            </div>
        </form>
    `;
    
    // Logic update dropdown vị trí ban đầu nếu đang sửa hoặc thêm mới
    const deptSelect = modalBody.querySelector('select[name="departmentId"]');
    const posSelect = modalBody.querySelector('select[name="positionId"]');
    
    // Nếu đang sửa và có phòng ban, hoặc khi thêm mới người dùng chọn phòng ban
    if (employeeData.department_id) {
         updatePositionOptions(employeeData.department_id, posSelect);
         posSelect.value = employeeData.position_id; // Set lại giá trị sau khi render options
    }

    container.querySelector('#employee-modal').style.display = 'block';
}

function handleCloseModal(container) {
    container.querySelector('#employee-modal').style.display = 'none';
}

async function handleFormSubmit(event, container) {
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        hireDate: formData.get('hireDate'),
        departmentId: formData.get('departmentId'),
        positionId: formData.get('positionId'),
        shift_id: formData.get('shift_id')
    };

    // Validate cơ bản
    if(!data.name || !data.departmentId || !data.positionId) {
        alert("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
    }

    try {
        if (isEditing) {
            await updateEmployee(currentEmployeeId, data);
        } else {
            await createEmployee(data);
        }
        handleCloseModal(container);
        await loadInitialData(container); // Reload lại dữ liệu để cập nhật bảng
        alert('Thao tác thành công!');
    } catch (error) {
        alert('Lỗi: ' + error.message);
    }
}

async function handleDelete(id, container) {
    if(confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
        try {
            await deleteEmployee(id);
            await loadInitialData(container); 
        } catch (e) {
            alert(e.message);
        }
    }
}
