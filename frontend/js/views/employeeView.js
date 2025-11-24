import UI from '../utils/uiHelper.js';

class EmployeeView {
    
    // 1. RENDER LAYOUT (Action Bar + Table Wrapper)
    renderLayout(container, departments, positions) {
        // Defensive coding
        departments = Array.isArray(departments) ? departments : [];
        positions = Array.isArray(positions) ? positions : [];

        const deptOptions = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        const posOptions = positions.map(p => `<option value="${p.id}">${p.title}</option>`).join('');

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
                        <button id="btn-reset" class="btn btn-outline"><i class="fa-solid fa-arrows-rotate"></i></button>
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
                        <tbody id="employee-table-body"></tbody>
                    </table>
                </div>
                <div class="pagination-bar" id="pagination-container"></div>
            </div>
        `;
    }

    // 2. RENDER TABLE ROWS
    renderTable(employees) {
        const tbody = document.getElementById('employee-table-body');
        if (!tbody) return;
        
        if (!employees || employees.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">Không tìm thấy dữ liệu</td></tr>`;
            return;
        }

        tbody.innerHTML = employees.map(emp => {
            const hireDate = UI.formatDate(emp.hire_date);
            // Sử dụng total_salary (đã tính toán) hoặc fallback về salary_base
            const salaryVal = emp.total_salary || emp.salary_base || 0;
            const salaryFormatted = UI.formatMoney(salaryVal);
            
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

    // 3. PAGINATION
    renderPagination(pagination) {
        const container = document.getElementById('pagination-container');
        if (!container) return;

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

    // 4. SHOW MODAL 
showModal(data = null, departments = [], positions = [], shifts = []) {
        const isEdit = !!data;
        const title = isEdit ? `Cập nhật hồ sơ: ${data.name}` : 'Thêm mới nhân viên';
        const btnText = isEdit ? 'Lưu thay đổi' : 'Thêm mới';

        // --- 1. CHUẨN HÓA DỮ LIỆU (Safe Access) ---
        const empId = data?.id || '';
        const empName = data?.name || '';
        const empHireDate = data?.hire_date || '';
        
        // Lấy ID hiện tại (API trả về snake_case)
        let currentDeptId = data?.department_id;
        const currentPosId = data?.position_id;
        const currentShiftId = data?.shift_id;

        // --- 2. LOGIC QUAN TRỌNG: Xử lý Dropdown Phụ thuộc ---
        // Vấn đề: Nếu Backend không trả về department_id, ta phải tìm nó từ position_id
        if (isEdit && !currentDeptId && currentPosId) {
            const foundPos = positions.find(p => p.id == currentPosId);
            if (foundPos) {
                currentDeptId = foundPos.department_id;
            }
        }
        // Đảm bảo không bị undefined/null để so sánh
        currentDeptId = currentDeptId || '';

        // Lọc danh sách Vị trí NGAY LẬP TỨC dựa trên Phòng ban hiện tại
        // Để khi modal hiện lên, dropdown Vị trí đã có đúng danh sách cần thiết
        const filteredPositions = currentDeptId 
            ? positions.filter(p => p.department_id == currentDeptId)
            : []; // Nếu thêm mới chưa chọn Dept thì list rỗng

        // --- 3. RENDER OPTIONS ---
        // Sử dụng toán tử == để so sánh an toàn (tránh lỗi string vs number)

        const deptOpts = departments.map(d => 
            `<option value="${d.id}" ${isEdit && d.id == currentDeptId ? 'selected' : ''}>${d.name}</option>`
        ).join('');

        const posOpts = filteredPositions.map(p => 
            `<option value="${p.id}" ${isEdit && p.id == currentPosId ? 'selected' : ''}>${p.title}</option>`
        ).join('');

        const shiftOpts = shifts.map(s => 
            `<option value="${s.id}" ${isEdit && s.id == currentShiftId ? 'selected' : ''}>${s.shift_name}</option>`
        ).join('');

        // --- 4. RENDER FORM HTML ---
        const html = `
            <form id="employee-form" data-mode="${isEdit ? 'edit' : 'create'}">
                <input type="hidden" name="id" value="${empId}">
                
                <input type="hidden" id="original-dept-id" value="${currentDeptId}">
                <input type="hidden" id="original-pos-id" value="${currentPosId || ''}">

                <div style="margin-bottom: 15px; text-align: right;">
                    <span class="badge ${isEdit ? 'badge-warning' : 'badge-success'}">
                        ${isEdit ? 'Chế độ: Cập nhật' : 'Chế độ: Thêm mới'}
                    </span>
                </div>

                <div id="salary-warning" class="d-none" style="background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 0.9rem; border: 1px solid #ffeeba; display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-triangle-exclamation"></i> 
                    <div><strong>Lưu ý:</strong> Thay đổi Vị trí/Phòng ban sẽ đặt lại lương cơ bản.</div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Họ và Tên <span class="text-danger">*</span></label>
                        <input type="text" name="name" class="form-control" value="${empName}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ngày vào làm <span class="text-danger">*</span></label>
                        <input type="date" name="hireDate" class="form-control" value="${empHireDate}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Phòng ban <span class="text-danger">*</span></label>
                        <select name="departmentId" id="modal-dept-select" class="form-control" required>
                            <option value="">-- Chọn Phòng ban --</option>
                            ${deptOpts}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Vị trí <span class="text-danger">*</span></label>
                        <select name="positionId" id="modal-pos-select" class="form-control" required>
                            <option value="">-- ${isEdit ? 'Chọn Vị trí' : 'Chọn Phòng ban trước'} --</option>
                            ${posOpts}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Ca làm việc <span class="text-danger">*</span></label>
                        <select name="shiftId" class="form-control" required>
                            <option value="">-- Chọn Ca làm --</option>
                            ${shiftOpts}
                        </select>
                    </div>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-outline" onclick="UI.closeModal()">Hủy bỏ</button>
            <button class="btn btn-primary" id="btn-save-employee">
                <i class="fa-solid fa-floppy-disk"></i> ${btnText}
            </button>
        `;

        UI.showModal(title, html, footer);
        
        // Lưu ý: Các logic lắng nghe sự kiện change (để update dropdown khi user chọn lại)
        // đã được xử lý ở Controller thông qua bindModalLogic()
    }

    // 5. HELPER UI METHODS
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

    toggleSalaryWarning(show) {
        const warningBox = document.getElementById('salary-warning');
        if (warningBox) {
            if (show) warningBox.classList.remove('d-none');
            else warningBox.classList.add('d-none');
        }
    }

    // 6. BIND EVENTS
    bindSearch(handler) {
        document.getElementById('btn-search').addEventListener('click', () => {
            const name = document.getElementById('search-name').value;
            const deptId = document.getElementById('filter-dept').value;
            const posId = document.getElementById('filter-pos').value;
            handler({ name, deptId, posId });
        });
    }

    bindFilterDeptChange(handler) {
        document.getElementById('filter-dept').addEventListener('change', (e) => handler(e.target.value));
    }

    bindReset(handler) {
        document.getElementById('btn-reset').addEventListener('click', () => {
            document.getElementById('search-name').value = '';
            document.getElementById('filter-dept').value = '';
            document.getElementById('filter-pos').value = '';
            handler();
        });
    }

    bindPagination(handler) {
        const container = document.getElementById('pagination-container');
        if (container) {
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
        document.querySelectorAll('.table-standard th[data-sort]').forEach(th => {
            th.addEventListener('click', () => handler(th.dataset.sort));
        });
    }

    bindTableActions(editHandler, deleteHandler, salaryHandler) {
        const tbody = document.getElementById('employee-table-body');
        if (!tbody) return;
        const newTbody = tbody.cloneNode(true);
        tbody.parentNode.replaceChild(newTbody, tbody);

        newTbody.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            if (target.classList.contains('btn-edit')) editHandler(target.dataset.id);
            else if (target.classList.contains('btn-delete')) deleteHandler(target.dataset.id);
            else if (target.classList.contains('toggle-salary-btn')) {
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
        // Save Handler
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
        document.removeEventListener('click', this._saveHandlerReference);
        this._saveHandlerReference = saveListener;
        document.addEventListener('click', this._saveHandlerReference);

        // Dept Change Dispatcher
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