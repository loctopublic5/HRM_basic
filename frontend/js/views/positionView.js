import UI from '../utils/uiHelper.js';

class PositionView {
    
renderLayout(container, departments = []) {
        // Map danh sách phòng ban vào thẻ option
        const deptOptions = departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

        container.innerHTML = `
            <div class="content-card">
                <div class="action-bar" style="gap: 10px; flex-wrap: nowrap;">
                    
                    <div class="filter-group" style="flex: 1; display: flex; gap: 8px; align-items: center;">
                        <div style="flex: 2; min-width: 150px;">
                            <input type="text" id="search-pos" class="filter-input" placeholder="Tìm tên chức vụ..." style="width: 100%; margin: 0;">
                        </div>

                        <div style="flex: 1; min-width: 150px;">
                            <select id="filter-dept" class="filter-select" style="width: 100%; margin: 0;">
                                <option value="">-- Tất cả Phòng ban --</option>
                                ${deptOptions}
                            </select>
                        </div>

                        <button id="btn-search" class="btn btn-primary" title="Tìm kiếm" style="padding: 0.5rem 0.8rem;">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>

                        <button id="btn-reset" class="btn btn-outline" title="Làm mới danh sách" style="padding: 0.5rem 0.8rem;">
                            <i class="fa-solid fa-arrows-rotate"></i>
                        </button>
                    </div>

                    <div style="flex-shrink: 0;">
                        <button id="btn-add-pos" class="btn btn-success btn-sm" style="white-space: nowrap;">
                            <i class="fa-solid fa-plus"></i> <span class="hide-on-mobile">Thêm vị trí</span>
                        </button>
                    </div>
                </div>

                <div class="table-wrapper">
                    <table class="table-standard">
                        <thead>
                            <tr>
                                <th style="width: 80px;">ID</th>
                                <th>Tên chức vụ</th>
                                <th>Thuộc Phòng ban</th> <th>Mô tả</th>
                                <th>Lương cơ bản</th>
                                <th class="text-center" style="width: 160px;">Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="position-table-body"></tbody>
                    </table>
                </div>
                
                <div class="pagination-bar" style="justify-content: flex-end; color: var(--text-muted); font-size: 0.9rem;">
                    <span id="pos-count">0 vị trí</span>
                </div>
            </div>
            <style>@media(max-width: 768px) { .hide-on-mobile { display: none; } }</style>
        `;
    }

renderTable(positions) {
        const tbody = document.getElementById('position-table-body');
        const countSpan = document.getElementById('pos-count');
        
        if (!tbody) return;

        if (!positions || positions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted">Không tìm thấy dữ liệu</td></tr>`;
            if (countSpan) countSpan.innerText = '0 vị trí';
            return;
        }

        if (countSpan) countSpan.innerText = `${positions.length} vị trí`;

        tbody.innerHTML = positions.map(pos => {
            const salaryFormatted = UI.formatMoney(pos.salary_base || 0);
            let description = pos.description || '';
            if (description.length > 40) description = description.substring(0, 40) + '...';
            else if (!description) description = '<span class="text-muted">--</span>';

            // Lấy tên phòng ban từ API (đã join sẵn) hoặc hiển thị N/A
            const deptName = pos.department_name ? 
                `<span class="badge badge-info" style="font-weight: normal;">${pos.department_name}</span>` : 
                '<span class="text-muted" style="font-size: 0.9em;">Chưa phân bổ</span>';

            return `
                <tr>
                    <td><span class="text-muted" style="font-family: monospace; font-size: 0.9em;">${pos.id}</span></td>
                    <td style="font-weight: 600; color: var(--primary);">${pos.title}</td>
                    <td>${deptName}</td> <td style="font-size: 0.9em; color: #666;">${description}</td>
                    <td>
                        <div class="salary-wrapper">
                            <span class="salary-text salary-hidden" data-real="${salaryFormatted}">******</span>
                            <button class="toggle-salary-btn" title="Xem/Ẩn lương"><i class="fa-regular fa-eye"></i></button>
                        </div>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-outline btn-sm btn-view-emp" data-id="${pos.id}" data-title="${pos.title}" title="Xem nhân viên">
                            <i class="fa-solid fa-users-viewfinder" style="color: var(--info);"></i>
                        </button>
                        <button class="btn btn-outline btn-sm btn-edit" data-id="${pos.id}" title="Sửa">
                            <i class="fa-solid fa-pen" style="color: var(--warning);"></i>
                        </button>
                        <button class="btn btn-outline btn-sm btn-delete" data-id="${pos.id}" title="Xóa">
                            <i class="fa-solid fa-trash" style="color: var(--danger);"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 3. Modal Thêm / Sửa (Giữ nguyên)
    showModal(data = null) {
        const isEdit = !!data;
        const title = isEdit ? 'Cập nhật Vị trí' : 'Thêm Vị trí mới';
        const btnText = isEdit ? 'Lưu thay đổi' : 'Tạo mới';
        const valTitle = data?.title || '';
        const valSalary = data?.salary_base ? parseInt(data.salary_base) : ''; 
        const valDesc = data?.description || '';

        const html = `
            <form id="position-form">
                <input type="hidden" name="id" value="${data?.id || ''}">
                <div class="form-group">
                    <label class="form-label">Tên chức vụ <span class="text-danger">*</span></label>
                    <input type="text" name="title" class="form-control" value="${valTitle}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Lương cơ bản (VND) <span class="text-danger">*</span></label>
                    <input type="number" name="salaryBase" class="form-control" value="${valSalary}" required min="0" step="100000">
                </div>
                <div class="form-group">
                    <label class="form-label">Mô tả công việc</label>
                    <textarea name="description" class="form-control" rows="3">${valDesc}</textarea>
                </div>
            </form>
        `;
        const footer = `
            <button class="btn btn-outline" onclick="UI.closeModal()">Hủy</button>
            <button class="btn btn-primary" id="btn-save-pos">${btnText}</button>
        `;
        UI.showModal(title, html, footer);
    }

    // 4. MỚI: Modal Xem Nhân viên (Có Che Lương)
    showEmployeeListModal(posTitle, employees) {
        const title = `Nhân viên chức vụ: ${posTitle}`;
        let contentHtml = '';
        
        if (!employees || employees.length === 0) {
            contentHtml = `
                <div class="text-center p-4 text-muted">
                    <i class="fa-solid fa-user-slash" style="font-size: 2rem; margin-bottom: 10px; color: #ccc;"></i>
                    <p>Chưa có nhân viên nào giữ chức vụ này.</p>
                </div>
            `;
        } else {
            const rows = employees.map((emp, index) => {
                const salaryVal = emp.total_salary || emp.salary_base || 0;
                const salaryFormatted = UI.formatMoney(salaryVal);
                return `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${emp.name}</strong></td>
                    <td>${emp.department_name || 'N/A'}</td>
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
                    <table class="table-standard" id="pos-emp-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th>Họ tên</th>
                                <th>Phòng ban</th>
                                <th>Lương thực nhận</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        }

        const footer = `<button class="btn btn-primary" id="btn-close-detail">Đóng</button>`;
        UI.showModal(title, contentHtml, footer);

        // Gắn sự kiện Đóng
        const btnClose = document.getElementById('btn-close-detail');
        if (btnClose) {
            btnClose.addEventListener('click', () => UI.closeModal());
        }

        // Gắn sự kiện Toggle Lương cho bảng trong Modal
        const table = document.getElementById('pos-emp-table');
        if (table) {
            table.addEventListener('click', (e) => {
                const btn = e.target.closest('.toggle-salary-btn');
                if (!btn) return;
                const wrapper = btn.parentElement;
                const textSpan = wrapper.querySelector('.salary-text');
                const icon = btn.querySelector('i');

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
            });
        }
    }

    // 5. Bind Events
    bindEvents(handlers) {
        const btnAdd = document.getElementById('btn-add-pos');
        if (btnAdd) btnAdd.addEventListener('click', handlers.onAdd);

        // Search & Filter
        const inputSearch = document.getElementById('search-pos');
        const selectDept = document.getElementById('filter-dept');
        const btnSearch = document.getElementById('btn-search');
        const btnReset = document.getElementById('btn-reset');

        const triggerFilter = () => {
            const keyword = inputSearch ? inputSearch.value.trim() : '';
            const deptId = selectDept ? selectDept.value : '';
            handlers.onFilter({ keyword, deptId });
        };

        if (btnSearch) btnSearch.addEventListener('click', triggerFilter);
        if (inputSearch) inputSearch.addEventListener('keypress', (e) => { if (e.key === 'Enter') triggerFilter(); });
        if (selectDept) selectDept.addEventListener('change', triggerFilter); // Lọc ngay khi chọn Dept
        
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (inputSearch) inputSearch.value = '';
                if (selectDept) selectDept.value = '';
                handlers.onReset();
            });
        }

        // Actions Table
        const tbody = document.getElementById('position-table-body');
        if (tbody) {
            const newTbody = tbody.cloneNode(true);
            tbody.parentNode.replaceChild(newTbody, tbody);

            newTbody.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const id = btn.dataset.id;
                if (btn.classList.contains('btn-edit')) handlers.onEdit(id);
                else if (btn.classList.contains('btn-delete')) handlers.onDelete(id);
                else if (btn.classList.contains('btn-view-emp')) handlers.onViewEmployees(id, btn.dataset.title);
                else if (btn.classList.contains('toggle-salary-btn')) {
                    // Toggle Lương bảng chính
                    const wrapper = btn.parentElement;
                    const textSpan = wrapper.querySelector('.salary-text');
                    const icon = btn.querySelector('i');
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

        // Save Modal
        const saveHandler = (e) => {
            if (e.target && e.target.id === 'btn-save-pos') {
                const form = document.getElementById('position-form');
                if (form && form.checkValidity()) {
                    const formData = new FormData(form);
                    handlers.onSave(Object.fromEntries(formData.entries()));
                } else if (form) form.reportValidity();
            }
        };
        if (window._posSaveListener) document.removeEventListener('click', window._posSaveListener);
        window._posSaveListener = saveHandler;
        document.addEventListener('click', window._posSaveListener);
    }
}

export default new PositionView();