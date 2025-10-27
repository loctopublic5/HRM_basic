const DEPARTMENTS_STORAGE_KEY = 'hrm_departments';

const mockDepartments = [
    { id: 'dept_it', name: 'Công nghệ thông tin' },
    { id: 'dept_hr', name: 'Nhân sự' },
    { id: 'dept_mkt', name: 'Marketing' },
    { id: 'dept_sale', name: 'Kinh doanh' },
    { id: 'dept_acc', name: 'Kế toán' },
    { id: 'dept_ops', name: 'Vận hành' },
];

function getAllDepartments() {
    const data = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveDepartments(departments) {
    localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(departments));
}

function getDepartmentById(id) {
    const departments = getAllDepartments();
    return departments.find(dept => dept.id === id) || null;
}

function addDepartment(name) {
    const departments = getAllDepartments();
    const newDepartment = {
        id: `dept_${Date.now()}`,
        name: name,
    };
    departments.push(newDepartment);
    saveDepartments(departments);
}

function updateDepartment(id, newName) {
    const departments = getAllDepartments();
    const index = departments.findIndex(dept => dept.id === id);
    if (index !== -1) {
        departments[index].name = newName;
        saveDepartments(departments);
    }
}

function deleteDepartment(id) {
    let departments = getAllDepartments();
    departments = departments.filter(dept => dept.id !== id);
    saveDepartments(departments);
}

(function init() {
    if (getAllDepartments().length === 0) {
        saveDepartments(mockDepartments);
        console.log('Khởi tạo dữ liệu phòng ban mẫu thành công!');
    }
})();

export { 
    getAllDepartments, 
    getDepartmentById,
    addDepartment,
    updateDepartment,
    deleteDepartment
};