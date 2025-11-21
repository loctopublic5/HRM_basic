// === frontend/modules/helpers/formatters.js ===

/**
 * Định dạng giá trị thành tiền tệ Việt Nam (VND).
 * Xử lý an toàn các trường hợp null, undefined, string.
 * * @param {string|number} value - Giá trị cần format (ví dụ: "10000000.00", 10000000)
 * @returns {string} Chuỗi đã format (ví dụ: "10.000.000 ₫") hoặc "0 ₫" nếu lỗi.
 */
export function formatCurrency(value) {
    // 1. Chuyển đổi sang số (xử lý cả chuỗi "10000.00" từ MySQL)
    const number = Number(value);

    // 2. Kiểm tra tính hợp lệ
    if (isNaN(number) || value === null || value === undefined || value === '') {
        return '0 ₫'; // Hoặc "Chưa cập nhật" tùy bạn
    }

    // 3. Format chuẩn tiếng Việt
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(number);
}