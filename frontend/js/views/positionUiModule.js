
import { 
    getPositions, 
    createPosition, 
    updatePosition, 
    deletePosition,
    getPositionById 
} from '../services/positionService.js';
import { getDepartments } from '../services/departmentService.js';
import { renderPagination, handlePaginationClick } from '../helpers/paginationComponent.js';

// --- STATE ---
let positions = [];
let departments = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let filteredPositions = []; // Dùng để lưu kết quả sau khi search

/**
 * HÀM RENDER CHÍNH
 */
export async function render(container) {
    if (!container.dataset.positionEventsAttached) {
        bindEvents(container);
        container.dataset.positionEventsAttached = 'true';
    }
    await loadInitialData(container);
}

/**
 * Tải dữ liệu từ API
 */
async function loadInitialData(container) {
    // Loading Spinner
    container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 300px;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
            <span style="margin-left: 15px; color: #666;">Đang tải dữ liệu vị trí...</span>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;

    try {
        // Tải song song Vị trí và Phòng ban (để hiển thị tên phòng ban hoặc dropdown)
        const [posList, deptList] = await Promise.all([
            getPositions(),
            getDepartments()
        ]);
        
        // --- BƯỚC 1: CHẨN ĐOÁN (DEBUG) ---
        console.log('API Response (Positions):', posList); 
        // Hãy mở Console (F12) để xem. Bạn sẽ thấy key là 'salary_base' hay 'salaryBase'.
        // --------------------------------


        positions = posList;
        filteredPositions = posList; // Mặc định chưa lọc
        departments = deptList;
        
        renderPageContent(container);

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="error-message">Lỗi tải dữ liệu: ${error.message}</p>`;
    }
}

/**
 * Vẽ khung sườn và nội dung
 */
function renderPageContent(container) {
    container.innerHTML = getTemplate();
    
    // Render dữ liệu bảng (có phân trang)
    renderTableSection(container);
}

/**
 * 1. KHUNG SƯỜN HTML (Design System)
 */
function getTemplate() {
    return `
    <div class="content-card">
        <!-- Header -->
        <div class="card-header">
            <h2 class="module-title">Quản lý Vị trí</h2>
            
            <div class="action-bar">
                <!-- Tìm kiếm -->
                <div class="filter-group">
                    <div class="search-group" style="display: flex; gap: 10px;">
                        <input type="text" id="search-pos-input" class="form-control" placeholder="Tìm tên chức vụ...">
                        <button id="search-pos-btn" class="btn btn-primary">
                            <i class="fa-solid fa-magnifying-glass"></i> Tìm
                        </button>
                    </div>
                </div>

                <!-- Hành động -->
                <div class="action-group">
                    <button id="add-pos-btn" class="btn btn-success">
                        <i class="fa-solid fa-plus"></i> Thêm vị trí
                    </button>
                </div>
            </div>
        </div>

        <!-- Body: Bảng dữ liệu -->
        <div class="card-body">
            <div class="table-responsive">
                <table class="table-standard">
                    <thead>
                        <tr>
                            <th style="width: 100px;">ID</th>
                            <th>Tên chức vụ</th>
                            <th>Phòng ban</th>
                            <th>Mô tả</th>
                            <th>Lương Cơ bản</th>
                            <th style="text-align: center; width: 150px;">Hành động</th>
                        </tr>
                    </thead>
                    <tbody id="pos-table-body">
                        <!-- Data rows here -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Footer: Phân trang -->
        <div class="card-footer" id="pagination-container"></div>
    </div>
    
    <!-- Modal Container (Ẩn) -->
    <div id="position-modal" class="modal" style="display: none;">
         <div class="modal-content">
            <span id="close-modal-btn" class="close-btn">&times;</span>
            <div id="modal-body"></div>
        </div>
    </div>
    `;
}

/**
 * 2. RENDER BẢNG & PHÂN TRANG
 */
function renderTableSection(container) {
    const tbody = container.querySelector('#pos-table-body');
    const paginationContainer = container.querySelector('#pagination-container');

    // Logic Phân trang Client-side (vì số lượng vị trí thường ít)
    const totalPages = Math.ceil(filteredPositions.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredPositions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // A. Render Rows
    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #999;">Không tìm thấy vị trí nào.</td></tr>`;
    } else {
        tbody.innerHTML = paginatedData.map(pos => {
            // --- FORMAT TIỀN TỆ (VND) ---
            // Sử dụng Intl.NumberFormat để định dạng số thành tiền Việt Nam chuẩn
            // style: 'currency', currency: 'VND' sẽ tự động thêm ký hiệu ₫ và dấu chấm phân cách
            const formattedSalary = new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
            }).format(pos.salary_base);

            // Xử lý tên phòng ban (giả sử API trả về department_name do JOIN, hoặc map thủ công)
            // Nếu dùng API PositionModel ở Giai đoạn 4, nó đã có department_name rồi.
            // Nếu chưa, ta map thủ công từ mảng 'departments' đã tải.
            let deptName = pos.department_name;
            if (!deptName) {
                 const dept = departments.find(d => d.id === pos.department_id);
                 deptName = dept ? dept.name : 'N/A';
            }

            // Xử lý cắt ngắn mô tả (Text Truncate)
            let description = pos.description || '';
            if (description.length > 50) {
                description = description.substring(0, 50) + '...';
            }

            return `
                <tr>
                    <td style="font-family: monospace; color: #666;">${pos.id}</td>
                    <td style="font-weight: 600; color: var(--color-primary);">${pos.title}</td>
                    <td><span class="badge badge-info">${deptName}</span></td>
                    <td title="${pos.description || ''}">${description}</td>
                    <td style="font-family: monospace; font-weight: bold; color: #27ae60;">${formattedSalary}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-sm btn-outline pos-edit-btn" data-id="${pos.id}" title="Sửa">
                            <i class="fa-solid fa-pen" style="color: #f39c12;"></i>
                        </button>
                        <button class="btn btn-sm btn-outline pos-delete-btn" data-id="${pos.id}" title="Xóa">
                            <i class="fa-solid fa-trash" style="color: #e74c3c;"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // B. Render Pagination
    paginationContainer.innerHTML = renderPagination(currentPage, totalPages);
}

/**
 * 3. XỬ LÝ SỰ KIỆN
 */
function bindEvents(container) {
    container.addEventListener('click', async (event) => {
        const target = event.target;

        // Nút Thêm
        if (target.closest('#add-pos-btn')) {
            handleOpenModal(container);
        }
        // Nút Đóng Modal
        if (target.id === 'close-modal-btn') handleCloseModal(container);

        // Nút Tìm kiếm (Client-side filter)
        if (target.closest('#search-pos-btn')) {
            const keyword = container.querySelector('#search-pos-input').value.toLowerCase();
            filteredPositions = positions.filter(p => p.title.toLowerCase().includes(keyword));
            currentPage = 1; // Reset về trang 1
            renderTableSection(container);
        }

        // Nút Sửa
        const editBtn = target.closest('.pos-edit-btn');
        if (editBtn) handleOpenModal(container, editBtn.dataset.id);

        // Nút Xóa
        const deleteBtn = target.closest('.pos-delete-btn');
        if (deleteBtn) handleDelete(deleteBtn.dataset.id, container);

        // Phân trang
        const paginationBtn = target.closest('.pagination button');
        if (paginationBtn) {
            const totalPages = Math.ceil(filteredPositions.length / ITEMS_PER_PAGE) || 1;
            handlePaginationClick(event, { currentPage, totalPages }, (newPage) => {
                currentPage = newPage;
                renderTableSection(container);
            });
        }
    });

    // Sự kiện Submit Form (Trong Modal)
    container.addEventListener('submit', (event) => {
        if (event.target.id === 'position-form') {
            event.preventDefault();
            handleFormSubmit(event, container);
        }
    });
}

// --- CÁC HÀM LOGIC FORM & MODAL ---

let currentEditingId = null;

async function handleOpenModal(container, id = null) {
    currentEditingId = id;
    const isEditing = id !== null;
    
    let posData = {};
    if (isEditing) {
        // Tìm trong mảng đã tải hoặc gọi API getById nếu cần chi tiết hơn
        // Ở đây ta dùng API getById cho chắc chắn
        try {
            posData = await getPositionById(id);
        } catch (e) { alert(e.message); return; }
    }

    const modalBody = container.querySelector('#modal-body');
    modalBody.innerHTML = `
        <h3 class="module-title" style="text-align: center; font-size: 1.2rem;">
            ${isEditing ? 'Cập nhật Vị trí' : 'Thêm Vị trí mới'}
        </h3>
        <form id="position-form">
            <div class="form-group">
                <label>Tên chức vụ:</label>
                <input type="text" name="title" class="form-control" value="${posData.title || ''}" required>
            </div>
            <div class="form-group">
                <label>Thuộc Phòng ban:</label>
                <select name="departmentId" class="form-select" required>
                    <option value="">-- Chọn phòng ban --</option>
                    ${departments.map(d => `<option value="${d.id}" ${d.id === posData.department_id ? 'selected' : ''}>${d.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Lương cơ bản (VND):</label>
                <input type="number" name="salaryBase" class="form-control" value="${posData.salary_base ? parseInt(posData.salary_base) : ''}" required min="0">
            </div>
            <div class="form-group">
                <label>Mô tả công việc:</label>
                <textarea name="description" class="form-control" rows="3">${posData.description || ''}</textarea>
            </div>
            <div style="text-align: right; margin-top: 1.5rem; border-top: 1px solid #eee; padding-top: 1rem;">
                 <button type="button" class="btn btn-outline" onclick="document.getElementById('position-modal').style.display='none'">Hủy</button>
                 <button type="submit" class="btn btn-primary">${isEditing ? 'Lưu thay đổi' : 'Tạo mới'}</button>
            </div>
        </form>
    `;
    
    container.querySelector('#position-modal').style.display = 'block';
}

function handleCloseModal(container) {
    container.querySelector('#position-modal').style.display = 'none';
}

async function handleFormSubmit(event, container) {
    const formData = new FormData(event.target);
    const data = {
        title: formData.get('title'),
        departmentId: formData.get('departmentId'), // Chú ý tên trường phải khớp với API backend mong đợi
        salaryBase: formData.get('salaryBase'),
        description: formData.get('description')
    };

    try {
        if (currentEditingId) {
            await updatePosition(currentEditingId, data);
        } else {
            await createPosition(data);
        }
        handleCloseModal(container);
        await loadInitialData(container); // Reload lại bảng
        alert("Thao tác thành công!");
    } catch (error) {
        alert("Lỗi: " + error.message);
    }
}

async function handleDelete(id, container) {
    if (confirm("Bạn có chắc chắn muốn xóa vị trí này?")) {
        try {
            await deletePosition(id);
            await loadInitialData(container);
        } catch (error) {
            alert("Lỗi xóa: " + error.message);
        }
    }
}