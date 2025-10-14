// === modules/employeeManagementModule.js ===

import { getAllDepartments } from './departmentModule.js';
import { getAllPositions, getPositionById, getPositionsByDepartmentId } from './positionModule.js';
import { 
    getAllEmployees, 
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee
} from './employeeDbModule.js';

// --- Biến trạng thái của module ---
let isEditing = false;
let currentEmployeeId = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

/**
 * Hàm chính để render toàn bộ giao diện quản lý nhân viên
 * @param {HTMLElement} container - Element để render vào
 */
function render(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>Quản lý Nhân viên</h2>
            <button id="add-employee-btn">Thêm nhân viên mới</button>
        </div>
        <div id="employee-table-container"></div>
        
        <div id="employee-modal" class="modal">
            <div class="modal-content">
                <span id="close-modal-btn" class="close-btn">&times;</span>
                <div id="modal-body"></div>
            </div>
        </div>
    `;

    renderTable();
    bindMainEvents();
}

/**
 * Render lại chỉ phần bảng dữ liệu và các nút phân trang
 */
function renderTable() {
    const tableContainer = document.getElementById('employee-table-container');
    const allEmployees = getAllEmployees();
    const departments = getAllDepartments();
    const positions = getAllPositions();

    const departmentMap = departments.reduce((map, dept) => ({ ...map, [dept.id]: dept.name }), {});
    const positionMap = positions.reduce((map, pos) => ({ ...map, [pos.id]: pos }), {});

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

    tableContainer.innerHTML = `
        <table id="employee-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Phòng ban</th>
                    <th>Vị trí</th>
                    <th>Lương Cơ bản + Phụ cấp</th> <th>Ngày vào làm</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedEmployees.map(emp => {
                    // --- LOGIC TÍNH LƯƠNG MỚI ---
                    const position = positionMap[emp.positionId];
                    const salaryBase = position ? position.salaryBase : 0;
                    const allowance = emp.permanentAllowance || 0;
                    const totalSalary = salaryBase + allowance;
                    
                    const formattedSalary = totalSalary.toLocaleString('vi-VN', { 
                        style: 'currency', 
                        currency: 'VND' 
                    });

                    return `
                        <tr>
                            <td>${emp.id}</td>
                            <td>${emp.name}</td>
                            <td>${departmentMap[emp.departmentId] || 'N/A'}</td>
                            <td>${position ? position.title : 'N/A'}</td>
                            <td>${formattedSalary}</td>
                            <td>${emp.hireDate}</td>
                            <td class="actions">
                                <button class="edit-btn" data-id="${emp.id}">Sửa</button>
                                <button class="delete-btn" data-id="${emp.id}">Xóa</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        ${totalPages > 1 ? paginationHtml : ''} 
    `;
}

/**
 * Gắn các sự kiện chính cho trang
 */
function bindMainEvents() {
    const addBtn = document.getElementById('add-employee-btn');
    const modal = document.getElementById('employee-modal');
    const tableContainer = document.getElementById('employee-table-container');

    addBtn.addEventListener('click', () => openFormModal());
    document.getElementById('close-modal-btn').addEventListener('click', closeFormModal);

    console.log('Tìm thấy nút "Thêm nhân viên mới":', addBtn);
    console.log('Tìm thấy container của bảng (để gắn sự kiện Sửa/Xóa):', tableContainer);


    tableContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-btn')) {
            openFormModal(event.target.dataset.id);
        }
        
        if (event.target.classList.contains('delete-btn')) {
            if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
                const totalEmployeesBeforeDelete = getAllEmployees().length;
                deleteEmployee(event.target.dataset.id);
                
                if (totalEmployeesBeforeDelete % ITEMS_PER_PAGE === 1 && currentPage > 1) {
                    currentPage--;
                }
                renderTable();
            }
        }
        
        if (event.target.closest('.pagination')) {
            const action = event.target.dataset.action;
            const totalPages = Math.ceil(getAllEmployees().length / ITEMS_PER_PAGE);
            if (action === 'prev' && currentPage > 1) {
                currentPage--;
                renderTable();
            }
            if (action === 'next' && currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        }
    });
}

/**
 * Mở và render form trong modal
 * @param {string|null} employeeId - ID của nhân viên (nếu là sửa), null (nếu là thêm)
 */
/**
 * Mở và render form trong modal
 * @param {string|null} employeeId - ID của nhân viên (nếu là sửa), null (nếu là thêm)
 */
function openFormModal(employeeId = null) {
    isEditing = employeeId !== null;
    currentEmployeeId = employeeId;
    
    const employee = isEditing ? getEmployeeById(employeeId) : {};
    const modalBody = document.getElementById('modal-body');
    const departments = getAllDepartments();

    modalBody.innerHTML = `
        <h3>${isEditing ? 'Chỉnh sửa Nhân viên' : 'Thêm Nhân viên mới'}</h3>
        <form id="employee-form">
            <label>Tên:</label>
            <input type="text" name="name" value="${employee.name || ''}" required>
            <label>Ngày vào làm:</label>
            <input type="date" name="hireDate" value="${employee.hireDate || ''}" required>
            <label>Phòng ban:</label>
            <select name="departmentId" required>
                <option value="">-- Chọn phòng ban --</option>
                ${departments.map(d => `<option value="${d.id}" ${d.id === employee.departmentId ? 'selected' : ''}>${d.name}</option>`).join('')}
            </select>
            <label>Vị trí:</label>
            <select name="positionId" required>
                <option value="">-- Vui lòng chọn phòng ban trước --</option>
            </select>
            <div class="salary-display">
                <strong>Lương cơ bản (từ Vị trí):</strong>
                <span id="salary-base-display">—</span>
            </div>
            <button type="submit">${isEditing ? 'Lưu thay đổi' : 'Thêm mới'}</button>
        </form>
    `;

    const departmentSelect = modalBody.querySelector('select[name="departmentId"]');
    const positionSelect = modalBody.querySelector('select[name="positionId"]');
    const salaryDisplay = document.getElementById('salary-base-display');

    // --- LOGIC MỚI ĐÃ ĐƯỢC TÁCH BIỆT ---

    // Hàm 1: Chỉ cập nhật hiển thị lương
    function updateSalaryDisplay() {
        const posId = positionSelect.value;
        const selectedPosition = getPositionById(posId);
        if (selectedPosition) {
            salaryDisplay.textContent = selectedPosition.salaryBase.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        } else {
            salaryDisplay.textContent = '—';
        }
    }

    // Hàm 2: Chỉ cập nhật danh sách vị trí
    function updatePositionOptions() {
        const deptId = departmentSelect.value;
        const currentPosId = employee.positionId; // Chỉ dùng cho lần tải đầu ở chế độ Sửa
        
        if (deptId) {
            const positions = getPositionsByDepartmentId(deptId);
            positionSelect.innerHTML = positions.map(p => 
                // Ở chế độ Sửa, chỉ chọn sẵn vị trí ở lần tải đầu tiên
                `<option value="${p.id}" ${isEditing && p.id === currentPosId ? 'selected' : ''}>${p.title}</option>`
            ).join('');
            positionSelect.disabled = false;
        } else {
            positionSelect.innerHTML = '<option value="">-- Vui lòng chọn phòng ban trước --</option>';
            positionSelect.disabled = true;
        }
        // Sau khi cập nhật danh sách vị trí, phải cập nhật lại lương hiển thị
        updateSalaryDisplay();
    }
    
    // --- GẮN SỰ KIỆN THEO LOGIC MỚI ---
    departmentSelect.addEventListener('change', updatePositionOptions);
    positionSelect.addEventListener('change', updateSalaryDisplay);

    if (isEditing && employee.departmentId) {
        updatePositionOptions();
    }
    
    document.getElementById('employee-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('employee-modal').style.display = 'block';
}

function closeFormModal() {
    document.getElementById('employee-modal').style.display = 'none';
}

function handleFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    // Không còn lấy 'salary' từ form nữa
    const employeeData = {
        name: formData.get('name'),
        hireDate: formData.get('hireDate'),
        departmentId: formData.get('departmentId'),
        positionId: formData.get('positionId'),
    };

    if (isEditing) {
        updateEmployee(currentEmployeeId, employeeData);
    } else {
        addEmployee(employeeData);
        // Cập nhật lại currentPage để xem nhân viên mới
        const totalEmployees = getAllEmployees().length;
        currentPage = Math.ceil(totalEmployees / ITEMS_PER_PAGE);
    }

    closeFormModal();
    renderTable(); // Cập nhật lại bảng
}

export { render };