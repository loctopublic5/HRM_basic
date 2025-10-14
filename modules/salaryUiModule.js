import { getAllEmployees, getEmployeeById } from './employeeDbModule.js';
import { getPositionById } from './positionModule.js';
import { addAdjustment, getAdjustmentsForEmployee } from './salaryModule.js';

let selectedEmployeeId = null;

function render(container) {
    const employees = getAllEmployees();
    
    // Giao diện ban đầu: chỉ có dropdown chọn nhân viên
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

    const employeeSelect = document.getElementById('employee-select');
    employeeSelect.addEventListener('change', () => {
        selectedEmployeeId = employeeSelect.value;
        if (selectedEmployeeId) {
            renderSalaryDetails(document.getElementById('salary-details-container'));
        } else {
            document.getElementById('salary-details-container').innerHTML = '';
        }
    });
}

function renderSalaryDetails(container) {
    const employee = getEmployeeById(selectedEmployeeId);
    const position = getPositionById(employee.positionId);
    const adjustments = getAdjustmentsForEmployee(selectedEmployeeId);

    const salaryBase = position ? position.salaryBase : 0;
    const totalSalary = salaryBase + employee.permanentAllowance;

    container.innerHTML = `
        <hr>
        <h4>Thông tin lương: ${employee.name}</h4>
        <p><strong>Lương cơ bản (từ Vị trí):</strong> ${salaryBase.toLocaleString('vi-VN')} VND</p>
        <p><strong>Phụ cấp cố định:</strong> ${employee.permanentAllowance.toLocaleString('vi-VN')} VND</p>
        <p><strong>Tổng lương cơ bản hiện tại:</strong> ${totalSalary.toLocaleString('vi-VN')} VND</p>

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

        <h4>Lịch sử điều chỉnh</h4>
        <table>
            <thead><tr><th>Ngày</th><th>Loại</th><th>Số tiền</th><th>Mô tả</th></tr></thead>
            <tbody>
                ${adjustments.map(adj => `
                    <tr>
                        <td>${adj.date}</td>
                        <td>${adj.type === 'bonus' ? 'Thưởng' : 'Tăng lương'}</td>
                        <td>${adj.amount.toLocaleString('vi-VN')} VND</td>
                        <td>${adj.description}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('adjustment-form').addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(event.target);
        addAdjustment({
            employeeId: selectedEmployeeId,
            type: formData.get('type'),
            amount: formData.get('amount'),
            description: formData.get('description'),
        });
        // Render lại để cập nhật thông tin
        renderSalaryDetails(container);
    });
}

export { render };