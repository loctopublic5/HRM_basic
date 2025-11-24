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

        View.bindReset(() => {
            // Reset State về mặc định
            this.state.filters = { name: '', deptId: '', posId: '' };
            this.state.currentPage = 1;
            this.state.sortBy = 'name';
            this.state.sortOrder = 'ASC';

            // Reset Dropdown Vị trí về danh sách đầy đủ (nếu trước đó bị lọc theo phòng ban)
            View.updateFilterPositions(this.state.positions);

            // Tải lại dữ liệu
            this.loadTableData();
            UI.toast('Đã làm mới danh sách', 'info');
        });

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

// Xử lý Action Bảng (Sửa / Xóa)
        View.bindTableActions(
            // 1. Handle Edit Click
            (id) => this.handleEditClick(id), 
            
            // 2. Handle Delete Click
            async (id) => {
                if (await UI.confirm('Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.')) {
                    try {
                        await Service.deleteEmployee(id);
                        UI.toast('Xóa thành công', 'success');
                        this.loadTableData();
                    } catch (e) { UI.toast(e.message, 'error'); }
                }
            },
            // Salary toggle
            () => {} 
        );

        // Xử lý Save Form
        View.bindModalSave((data) => this.handleFormSubmit(data));

        // Xử lý Logic Dropdown & Warning trong Modal
        this.bindModalLogic();
    }

    /**
     * LOGIC 1: Tải dữ liệu và Hiển thị Modal Sửa
     */
    async handleEditClick(id) {
        try {
            UI.showLoading(); 

            // Bước 1: Gọi API lấy chi tiết nhân viên mới nhất
            // (Dùng Promise.all nếu muốn tối ưu, nhưng ở đây tách ra để dễ debug logic)
            const emp = await Service.getEmployeeById(id);

            // Bước 2: Kiểm tra xem danh mục đã có trong State chưa? (Phòng trường hợp reload trang)
            if (!this.state.departments.length || !this.state.positions.length) {
                console.log('⚠️ State rỗng, đang tải lại danh mục...');
                const [depts, pos, shifts] = await Promise.all([
                    Service.getDepartments(),
                    Service.getPositions(),
                    Service.getShifts()
                ]);
                this.state.departments = depts;
                this.state.positions = pos;
                this.state.shifts = shifts;
            }

            UI.hideLoading();

            // Bước 3: Gọi View để hiển thị Modal
            // Truyền đầy đủ dữ liệu cần thiết để View tự xử lý logic hiển thị
            View.showModal(emp, this.state.departments, this.state.positions, this.state.shifts);

        } catch (e) { 
            UI.hideLoading();
            UI.toast('Lỗi tải thông tin nhân viên: ' + e.message, 'error'); 
        }
    }

    /**
     * LOGIC 2: Xử lý Submit Form (Có Confirm)
     */
    async handleFormSubmit(data) {
        try {
            // Validate cơ bản (View đã check required, ở đây check logic nghiệp vụ nếu cần)
            
            // Nếu là EDIT -> Cần xác nhận
            if (data.id) {
                const confirmed = await UI.confirm(
                    `Bạn đang cập nhật thông tin cho <b>${data.name}</b>.<br>Hệ thống sẽ lưu lại các thay đổi này.`,
                    'Xác nhận cập nhật'
                );
                
                if (!confirmed) return; // Người dùng bấm Hủy

                UI.showLoading();
                await Service.updateEmployee(data.id, data);
                UI.hideLoading();
                UI.toast('Cập nhật hồ sơ thành công', 'success');

            } else {
                // Nếu là CREATE -> Không cần confirm gắt gao
                UI.showLoading();
                await Service.createEmployee(data);
                UI.hideLoading();
                UI.toast('Thêm mới nhân viên thành công', 'success');
            }
            
            UI.closeModal();
            this.loadTableData(); // Refresh bảng

        } catch (e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        }
    }

    /**
     * LOGIC 3: Logic phụ thuộc Dropdown & Cảnh báo Lương
     */
    bindModalLogic() {
        // Sự kiện custom từ View bắn ra khi dropdown Dept thay đổi
        document.addEventListener('modal-dept-changed', (e) => {
            const newDeptId = e.detail;
            
            // 1. Lọc lại danh sách Vị trí tương ứng
            const filteredPos = this.state.positions.filter(p => p.department_id === newDeptId);
            View.updateModalPositions(filteredPos);

            // 2. Kiểm tra Warning
            this.checkSalaryWarning();
        });

        // Sự kiện change của dropdown Position (cần gắn trực tiếp hoặc delegate)
        // Do View.js dùng document dispatch event cho Dept, ta nên thêm listener cho Position ở View
        // Tuy nhiên, để đơn giản, ta có thể check warning mỗi khi có tương tác trong modal
        document.addEventListener('change', (e) => {
            if (e.target.id === 'modal-pos-select') {
                this.checkSalaryWarning();
            }
        });
    }

    /**
     * Helper: Kiểm tra xem có cần hiện cảnh báo lương không
     */
    checkSalaryWarning() {
        const originalDept = document.getElementById('original-dept-id')?.value;
        const originalPos = document.getElementById('original-pos-id')?.value;
        
        const currentDept = document.getElementById('modal-dept-select')?.value;
        const currentPos = document.getElementById('modal-pos-select')?.value;

        // Chỉ check khi đang ở chế độ Edit (tức là có original value)
        if (originalDept || originalPos) {
            // Nếu Dept khác OR Pos khác -> Hiện cảnh báo
            // (Dùng != để so sánh lỏng vì value có thể là string/number)
            const isChanged = (currentDept != originalDept) || (currentPos != originalPos);
            View.toggleSalaryWarning(isChanged);
        }
    



        document.addEventListener('modal-dept-changed', (e) => {
            const deptId = e.detail;
            const filteredPos = this.state.positions.filter(p => p.department_id === deptId);
            View.updateModalPositions(filteredPos);
        });
    }
}

export default new EmployeeController();