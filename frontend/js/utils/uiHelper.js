import CONFIG from '../config.js';

class UI {
    // ============================
    // 1. TOAST NOTIFICATIONS
    // ============================
    
    static toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return; // Phòng trường hợp chưa có DOM
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fa-solid ${this._getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(toast);

        // Animation Slide In (CSS đã có, nhưng thêm inline cho chắc chắn)
        toast.style.animation = 'slideIn 0.3s ease forwards';

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    static _getIconForType(type) {
        switch (type) {
            case 'success': return 'fa-circle-check';
            case 'error': return 'fa-circle-exclamation';
            case 'warning': return 'fa-triangle-exclamation';
            default: return 'fa-circle-info';
        }
    }

    // ============================
    // 2. MODAL SYSTEM
    // ============================

    static showModal(title, htmlContent, footerHtml = '') {
        const overlay = document.getElementById('modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');
        const footerEl = document.getElementById('modal-footer');

        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.innerHTML = htmlContent;
        if (footerEl) footerEl.innerHTML = footerHtml;
        
        if (overlay) overlay.classList.add('open');
    }

    static closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.remove('open');
    }

    static confirm(message) {
        return new Promise((resolve) => {
            const content = `<p class="text-center" style="font-size: 1.1rem; margin: 20px 0;">${message}</p>`;
            const footer = `
                <button id="confirm-cancel" class="btn btn-outline">Hủy</button>
                <button id="confirm-ok" class="btn btn-primary">Đồng ý</button>
            `;

            this.showModal('Xác nhận', content, footer);

            const btnOk = document.getElementById('confirm-ok');
            const btnCancel = document.getElementById('confirm-cancel');

            const cleanup = () => {
                btnOk.removeEventListener('click', handleOk);
                btnCancel.removeEventListener('click', handleCancel);
            };

            const handleOk = () => {
                this.closeModal();
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                this.closeModal();
                cleanup();
                resolve(false);
            };

            if (btnOk) btnOk.addEventListener('click', handleOk);
            if (btnCancel) btnCancel.addEventListener('click', handleCancel);
        });
    }

    // ============================
    // 3. LOADING SYSTEM (Đã Nâng Cấp)
    // ============================

    /**
     * Hiển thị Loading Overlay
     * @param {HTMLElement} container - Nơi hiển thị loading (mặc định là toàn trang)
     */
    static showLoading(container = document.body) {
        // 1. Kiểm tra nếu đã có loading thì không tạo thêm
        if (container.querySelector('.loading-overlay')) return;

        // 2. Tạo element Loading
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        
        // Style inline để đảm bảo hoạt động ngay cả khi CSS chưa load xong
        loader.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255,255,255,0.7);
            display: flex; justify-content: center; align-items: center;
            z-index: 9999; 
            backdrop-filter: blur(2px);
        `;

        // Nếu container là body, dùng fixed để phủ toàn màn hình
        if (container === document.body) {
            loader.style.position = 'fixed';
        } else {
            // Đảm bảo container cha có position relative để loader phủ đúng phạm vi
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
        }

        loader.innerHTML = `
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid var(--accent, #3498db); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
            <span style="margin-left: 15px; font-weight: 500; color: #555;">Đang xử lý...</span>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
        
        container.appendChild(loader);
    }

    /**
     * Ẩn Loading (Xóa element loading khỏi DOM)
     */
    static hideLoading() {
        const loaders = document.querySelectorAll('.loading-overlay');
        loaders.forEach(el => el.remove());
    }

    // ============================
    // 4. FORMATTERS
    // ============================

    static formatMoney(amount) {
        if (!amount && amount !== 0) return '0 ₫';
        return new Intl.NumberFormat(CONFIG.CURRENCY_LOCALE, {
            style: 'currency',
            currency: CONFIG.CURRENCY
        }).format(amount);
    }

    static formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(CONFIG.DATE_LOCALE);
    }
}

// Global Event Listener cho Modal Overlay (đóng khi click ra ngoài)
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                UI.closeModal();
            }
        });
    }
});

export default UI;