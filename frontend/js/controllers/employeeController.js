import Service from '../services/employeeService.js';
import View from '../views/employeeView.js';
import UI from '../utils/uiHelper.js';

class EmployeeController {
    constructor() {
        this.state = {
            currentPage: 1,
            limit: 10,
            sortBy: 'name',
            sortOrder: 'ASC',
            filters: { name: '', deptId: '', posId: '' },
            departments: [],
            positions: [],
            shifts: []
        };
    }

    async init(container) {
        // Log bắt đầu
        console.log('🚀 [EmployeeController] Init Start');
        
        try {
            // 1. Tải dữ liệu danh mục trước
            console.time('LoadMetadata'); // Đo thời gian tải
            const [depts, pos, shifts] = await Promise.all([
                Service.getDepartments(),
                Service.getPositions(),
                Service.getShifts()
            ]);
            console.timeEnd('LoadMetadata');

            // --- DEBUG LOG QUAN TRỌNG ---
            console.log('📊 [Debug Data] Departments:', depts);
            console.log('📊 [Debug Data] Positions:', pos);
            console.log('📊 [Debug Data] Shifts:', shifts);

            // Kiểm tra kiểu dữ liệu để tránh crash
            if (!Array.isArray(depts) || !Array.isArray(pos)) {
                throw new Error('Dữ liệu phòng ban hoặc vị trí không đúng định dạng mảng.');
            }

            this.state.departments = depts;
            this.state.positions = pos;
            this.state.shifts = shifts;

            // 2. Render khung sườn
            View.renderLayout(container, depts, pos);

            // 3. Tải dữ liệu bảng
            await this.loadTableData();

            // 4. Gắn sự kiện
            this.bindEvents();

        } catch (error) {
            console.error('❌ [EmployeeController] Init Error:', error);
            UI.toast('Lỗi tải module nhân viên: ' + error.message, 'error');
            
            // Render màn hình lỗi vào container để user biết
            container.innerHTML = `
                <div class="content-card" style="align-items: center; justify-content: center; color: var(--danger);">
                    <h3><i class="fa-solid fa-triangle-exclamation"></i> Không thể tải dữ liệu</h3>
                    <p>Vui lòng mở Console (F12) để xem chi tiết lỗi.</p>
                </div>`;
        }
    }

    async loadTableData() {
        try {
            console.log('🔄 [EmployeeController] Loading Table Data...');
            
            const params = {
                page: this.state.currentPage,
                limit: this.state.limit,
                sortBy: this.state.sortBy,
                sortOrder: this.state.sortOrder,
                ...this.state.filters
            };

            const response = await Service.getEmployees(params);
            
            // --- DEBUG LOG RESPONSE ---
            console.log('📊 [Debug Data] Employees Response:', response);

            // Backend trả về: { data: [...], pagination: {...} }
            // Service đã chuẩn hóa, nên ta an tâm dùng
            View.renderTable(response.data);
            View.renderPagination(response.pagination);

        } catch (error) {
            console.error('❌ [EmployeeController] Load Table Error:', error);
            UI.toast('Không tải được danh sách nhân viên', 'error');
        }
    }

    bindEvents() {
        View.bindSearch((filters) => {
            this.state.filters = filters;
            this.state.currentPage = 1; 
            this.loadTableData();
        });

        View.bindFilterDeptChange((deptId) => {
            const filteredPos = deptId 
                ? this.state.positions.filter(p => p.department_id === deptId)
                : this.state.positions;
            View.updateFilterPositions(filteredPos);
        });

        View.bindPagination((page) => {
            this.state.currentPage = page;
            this.loadTableData();
        });

        View.bindSort((field) => {
            if (this.state.sortBy === field) {
                this.state.sortOrder = this.state.sortOrder === 'ASC' ? 'DESC' : 'ASC';
            } else {
                this.state.sortBy = field;
                this.state.sortOrder = 'ASC';
            }
            this.loadTableData();
        });

        document.getElementById('btn-add-new').addEventListener('click', () => {
            View.showModal(null, this.state.departments, this.state.positions, this.state.shifts);
        });

        View.bindTableActions(
            async (id) => {
                try {
                    const emp = await Service.getEmployeeById(id);
                    View.showModal(emp, this.state.departments, this.state.positions, this.state.shifts);
                } catch (e) { UI.toast(e.message, 'error'); }
            },
            async (id) => {
                if (await UI.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
                    try {
                        await Service.deleteEmployee(id);
                        UI.toast('Xóa thành công', 'success');
                        this.loadTableData();
                    } catch (e) { UI.toast(e.message, 'error'); }
                }
            },
            () => {} 
        );

        View.bindModalSave(async (data) => {
            try {
                if (data.id) {
                    await Service.updateEmployee(data.id, data);
                    UI.toast('Cập nhật thành công', 'success');
                } else {
                    await Service.createEmployee(data);
                    UI.toast('Thêm mới thành công', 'success');
                }
                UI.closeModal();
                this.loadTableData();
            } catch (e) {
                UI.toast(e.message, 'error');
            }
        });

        document.addEventListener('modal-dept-changed', (e) => {
            const deptId = e.detail;
            const filteredPos = this.state.positions.filter(p => p.department_id === deptId);
            View.updateModalPositions(filteredPos);
        });
    }
}

export default new EmployeeController();