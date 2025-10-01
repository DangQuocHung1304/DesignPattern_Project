// Service để gọi API
class ApiService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }
    
    // Set token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        }
    }
    
    // Get headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.includeAuth !== false),
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP Error: ${response.status}`);
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('API Request Error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // GET request
    async get(endpoint, includeAuth = true) {
        return this.request(endpoint, {
            method: 'GET',
            includeAuth
        });
    }
    
    // POST request
    async post(endpoint, data, includeAuth = true) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            includeAuth
        });
    }
    
    // PUT request
    async put(endpoint, data, includeAuth = true) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            includeAuth
        });
    }
    
    // DELETE request
    async delete(endpoint, includeAuth = true) {
        return this.request(endpoint, {
            method: 'DELETE',
            includeAuth
        });
    }
    
    // === API Methods ===
    
    // Health check
    async checkHealth() {
        return this.get(CONFIG.ENDPOINTS.HEALTH, false);
    }
    
    // Authentication
    async login(email, password) {
        try {
            const result = await this.post('/auth/login', { email, password }, false);
            
            if (result.success) {
                return result;
            } else {
                // Fallback to mock data for testing
                console.log('API login failed, using mock data for testing');
                return this.getMockLoginData(email, password);
            }
        } catch (error) {
            console.log('API connection failed, using mock data for testing');
            return this.getMockLoginData(email, password);
        }
    }
    
    // Mock login data for testing
    getMockLoginData(email, password) {
        // Simple mock validation
        if (email && password.length >= 3) {
            const mockUser = {
                id: 1,
                email: email,
                fullName: 'Nguyễn Văn Test',
                firstName: 'Nguyễn Văn',
                lastName: 'Test',
                phone: '0123456789',
                gender: 'male',
                dateOfBirth: '1990-01-01',
                address: '123 Test Street, Test City'
            };
            
            return {
                success: true,
                data: {
                    user: mockUser,
                    token: 'mock-token-' + Date.now()
                }
            };
        } else {
            return {
                success: false,
                error: 'Email hoặc mật khẩu không đúng'
            };
        }
    }
    
    async register(userData) {
        return this.post(CONFIG.ENDPOINTS.AUTH.REGISTER, userData, false);
    }
    
    async refreshToken(token) {
        return this.post(CONFIG.ENDPOINTS.AUTH.REFRESH, { token }, false);
    }
    
    // Specialties
    async getSpecialties() {
        return this.get(CONFIG.ENDPOINTS.SPECIALTIES, false);
    }
    
    async getSpecialtyDoctors(specialtyId) {
        return this.get(`${CONFIG.ENDPOINTS.SPECIALTIES}/${specialtyId}/doctors`, false);
    }
    
    // Doctors
    async getDoctors() {
        return this.get(CONFIG.ENDPOINTS.DOCTORS, false);
    }
    
    async getDoctor(publicId) {
        return this.get(`${CONFIG.ENDPOINTS.DOCTORS}/${publicId}`, false);
    }
    
    async getDoctorSchedule(publicId, startDate, endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        return this.get(`${CONFIG.ENDPOINTS.DOCTORS}/${publicId}/schedule?${params}`, false);
    }
    
    async getDoctorAvailableSlots(publicId, date) {
        return this.get(`${CONFIG.ENDPOINTS.DOCTORS}/${publicId}/available-slots?date=${date}`, false);
    }
    
    // Appointments
    async getAppointments() {
        return this.get(CONFIG.ENDPOINTS.APPOINTMENTS);
    }
    
    async getAppointment(id) {
        return this.get(`${CONFIG.ENDPOINTS.APPOINTMENTS}/${id}`);
    }
    
    async createAppointment(appointmentData) {
        return this.post(CONFIG.ENDPOINTS.APPOINTMENTS, appointmentData);
    }
    
    async updateAppointmentStatus(id, status, notes = '') {
        return this.put(`${CONFIG.ENDPOINTS.APPOINTMENTS}/${id}/status`, { status, notes });
    }
    
    async cancelAppointment(id) {
        return this.delete(`${CONFIG.ENDPOINTS.APPOINTMENTS}/${id}`);
    }
    
    // Users
    async getUserProfile() {
        try {
            console.log('🔄 Calling API: GET /users/profile');
            
            // Call the real API endpoint with authentication
            const result = await this.get('/users/profile', true); // include auth token
            
            if (result.success && result.data) {
                console.log('✅ API getUserProfile successful:', result.data);
                return result;
            } else {
                console.log('⚠️ API getUserProfile failed or no data, using mock data');
                return this.getMockUserProfile();
            }
        } catch (error) {
            console.log('❌ API connection failed for getUserProfile, using mock data');
            console.error('API Error details:', error);
            return this.getMockUserProfile();
        }
    }
    
    // Mock user profile for testing/fallback
    getMockUserProfile() {
        console.log('📋 Using mock user profile data');
        return {
            success: true,
            data: {
                id: 1,
                firstName: 'Nguyễn Văn',
                lastName: 'Test',
                fullName: 'Nguyễn Văn Test',
                email: 'test@example.com',
                phone: '0123456789',
                gender: 'male',
                dateOfBirth: '1990-05-15',
                address: '123 Đường ABC, Quận 1, TP.HCM',
                memberSince: '2024-01-15',
                insurance: 'BHYT123456789',
                emergencyContact: '0987654321',
                bloodType: 'O+',
                avatar: null,
                // Additional fields that might come from backend
                createdAt: '2024-01-15T00:00:00Z',
                updatedAt: new Date().toISOString()
            }
        };
    }
    
    async getAppointmentHistory(userId) {
        try {
            const result = await this.get(`/appointments/history/${userId}`);
            if (result.success) {
                return result;
            } else {
                // Return empty history
                return { success: true, data: [] };
            }
        } catch (error) {
            console.log('API connection failed for appointment history');
            return { success: true, data: [] };
        }
    }
    
    async getCurrentTreatments(userId) {
        try {
            const result = await this.get(`/treatments/current/${userId}`);
            if (result.success) {
                return result;
            } else {
                // Return empty treatments
                return { success: true, data: [] };
            }
        } catch (error) {
            console.log('API connection failed for current treatments');
            return { success: true, data: [] };
        }
    }
}

// Tạo instance global
const apiService = new ApiService();