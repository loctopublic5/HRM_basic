import Service from '../services/departmentService.js';
import View from '../views/departmentView.js';
import UI from '../utils/uiHelper.js';

class DepartmentController {
    constructor() {
        this.departments = []; // Cache danh sách để search/xử lý nhanh
    }

    async init(container) {
        try {
            UI.showLoading();
            // Render khung sườn trước
            View.renderLayout(container);
            
            // Tải dữ liệu
            await this.loadData();
            
            UI.hideLoading();
        } catch (error) {
            UI.hideLoading();
            UI.toast('Lỗi khởi tạo module: ' + error.message, 'error');
        }
    }

    async loadData() {
        try {
            this.departments = await Service.getAll();
            View.renderTable(this.departments);
            
            // Gắn lại sự kiện sau khi render bảng
            this.bindEvents(); 
        } catch (e) {
            UI.toast('Không tải được danh sách phòng ban', 'error');
        }
    }

    bindEvents() {
        View.bindEvents({
            onAdd: () => {
                View.showModal(null);
            },
            onEdit: (dept) => {
                // dept chỉ có id và name từ dataset của nút bấm
                View.showModal(dept);
            },
            onDelete: async (id) => {
                if (await UI.confirm(`Bạn có chắc chắn muốn xóa phòng ban <b>${id}</b> không?<br>Lưu ý: Hành động này có thể ảnh hưởng đến nhân viên thuộc phòng ban.`)) {
                    try {
                        UI.showLoading();
                        await Service.delete(id);
                        await this.loadData(); // Reload
                        UI.toast('Xóa thành công', 'success');
                    } catch (e) {
                        UI.hideLoading();
                        UI.toast(e.message, 'error');
                    }
                }
            },
            onSave: async (data) => {
                // Validate cơ bản
                if (!data.name.trim()) {
                    UI.toast('Tên phòng ban không được để trống', 'warning');
                    return;
                }
                // ID check cho Create
                if (!data.id && !data.newId) { 
                    // Trường hợp này hiếm vì HTML required check rồi, nhưng cứ check logic
                }

                try {
                    UI.showLoading();
                    if (this.isEditing(data.id)) {
                        // Logic Update (Chỉ update tên)
                        await Service.update(data.id, { name: data.name });
                        UI.toast('Cập nhật thành công', 'success');
                    } else {
                        // Logic Create
                        await Service.create(data); // data đã có id từ newId
                        UI.toast('Tạo phòng ban mới thành công', 'success');
                    }
                    
                    UI.closeModal();
                    await this.loadData();
                } catch (e) {
                    UI.hideLoading();
                    UI.toast(e.message, 'error');
                }
            },
            onViewEmployees: async (id, name) => {
                try {
                    UI.showLoading();
                    const employees = await Service.getEmployeesByDepartment(id);
                    UI.hideLoading();
                    
                    View.showEmployeeListModal(name, employees);
                } catch (e) {
                    UI.hideLoading();
                    UI.toast('Lỗi tải danh sách nhân viên: ' + e.message, 'error');
                }
            }
        });
    }

    // Helper kiểm tra xem ID này đã có trong danh sách chưa để biết là Edit hay Create
    // Tuy nhiên với logic form hiện tại, input hidden ID chỉ có value khi Edit.
    // Khi Create, input hidden ID rỗng, ta dùng newId.
    // Cách đơn giản hơn: Kiểm tra xem data.id (hidden) có giá trị không.
    // Nhưng ở hàm onSave tôi đã xử lý gán newId vào id. 
    // Nên ta cần một cách check khác: Check xem ID đó đã tồn tại trong mảng this.departments chưa.
    isEditing(id) {
        return this.departments.some(d => d.id === id);
    }
}

export default new DepartmentController();