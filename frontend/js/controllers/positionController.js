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
            
            // 1. Tải song song Vị trí và Phòng ban
            const [posList, deptList] = await Promise.all([
                Service.getPositions(),
                Service.getDepartments()
            ]);

            this.positions = posList;
            this.departments = deptList;

            // 2. Render Layout (Truyền danh sách phòng ban vào để tạo Dropdown)
            View.renderLayout(container, this.departments);
            
            // 3. Render Bảng
            View.renderTable(this.positions);
            
            // 4. Gắn sự kiện
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
            this.bindEvents();
        } catch (e) {
            UI.toast('Không tải được danh sách vị trí', 'error');
        }
    }

    bindEvents() {
        View.bindEvents({
            onAdd: () => View.showModal(null),
            onEdit: async (id) => {
                try {
                    UI.showLoading();
                    const pos = await Service.getPositionById(id);
                    UI.hideLoading();
                    View.showModal(pos);
                } catch (e) {
                    UI.hideLoading();
                    UI.toast('Lỗi tải thông tin vị trí', 'error');
                }
            },
            onDelete: async (id) => {
                const confirm = await UI.confirm(
                    "Bạn có chắc chắn muốn xóa vị trí này không?<br>" +
                    "<span class='text-danger'>Lưu ý: Việc này sẽ ảnh hưởng đến các nhân viên đang giữ chức vụ này.</span>"
                );
                if (confirm) {
                    try {
                        UI.showLoading();
                        await Service.deletePosition(id);
                        await this.loadData();
                        UI.toast('Xóa vị trí thành công', 'success');
                    } catch (e) {
                        UI.hideLoading();
                        UI.toast(e.message, 'error');
                    }
                }
            },
            onSave: async (formData) => {
                const payload = {
                    title: formData.title,
                    description: formData.description,
                    salary_base: parseFloat(formData.salaryBase)
                };
                if (!payload.title.trim()) {
                    UI.toast('Tên chức vụ không được để trống', 'warning');
                    return;
                }
                if (isNaN(payload.salary_base) || payload.salary_base <= 0) {
                    UI.toast('Lương cơ bản phải lớn hơn 0', 'warning');
                    return;
                }

                try {
                    UI.showLoading();
                    if (formData.id) {
                        await Service.updatePosition(formData.id, payload);
                        UI.toast('Cập nhật thành công', 'success');
                    } else {
                        await Service.createPosition(payload);
                        UI.toast('Thêm vị trí mới thành công', 'success');
                    }
                    UI.closeModal();
                    await this.loadData();
                } catch (e) {
                    UI.hideLoading();
                    UI.toast(e.message, 'error');
                }
            },
            onSearch: (keyword) => {
                if (!keyword) {
                    View.renderTable(this.positions);
                    return;
                }
                const lowerKey = keyword.toLowerCase();
                const filtered = this.positions.filter(p => p.title.toLowerCase().includes(lowerKey));
                View.renderTable(filtered);
            },
            // MỚI: Xử lý xem danh sách nhân viên
            onViewEmployees: async (posId, posTitle) => {
                try {
                    UI.showLoading();
                    const employees = await Service.getEmployeesByPosition(posId);
                    UI.hideLoading();
                    View.showEmployeeListModal(posTitle, employees);
                } catch (e) {
                    UI.hideLoading();
                    UI.toast('Lỗi tải danh sách nhân viên: ' + e.message, 'error');
                }
            },
            onFilter: ({ keyword, deptId }) => {
                const lowerKey = keyword.toLowerCase();
                
                // Lọc client-side trên danh sách gốc this.positions
                const filtered = this.positions.filter(p => {
                    // Điều kiện 1: Tên khớp từ khóa
                    const matchName = p.title.toLowerCase().includes(lowerKey);
                    // Điều kiện 2: ID Phòng ban khớp (nếu có chọn)
                    // Lưu ý: p.department_id lấy từ API
                    const matchDept = deptId ? (p.department_id === deptId) : true;
                    
                    return matchName && matchDept;
                });

                View.renderTable(filtered);
            },
            onReset: () => {
                // Hiển thị lại toàn bộ danh sách gốc
                View.renderTable(this.positions);
                UI.toast('Đã làm mới danh sách', 'info');
            }
        });
    }
}

export default new PositionController();