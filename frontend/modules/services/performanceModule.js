const REVIEW_STORAGE_KEY = 'hrm_performance_reviews';

export function getAllReviews() {
    const data = localStorage.getItem(REVIEW_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveReviews(reviews) {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
}

/**
 * Thêm một bài đánh giá mới.
 */
export function addReview(reviewData) {
    const allReviews = getAllReviews();
    const newReview = {
        id: `rev_${Date.now()}`,
        reviewerId: 'admin', // Giả định admin là người đánh giá
        date: new Date().toISOString().split('T')[0],
        ...reviewData
    };
    allReviews.push(newReview);
    saveReviews(allReviews);
    return true;
}

/**
 * Tổng hợp dữ liệu hiệu suất cho tất cả nhân viên.
 */
export function getPerformanceStats(employees) {
    const allReviews = getAllReviews();
    
    // Thống kê chung
    const totalRatingSum = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const overallAverage = allReviews.length > 0 ? (totalRatingSum / allReviews.length) : 0;

    // Thống kê cho từng nhân viên
    const employeeStats = employees.map(emp => {
        const employeeReviews = allReviews.filter(rev => rev.employeeId === emp.id);
        const reviewCount = employeeReviews.length;
        if (reviewCount === 0) {
            return { employeeId: emp.id, name: emp.name, averageRating: 0, reviewCount: 0, feedback: [] };
        }
        const ratingSum = employeeReviews.reduce((sum, rev) => sum + rev.rating, 0);
        const averageRating = ratingSum / reviewCount;
        const feedback = employeeReviews.map(rev => rev.feedback);

        return { employeeId: emp.id, name: emp.name, averageRating, reviewCount, feedback };
    });

    return { overallAverage, employeeStats };
}