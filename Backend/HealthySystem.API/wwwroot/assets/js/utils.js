// Các hàm tiện ích chung
class Utils {
    
    // Format ngày tháng
    static formatDate(date, format = 'dd/mm/yyyy') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        switch(format) {
            case 'dd/mm/yyyy':
                return `${day}/${month}/${year}`;
            case 'dd/mm/yyyy hh:mm':
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            case 'yyyy-mm-dd':
                return `${year}-${month}-${day}`;
            default:
                return d.toLocaleDateString('vi-VN');
        }
    }
    
    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Validate phone number (Việt Nam)
    static isValidPhone(phone) {
        const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    
    // Format số điện thoại
    static formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('84')) {
            return '+' + cleaned;
        }
        if (cleaned.startsWith('0')) {
            return cleaned.replace(/^0/, '+84');
        }
        return '+84' + cleaned;
    }
    
    // Hiển thị loading
    static showLoading(element) {
        element.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>Đang tải...</span>
            </div>
        `;
    }
    
    // Ẩn loading
    static hideLoading(element, content = '') {
        element.innerHTML = content;
    }
    
    // Hiển thị thông báo
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            notification.remove();
        }, duration);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
    
    // Get notification icon
    static getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Generate UUID
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Capitalize first letter
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    // Format currency (VND)
    static formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
}