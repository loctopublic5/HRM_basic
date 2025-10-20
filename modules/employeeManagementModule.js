import { getAllDepartments } from './departmentModule.js';
import { getAllPositions, getPositionById, getPositionsByDepartmentId } from './positionModule.js';
import { getAllEmployees, getEmployeeById,addEmployee,updateEmployee,deleteEmployee} from './employeeDbModule.js';
import { renderPagination, handlePaginationClick } from './paginationComponent.js';
import { isNotEmpty, isNameUnique } from './validators.js';
import { calculateSalaryDetails } from './salaryModule.js';

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

    const totalPages = Math.ceil(allEmployees.length / ITEMS_PER_PAGE) || 1;
    const paginatedEmployees = allEmployees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const paginationHtml = renderPagination(currentPage, totalPages);

    tableContainer.innerHTML = `
        <table id="employee-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Phòng ban</th>
                    <th>Vị trí</th>
                    <th>Lương Cơ bản + Phụ cấp</th>
                    <th>Ngày vào làm</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedEmployees.map(emp => {

                    const { totalSalary } = calculateSalaryDetails(emp);
                    const position = positionMap[emp.positionId];
                    
                    return `
                        <tr>
                            <td>${emp.id}</td>
                            <td>${emp.name}</td>
                            <td>${departmentMap[emp.departmentId] || 'N/A'}</td>
                            <td>${position ? position.title : 'N/A'}</td>
                            <td>${totalSalary.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                            <td>${emp.hireDate}</td>
                            <td class="actions">
                                <button class="epl-edit-btn" data-id="${emp.id}">Sửa</button>
                                <button class="epl-delete-btn" data-id="${emp.id}">Xóa</button>
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
    const tableContainer = document.getElementById('employee-table-container');

    addBtn.addEventListener('click', () => openFormModal());
    document.getElementById('close-modal-btn').addEventListener('click', closeFormModal);

    tableContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('epl-edit-btn')) {
            openFormModal(event.target.dataset.id);
        }
        
        if (event.target.classList.contains('epl-delete-btn')) {
            if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
                const totalEmployeesBeforeDelete = getAllEmployees().length;
                deleteEmployee(event.target.dataset.id);
                if (totalEmployeesBeforeDelete % ITEMS_PER_PAGE === 1 && currentPage > 1) {
                    currentPage--;
                }
                renderTable();
            }
        }
        
        const totalPages = Math.ceil(getAllEmployees().length / ITEMS_PER_PAGE);
        handlePaginationClick(event, { currentPage, totalPages }, (newPage) => {
            currentPage = newPage;
            renderTable();
        });
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
// === Trong file modules/employeeManagementModule.js ===

/**
 * Mở và render form trong modal (Phiên bản đã hợp nhất logic).
 * @param {string|null} employeeId 
 */
function openFormModal(employeeId = null) {
    isEditing = employeeId !== null;
    currentEmployeeId = employeeId;
    
    const employee = isEditing ? getEmployeeById(employeeId) : {};
    const modalBody = document.getElementById('modal-body');
    const departments = getAllDepartments();
    const todayString = new Date().toISOString().split('T')[0];

    // 1. Render HTML của form (Không thay đổi)
    modalBody.innerHTML = `
        <h3>${isEditing ? 'Chỉnh sửa Nhân viên' : 'Thêm Nhân viên mới'}</h3>
        <form id="employee-form">
            <label>Tên:</label>
            <input type="text" name="name" value="${employee.name || ''}" required>
            <label>Ngày vào làm:</label>
            <input type="date" name="hireDate" value="${employee.hireDate || todayString}" max="${todayString}" required>
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

    // 2. Lấy các element và biến trạng thái ngay sau khi render
    const departmentSelect = modalBody.querySelector('select[name="departmentId"]');
    const positionSelect = modalBody.querySelector('select[name="positionId"]');
    const salaryDisplay = document.getElementById('salary-base-display');
    let originalPositionId = employee.positionId; // Lưu lại vị trí ban đầu

    // 3. --- TÁCH BIỆT CÁC HÀM LOGIC ---

    // Hàm chỉ cập nhật hiển thị lương
    function updateSalaryDisplay() {
        const selectedPosition = getPositionById(positionSelect.value);
        salaryDisplay.textContent = selectedPosition 
            ? selectedPosition.salaryBase.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) 
            : '—';
    }

    // Hàm chỉ cập nhật danh sách vị trí
    function updatePositionOptions() {
        const deptId = departmentSelect.value;
        if (deptId) {
            const positions = getPositionsByDepartmentId(deptId);
            positionSelect.innerHTML = positions.map(p => 
                `<option value="${p.id}" ${isEditing && p.id === employee.positionId ? 'selected' : ''}>${p.title}</option>`
            ).join('');
            positionSelect.disabled = false;
        } else {
            positionSelect.innerHTML = '<option value="">-- Chọn phòng ban trước --</option>';
            positionSelect.disabled = true;
        }
    }

    // Hàm chỉ kiểm tra và hiển thị cảnh báo
    function checkForPositionChangeWarning() {
        if (isEditing && positionSelect.value && positionSelect.value !== originalPositionId) {
            const confirmed = window.confirm(
                "Cảnh báo: Thay đổi vị trí sẽ tính lại các khoản phụ cấp về mức lương cơ bản của vị trí mới. Bạn có chắc chắn muốn tiếp tục?"
            );
            if (confirmed) {
                originalPositionId = positionSelect.value; // Đồng ý -> cập nhật vị trí gốc
            } else {
                // Hủy -> khôi phục lại lựa chọn
                departmentSelect.value = getPositionById(originalPositionId)?.departmentId || '';
                updatePositionOptions(); // Tải lại danh sách vị trí của phòng ban cũ
                positionSelect.value = originalPositionId; // Chọn lại vị trí cũ
            }
        }
        updateSalaryDisplay(); // Luôn cập nhật lương sau khi kiểm tra
    }

    // 4. --- GẮN SỰ KIỆN ĐÃ HỢP NHẤT ---
    
    // Khi chọn Phòng ban: Cập nhật danh sách Vị trí, sau đó kiểm tra cảnh báo
    departmentSelect.addEventListener('change', () => {
        updatePositionOptions();
        checkForPositionChangeWarning();
    });

    // Khi chọn Vị trí: Kiểm tra cảnh báo trước, sau đó cập nhật lương
    positionSelect.addEventListener('change', () => {
        checkForPositionChangeWarning();
    });

    // 5. --- KHỞI TẠO TRẠNG THÁI FORM ---
    
    // Tải danh sách vị trí ban đầu cho chế độ Sửa
    if (isEditing && employee.departmentId) {
        updatePositionOptions();
    }
    updateSalaryDisplay(); // Hiển thị lương ban đầu
    
    document.getElementById('employee-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('employee-modal').style.display = 'block';
}

function closeFormModal() {
    document.getElementById('employee-modal').style.display = 'none';
}

function handleFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const hireDate = formData.get('hireDate');
    const departmentId = formData.get('departmentId');
    const positionId = formData.get('positionId');

    // Lấy danh sách nhân viên hiện tại để kiểm tra trùng lặp
    const allEmployees = getAllEmployees();

    if (!isNotEmpty(name, 'Tên nhân viên') || 
        !isNotEmpty(hireDate, 'Ngày vào làm') ||
        !isNotEmpty(departmentId, 'Phòng ban') ||
        !isNotEmpty(positionId, 'Vị trí') ||
        !isNameUnique(name, allEmployees, isEditing ? currentEmployeeId : null)
    ) {
        return; // Dừng lại nếu một trong các điều kiện không thỏa mãn
    }

    const employeeData = { name, hireDate, departmentId, positionId };

    if (isEditing) {
        updateEmployee(currentEmployeeId, employeeData);
    } else {
        addEmployee(employeeData);
        currentPage = Math.ceil(getAllEmployees().length / ITEMS_PER_PAGE);
    }

    closeFormModal();
    renderTable(); // Cập nhật lại bảng
}

export { render };