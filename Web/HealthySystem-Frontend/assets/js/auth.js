// Authentication module
class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.init();
    }
    
    // Initialize authentication
    init() {
        const savedToken = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        const savedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        
        if (savedToken && savedUser) {
            this.token = savedToken;
            this.user = JSON.parse(savedUser);
            apiService.setToken(savedToken);
            this.updateUI();
        }
    }
    
    // Login
    async login(email, password) {
        try {
            console.log('AuthManager: Calling API login...');
            const response = await apiService.login(email, password);
            console.log('AuthManager: API response:', response);
            
            if (response.success) {
                const userData = response.data;
                console.log('AuthManager: Login successful, userData:', userData);
                
                this.user = userData.user || userData;
                this.token = userData.token || 'dummy-token';
                
                // Save to localStorage - save to both CONFIG keys and fallback keys for compatibility
                if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS) {
                    localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, this.token);
                    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(this.user));
                    console.log('AuthManager: Saved with CONFIG keys');
                }
                
                // Also save to fallback keys for compatibility with login.html
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                localStorage.setItem('userRole', this.user.role || this.user.Role);
                localStorage.setItem('userName', `${this.user.firstName} ${this.user.lastName}` || this.user.fullName);
                localStorage.setItem('userEmail', this.user.email);
                console.log('AuthManager: Saved with fallback keys, role:', this.user.role || this.user.Role);
                
                // Set token for API service if method exists
                if (apiService && apiService.setToken) {
                    apiService.setToken(this.token);
                }
                
                console.log('AuthManager: Saved user data, returning success');
                return { success: true, user: this.user };
            } else {
                console.log('AuthManager: Login failed:', response.error);
                return { success: false, error: response.error || 'Đăng nhập thất bại' };
            }
        } catch (error) {
            console.error('AuthManager: Login error:', error);
            return { success: false, error: error.message || 'Lỗi kết nối server' };
        }
    }
    
    // Register
    async register(userData) {
        try {
            const response = await apiService.register(userData);
            
            if (response.success) {
                const { token, user } = response.data;
                
                this.token = token;
                this.user = user;
                
                // Save to localStorage - save to both CONFIG keys and fallback keys
                if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS) {
                    localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
                    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
                }
                
                // Also save to fallback keys for compatibility
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                // Set token for API service
                apiService.setToken(token);
                
                // Update UI
                this.updateUI();
                
                Utils.showNotification('Đăng ký thành công!', 'success');
                
                return { success: true, user };
            } else {
                Utils.showNotification(response.error || 'Đăng ký thất bại', 'error');
                return { success: false, error: response.error };
            }
        } catch (error) {
            Utils.showNotification('Lỗi kết nối server', 'error');
            return { success: false, error: error.message };
        }
    }
    
    // Logout
    logout() {
        this.token = null;
        this.user = null;
        
        // Clear ALL possible auth data keys
        if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS) {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);  // healthysystem_token
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);   // healthysystem_user
        }
        
        // Also remove ALL fallback keys
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        
        // Clear session storage
        sessionStorage.clear();
        
        // Clear API service token
        apiService.setToken(null);
        
        // Update UI
        this.updateUI();
        
        Utils.showNotification('Đã đăng xuất', 'info');
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        return this.token !== null && this.user !== null;
    }
    
    // Get current user
    getCurrentUser() {
        return this.user;
    }
    
    // Update UI based on authentication status
    updateUI() {
        const authLink = document.getElementById('auth-link');
        const appointmentsSection = document.getElementById('appointments');
        
        // Check if authLink exists (not all pages have it)
        if (!authLink) {
            return; // Exit early if element doesn't exist
        }
        
        if (this.isAuthenticated()) {
            // Show user info
            authLink.textContent = `👤 ${this.user.fullName}`;
            authLink.onclick = () => this.showUserMenu();
            
            // Show appointments section
            if (appointmentsSection) {
                appointmentsSection.classList.remove('d-none');
            }
            
            // Load user's appointments
            if (typeof window.loadAppointments === 'function') {
                window.loadAppointments();
            }
        } else {
            // Show login link
            authLink.textContent = 'Đăng nhập';
            authLink.href = 'login.html';
            authLink.onclick = null; // Remove onclick event
            
            // Hide appointments section
            if (appointmentsSection) {
                appointmentsSection.classList.add('d-none');
            }
        }
    }
    
    // Show login modal
    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Đăng nhập</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="login-form">
                        <div class="form-group">
                            <label class="form-label">Email:</label>
                            <input type="email" class="form-control" name="email" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mật khẩu:</label>
                            <input type="password" class="form-control" name="password" required>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">Đăng nhập</button>
                            <button type="button" class="btn btn-secondary" onclick="authManager.showRegisterModal()">Đăng ký</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');
            
            const result = await this.login(email, password);
            
            if (result.success) {
                modal.remove();
            }
        });
        
        // Handle close
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Show register modal
    showRegisterModal() {
        // Remove login modal if exists
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>Đăng ký tài khoản</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="register-form">
                        <div class="row">
                            <div class="col-6">
                                <div class="form-group">
                                    <label class="form-label">Họ và tên:</label>
                                    <input type="text" class="form-control" name="fullName" required>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="form-group">
                                    <label class="form-label">Email:</label>
                                    <input type="email" class="form-control" name="email" required>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-6">
                                <div class="form-group">
                                    <label class="form-label">Số điện thoại:</label>
                                    <input type="tel" class="form-control" name="phone" required>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="form-group">
                                    <label class="form-label">Mật khẩu:</label>
                                    <input type="password" class="form-control" name="password" required>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-6">
                                <div class="form-group">
                                    <label class="form-label">Giới tính:</label>
                                    <select class="form-control" name="gender">
                                        <option value="">Chọn giới tính</option>
                                        <option value="M">Nam</option>
                                        <option value="F">Nữ</option>
                                        <option value="O">Khác</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="form-group">
                                    <label class="form-label">Ngày sinh:</label>
                                    <input type="date" class="form-control" name="dateOfBirth">
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Người liên hệ khẩn cấp:</label>
                            <input type="text" class="form-control" name="emergencyContactName" placeholder="Họ tên">
                        </div>
                        <div class="form-group">
                            <label class="form-label">SĐT người liên hệ khẩn cấp:</label>
                            <input type="tel" class="form-control" name="emergencyContactPhone" placeholder="Số điện thoại">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">Đăng ký</button>
                            <button type="button" class="btn btn-secondary" onclick="authManager.showLoginModal()">Đã có tài khoản</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#register-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const userData = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                password: formData.get('password'),
                gender: formData.get('gender') || null,
                dateOfBirth: formData.get('dateOfBirth') ? new Date(formData.get('dateOfBirth')) : null,
                emergencyContactName: formData.get('emergencyContactName') || null,
                emergencyContactPhone: formData.get('emergencyContactPhone') || null
            };
            
            const result = await this.register(userData);
            
            if (result.success) {
                modal.remove();
            }
        });
        
        // Handle close
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Show user menu
    showUserMenu() {
        const menu = document.createElement('div');
        menu.className = 'user-menu';
        menu.innerHTML = `
            <div class="user-menu-content">
                <div class="user-info">
                    <h4>${this.user.fullName}</h4>
                    <p>${this.user.email}</p>
                    <p>Vai trò: ${Utils.capitalize(this.user.role)}</p>
                </div>
                <div class="user-actions">
                    <button class="btn btn-outline btn-sm" onclick="authManager.showProfile()">Thông tin cá nhân</button>
                    <button class="btn btn-danger btn-sm" onclick="authManager.logout()">Đăng xuất</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Position menu
        const authLink = document.getElementById('auth-link');
        const rect = authLink.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = rect.bottom + 10 + 'px';
        menu.style.right = '20px';
        
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== authLink) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
    
    // Show user profile
    showProfile() {
        // Implementation for user profile modal
        Utils.showNotification('Tính năng đang phát triển', 'info');
    }
}

// CSS cho modals và user menu
const authStyles = `
<style>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.modal {
    background: white;
    border-radius: var(--border-radius);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-lg {
    max-width: 800px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
    margin: 0;
    color: var(--primary-color);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-muted);
}

.modal-close:hover {
    color: var(--text-dark);
}

.modal-body {
    padding: 1.5rem;
}

.user-menu {
    position: fixed;
    z-index: 9999;
}

.user-menu-content {
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    padding: 1rem;
    min-width: 250px;
}

.user-info {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
    margin-bottom: 1rem;
}

.user-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--primary-color);
}

.user-info p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    color: var(--text-muted);
}

.user-actions {
    display: flex;
    gap: 0.5rem;
}
</style>
`;

// Add styles to head
document.head.insertAdjacentHTML('beforeend', authStyles);

// Create global auth manager instance
const authManager = new AuthManager();

// Export functions to global scope for inline event handlers
window.isAuthenticated = function() {
    return authManager.isAuthenticated();
};

window.getCurrentUser = function() {
    return authManager.getCurrentUser();
};

window.getUser = function() {
    return authManager.user;
};

window.getUserRole = function() {
    return authManager.getUserRole();
};

window.logout = function() {
    return authManager.logout();
};