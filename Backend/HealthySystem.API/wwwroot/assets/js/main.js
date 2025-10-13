// Main JavaScript file for HealthySystem
class MainApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.updateNavigation();
    }

    checkAuthStatus() {
        // Check if user is logged in
        let token, user;
        
        console.log('Checking auth status...');
        
        // Try to use CONFIG storage keys first, fallback to hardcoded keys
        if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS) {
            token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
            user = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
            console.log('Using CONFIG storage keys:', {
                token: token ? 'exists' : 'null',
                user: user ? 'exists' : 'null'
            });
        } else {
            token = localStorage.getItem('authToken');
            user = localStorage.getItem('user');
            console.log('Using fallback storage keys:', {
                token: token ? 'exists' : 'null',
                user: user ? 'exists' : 'null'
            });
        }
        
        if (token && user) {
            try {
                this.currentUser = JSON.parse(user);
                console.log('Current user data:', this.currentUser);
                this.showUserNavigation();
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.clearAuthData();
                this.showGuestNavigation();
            }
        } else {
            console.log('No auth data found, showing guest navigation');
            this.showGuestNavigation();
        }
    }

    showUserNavigation() {
        const loginBtn = document.getElementById('login-btn');
        const userMenu = document.getElementById('user-menu');
        const userDisplayName = document.getElementById('user-display-name');

        // Ẩn nút đăng nhập
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }

        // Hiển thị menu người dùng
        if (userMenu && userDisplayName && this.currentUser) {
            userMenu.style.display = 'block';
            
            // Xử lý tên hiển thị linh hoạt
            let displayName = '';
            if (this.currentUser.fullName) {
                displayName = this.currentUser.fullName;
            } else if (this.currentUser.firstName && this.currentUser.lastName) {
                displayName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            } else if (this.currentUser.name) {
                displayName = this.currentUser.name;
            } else if (this.currentUser.email) {
                displayName = this.currentUser.email.split('@')[0];
            } else {
                displayName = 'Người dùng';
            }
            
            userDisplayName.textContent = displayName;
            console.log('User display name set to:', displayName);
        }
    }

    showGuestNavigation() {
        const loginBtn = document.getElementById('login-btn');
        const userMenu = document.getElementById('user-menu');

        // Hiển thị nút đăng nhập
        if (loginBtn) {
            loginBtn.style.display = 'inline-flex';
        }

        // Ẩn menu người dùng
        if (userMenu) {
            userMenu.style.display = 'none';
        }
    }

    updateNavigation() {
        // Update navigation based on auth status
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Logout functionality
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
                e.preventDefault();
                this.logout();
            }
        });

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Profile link click handler
        const userProfileLink = document.getElementById('user-profile-link');
        if (userProfileLink) {
            userProfileLink.addEventListener('click', (e) => {
                if (!this.currentUser) {
                    e.preventDefault();
                    window.location.href = 'login.html';
                }
            });
        }
    }

    logout() {
        this.clearAuthData();
        this.showGuestNavigation();
        window.location.href = 'index.html';
    }

    clearAuthData() {
        // Clear both possible storage keys
        if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS) {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.currentUser = null;
    }

    // Utility functions
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto dismiss after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Initialize demo data if needed
    initDemoMode() {
        if (!localStorage.getItem('user') && window.location.search.includes('demo=true')) {
            const demoUser = {
                id: 1,
                firstName: 'Nguyễn Văn',
                lastName: 'An',
                email: 'demo@healthysystem.com',
                phone: '0123456789',
                gender: 'male',
                dateOfBirth: '1990-05-15',
                address: '123 Đường ABC, Quận 1, TP.HCM'
            };

            localStorage.setItem('authToken', 'demo-token-123');
            localStorage.setItem('user', JSON.stringify(demoUser));
            this.showNotification('Chế độ demo đã được kích hoạt!', 'success');
            this.checkAuthStatus();
        }
    }
}

// Global functions for compatibility
function showNotification(message, type = 'info') {
    if (window.mainApp) {
        window.mainApp.showNotification(message, type);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.mainApp = new MainApp();
    
    // Check for demo mode
    window.mainApp.initDemoMode();
});

// Export for other modules
window.MainApp = MainApp;