/**
 * Kiểm tra xem một giá trị có bị bỏ trống hay không.
 * @param {string} value - Giá trị cần kiểm tra.
 * @param {string} fieldName - Tên của trường để hiển thị trong thông báo lỗi.
 * @returns {boolean} True nếu hợp lệ, False nếu không.
 */
export function isNotEmpty(value, fieldName) {
    if (value === null || value === undefined || String(value).trim() === '') {
        alert(`${fieldName} không được để trống.`);
        return false;
    }
    return true;
}

/**
 * Kiểm tra xem một giá trị số có lớn hơn 0 hay không.
 * @param {number|string} value - Giá trị cần kiểm tra.
 * @param {string} fieldName - Tên của trường để hiển thị trong thông báo lỗi.
 * @returns {boolean} True nếu hợp lệ, False nếu không.
 */
export function isGreaterThanZero(value, fieldName) {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
        alert(`${fieldName} phải là một số dương.`);
        return false;
    }
    return true;
}

/**
 * Kiểm tra xem tên có bị trùng lặp trong một danh sách hay không.
 * @param {string} name - Tên mới cần kiểm tra.
 * @param {Array} existingItems - Mảng các đối tượng đã có (ví dụ: allEmployees).
 * @param {string|null} currentId - ID của đối tượng đang được chỉnh sửa (để bỏ qua chính nó).
 * @returns {boolean} True nếu hợp lệ (không trùng), False nếu bị trùng.
 */
export function isNameUnique(name, existingItems, currentId = null) {
    // some() sẽ trả về true ngay khi tìm thấy một item thỏa mãn điều kiện
    const isDuplicate = existingItems.some(item => 
        // So sánh tên không phân biệt chữ hoa/thường
        item.name.toLowerCase() === name.toLowerCase() && 
        // Nếu là chế độ Sửa, phải đảm bảo item tìm thấy không phải là chính nó
        item.id !== currentId
    );

    if (isDuplicate) {
        alert(`Tên "${name}" đã tồn tại. Vui lòng chọn một tên khác.`);
        return false;
    }
    return true;
}