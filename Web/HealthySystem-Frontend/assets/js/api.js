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
        return this.post('/auth/login', { email, password }, false);
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
}

// Tạo instance global
const apiService = new ApiService();