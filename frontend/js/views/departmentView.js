import UI from '../utils/uiHelper.js';

class DepartmentView {
    
    // 1. RENDER KHUNG SƯỜN
    renderLayout(container) {
        container.innerHTML = `
            <div class="content-card">
                <div class="action-bar">
                    <div class="filter-group">
                        <input type="text" id="search-dept" class="filter-input" placeholder="Tìm tên phòng ban..." style="max-width: 300px;">
                    </div>
                    <button id="btn-add-dept" class="btn btn-success btn-sm">
                        <i class="fa-solid fa-plus"></i> Thêm phòng ban
                    </button>
                </div>

                <div class="table-wrapper">
                    <table class="table-standard">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên Phòng ban</th>
                                <th class="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="department-table-body"></tbody>
                    </table>
                </div>
                
                <div class="pagination-bar" style="justify-content: flex-end; color: var(--text-muted); font-size: 0.9rem;">
                    <span id="dept-count">0 phòng ban</span>
                </div>
            </div>
        `;
    }

    // 2. RENDER BẢNG DỮ LIỆU
    renderTable(departments) {
        const tbody = document.getElementById('department-table-body');
        const countSpan = document.getElementById('dept-count');
        
        if (!tbody) return;

        if (!departments || departments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center p-4 text-muted">Chưa có dữ liệu phòng ban</td></tr>`;
            if (countSpan) countSpan.innerText = '0 phòng ban';
            return;
        }

        if (countSpan) countSpan.innerText = `${departments.length} phòng ban`;

        tbody.innerHTML = departments.map(dept => `
            <tr>
                <td><span class="badge badge-info" style="background: #eef2f7; color: #333;">${dept.id}</span></td>
                <td><strong>${dept.name}</strong></td>
                <td class="text-center">
                    <button class="btn btn-outline btn-sm btn-view-employees" data-id="${dept.id}" data-name="${dept.name}" title="Xem nhân viên">
                        <i class="fa-solid fa-users-viewfinder" style="color: var(--info);"></i>
                    </button>
                    <button class="btn btn-outline btn-sm btn-edit" data-id="${dept.id}" data-name="${dept.name}" title="Sửa tên">
                        <i class="fa-solid fa-pen" style="color: var(--warning);"></i>
                    </button>
                    <button class="btn btn-outline btn-sm btn-delete" data-id="${dept.id}" title="Xóa">
                        <i class="fa-solid fa-trash" style="color: var(--danger);"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // 3. MODAL THÊM / SỬA
    showModal(data = null) {
        const isEdit = !!data;
        const title = isEdit ? 'Cập nhật Phòng ban' : 'Thêm Phòng ban mới';
        const btnText = isEdit ? 'Lưu thay đổi' : 'Tạo mới';

        const html = `
            <form id="department-form">
                <input type="hidden" name="id" value="${data?.id || ''}">
                
                <div class="form-group">
                    <label class="form-label">Tên Phòng ban <span class="text-danger">*</span></label>
                    <input type="text" name="name" class="form-control" value="${data?.name || ''}" required placeholder="Ví dụ: Phòng Kế toán">
                </div>
                
                ${!isEdit ? `
                <div class="form-group">
                    <label class="form-label">Mã Phòng ban (ID) <span class="text-danger">*</span></label>
                    <input type="text" name="newId" class="form-control" placeholder="Ví dụ: dept_acc" required>
                    <small class="text-muted">Mã định danh duy nhất, không dấu, không khoảng trắng.</small>
                </div>` : ''}
            </form>
        `;

        const footer = `
            <button class="btn btn-outline" id="btn-cancel-dept">Hủy</button>
            <button class="btn btn-primary" id="btn-save-dept">${btnText}</button>
        `;

        UI.showModal(title, html, footer);
        const btnCancel = document.getElementById('btn-cancel-dept');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => UI.closeModal());
        }
    }

    // 4. MODAL XEM NHÂN VIÊN (Tính năng đặc biệt)
    showEmployeeListModal(deptName, employees) {
        const title = `Danh sách nhân viên: ${deptName}`;
        
        let contentHtml = '';
        
        if (!employees || employees.length === 0) {
            contentHtml = `
                <div class="text-center p-4 text-muted">
                    <i class="fa-solid fa-user-slash" style="font-size: 2rem; margin-bottom: 10px; color: #ccc;"></i>
                    <p>Chưa có nhân viên nào thuộc phòng ban này.</p>
                </div>
            `;
        } else {
            // Map dữ liệu ra các dòng bảng
            const rows = employees.map((emp, index) => {
                // Format lương
                const salaryVal = emp.total_salary || emp.salary_base || 0;
                const salaryFormatted = UI.formatMoney(salaryVal);

                return `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${emp.name}</strong></td>
                    <td>${emp.position_title || '<span class="text-muted">N/A</span>'}</td>
                    <td>
                        <div class="salary-wrapper">
                            <span class="salary-text salary-hidden" data-real="${salaryFormatted}">******</span>
                            <button class="toggle-salary-btn" title="Xem/Ẩn lương">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `}).join('');

            contentHtml = `
                <div class="table-wrapper" style="max-height: 400px; overflow-y: auto;">
                    <table class="table-standard" id="dept-emp-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th>Họ tên</th>
                                <th>Vị trí</th>
                                <th>Lương thực nhận</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        }

        // Footer chỉ cần nút đóng
        const footer = `<button class="btn btn-primary" id="btn-close-detail">Đóng</button>`;
        // 1. Hiển thị Modal
        UI.showModal(title, contentHtml, footer);

        // 2. GẮN SỰ KIỆN TOGGLE LƯƠNG (Ngay sau khi Modal render)
        // Vì nội dung modal là động, ta gắn sự kiện delegation vào cái bảng vừa tạo
        const table = document.getElementById('dept-emp-table');
        if (table) {
            table.addEventListener('click', (e) => {
                // Tìm nút toggle gần nhất
                const btn = e.target.closest('.toggle-salary-btn');
                if (!btn) return;

                // Logic ẩn/hiện (giống hệt bên EmployeeView)
                const wrapper = btn.parentElement;
                const textSpan = wrapper.querySelector('.salary-text');
                const icon = btn.querySelector('i');

                if (textSpan.classList.contains('salary-hidden')) {
                    // Hiện
                    textSpan.textContent = textSpan.dataset.real;
                    textSpan.classList.remove('salary-hidden');
                    textSpan.classList.add('salary-visible');
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    // Ẩn
                    textSpan.textContent = '******';
                    textSpan.classList.add('salary-hidden');
                    textSpan.classList.remove('salary-visible');
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            });
        }
        const btnClose = document.getElementById('btn-close-detail');
        if (btnClose) {
            btnClose.addEventListener('click', () => UI.closeModal());
        }
    }

    // 5. BIND EVENTS
    bindEvents(handlers) {
        // Thêm mới
        const btnAdd = document.getElementById('btn-add-dept');
        if (btnAdd) btnAdd.addEventListener('click', handlers.onAdd);

        // Search Client-side (Lọc trên bảng đã tải)
        const searchInput = document.getElementById('search-dept');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const keyword = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('#department-table-body tr');
                rows.forEach(row => {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(keyword) ? '' : 'none';
                });
            });
        }

        // Actions Table (Sửa, Xóa, Xem chi tiết)
        const tbody = document.getElementById('department-table-body');
        if (tbody) {
            // Clone để reset event
            const newTbody = tbody.cloneNode(true);
            tbody.parentNode.replaceChild(newTbody, tbody);

            newTbody.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const id = btn.dataset.id;
                const name = btn.dataset.name;

                if (btn.classList.contains('btn-edit')) handlers.onEdit({ id, name });
                else if (btn.classList.contains('btn-delete')) handlers.onDelete(id);
                else if (btn.classList.contains('btn-view-employees')) handlers.onViewEmployees(id, name);
            });
        }

        // Save Modal
        // Logic bindModalSave tương tự EmployeeView
        const saveHandler = (e) => {
            if (e.target && e.target.id === 'btn-save-dept') {
                const form = document.getElementById('department-form');
                if (form && form.checkValidity()) {
                    const formData = new FormData(form);
                    // Nếu là Create thì lấy newId gán vào id
                    const data = Object.fromEntries(formData.entries());
                    if (!data.id && data.newId) data.id = data.newId; 
                    
                    handlers.onSave(data);
                } else if (form) {
                    form.reportValidity();
                }
            }
        };
        
        // Hack để tránh duplicate event listener trên document
        if (window._deptSaveListener) document.removeEventListener('click', window._deptSaveListener);
        window._deptSaveListener = saveHandler;
        document.addEventListener('click', window._deptSaveListener);
    }
}

export default new DepartmentView();