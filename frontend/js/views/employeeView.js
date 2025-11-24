import UI from '../utils/uiHelper.js';

class EmployeeView {
    // Không cần constructor lấy main-content nữa vì Controller sẽ truyền vào

    // 1. RENDER KHUNG SƯỜN (LAYOUT)
    // SỬA LỖI: Thêm tham số container vào đầu
    renderLayout(container, departments, positions) {
        // Defensive coding: Kiểm tra nếu data null thì gán mảng rỗng để không lỗi
        departments = Array.isArray(departments) ? departments : [];
        positions = Array.isArray(positions) ? positions : [];

        const deptOptions = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        const posOptions = positions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');

        // Xóa nội dung cũ
        container.innerHTML = '';
        
        container.innerHTML = `
            <div class="content-card">
                <div class="action-bar">
                    <div class="filter-group">
                        <input type="text" id="search-name" class="filter-input" placeholder="Tìm theo tên..." style="flex: 2;">
                        <select id="filter-dept" class="filter-select" style="flex: 1;">
                            <option value="">-- Phòng ban --</option>
                            ${deptOptions}
                        </select>
                        <select id="filter-pos" class="filter-select" style="flex: 1;">
                            <option value="">-- Vị trí --</option>
                            ${posOptions}
                        </select>
                        <button id="btn-search" class="btn btn-primary"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </div>
                    <button id="btn-add-new" class="btn btn-success btn-sm">
                        <i class="fa-solid fa-plus"></i> Thêm nhân viên
                    </button>
                </div>

                <div class="table-wrapper">
                    <table class="table-standard">
                        <thead>
                            <tr>
                                <th data-sort="id">ID <i class="sort-icon fa-solid fa-sort"></i></th>
                                <th data-sort="name">Họ và Tên <i class="sort-icon fa-solid fa-sort"></i></th>
                                <th data-sort="department_name">Phòng ban <i class="sort-icon fa-solid fa-sort"></i></th>
                                <th data-sort="position_title">Vị trí <i class="sort-icon fa-solid fa-sort"></i></th>
                                <th data-sort="hire_date">Ngày vào làm <i class="sort-icon fa-solid fa-sort"></i></th>
                                <th>Mức lương</th>
                                <th class="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="employee-table-body">
                            </tbody>
                    </table>
                </div>

                <div class="pagination-bar" id="pagination-container"></div>
            </div>
        `;
    }

    // 2. RENDER DATA ROWS
    renderTable(employees) {
        const tbody = document.getElementById('employee-table-body');
        if (!tbody) return; // Guard clause
        
        if (!employees || employees.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">Không tìm thấy dữ liệu</td></tr>`;
            return;
        }

        tbody.innerHTML = employees.map(emp => {
            const hireDate = UI.formatDate(emp.hire_date);
            const salaryFormatted = UI.formatMoney(emp.salary_base || 0);
            
            return `
                <tr>
                    <td>${emp.id}</td>
                    <td><strong>${emp.name}</strong></td>
                    <td><span class="badge badge-info">${emp.department_name || 'N/A'}</span></td>
                    <td>${emp.position_title || 'N/A'}</td>
                    <td>${hireDate}</td>
                    <td>
                        <div class="salary-wrapper">
                            <span class="salary-text salary-hidden" data-real="${salaryFormatted}">******</span>
                            <button class="toggle-salary-btn"><i class="fa-regular fa-eye"></i></button>
                        </div>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-outline btn-sm btn-edit" data-id="${emp.id}" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-outline btn-sm btn-delete" data-id="${emp.id}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 3. RENDER PAGINATION
    renderPagination(pagination) {
        const container = document.getElementById('pagination-container');
        if (!container) return;

        // Nếu backend trả về null hoặc thiếu field, fallback về default
        const currentPage = pagination?.currentPage || 1;
        const totalPages = pagination?.totalPages || 1;
        const totalItems = pagination?.totalItems || 0;

        let pagesHtml = '';
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                pagesHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                 pagesHtml += `<span style="margin: 0 5px;">...</span>`;
            }
        }

        container.innerHTML = `
            <div class="pagination-info text-muted">
                Hiển thị trang <strong>${currentPage}</strong> trên <strong>${totalPages}</strong> (Tổng: ${totalItems} bản ghi)
            </div>
            <div class="pagination-controls">
                <button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>
                ${pagesHtml}
                <button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>
            </div>
        `;
    }

    // 4. MODAL FORM
    showModal(data = null, departments = [], positions = [], shifts = []) {
        const isEdit = !!data;
        const title = isEdit ? `Cập nhật nhân viên` : 'Thêm mới nhân viên';
        const btnText = isEdit ? 'Lưu thay đổi' : 'Thêm mới';

        // Map options
        const deptOpts = departments.map(d => `<option value="${d.id}" ${isEdit && data.department_id === d.id ? 'selected' : ''}>${d.name}</option>`).join('');
        const shiftOpts = shifts.map(s => `<option value="${s.id}" ${isEdit && data.shift_id === s.id ? 'selected' : ''}>${s.shift_name}</option>`).join('');
        
        // Filter positions theo dept hiện tại (nếu edit)
        const initialPosOpts = positions
            .filter(p => !isEdit || p.department_id === (data.department_id || ''))
            .map(p => `<option value="${p.id}" ${isEdit && data.position_id === p.id ? 'selected' : ''}>${p.title}</option>`)
            .join('');

        const html = `
            <form id="employee-form">
                <input type="hidden" name="id" value="${data ? data.id : ''}">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Họ và Tên <span class="text-danger">*</span></label>
                        <input type="text" name="name" class="form-control" value="${data ? data.name : ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ngày vào làm <span class="text-danger">*</span></label>
                        <input type="date" name="hireDate" class="form-control" value="${data ? data.hire_date : ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phòng ban <span class="text-danger">*</span></label>
                        <select name="departmentId" id="modal-dept-select" class="form-control" required>
                            <option value="">-- Chọn --</option>
                            ${deptOpts}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Vị trí <span class="text-danger">*</span></label>
                        <select name="positionId" id="modal-pos-select" class="form-control" required>
                            <option value="">-- Chọn Phòng ban trước --</option>
                            ${isEdit ? initialPosOpts : ''}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ca làm việc <span class="text-danger">*</span></label>
                        <select name="shiftId" class="form-control" required>
                            <option value="">-- Chọn --</option>
                            ${shiftOpts}
                        </select>
                    </div>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-outline" onclick="document.getElementById('modal-overlay').classList.remove('open')">Hủy</button>
            <button class="btn btn-primary" id="btn-save-employee">${btnText}</button>
        `;

        UI.showModal(title, html, footer);
    }

    updateModalPositions(filteredPositions) {
        const select = document.getElementById('modal-pos-select');
        if (select) {
            select.innerHTML = '<option value="">-- Chọn --</option>' + 
                filteredPositions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
        }
    }
    
    updateFilterPositions(filteredPositions) {
        const select = document.getElementById('filter-pos');
        if(select) {
            select.innerHTML = '<option value="">-- Vị trí --</option>' + 
                filteredPositions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
        }
    }

    // --- BIND EVENTS ---
    
    bindSearch(handler) {
        const btn = document.getElementById('btn-search');
        if (btn) {
            btn.addEventListener('click', () => {
                const name = document.getElementById('search-name').value;
                const deptId = document.getElementById('filter-dept').value;
                const posId = document.getElementById('filter-pos').value;
                handler({ name, deptId, posId });
            });
        }
    }

    bindFilterDeptChange(handler) {
        const select = document.getElementById('filter-dept');
        if (select) {
            select.addEventListener('change', (e) => handler(e.target.value));
        }
    }

    bindPagination(handler) {
        // Event delegation cho container
        const container = document.getElementById('pagination-container');
        if (container) {
            // Clone node để xóa event cũ nếu init lại
            const newContainer = container.cloneNode(true);
            container.parentNode.replaceChild(newContainer, container);
            
            newContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('page-btn') && !e.target.disabled) {
                    handler(parseInt(e.target.dataset.page));
                }
            });
        }
    }
    
    bindSort(handler) {
        const headers = document.querySelectorAll('.table-standard th[data-sort]');
        headers.forEach(th => {
            th.addEventListener('click', () => {
                handler(th.dataset.sort);
            });
        });
    }

    bindTableActions(editHandler, deleteHandler) {
        const tbody = document.getElementById('employee-table-body');
        if (!tbody) return;

        // Clone node để reset events
        const newTbody = tbody.cloneNode(true);
        tbody.parentNode.replaceChild(newTbody, tbody);

        newTbody.addEventListener('click', (e) => {
            // Tìm nút button gần nhất (xử lý trường hợp click vào icon bên trong)
            const target = e.target.closest('button');
            if (!target) return;

            if (target.classList.contains('btn-edit')) {
                editHandler(target.dataset.id);
            } else if (target.classList.contains('btn-delete')) {
                deleteHandler(target.dataset.id);
            } else if (target.classList.contains('toggle-salary-btn')) {
                const wrapper = target.parentElement;
                const textSpan = wrapper.querySelector('.salary-text');
                const icon = target.querySelector('i');
                
                if (textSpan.classList.contains('salary-hidden')) {
                    textSpan.textContent = textSpan.dataset.real;
                    textSpan.classList.remove('salary-hidden');
                    textSpan.classList.add('salary-visible');
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    textSpan.textContent = '******';
                    textSpan.classList.add('salary-hidden');
                    textSpan.classList.remove('salary-visible');
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            }
        });
    }

    bindModalSave(handler) {
        // Gán sự kiện cho document để bắt click ở modal động
        // Lưu ý: Chỉ nên gán 1 lần hoặc kiểm tra flag, nhưng đơn giản nhất là check ID
        const saveListener = (e) => {
            if (e.target && e.target.id === 'btn-save-employee') {
                const form = document.getElementById('employee-form');
                if (form.checkValidity()) {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    handler(data);
                } else {
                    form.reportValidity();
                }
            }
        };
        // Xóa listener cũ trước khi thêm (tránh double submit)
        document.removeEventListener('click', this._saveHandlerReference);
        this._saveHandlerReference = saveListener; // Lưu ref
        document.addEventListener('click', this._saveHandlerReference);

        // Dept Change trong Modal
        const deptChangeListener = (e) => {
            if (e.target && e.target.id === 'modal-dept-select') {
                const event = new CustomEvent('modal-dept-changed', { detail: e.target.value });
                document.dispatchEvent(event);
            }
        };
        document.removeEventListener('change', this._deptHandlerReference);
        this._deptHandlerReference = deptChangeListener;
        document.addEventListener('change', this._deptHandlerReference);
    }
}

export default new EmployeeView();