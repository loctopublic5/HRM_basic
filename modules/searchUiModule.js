import { getAllDepartments } from './departmentModule.js';
import { getAllPositions } from './positionModule.js';
import { calculateSalaryDetails } from './salaryModule.js';
import { renderPagination, handlePaginationClick } from './paginationComponent.js';
// Import các hàm từ service mới
import { getAutocompleteSuggestions, searchEmployees } from './searchModule.js'; 

// --- Biến trạng thái cho Module ---
let searchResults = []; // Lưu kết quả tìm kiếm đầy đủ (trước khi phân trang)
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let sortBy = 'name';
let sortOrder = 'asc';

/**
 * HÀM CHÍNH (EXPORT): Render layout ban đầu và gắn sự kiện 1 lần.
 * @param {HTMLElement} container 
 */
function render(container) {
    if (!container.dataset.searchEventsAttached) {
        bindEvents(container);
        container.dataset.searchEventsAttached = 'true';
    }
    renderSearchForm(container); // Vẽ form và khu vực kết quả trống
}

/**
 * Hàm nội bộ: Vẽ form tìm kiếm và khu vực kết quả ban đầu.
 */
function renderSearchForm(container) {
    const departments = getAllDepartments();
    const positions = getAllPositions();

    container.innerHTML = `
        <div class="page-header"><h2>Tìm kiếm Nhân viên</h2></div>
        <form id="search-employee-form" class="search-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="search-name">Tên nhân viên:</label>
                    <input type="text" id="search-name" name="name" list="employee-names" autocomplete="off">
                    <datalist id="employee-names"></datalist> 
                </div>
                <div class="form-group">
                    <label for="search-dept">Phòng ban:</label>
                    <select id="search-dept" name="departmentId">
                        <option value="">-- Tất cả --</option>
                        ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="search-pos">Vị trí:</label>
                    <select id="search-pos" name="positionId">
                        <option value="">-- Tất cả --</option>
                        ${positions.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
                    </select>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">Tìm kiếm</button>
        </form>
        <hr>
        <div id="search-results-container">
            <p>Nhập tiêu chí tìm kiếm và nhấn "Tìm kiếm".</p>
        </div>
    `;
}

/**
 * HÀM NỘI BỘ: Gắn tất cả sự kiện cần thiết (chạy 1 lần).
 */
function bindEvents(container) {
    // Listener cho toàn bộ container
    container.addEventListener('input', event => {
        // Xử lý Autocomplete
        if (event.target.id === 'search-name') {
            handleAutocomplete(event);
        }
    });

    container.addEventListener('submit', event => {
        // Xử lý Submit Form Tìm kiếm
        if (event.target.id === 'search-employee-form') {
            event.preventDefault();
            handleSearch(container);
        }
    });

    container.addEventListener('click', event => {
        // Xử lý Sắp xếp và Phân trang trên bảng kết quả
        handleTableInteractions(event, container);
    });
}

/**
 * HÀM NỘI BỘ: Xử lý gợi ý autocomplete.
 */
function handleAutocomplete(event) {
    const nameInput = event.target;
    const datalist = document.getElementById('employee-names');
    const query = nameInput.value;

    const suggestions = getAutocompleteSuggestions(query);

    datalist.innerHTML = suggestions.map(name => `<option value="${name}"></option>`).join('');
}

/**
 * HÀM NỘI BỘ: Lấy dữ liệu, gọi service tìm kiếm và render kết quả.
 */
function handleSearch(container) {
    const form = document.getElementById('search-employee-form');
    const formData = new FormData(form);
    const nameQuery = formData.get('name');
    const deptId = formData.get('departmentId');
    const posId = formData.get('positionId');

    // Gọi service để lấy kết quả
    searchResults = searchEmployees({ nameQuery, deptId, posId });

    currentPage = 1; // Reset về trang 1 cho mỗi lần tìm kiếm mới
    sortBy = 'name'; // Reset sắp xếp về mặc định
    sortOrder = 'asc';

    renderResultsTable(container.querySelector('#search-results-container'));
}

/**
 * HÀM NỘI BỘ: Vẽ bảng kết quả, có sắp xếp và phân trang.
 */
function renderResultsTable(resultsContainer) {
    if (!searchResults || searchResults.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">Không tìm thấy kết quả nào phù hợp.</p>';
        return;
    }

    // --- SẮP XẾP ---
    searchResults.sort((a, b) => { 
        let valA, valB;
        if (sortBy === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        } else if (sortBy === 'totalSalary') {
            valA = calculateSalaryDetails(a).totalSalary;
            valB = calculateSalaryDetails(b).totalSalary;
        } else {
            valA = a[sortBy];
            valB = b[sortBy];
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // --- PHÂN TRANG ---
    const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE) || 1;
    const paginatedResults = searchResults.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const paginationHtml = renderPagination(currentPage, totalPages);

    const deptMap = getAllDepartments().reduce((map, d) => ({...map, [d.id]: d.name}), {});
    const posMap = getAllPositions().reduce((map, p) => ({...map, [p.id]: p.title}), {});

    resultsContainer.innerHTML = `
        <table class="table-standard search-results-table">
            <thead>
                <tr>
                    <th data-sort="id">ID</th>
                    <th data-sort="name">Tên ${sortBy === 'name' ? (sortOrder === 'desc' ? '▾' : '▴') : ''}</th>
                    <th>Phòng ban</th>
                    <th>Vị trí</th>
                    <th data-sort="totalSalary">Lương ${sortBy === 'totalSalary' ? (sortOrder === 'desc' ? '▾' : '▴') : ''}</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedResults.map(emp => {
                    // Gọi hàm tính lương "thông minh"
                    const { totalSalary } = calculateSalaryDetails(emp);
                    return `
                        <tr>
                            <td>${emp.id}</td>
                            <td>${emp.name}</td>
                            <td>${deptMap[emp.departmentId] || 'N/A'}</td>
                            <td>${posMap[emp.positionId] || 'N/A'}</td>
                            <td>${totalSalary.toLocaleString('vi-VN')} VND</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        ${paginationHtml}
    `;
}

/**
 * HÀM NỘI BỘ: Xử lý click Sắp xếp và Phân trang trên bảng kết quả.
 */
function handleTableInteractions(event, container) {
    const resultsContainer = container.querySelector('#search-results-container');
    
     // Xử lý sắp xếp
    const sortHeader = event.target.closest('.search-results-table [data-sort]');
    if (sortHeader) {
        const newSortBy = sortHeader.dataset.sort;
        if (sortBy === newSortBy) {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            sortBy = newSortBy; sortOrder = 'asc';
        }
        currentPage = 1;
        renderResultsTable(resultsContainer);
        return;
    }

     // Xử lý phân trang
    const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE) || 1;
    handlePaginationClick(event, { currentPage, totalPages }, (newPage) => {
        currentPage = newPage;
        renderResultsTable(resultsContainer);
    });
}

export { render }; // Chỉ export hàm render chính