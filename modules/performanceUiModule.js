// === modules/performanceUiModule.js (Phiên bản Hoàn chỉnh, Sửa lỗi) ===

import { getAllEmployees } from './employeeDbModule.js';
import { addReview, getPerformanceStats } from './performanceModule.js';

let currentRating = 0;
let sortBy = 'averageRating';
let sortOrder = 'desc';

/**
 * Hàm này chỉ vẽ lại nội dung động của trang.
 */
function renderPerformancePage(container) {
    const employees = getAllEmployees();
    const { overallAverage, employeeStats } = getPerformanceStats(employees);

    employeeStats.sort((a, b) => {
        const valA = a[sortBy]; const valB = b[sortBy];
        return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
    
    currentRating = 0; // Luôn reset rating khi vẽ lại

    container.innerHTML = `
        <div class="page-header"><h2>Đánh giá Hiệu suất</h2></div>
        
        <h4>Tạo Đánh giá mới</h4>
        <form id="review-form">
            <select name="employeeId" required>
                <option value="">-- Chọn nhân viên để đánh giá --</option>
                ${employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('')}
            </select>
            <div class="star-rating">
                <label>Đánh giá:</label>
                <div class="stars">
                    <span data-value="1">☆</span><span data-value="2">☆</span><span data-value="3">☆</span><span data-value="4">☆</span><span data-value="5">☆</span>
                </div>
            </div>
            <textarea name="feedback" placeholder="Nhận xét chi tiết..." required></textarea>
            <button type="submit">Lưu đánh giá</button>
        </form>
        <hr>
        <h4>Báo cáo Hiệu suất</h4>
        <p>Đánh giá trung bình toàn công ty: <strong>${overallAverage.toFixed(1)} / 5.0</strong></p>
        <table class="performance-table">
            <thead>
                <tr>
                    <th data-sort="name">Nhân viên</th>
                    <th data-sort="averageRating">Rating TB ${sortBy === 'averageRating' ? (sortOrder === 'desc' ? '▾' : '▴') : ''}</th>
                    <th data-sort="reviewCount">Lượt ĐG ${sortBy === 'reviewCount' ? (sortOrder === 'desc' ? '▾' : '▴') : ''}</th>
                </tr>
            </thead>
            <tbody>
                ${employeeStats.map(stat => `
                    <tr class="employee-row" data-employee-id="${stat.employeeId}">
                        <td>${stat.name}</td>
                        <td><span class="rating-value" style="color: ${getRatingColor(stat.averageRating)}">${stat.averageRating.toFixed(1)}</span></td>
                        <td>${stat.reviewCount}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Hàm này chỉ được gọi MỘT LẦN để gắn tất cả sự kiện.
 */
function bindEvents(container) {
    // Listener cho các hiệu ứng hover trên sao
    container.addEventListener('mouseover', event => {
        const star = event.target.closest('.stars span');
        if (star) {
            updateStars(star.parentElement, star.dataset.value, 'hover');
        }
    });

    container.addEventListener('mouseout', event => {
        if (event.target.closest('.stars')) {
            updateStars(event.target.closest('.stars'), currentRating, 'selected');
        }
    });

    // Listener cho các hành động CLICK
    container.addEventListener('click', event => {
        const target = event.target;

        // Xử lý click chọn sao
        const star = target.closest('.stars span');
        if (star) {
            currentRating = parseInt(star.dataset.value);
            updateStars(star.parentElement, currentRating, 'selected');
            return;
        }

        // Xử lý click sắp xếp
        const sortHeader = target.closest('[data-sort]');
        if (sortHeader) {
            // ... (logic sắp xếp không đổi)
            return;
        }

        // Xử lý click xem chi tiết
        const row = target.closest('.employee-row');
        if (row) {
            // ... (logic xem chi tiết không đổi)
        }
    });

    // Listener cho sự kiện SUBMIT của form
    container.addEventListener('submit', event => {
        if (event.target.id === 'review-form') {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const employeeId = formData.get('employeeId');

            if (!employeeId) {
                alert('Vui lòng chọn một nhân viên.'); return;
            }
            if (currentRating === 0) {
                alert('Vui lòng chọn số sao đánh giá.'); return;
            }

            addReview({
                employeeId: employeeId,
                rating: currentRating,
                feedback: formData.get('feedback')
            });
            renderPerformancePage(container); // Vẽ lại toàn bộ nội dung
        }
    });
}

function getRatingColor(rating) { /* ... Giữ nguyên ... */ }

function updateStars(container, rating, stateClass) {
    const stars = container.querySelectorAll('span');
    stars.forEach(star => {
        star.textContent = star.dataset.value <= rating ? '★' : '☆';
        star.classList.remove('hover', 'selected');
        if (star.dataset.value <= rating) {
            star.classList.add(stateClass);
        }
    });
}

/**
 * Hàm render chính, điểm vào của module.
 */
function render(container) {
    // Cơ chế "đánh dấu" để đảm bảo bindEvents chỉ chạy một lần
    if (!container.dataset.performanceEventsAttached) {
        bindEvents(container);
        container.dataset.performanceEventsAttached = 'true';
    }
    // Luôn vẽ lại giao diện mỗi khi được gọi
    renderPerformancePage(container);
}

export { render };