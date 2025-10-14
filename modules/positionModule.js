const POSITIONS_STORAGE_KEY = 'hrm_positions';

// Dữ liệu mẫu chuẩn, mỗi vị trí có liên kết 'departmentId' rõ ràng
const mockPositions = [
    // Vị trí cho phòng IT (dept_it)
    { id: 'pos_dev', title: 'Developer', description: 'Phát triển phần mềm', departmentId: 'dept_it', salaryBase: 8000000 },
    { id: 'pos_qa', title: 'QA Tester', description: 'Kiểm thử chất lượng', departmentId: 'dept_it', salaryBase: 4000000 },
    { id: 'pos_bse', title: 'BrSE', description: 'Kỹ sư cầu nối', departmentId: 'dept_it', salaryBase: 6000000 },

    // Vị trí cho phòng Nhân sự (dept_hr)
    { id: 'pos_recruiter', title: 'Recruiter', description: 'Tuyển dụng nhân sự', departmentId: 'dept_hr', salaryBase: 3500000 },
    { id: 'pos_cpo', title: 'C&B Officer', description: 'Chuyên viên lương và phúc lợi', departmentId: 'dept_hr', salaryBase: 4200000 },

    // Vị trí cho phòng Marketing (dept_mkt)
    { id: 'pos_manager', title: 'Marketing Manager', description: 'Quản lý marketing', departmentId: 'dept_mkt', salaryBase: 6500000 },
    { id: 'pos_content', title: 'Content Creator', description: 'Sáng tạo nội dung', departmentId: 'dept_mkt', salaryBase: 3800000 },
];
/**
 * Lấy tất cả vị trí từ localStorage.
 * @returns {Array} Mảng các đối tượng vị trí.
 */
function getAllPositions() {
    const data = localStorage.getItem(POSITIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Lưu mảng vị trí vào localStorage.
 * @param {Array} positions Mảng các đối tượng vị trí.
 */
function savePositions(positions) {
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
}

/**
 * Lấy các vị trí thuộc về một phòng ban cụ thể.
 * @param {string} departmentId ID của phòng ban.
 * @returns {Array} Mảng các vị trí trong phòng ban đó.
 */
function getPositionsByDepartmentId(departmentId) {
    const allPositions = getAllPositions();
    return allPositions.filter(pos => pos.departmentId === departmentId);
}

function getPositionById(id) {
    return getAllPositions().find(pos => pos.id === id) || null;
}

/**
 * Thêm một vị trí mới.
 * @param {string} title Tên vị trí
 * @param {string} description Mô tả
 * @param {string} departmentId ID phòng ban liên quan
 * @param {number} salaryBase Mức lương cơ bản
 */
function addPosition(title, description, departmentId, salaryBase) {
    const positions = getAllPositions();
    const newPosition = {
        id: `pos_${Date.now()}`,
        title,
        description,
        departmentId,
        salaryBase: parseInt(salaryBase) // Đảm bảo là số
    };
    positions.push(newPosition);
    savePositions(positions);
}

/**
 * Cập nhật thông tin một vị trí.
 * @param {string} id ID của vị trí cần cập nhật.
 * @param {object} updates Đối tượng chứa các trường cần cập nhật.
 */
function updatePosition(id, updates) {
    const positions = getAllPositions();
    const index = positions.findIndex(pos => pos.id === id);
    if (index !== -1) {
        // Đảm bảo salaryBase được lưu là số
        if (updates.salaryBase) {
            updates.salaryBase = parseInt(updates.salaryBase);
        }
        positions[index] = { ...positions[index], ...updates };
        savePositions(positions);
    }
}

/**
 * Xóa một vị trí dựa trên ID.
 * @param {string} id ID của vị trí cần xóa.
 */
function deletePosition(id) {
    let positions = getAllPositions();
    positions = positions.filter(pos => pos.id !== id);
    savePositions(positions);
}

/**
 * Logic tự khởi tạo dữ liệu mẫu nếu localStorage trống.
 */
(function init() {
    if (getAllPositions().length === 0) {
        savePositions(mockPositions);
        console.log('Khởi tạo dữ liệu vị trí mẫu thành công!');
    }
})();

// Export tất cả các hàm cần thiết để module khác sử dụng
export { 
    getAllPositions, 
    getPositionsByDepartmentId,
    addPosition,
    updatePosition,
    deletePosition, 
    getPositionById
};