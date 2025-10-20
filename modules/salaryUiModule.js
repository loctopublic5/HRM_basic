import { getAllEmployees, getEmployeeById } from './employeeDbModule.js';
import { getPositionById } from './positionModule.js';
import { isGreaterThanZero } from './validators.js';
import { addAdjustment, getAdjustmentsForEmployee, calculateSalaryDetails } from './salaryModule.js';

let selectedEmployeeId = null;

/**
 * Hàm nội bộ, chỉ để vẽ lại phần chi tiết lương.
 * @param {HTMLElement} container - Vùng div#salary-details-container
 */
function renderSalaryDetails(container) {
    if (!selectedEmployeeId) {
        container.innerHTML = '';
        return;
    }

    const employee = getEmployeeById(selectedEmployeeId);
    if (!employee) { // Thêm kiểm tra an toàn
        container.innerHTML = '<p>Không tìm thấy thông tin nhân viên.</p>';
        return;
    }
    
    const position = getPositionById(employee.positionId);
    const adjustments = getAdjustmentsForEmployee(selectedEmployeeId);

    // --- SỬ DỤNG HÀM TÍNH TOÁN "ĐỘNG" MỚI ---
    const { salaryBase, currentAllowance, totalSalary } = calculateSalaryDetails(employee);

    container.innerHTML = `
        <hr>
        <h4>Thông tin lương: ${employee.name}</h4>
        <div class="salary-details">
            <p><strong>Vị trí hiện tại:</strong> ${position ? position.title : 'N/A'}</p>
            <p><strong>Lương cơ bản (từ Vị trí):</strong> ${salaryBase.toLocaleString('vi-VN')} VND</p>
            <p><strong>Tổng phụ cấp (cho Vị trí này):</strong> ${currentAllowance.toLocaleString('vi-VN')} VND</p>
            <p class="total-salary"><strong>Tổng lương cơ bản hiện tại:</strong> ${totalSalary.toLocaleString('vi-VN')} VND</p>
        </div>

        <h4>Thêm điều chỉnh mới</h4>
        <form id="adjustment-form">
            <input type="number" name="amount" placeholder="Số tiền (VND)" required>
            <select name="type" required>
                <option value="bonus">Thưởng (một lần)</option>
                <option value="allowance">Tăng lương (vĩnh viễn)</option>
            </select>
            <input type="text" name="description" placeholder="Lý do/Mô tả" required>
            <button type="submit">Lưu điều chỉnh</button>
        </form>

        <h4>Lịch sử điều chỉnh (Tất cả vị trí)</h4>
        <table>
            <thead>
                <tr>
                    <th>Ngày</th>
                    <th>Vị trí</th>
                    <th>Loại</th>
                    <th>Số tiền</th>
                    <th>Mô tả</th>
                </tr>
            </thead>
            <tbody>
                ${adjustments.map(adj => {
                    // Lấy thông tin vị trí tại thời điểm điều chỉnh
                    const adjPosition = getPositionById(adj.positionId);
                    return `
                        <tr>
                            <td>${adj.date}</td>
                            <td>${adjPosition ? adjPosition.title : 'Vị trí cũ/Không xác định'}</td>
                            <td>${adj.type === 'bonus' ? 'Thưởng' : 'Tăng lương'}</td>
                            <td>${adj.amount.toLocaleString('vi-VN')} VND</td>
                            <td>${adj.description}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Hàm render chính, điểm vào của module.
 */
function render(container) {
    // Chỉ gắn sự kiện một lần duy nhất
    if (!container.dataset.salaryEventsAttached) {
        container.addEventListener('change', event => {
            if (event.target.id === 'employee-select') {
                selectedEmployeeId = event.target.value;
                renderSalaryDetails(container.querySelector('#salary-details-container'));
            }
        });

        container.addEventListener('submit', event => {
            if (event.target.id === 'adjustment-form') {
                event.preventDefault();
                const formData = new FormData(event.target);
                const amount = formData.get('amount');
                const type = formData.get('type');
                const description = formData.get('description');

                if (!isGreaterThanZero(amount, 'Số tiền')) {
                    return; 
                }
                
                const maxAmount = 50000000;
                if (parseInt(amount) > maxAmount) {
                    alert(`Số tiền điều chỉnh không được vượt quá ${maxAmount.toLocaleString('vi-VN')} VND.`);
                    return; 
                }
                
                addAdjustment({
                    employeeId: selectedEmployeeId,
                    type: type,
                    amount: amount,
                    description: description,
                });
                renderSalaryDetails(container.querySelector('#salary-details-container'));
            }
        });
        container.dataset.salaryEventsAttached = 'true';
    }

    // Luôn vẽ lại layout chính khi được gọi
    const employees = getAllEmployees();
    container.innerHTML = `
        <div class="page-header">
            <h2>Quản lý Điều chỉnh Lương</h2>
        </div>
        <div class="form-group">
            <label for="employee-select">Chọn nhân viên:</label>
            <select id="employee-select">
                <option value="">-- Vui lòng chọn --</option>
                ${employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('')}
            </select>
        </div>
        <div id="salary-details-container"></div>
    `;
}

export { render };