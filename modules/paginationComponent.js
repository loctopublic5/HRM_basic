// === modules/paginationComponent.js ===

/**
 * Render ra chuỗi HTML cho component phân trang.
 * @param {number} currentPage - Trang hiện tại.
 * @param {number} totalPages - Tổng số trang.
 * @returns {string} Chuỗi HTML.
 */
export function renderPagination(currentPage, totalPages) {
    if (totalPages <= 1) return ''; // Không hiển thị nếu chỉ có 1 trang hoặc không có trang nào

    return `
        <nav class="pagination-component">
            <button data-action="prev" title="Trang trước" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span>Trang ${currentPage} / ${totalPages}</span>
            <button data-action="next" title="Trang sau" ${currentPage >= totalPages ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </nav>
    `;
}

/**
 * Xử lý sự kiện click cho component phân trang.
 * @param {Event} event - Sự kiện click được truyền vào.
 * @param {object} state - Trạng thái hiện tại { currentPage, totalPages }.
 * @param {function} onPageChange - Một callback function sẽ được gọi với số trang mới.
 */
export function handlePaginationClick(event, { currentPage, totalPages }, onPageChange) {
    const paginationWrapper = event.target.closest('.pagination-component');
    if (!paginationWrapper) return; // Bỏ qua nếu click không thuộc về component này

    // Ngăn sự kiện nổi bọt lên các listener khác, giải quyết lỗi tự động chuyển trang
    event.stopPropagation(); 

    const button = event.target.closest('button');
    if (!button) return;

    const action = button.dataset.action;
    let newPage = currentPage;

    if (action === 'prev' && currentPage > 1) {
        newPage--;
    }
    if (action === 'next' && currentPage < totalPages) {
        newPage++;
    }

    if (newPage !== currentPage) {
        onPageChange(newPage); // Gọi callback để module cha cập nhật state và render lại
    }
}