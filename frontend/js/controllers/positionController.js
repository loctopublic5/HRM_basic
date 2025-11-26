import Service from '../services/positionService.js';
import View from '../views/positionView.js';
import UI from '../utils/uiHelper.js';

class PositionController {
    constructor() {
        this.positions = []; 
        this.departments = [];
    }

    async init(container) {
        try {
            UI.showLoading();
            
            // 1. Tải dữ liệu
            const [posList, deptList] = await Promise.all([
                Service.getPositions(),
                Service.getDepartments()
            ]);

            this.positions = posList;
            this.departments = deptList;

            // 2. Render
            View.renderLayout(container, this.departments);
            View.renderTable(this.positions);
            
            // 3. Bind Events
            this.bindEvents();
            
            UI.hideLoading();
        } catch (error) {
            UI.hideLoading();
            UI.toast('Lỗi khởi tạo: ' + error.message, 'error');
        }
    }

    async loadData() {
        try {
            this.positions = await Service.getPositions();
            View.renderTable(this.positions);
            // Không cần gọi lại bindEvents() ở đây vì DOM layout chính không đổi
        } catch (e) {
            UI.toast('Không tải được danh sách vị trí', 'error');
        }
    }

    bindEvents() {
        // 1. Gắn các sự kiện View cơ bản
        View.bindEvents({
            onAdd: () => View.showModal(null, this.departments),
            
            onEdit: async (id) => {
                try {
                    UI.showLoading();
                    const pos = await Service.getPositionById(id);
                    UI.hideLoading();
                    View.showModal(pos, this.departments);
                } catch (e) {
                    UI.hideLoading();
                    UI.toast('Lỗi tải thông tin', 'error');
                }
            },
            
            onDelete: async (id) => {
                const confirm = await UI.confirm("Bạn có chắc chắn muốn xóa vị trí này không?<br><span class='text-danger'>Lưu ý: Ảnh hưởng đến nhân viên đang giữ chức vụ.</span>");
                if (confirm) {
                    try {
                        UI.showLoading();
                        await Service.deletePosition(id);
                        await this.loadData();
                        UI.toast('Xóa thành công', 'success');
                    } catch (e) {
                        UI.hideLoading();
                        UI.toast(e.message, 'error');
                    }
                }
            },

            // (Lưu ý: onSave cũ trong View.bindEvents không còn tác dụng vì ta dùng bindModalSave riêng)
            onSave: () => {}, 

            onSearch: (keyword) => {
                if (!keyword) {
                    View.renderTable(this.positions);
                    return;
                }
                const lowerKey = keyword.toLowerCase();
                const filtered = this.positions.filter(p => p.title.toLowerCase().includes(lowerKey));
                View.renderTable(filtered);
            },

            onFilter: ({ keyword, deptId }) => {
                const lowerKey = keyword.toLowerCase();
                const filtered = this.positions.filter(p => {
                    const matchName = p.title.toLowerCase().includes(lowerKey);
                    const matchDept = deptId ? (p.department_id == deptId) : true;
                    return matchName && matchDept;
                });
                View.renderTable(filtered);
            },

            onReset: () => {
                View.renderTable(this.positions);
                UI.toast('Đã làm mới', 'info');
            },

            onViewEmployees: async (posId, posTitle) => {
                try {
                    UI.showLoading();
                    const employees = await Service.getEmployeesByPosition(posId);
                    UI.hideLoading();
                    View.showEmployeeListModal(posTitle, employees);
                } catch (e) {
                    UI.hideLoading();
                    UI.toast('Lỗi tải danh sách: ' + e.message, 'error');
                }
            }
        });
    document.addEventListener('submit', async (e) => {
            // Kiểm tra đúng form Position
            if (e.target && e.target.id === 'position-form') {
                
                // --- QUAN TRỌNG NHẤT: CHẶN RELOAD ---
                e.preventDefault(); 
                // ------------------------------------

                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                // Gọi hàm xử lý logic lưu
                await this.handleSave(data);
            }
        });
    }

    // Tách logic lưu ra hàm riêng cho gọn
    async handleSave(formData) {
        // 1. Validate
        const payload = {
            title: formData.title,
            description: formData.description,
            salary_base: parseFloat(formData.salaryBase),
            departmentId: formData.departmentId
        };

        if (!payload.title.trim()) return UI.toast('Thiếu tên chức vụ', 'warning');
        if (!payload.departmentId) return UI.toast('Thiếu phòng ban', 'warning');
        if (isNaN(payload.salary_base) || payload.salary_base < 0) return UI.toast('Lương không hợp lệ', 'warning');

        // 2. Call API
        try {
            UI.showLoading();
            if (formData.id) {
                await Service.updatePosition(formData.id, payload);
                UI.toast('Cập nhật thành công', 'success');
            } else {
                await Service.createPosition(payload);
                UI.toast('Thêm mới thành công', 'success');
            }
            
            UI.closeModal();
            await this.loadData();
        } catch (e) {
            UI.hideLoading();
            UI.toast(e.message, 'error');
        }
    }
}

export default new PositionController();