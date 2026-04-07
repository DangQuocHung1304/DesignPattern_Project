// Service để gọi API
class ApiService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN)
            || localStorage.getItem('token')
            || localStorage.getItem('authToken');

        if (this.token && !localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN)) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, this.token);
        }
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        }
    }

    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (includeAuth && this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.includeAuth !== false),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const contentType = response.headers.get('content-type');
            let data = null;

            if (contentType && contentType.includes('application/json')) {
                const text = await response.text();
                if (text) {
                    try {
                        data = JSON.parse(text);
                    } catch (parseError) {
                        console.error('Failed to parse JSON:', text);
                        throw new Error('Invalid JSON response from server');
                    }
                }
            } else {
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

    buildFriendlyErrorResult(error, fallbackMessage) {
        return {
            success: false,
            error: error?.message || fallbackMessage,
            status: error?.status || 0
        };
    }

    async executeSafely(operation, fallbackMessage) {
        try {
            const result = await operation();
            if (!result || typeof result.success !== 'boolean') {
                return this.buildFriendlyErrorResult(null, fallbackMessage);
            }

            if (!result.success && !result.error) {
                return {
                    ...result,
                    error: fallbackMessage
                };
            }

            return result;
        } catch (error) {
            console.error('Operation failed:', error);
            return this.buildFriendlyErrorResult(error, fallbackMessage);
        }
    }

    applyPatternUiState(result, options = {}) {
        if (!result || !result.success) {
            return result;
        }

        const state = result.data?.processingState;
        if (!state) {
            return result;
        }

        const targetId = options.containerId || state.skeletonHint || '';
        if (state.isLoading && targetId && typeof window.renderSkeletons === 'function') {
            window.renderSkeletons(targetId, options.skeletonCount || 3);
        }

        if (!state.isLoading && targetId && typeof window.clearSkeletons === 'function') {
            window.clearSkeletons(targetId);
        }

        if (typeof window.handlePatternObserverEvent === 'function') {
            window.handlePatternObserverEvent(result, options.eventName || 'pattern.state.changed');
        }

        return result;
    }

    async fetchPatternBasedData({
        endpoint,
        method = 'GET',
        payload = null,
        includeAuth = true,
        containerId,
        eventName,
        skeletonCount = 3,
        fallbackErrorMessage = 'Không thể xử lý yêu cầu pattern lúc này.'
    }) {
        return this.executeSafely(async () => {
            const requestMethod = method.toUpperCase();
            let result;

            switch (requestMethod) {
                case 'GET':
                    result = await this.get(endpoint, includeAuth);
                    break;
                case 'POST':
                    result = await this.post(endpoint, payload, includeAuth);
                    break;
                case 'PUT':
                    result = await this.put(endpoint, payload, includeAuth);
                    break;
                case 'DELETE':
                    result = await this.delete(endpoint, includeAuth);
                    break;
                default:
                    return {
                        success: false,
                        error: `Unsupported method: ${requestMethod}`,
                        status: 400
                    };
            }

            return this.applyPatternUiState(result, {
                containerId,
                eventName,
                skeletonCount
            });
        }, fallbackErrorMessage);
    }

    async get(endpoint, includeAuth = true) {
        return this.request(endpoint, {
            method: 'GET',
            includeAuth
        });
    }

    async post(endpoint, data, includeAuth = true) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            includeAuth
        });
    }

    async put(endpoint, data, includeAuth = true) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            includeAuth
        });
    }

    async delete(endpoint, includeAuth = true) {
        return this.request(endpoint, {
            method: 'DELETE',
            includeAuth
        });
    }

    async checkHealth() {
        return this.get(CONFIG.ENDPOINTS.HEALTH, false);
    }

    async login(email, password) {
        return this.executeSafely(
            () => this.post('/auth/login', { email, password }, false),
            'Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.'
        );
    }

    async register(userData) {
        return this.post(CONFIG.ENDPOINTS.AUTH.REGISTER, userData, false);
    }

    async refreshToken(token) {
        return this.post(CONFIG.ENDPOINTS.AUTH.REFRESH, { token }, false);
    }

    async getSpecialties() {
        return this.get(CONFIG.ENDPOINTS.SPECIALTIES, false);
    }

    async getSpecialtyDoctors(specialtyId) {
        return this.get(`${CONFIG.ENDPOINTS.SPECIALTIES}/${specialtyId}/doctors`, false);
    }

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

        const query = params.toString();
        const suffix = query ? `?${query}` : '';
        return this.get(`${CONFIG.ENDPOINTS.DOCTORS}/${publicId}/schedule${suffix}`, false);
    }

    async getDoctorAvailableSlots(publicId, date) {
        return this.get(`${CONFIG.ENDPOINTS.DOCTORS}/${publicId}/available-slots?date=${encodeURIComponent(date)}`, false);
    }

    // ==================== APPOINTMENTS APIs ====================
    async getAppointments() {
        return this.executeSafely(
            () => this.get('/appointments', true),
            'Không thể tải danh sách lịch hẹn.'
        );
    }

    async getAppointmentById(appointmentId) {
        return this.executeSafely(
            () => this.get(`/appointments/${appointmentId}`, true),
            'Không thể tải chi tiết lịch hẹn.'
        );
    }

    async getAppointment(appointmentId) {
        return this.getAppointmentById(appointmentId);
    }

    async createAppointment(appointmentData) {
        return this.executeSafely(
            () => this.post('/appointments', appointmentData, true),
            'Không thể tạo lịch hẹn.'
        );
    }

    async createAppointmentForNewPatient(appointmentData) {
        return this.executeSafely(
            () => this.post('/appointments/with-new-patient', appointmentData, true),
            'Không thể tạo lịch hẹn cho bệnh nhân mới.'
        );
    }

    async updateAppointmentStatus(appointmentId, status, notes = null) {
        return this.fetchPatternBasedData({
            endpoint: `/appointments/${appointmentId}/status/pattern`,
            method: 'PUT',
            payload: {
                targetStatus: status,
                notes
            },
            includeAuth: true,
            eventName: 'appointment.status.changed',
            fallbackErrorMessage: 'Không thể cập nhật trạng thái lịch hẹn.'
        });
    }

    async cancelAppointment(appointmentId) {
        return this.executeSafely(
            () => this.delete(`/appointments/${appointmentId}`, true),
            'Không thể hủy lịch hẹn.'
        );
    }

    async rescheduleAppointment(rescheduleData) {
        const { appointmentId, newAppointmentStart, newAppointmentEnd, reason } = rescheduleData;
        return this.executeSafely(
            () => this.put(`/appointments/${appointmentId}/reschedule`, {
                newAppointmentStart,
                newAppointmentEnd,
                reason
            }, true),
            'Không thể đổi lịch hẹn.'
        );
    }

    async getAppointmentHistory(userId) {
        const result = await this.executeSafely(
            () => this.get(`/appointments/history/${userId}`, true),
            'Không thể tải lịch sử lịch hẹn.'
        );

        return result.success ? result : { success: true, data: [] };
    }

    async getDoctorAppointments() {
        return this.getAppointments();
    }

    // ==================== USERS APIs ====================
    async getUserProfile() {
        const result = await this.executeSafely(
            () => this.get('/users/profile', true),
            'Không thể tải hồ sơ người dùng.'
        );

        if (result.success && result.data) {
            return result;
        }

        return this.getMockUserProfile();
    }

    getMockUserProfile() {
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
                createdAt: '2024-01-15T00:00:00Z',
                updatedAt: new Date().toISOString()
            }
        };
    }

    async getCurrentTreatments(userId) {
        const result = await this.executeSafely(
            () => this.get(`/treatments/current/${userId}`, true),
            'Không thể tải thông tin điều trị hiện tại.'
        );

        return result.success ? result : { success: true, data: [] };
    }

    // ==================== SERVICES / NEWS / GUIDES APIs ====================
    async getServices(category = null) {
        const endpoint = category ? `/services?category=${encodeURIComponent(category)}` : '/services';
        return this.executeSafely(
            () => this.get(endpoint, false),
            'Không thể tải danh sách dịch vụ.'
        );
    }

    async getServiceCategories() {
        return this.executeSafely(
            () => this.get('/services/categories', false),
            'Không thể tải danh mục dịch vụ.'
        );
    }

    async getServicePrices(category = null) {
        const endpoint = category ? `/serviceprices?category=${encodeURIComponent(category)}` : '/serviceprices';
        return this.executeSafely(
            () => this.get(endpoint, false),
            'Không thể tải bảng giá dịch vụ.'
        );
    }

    async getServicePriceCategories() {
        return this.executeSafely(
            () => this.get('/serviceprices/categories', false),
            'Không thể tải danh mục bảng giá dịch vụ.'
        );
    }

    async getNews(page = 1, limit = 10, category = null) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (category) {
            params.append('category', category);
        }

        return this.executeSafely(
            () => this.get(`/news?${params.toString()}`, false),
            'Không thể tải danh sách tin tức.'
        );
    }

    async getNewsDetail(newsId) {
        return this.executeSafely(
            () => this.get(`/news/${newsId}`, false),
            'Không thể tải chi tiết tin tức.'
        );
    }

    async getFeaturedNews(limit = 4) {
        return this.executeSafely(
            () => this.get(`/news/featured?limit=${limit}`, false),
            'Không thể tải tin tức nổi bật.'
        );
    }

    async getNewsCategories() {
        return this.executeSafely(
            () => this.get('/news/categories', false),
            'Không thể tải danh mục tin tức.'
        );
    }

    async getGuides(category = null) {
        const endpoint = category ? `/guides?category=${encodeURIComponent(category)}` : '/guides';
        return this.executeSafely(
            () => this.get(endpoint, false),
            'Không thể tải danh sách hướng dẫn.'
        );
    }

    async getGuideDetail(guideId) {
        return this.executeSafely(
            () => this.get(`/guides/${guideId}`, false),
            'Không thể tải chi tiết hướng dẫn.'
        );
    }

    async getGuidesCategories() {
        return this.executeSafely(
            () => this.get('/guides/categories', false),
            'Không thể tải danh mục hướng dẫn.'
        );
    }

    // ==================== PATTERN APIs ====================
    async fetchSecureMedicalHistory(patientCode) {
        return this.fetchPatternBasedData({
            endpoint: `/medicalhistory/secure-summary/${encodeURIComponent(patientCode)}/pattern`,
            method: 'GET',
            includeAuth: true,
            containerId: 'medical-record-secure-summary',
            fallbackErrorMessage: 'Không thể tải hồ sơ bệnh án bảo mật.'
        });
    }

    buildStartExaminationPayload(appointmentIdOrPayload, extraPayload = {}) {
        if (typeof appointmentIdOrPayload === 'object') {
            return appointmentIdOrPayload;
        }

        return {
            appointmentCode: `APT-${appointmentIdOrPayload}`,
            doctorCode: extraPayload.doctorCode || 'DOC-DEMO',
            patientCode: extraPayload.patientCode || 'PAT-DEMO',
            doctorName: extraPayload.doctorName || 'Bac si',
            patientName: extraPayload.patientName || 'Benh nhan',
            currentAppointmentState: extraPayload.currentAppointmentState || 'checked-in',
            symptomSummary: extraPayload.symptomSummary || 'Trieu chung tong quat',
            diagnosis: extraPayload.diagnosis || 'Theo doi ban dau',
            visitTime: extraPayload.visitTime || new Date().toISOString(),
            initialFee: extraPayload.initialFee || 250000,
            consultationFee: extraPayload.consultationFee || 250000,
            labFee: extraPayload.labFee || 0,
            isAfterHours: Boolean(extraPayload.isAfterHours),
            hasInsurance: Boolean(extraPayload.hasInsurance),
            isLoyalPatient: Boolean(extraPayload.isLoyalPatient),
            room: extraPayload.room || 'General',
            prescriptions: extraPayload.prescriptions || [],
            labRequests: extraPayload.labRequests || []
        };
    }

    async startExaminationWorkflow(appointmentIdOrPayload, extraPayload = {}) {
        return this.fetchPatternBasedData({
            endpoint: '/examinations/start/pattern',
            method: 'POST',
            payload: this.buildStartExaminationPayload(appointmentIdOrPayload, extraPayload),
            includeAuth: true,
            containerId: 'examination-workflow-result',
            fallbackErrorMessage: 'Không thể bắt đầu quy trình khám bệnh.'
        });
    }

    async generateTreatmentPlanPattern(planType, payload) {
        return this.fetchPatternBasedData({
            endpoint: `/examinations/treatment-plan/${encodeURIComponent(planType)}/pattern`,
            method: 'POST',
            payload,
            includeAuth: true,
            containerId: 'treatment-plan-result',
            fallbackErrorMessage: 'Không thể tạo phác đồ điều trị.'
        });
    }

    async submitInsuranceClaimPattern(payload) {
        return this.fetchPatternBasedData({
            endpoint: '/examinations/insurance-claim/pattern',
            method: 'POST',
            payload,
            includeAuth: true,
            containerId: 'insurance-claim-result',
            fallbackErrorMessage: 'Không thể gửi hồ sơ bảo hiểm.'
        });
    }

    async previewInvoicePricingPattern(payload) {
        return this.fetchPatternBasedData({
            endpoint: '/invoice/pricing/preview/pattern',
            method: 'POST',
            payload,
            includeAuth: true,
            containerId: 'invoice-pricing-preview',
            fallbackErrorMessage: 'Không thể xem trước chi phí hóa đơn.'
        });
    }

    async payInvoiceWithStrategy(invoiceId, payload) {
        return this.fetchPatternBasedData({
            endpoint: `/invoice/${invoiceId}/pay/pattern`,
            method: 'POST',
            payload,
            includeAuth: true,
            containerId: 'invoice-payment-result',
            fallbackErrorMessage: 'Không thể thanh toán hóa đơn.'
        });
    }

    async createAccountWithFactory(payload) {
        return this.fetchPatternBasedData({
            endpoint: '/account/create/pattern',
            method: 'POST',
            payload,
            includeAuth: true,
            containerId: 'account-creation-result',
            fallbackErrorMessage: 'Không thể tạo tài khoản.'
        });
    }

    async getSystemConfigBySingleton(key) {
        return this.executeSafely(
            () => this.get(`/design-patterns/singleton/config/${encodeURIComponent(key)}/pattern`, true),
            'Không thể tải cấu hình hệ thống.'
        );
    }

    async updateSystemConfigBySingleton(key, value) {
        return this.fetchPatternBasedData({
            endpoint: '/design-patterns/singleton/config/pattern',
            method: 'POST',
            payload: { key, value },
            includeAuth: true,
            containerId: 'singleton-config',
            fallbackErrorMessage: 'Không thể cập nhật cấu hình hệ thống.'
        });
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