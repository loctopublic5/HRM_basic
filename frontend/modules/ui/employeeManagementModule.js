
import { getAllDepartments } from '../services/departmentModule.js';
import { getAllPositions } from '../services/positionModule.js';
import { getEmployees, searchEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeById } from '../services/employeeDbModule.js';
import { calculateSalaryDetails } from '../services/salaryModule.js'; 
import { getAllShifts } from '../services/shiftModule.js';
import { renderPagination, handlePaginationClick } from '../helpers/paginationComponent.js';

// --- BIẾN STATE CỦA MODULE ---
// Lưu dữ liệu tải 1 lần để tái sử dụng
let departments = [];
let positions = [];
let shifts = [];
let employees = []; // Dữ liệu bảng hiện tại
let paginationInfo = {}; // Lưu thông tin phân trang

// Biến trạng thái
let currentPage = 1;
const ITEMS_PER_PAGE = 5; // (Lưu ý: Backend đang default là 10, cần đồng bộ)
let sortBy = 'name';
let sortOrder = 'asc';
let isEditing = false;
let currentEmployeeId = null;

/**
 * HÀM RENDER CHÍNH (Gắn sự kiện 1 lần)
 * @param {HTMLElement} container (Đây là thẻ #main-content)
 */
export async function render(container) {
    // Cơ chế gắn sự kiện 1 lần
    if (!container.dataset.employeeEventsAttached) {
        console.log('Gắn sự kiện cho Module Quản lý Nhân viên...');
        
        container.addEventListener('click', (event) => {
            if (event.target.id === 'add-employee-btn') handleOpenModal(container);
            if (event.target.id === 'close-modal-btn') handleCloseModal(container);
            
            const editBtn = event.target.closest('.epl-edit-btn');
            if (editBtn) handleOpenModal(container, editBtn.dataset.id);
            
            const deleteBtn = event.target.closest('.epl-delete-btn');
            if (deleteBtn) handleDelete(deleteBtn.dataset.id, container);
            
            handlePagination(event, container);
        });

        container.addEventListener('submit', (event) => {
            event.preventDefault(); 
            if (event.target.id === 'search-employee-form') handleSearch(event, container);
            if (event.target.id === 'employee-form') handleFormSubmit(event, container);
        });

        // (Thêm listener 'change' cho dropdown động)
        container.addEventListener('change', (event) => {
            if (event.target.name === 'departmentId') {
                handleDepartmentChange(event.target.value, container);
            }
        });

        container.dataset.employeeEventsAttached = 'true';
    }
    
    // Luôn tải dữ liệu nền và vẽ lại giao diện
    await loadInitialData(container);
}

/**
 * (Promise.all) Tải tất cả dữ liệu nền cần thiết cho module.
 * @param {HTMLElement} container 
 */
async function loadInitialData(container) {
    container.innerHTML = '<p>Đang tải dữ liệu, vui lòng chờ...</p>';
    try {
        // Yêu cầu 4 API chạy song song
        const [empData, depts, pos, shfts] = await Promise.all([
            getEmployees(currentPage, ITEMS_PER_PAGE, sortBy, sortOrder),
            getAllDepartments(),
            getAllPositions(),
            getAllShifts() // Giả sử bạn đã tạo service cho 'shifts'
        ]);
        
        employees = empData.data;
        paginationInfo = empData.pagination;
        departments = depts;
        positions = pos;
        shifts = shfts;
        
        // Vẽ lại toàn bộ
        renderPageContent(container);

    } catch (error) {
        console.error('Lỗi nghiêm trọng khi tải dữ liệu module:', error);
        container.innerHTML = '<p class="error-message">Không thể tải dữ liệu. Vui lòng thử lại.</p>';
    }
}

/**
 * HÀM NỘI BỘ: Chỉ làm nhiệm vụ vẽ lại nội dung động.
 */
function renderPageContent(container) {
    // Render Giao diện chính (Toolbar + Bảng + Modal)
    // HTML này sẽ được render BÊN TRONG thẻ #main-content
    container.innerHTML = `
        <div class="page-header">
            <h2>Quản lý Nhân viên</h2>
            <button id="add-employee-btn" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Thêm nhân viên</button>
        </div>
        
        <div class="toolbar-container">
            <form id="search-employee-form" class="search-area">
                <input type="text" id="search-name" name="name" placeholder="Tìm theo tên..." list="employee-names" autocomplete="off">
                <datalist id="employee-names"></datalist>
                
                <select id="search-dept" name="departmentId">
                    <option value="">-- Lọc theo phòng ban --</option>
                    ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                </select>
                
                <select id="search-pos" name="positionId">
                    <option value="">-- Lọc theo vị trí --</option>
                    ${positions.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
                </select>
                
                <button type="submit" class="btn">Tìm kiếm</button>
            </form>
        </div>

        <div id="employee-table-container">
            <!-- Bảng sẽ được render vào đây -->
        </div>
        
        <div id="employee-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <span id="close-modal-btn" class="close-btn">&times;</span>
                <div id="modal-body"></div>
            </div>
        </div>
    `;

    // Gọi hàm render bảng riêng
    renderTable(container.querySelector('#employee-table-container'));
}

/**
 * HÀM NỘI BỘ: Chỉ vẽ lại bảng
 */
function renderTable(tableContainer) {
    const paginationHtml = renderPagination(paginationInfo.currentPage, paginationInfo.totalPages);
    
    tableContainer.innerHTML = `
        <table id="employee-table">
            <thead>
                <tr>
                    <th>Tên</th>
                    <th>Phòng ban</th>
                    <th>Vị trí</th>
                    <th>Ca làm</th>
                    <th>Lương (Ước tính)</th> 
                    <th>Ngày vào làm</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${employees.map(emp => {
                    // Dữ liệu Tên (department_name, position_title, shift_name)
                    // đã được JOIN từ API (theo EmployeeModel Bước 3)
                    const { totalSalary } = calculateSalaryDetails(emp);
                    
                    return `
                        <tr>
                            <td>${emp.name}</td>
                            <td>${emp.department_name || 'N/A'}</td>
                            <td>${emp.position_title || 'N/A'}</td>
                            <td>${emp.shift_name || 'N/A'}</td>
                            <td>${totalSalary.toLocaleString('vi-VN')} VND</td> 
                            <td>${emp.hire_date}</td>
                            <td class="actions">
                                <button class="epl-edit-btn btn-action btn-edit" data-id="${emp.id}">Sửa</button>
                                <button class="epl-delete-btn btn-action btn-delete" data-id="${emp.id}">Xóa</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        ${paginationHtml}
    `;
}

// --- CÁC HÀM XỬ LÝ SỰ KIỆN ---

/**
 * Xử lý sự kiện submit của form tìm kiếm.
 */
async function handleSearch(event, container) {
    const formData = new FormData(event.target);
    const criteria = {
        name: formData.get('name') || null,
        deptId: formData.get('departmentId') || null,
        posId: formData.get('positionId') || null,
    };
    
    try {
        const result = await searchEmployees(criteria);
        employees = result.data; // Cập nhật state
        paginationInfo = result.pagination;
        currentPage = 1;
        renderTable(container.querySelector('#employee-table-container'));
    } catch (error) {
        alert('Lỗi khi tìm kiếm: ' + error.message);
    }
}

/**
 * Xử lý sự kiện click phân trang.
 */
async function handlePagination(event, container) {
    const totalPages = paginationInfo.totalPages || 1;
    
    handlePaginationClick(event, { currentPage, totalPages }, async (newPage) => {
        currentPage = newPage;
        try {
            // (Bạn có thể cần kiểm tra xem có đang ở chế độ tìm kiếm không)
            const empData = await getEmployees(currentPage, ITEMS_PER_PAGE, sortBy, sortOrder);
            employees = empData.data;
            paginationInfo = empData.pagination;
            renderTable(container.querySelector('#employee-table-container'));
        } catch (error) {
            alert('Lỗi khi chuyển trang: ' + error.message);
        }
    });
}

/**
 * Xử lý mở Modal (Thêm/Sửa)
 */
async function handleOpenModal(container, employeeId = null) {
    isEditing = employeeId !== null;
    currentEmployeeId = employeeId;
    
    const modalBody = container.querySelector('#modal-body');
    let employeeData = {};
    
    if (isEditing) {
        try {
            employeeData = await getEmployeeById(employeeId);
        } catch (error) {
            alert('Không thể tải dữ liệu nhân viên: ' + error.message);
            return;
        }
    }
    
    // **(Bước 4) TÁI SỬ DỤNG DATA (departments, positions, shifts) ĐÃ TẢI SẴN**
    modalBody.innerHTML = `
        <h3>${isEditing ? 'Chỉnh sửa Nhân viên' : 'Thêm Nhân viên mới'}</h3>
        <form id="employee-form">
            <label>Tên:</label>
            <input type="text" name="name" value="${employeeData.name || ''}" required>
            <label>Ngày vào làm:</label>
            <input type="date" name="hireDate" value="${employeeData.hire_date || new Date().toISOString().split('T')[0]}" required>
            
            <label>Phòng ban:</label>
            <select name="departmentId" required>
                <option value="">-- Chọn phòng ban --</option>
                ${departments.map(d => `<option value="${d.id}" ${d.id === employeeData.department_id ? 'selected' : ''}>${d.name}</option>`).join('')}
            </select>
            
            <label>Vị trí:</label>
            <select name="positionId" required>
                <option value="">-- Vui lòng chọn phòng ban --</option>
                <!-- Dữ liệu sẽ được load bởi handleDepartmentChange() -->
            </select>
            
            <label>Ca làm việc:</label>
            <select name="shift_id" required>
                <option value="">-- Chọn ca làm --</option>
                ${shifts.map(s => `<option value="${s.id}" ${s.id === employeeData.shift_id ? 'selected' : ''}>${s.shift_name}</option>`).join('')}
            </select>

            <button type="submit">${isEditing ? 'Lưu thay đổi' : 'Thêm mới'}</button>
        </form>
    `;
    
    // Kích hoạt logic dropdown động
    if (employeeData.department_id) {
        handleDepartmentChange(employeeData.department_id, container);
        // Set giá trị cũ cho vị trí
        container.querySelector('select[name="positionId"]').value = employeeData.position_id;
    }
    
    container.querySelector('#employee-modal').style.display = 'block';
}

/**
 * Xử lý khi dropdown Phòng ban thay đổi (trong Modal).
 */
function handleDepartmentChange(departmentId, container) {
    const positionSelect = container.querySelector('#employee-modal select[name="positionId"]');
    if (!departmentId) {
        positionSelect.innerHTML = '<option value="">-- Vui lòng chọn phòng ban --</option>';
        positionSelect.disabled = true;
        return;
    }
    
    // Lọc từ danh sách positions đã tải sẵn
    const positionsInDept = positions.filter(p => p.department_id === departmentId);
    
    positionSelect.innerHTML = '<option value="">-- Chọn vị trí --</option>';
    positionsInDept.forEach(p => {
        positionSelect.innerHTML += `<option value="${p.id}">${p.title}</option>`;
    });
    positionSelect.disabled = false;
}

function handleCloseModal(container) {
    container.querySelector('#employee-modal').style.display = 'none';
}

/**
 * Xử lý submit form Thêm/Sửa
 */
async function handleFormSubmit(event, container) {
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        hireDate: formData.get('hireDate'),
        positionId: formData.get('positionId'),
        shift_id: formData.get('shift_id')
    };

    // (Bạn nên thêm validation ở đây, ví dụ: gọi isNotEmpty...)
    
    try {
        if (isEditing) {
            await updateEmployee(currentEmployeeId, data);
            alert('Cập nhật thành công!');
        } else {
            await createEmployee(data);
            alert('Thêm nhân viên thành công!');
        }
        handleCloseModal(container);
        // Tải lại dữ liệu trang 1
        const result = await getEmployees(1, ITEMS_PER_PAGE, sortBy, sortOrder);
        employees = result.data;
        paginationInfo = result.pagination;
        renderTable(container.querySelector('#employee-table-container'));
    } catch (error) {
        alert('Lỗi khi lưu: ' + error.message);
    }
}

/**
 * Xử lý xóa
 */
async function handleDelete(employeeId, container) {
    if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
        try {
            await deleteEmployee(employeeId);
            alert('Xóa thành công!');
            // Tải lại dữ liệu trang 1
            const result = await getEmployees(1, ITEMS_PER_PAGE, sortBy, sortOrder);
            employees = result.data;
            paginationInfo = result.pagination;
            renderTable(container.querySelector('#employee-table-container'));
        } catch (error) {
            alert('Lỗi khi xóa: ' + error.message);
        }
    }
}