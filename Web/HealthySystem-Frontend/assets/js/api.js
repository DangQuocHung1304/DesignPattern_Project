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
            
            // Check if response has content
            const contentType = response.headers.get('content-type');
            let data = null;
            
            // Only parse JSON if content-type is JSON and response has body
            if (contentType && contentType.includes('application/json')) {
                const text = await response.text();
                if (text) {
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        console.error('Failed to parse JSON:', text);
                        throw new Error('Invalid JSON response from server');
                    }
                }
            } else {
                // For non-JSON responses, try to get text
                const text = await response.text();
                if (text) {
                    data = { message: text };
                }
            }
            
            if (!response.ok) {
                const errorMsg = data?.message || `HTTP Error: ${response.status}`;
                const error = new Error(errorMsg);
                error.status = response.status;
                throw error;
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('API Request Error:', error);
            return { 
                success: false, 
                error: error.message,
                status: error.status || 0
            };
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
            console.log('API: Attempting login with email:', email);
            const result = await this.post('/auth/login', { email, password }, false);
            console.log('API: Login result from server:', result);
            console.log('API: result.success:', result.success);
            console.log('API: result.data:', result.data);
            
            return result;
        } catch (error) {
            console.error('API: Connection failed:', error);
            return {
                success: false,
                error: error.message || 'Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.'
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
        const doctorId = (publicId ?? '').toString().trim();
        if (!doctorId || /^(null|undefined|nan)$/i.test(doctorId)) {
            return {
                success: false,
                error: 'Mã bác sĩ không hợp lệ',
                status: 400
            };
        }

        return this.get(`${CONFIG.ENDPOINTS.DOCTORS}/${doctorId}`, false);
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

    // Services (Pricing)
    async getServices(category = null) {
        try {
            const endpoint = category ? `/services?category=${category}` : '/services';
            return await this.get(endpoint, false);
        } catch (error) {
            console.error('Error fetching services:', error);
            return { success: false, error: error.message };
        }
    }

    async getServiceCategories() {
        try {
            return await this.get('/services/categories', false);
        } catch (error) {
            console.error('Error fetching service categories:', error);
            return { success: false, error: error.message };
        }
    }

    // News
    async getNews(page = 1, limit = 10, category = null) {
        try {
            let endpoint = `/news?page=${page}&limit=${limit}`;
            if (category) {
                endpoint += `&category=${category}`;
            }
            return await this.get(endpoint, false);
        } catch (error) {
            console.error('Error fetching news:', error);
            return { success: false, error: error.message };
        }
    }

    async getNewsDetail(newsId) {
        try {
            return await this.get(`/news/${newsId}`, false);
        } catch (error) {
            console.error('Error fetching news detail:', error);
            return { success: false, error: error.message };
        }
    }

    async getFeaturedNews(limit = 4) {
        try {
            return await this.get(`/news/featured?limit=${limit}`, false);
        } catch (error) {
            console.error('Error fetching featured news:', error);
            return { success: false, error: error.message };
        }
    }

    async getNewsCategories() {
        try {
            return await this.get('/news/categories', false);
        } catch (error) {
            console.error('Error fetching news categories:', error);
            return { success: false, error: error.message };
        }
    }

    // Guides
    async getGuides(category = null) {
        try {
            const endpoint = category ? `/guides?category=${category}` : '/guides';
            return await this.get(endpoint, false);
        } catch (error) {
            console.error('Error fetching guides:', error);
            return { success: false, error: error.message };
        }
    }

    async getGuideDetail(guideId) {
        try {
            return await this.get(`/guides/${guideId}`, false);
        } catch (error) {
            console.error('Error fetching guide detail:', error);
            return { success: false, error: error.message };
        }
    }

    async getGuidesCategories() {
        try {
            return await this.get('/guides/categories', false);
        } catch (error) {
            console.error('Error fetching guides categories:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== APPOINTMENTS APIs ====================
    
    // Get all appointments for current user
    async getAppointments() {
        try {
            return await this.get('/appointments', true);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            return { success: false, error: error.message };
        }
    }

    // Get appointment by ID
    async getAppointmentById(appointmentId) {
        try {
            return await this.get(`/appointments/${appointmentId}`, true);
        } catch (error) {
            console.error('Error fetching appointment:', error);
            return { success: false, error: error.message };
        }
    }

    // Create new appointment
    async createAppointment(appointmentData) {
        try {
            return await this.post('/appointments', appointmentData, true);
        } catch (error) {
            console.error('Error creating appointment:', error);
            return { success: false, error: error.message };
        }
    }

    // Create appointment for walk-in patient (new patient without account)
    async createAppointmentForNewPatient(appointmentData) {
        try {
            return await this.post('/appointments/with-new-patient', appointmentData, true);
        } catch (error) {
            console.error('Error creating appointment for new patient:', error);
            return { success: false, error: error.message };
        }
    }

    // Update appointment status
    async updateAppointmentStatus(appointmentId, status, notes = null) {
        try {
            return await this.put(`/appointments/${appointmentId}/status`, { 
                status, 
                notes 
            }, true);
        } catch (error) {
            console.error('Error updating appointment status:', error);
            return { success: false, error: error.message };
        }
    }

    // Cancel appointment
    async cancelAppointment(appointmentId) {
        try {
            return await this.delete(`/appointments/${appointmentId}`, true);
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            return { success: false, error: error.message };
        }
    }

    // Reschedule appointment
    async rescheduleAppointment(rescheduleData) {
        try {
            const { appointmentId, newAppointmentStart, newAppointmentEnd, reason } = rescheduleData;
            return await this.put(`/appointments/${appointmentId}/reschedule`, {
                newAppointmentStart,
                newAppointmentEnd,
                reason
            }, true);
        } catch (error) {
            console.error('Error rescheduling appointment:', error);
            return { success: false, error: error.message };
        }
    }

    // Get appointment history for a user
    async getAppointmentHistory(userId) {
        try {
            return await this.get(`/appointments/history/${userId}`, true);
        } catch (error) {
            console.error('Error fetching appointment history:', error);
            return { success: false, error: error.message };
        }
    }

    // Get doctor's appointments (for doctor dashboard)
    async getDoctorAppointments() {
        try {
            // This will call GET /api/appointments which filters by doctor if logged in as doctor
            return await this.get('/appointments', true);
        } catch (error) {
            console.error('Error fetching doctor appointments:', error);
            return { success: false, error: error.message };
        }
    }
}

// Tạo instance global
const apiService = new ApiService();

// Reusable loading skeleton helper for list containers.
window.renderSkeletons = function(containerId, count = 4) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletonItems = Array.from({ length: count }).map(() => `
        <article class="skeleton-card" aria-hidden="true">
            <div class="skeleton-row">
                <div class="skeleton-line" style="width: 36%; height: 14px;"></div>
                <div class="skeleton-line" style="width: 24%; height: 14px;"></div>
            </div>
            <div class="skeleton-line" style="width: 65%; margin-bottom: 0.55rem;"></div>
            <div class="skeleton-line" style="width: 48%; margin-bottom: 0.55rem;"></div>
            <div class="skeleton-line" style="width: 30%;"></div>
        </article>
    `).join('');

    container.setAttribute('aria-busy', 'true');
    container.innerHTML = `<div class="skeleton-list">${skeletonItems}</div>`;
};

window.clearSkeletons = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.removeAttribute('aria-busy');
};