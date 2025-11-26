import Service from '../services/employeeService.js';
import View from '../views/employeeView.js';
import UI from '../utils/uiHelper.js';

class EmployeeController {
    constructor() {
        // STATE MANAGEMENT
        this.currentEditingId = null; // Lưu ID nhân viên đang sửa (null = chế độ thêm mới)
        
        this.state = {
            currentPage: 1,
            limit: 10,
            sortBy: 'name',
            sortOrder: 'ASC',
            filters: { name: '', deptId: '', posId: '' },
            
            // Cache Metadata
            departments: [],
            positions: [],
            shifts: []
        };
    }

    // 1. KHỞI TẠO
    async init(container) {
        try {
            const [depts, pos, shifts] = await Promise.all([
                Service.getDepartments(),
                Service.getPositions(),
                Service.getShifts()
            ]);

            this.state.departments = depts;
            this.state.positions = pos;
            this.state.shifts = shifts;

            View.renderLayout(container, depts, pos);
            await this.loadTableData();
            this.bindEvents();

        } catch (error) {
            UI.toast('Lỗi khởi tạo: ' + error.message, 'error');
        }
    }

    // 2. TẢI DATA
    async loadTableData() {
        try {
            const params = {
                page: this.state.currentPage,
                limit: this.state.limit,
                sortBy: this.state.sortBy,
                sortOrder: this.state.sortOrder,
                ...this.state.filters
            };
            const response = await Service.getEmployees(params);
            View.renderTable(response.data);
            View.renderPagination(response.pagination);
        } catch (error) {
            UI.toast('Không tải được dữ liệu', 'error');
        }
    }

    // 3. EVENT BINDING
    bindEvents() {
        // --- A. SEARCH & FILTER ---
        View.bindSearch((filters) => {
            // filters là object { name, deptId, posId } lấy từ View
            this.state.filters = filters;
            this.state.currentPage = 1; // Reset về trang 1 khi tìm kiếm
            this.loadTableData();
        });

        // Xử lý khi chọn Phòng ban trên thanh Search -> Lọc lại dropdown Vị trí trên thanh Search
        View.bindFilterDeptChange((deptId) => {
            const filteredPos = deptId 
                ? this.state.positions.filter(p => p.department_id === deptId)
                : this.state.positions;
            View.updateFilterPositions(filteredPos);
        });

        View.bindReset(() => {
            this.state.filters = { name: '', deptId: '', posId: '' };
            this.state.currentPage = 1;
            View.updateFilterPositions(this.state.positions); // Reset dropdown vị trí
            this.loadTableData();
        });

        // --- B. PAGINATION & SORT ---
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

        // --- C. CRUD ACTIONS ---
        
        // Nút Thêm Mới
        const btnAdd = document.getElementById('btn-add-new');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                this.handleAddClick();
            });
        }

        document.addEventListener('click', (e) => {
            // Kiểm tra nếu click vào nút Hủy (có class btn-outline trong modal hoặc id cụ thể)
            // Giả định nút Hủy trong View có id="btn-cancel-employee" hoặc class tương tự
            if (e.target.matches('#btn-cancel-employee') || e.target.closest('.btn-cancel')) {
                e.preventDefault();
                UI.closeModal();
            }
        });

        // 2. Xử lý SUBMIT Form (Chặn Reload khi nhấn Enter)
        document.addEventListener('submit', (e) => {
            if (e.target && e.target.id === 'employee-form') {
                // --- QUAN TRỌNG: CHẶN RELOAD ---
                e.preventDefault();
                // -------------------------------

                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                // Gọi hàm xử lý logic (đã có từ trước)
                this.handleFormSubmit(data);
            }
        });

        // Logic Dropdown phụ thuộc
        this.bindModalLogic();
    }

    // --- D. HANDLERS ---

/**
     * Logic khi bấm nút Thêm Mới
     */
    handleAddClick() {
        this.currentEditingId = null; // Reset state: Chế độ Create
        View.showModal(null, this.state.departments, this.state.positions, this.state.shifts);
    }

    /**
     * Logic khi bấm nút Sửa (Cây bút)
     */
    async handleEditClick(id) {
        try {
            UI.showLoading();
            
            // 1. Lưu State: Đang ở chế độ Edit ID này
            this.currentEditingId = id; 

            // 2. Lấy dữ liệu mới nhất từ Server
            const emp = await Service.getEmployeeById(id);
            
            // 3. Kiểm tra và reload metadata nếu bị mất (F5 trang)
            if (!this.state.departments.length) {
                await this.init(document.getElementById('main-content'));
                return;
            }

            UI.hideLoading();

            // 4. Hiển thị Modal và Pre-fill
            View.showModal(emp, this.state.departments, this.state.positions, this.state.shifts);

        } catch (e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        }
    }

    async handleDeleteClick(id) {
        if (await UI.confirm('Xóa nhân viên này?')) {
            try {
                await Service.deleteEmployee(id);
                UI.toast('Xóa thành công', 'success');
                this.loadTableData();
            } catch (e) { UI.toast(e.message, 'error'); }
        }
    } 

    async handleFormSubmit(formData) {    
        try {
            // KIỂM TRA STATE ĐỂ QUYẾT ĐỊNH CREATE HAY UPDATE
            if (this.currentEditingId) {
                // === NHÁNH UPDATE ===
                
                // 1. Confirm Dialog
                const confirmed = await UI.confirm(
                    `Bạn đang cập nhật thông tin nhân viên.<br>Lưu ý: Lương có thể thay đổi theo vị trí mới.<br>Tiếp tục?`,
                    'Xác nhận cập nhật'
                );
                
                if (!confirmed) return; // User bấm Hủy

                // 2. Gọi API Update
                UI.showLoading();
                await Service.updateEmployee(this.currentEditingId, formData);
                UI.hideLoading();
                
                UI.toast('Cập nhật thành công', 'success');

            } else {
                // === NHÁNH CREATE ===
                
                UI.showLoading();
                await Service.createEmployee(formData);
                UI.hideLoading();
                
                UI.toast('Thêm mới thành công', 'success');
            }
            
            // Dọn dẹp
            UI.closeModal();
            this.loadTableData(); // Reload bảng
            this.currentEditingId = null; // Reset state an toàn

        } catch (e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        }
    }

    bindModalLogic() {
        // Lắng nghe sự kiện đổi Phòng ban trong Modal -> Lọc lại Vị trí
        document.addEventListener('modal-dept-changed', (e) => {
            const newDeptId = e.detail;
            const filteredPos = this.state.positions.filter(p => p.department_id === newDeptId);
            View.updateModalPositions(filteredPos);
            
            // (Optional) Logic check salary warning nếu cần
            this.checkSalaryWarning();
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'modal-pos-select') {
                this.checkSalaryWarning();
            }
        });
    }

    checkSalaryWarning() {
        const originalDept = document.getElementById('original-dept-id')?.value;
        const originalPos = document.getElementById('original-pos-id')?.value;
        
        const currentDept = document.getElementById('modal-dept-select')?.value;
        const currentPos = document.getElementById('modal-pos-select')?.value;

        if (originalDept || originalPos) {
            const isChanged = (currentDept != originalDept) || (currentPos != originalPos);
            View.toggleSalaryWarning(isChanged);
        }
    }
}

export default new EmployeeController();