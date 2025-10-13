// Cấu hình API và ứng dụng
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    APP_NAME: 'HealthySystem',
    VERSION: '1.0.0',
    
    // Các endpoints API
    ENDPOINTS: {
        HEALTH: '/health',
        SPECIALTIES: '/specialties',
        DOCTORS: '/doctors',
        APPOINTMENTS: '/appointments',
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            REFRESH: '/auth/refresh'
        }
    },
    
    // Cấu hình Local Storage
    STORAGE_KEYS: {
        TOKEN: 'healthysystem_token',
        USER: 'healthysystem_user',
        THEME: 'healthysystem_theme'
    },
    
    // Cấu hình UI
    THEME: {
        PRIMARY_COLOR: '#667eea',
        SECONDARY_COLOR: '#764ba2',
        SUCCESS_COLOR: '#28a745',
        ERROR_COLOR: '#dc3545',
        WARNING_COLOR: '#ffc107'
    }
};

// Export để sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}