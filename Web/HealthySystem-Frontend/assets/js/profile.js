class ProfileService {
    constructor() {
        this.currentUser = null;
        this.appointments = [];
        this.treatments = [];
    }

    async loadProfile() {
        try {
            console.log('ProfileService: Starting loadProfile...');
            
            // Check authentication using authManager or localStorage
            const isAuth = (typeof authManager !== 'undefined' && authManager.isAuthenticated()) || 
                          this.checkLocalAuth();
            
            console.log('ProfileService: Auth check result:', isAuth);
            
            if (!isAuth) {
                console.log('ProfileService: Not authenticated, redirecting to login');
                window.location.href = 'login.html';
                return;
            }

            // Get current user from multiple sources
            this.currentUser = this.getCurrentUserData();
            console.log('ProfileService: Current user data:', this.currentUser);
            
            if (!this.currentUser) {
                console.log('ProfileService: No user data found, attempting to fetch from API');
                await this.fetchUserProfile();
            }

            console.log('ProfileService: Loading profile sections...');
            
            // Load sections one by one to identify which one fails
            try {
                await this.loadPersonalInfo();
                console.log('ProfileService: Personal info loaded');
            } catch (error) {
                console.error('ProfileService: Error loading personal info:', error);
            }
            
            try {
                await this.loadMedicalHistory();
                console.log('ProfileService: Medical history loaded');
            } catch (error) {
                console.error('ProfileService: Error loading medical history:', error);
            }
            
            try {
                await this.loadCurrentTreatments();
                console.log('ProfileService: Current treatments loaded');
            } catch (error) {
                console.error('ProfileService: Error loading treatments:', error);
            }
            
            try {
                await this.loadStatistics();
                console.log('ProfileService: Statistics loaded');
            } catch (error) {
                console.error('ProfileService: Error loading statistics:', error);
            }

            console.log('ProfileService: Profile loading completed');

        } catch (error) {
            console.error('ProfileService: Error loading profile:', error);
            this.showError('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
        }
    }

    async fetchUserProfile() {
        try {
            const response = await apiService.getUserProfile();
            
            if (response.success) {
                this.currentUser = response.data;
                // Save to both storage systems
                if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS) {
                    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
                }
                localStorage.setItem('user', JSON.stringify(this.currentUser));
            } else {
                // Use mock data if API fails
                this.currentUser = this.getMockUserData();
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            this.currentUser = this.getMockUserData();
        }
    }

    checkLocalAuth() {
        // Check both CONFIG keys and fallback keys
        let token, user;
        if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS) {
            token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
            user = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        } else {
            token = localStorage.getItem('authToken');
            user = localStorage.getItem('user');
        }
        return !!(token && user);
    }

    getCurrentUserData() {
        // Try to get user from authManager first
        if (typeof authManager !== 'undefined' && authManager.getCurrentUser()) {
            return authManager.getCurrentUser();
        }
        
        // Try CONFIG storage keys
        if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS) {
            const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
            if (userData) {
                try {
                    return JSON.parse(userData);
                } catch (error) {
                    console.error('Error parsing CONFIG user data:', error);
                }
            }
        }
        
        // Try fallback storage key
        const fallbackUserData = localStorage.getItem('user');
        if (fallbackUserData) {
            try {
                return JSON.parse(fallbackUserData);
            } catch (error) {
                console.error('Error parsing fallback user data:', error);
            }
        }
        
        return null;
    }

    getMockUserData() {
        return {
            id: 1,
            firstName: 'Nguyễn Văn',
            lastName: 'Test',
            fullName: 'Nguyễn Văn Test',
            email: 'test@example.com',
            phone: '0123456789',
            gender: 'male',
            dateOfBirth: '1990-05-15',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            avatar: null,
            memberSince: '2024-01-15',
            insurance: 'BHYT123456789',
            emergencyContact: '0987654321',
            bloodType: 'O+'
        };
    }

    loadPersonalInfo() {
        // Get display name
        let displayName = '';
        let firstName = this.currentUser.firstName || '';
        let lastName = this.currentUser.lastName || '';
        
        if (this.currentUser.fullName) {
            displayName = this.currentUser.fullName;
            // Extract first and last name from fullName if not available
            if (!firstName || !lastName) {
                const nameParts = this.currentUser.fullName.split(' ');
                firstName = nameParts.slice(0, -1).join(' ') || 'User';
                lastName = nameParts[nameParts.length - 1] || '';
            }
        } else if (firstName && lastName) {
            displayName = `${firstName} ${lastName}`;
        } else if (this.currentUser.name) {
            displayName = this.currentUser.name;
        } else if (this.currentUser.email) {
            displayName = this.currentUser.email.split('@')[0];
        } else {
            displayName = 'Người dùng';
        }
        
        // Update profile header
        document.getElementById('profile-name').textContent = displayName;
        
        document.getElementById('profile-subtitle').textContent = 
            `Thành viên từ ${this.formatDate(this.currentUser.memberSince || '2024-01-01')}`;

        // Update avatar with initials
        const avatar = document.getElementById('profile-avatar');
        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
        avatar.innerHTML = `<span style="font-weight: bold;">${initials}</span>`;

        // Load personal information grid
        const personalInfoGrid = document.getElementById('personal-info');
        personalInfoGrid.innerHTML = `
            <div class="info-item">
                <span class="info-label">Họ và tên</span>
                <div class="info-value">${this.currentUser.firstName} ${this.currentUser.lastName}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Email</span>
                <div class="info-value">${this.currentUser.email}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Số điện thoại</span>
                <div class="info-value">${this.currentUser.phone}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Giới tính</span>
                <div class="info-value">${this.getGenderText(this.currentUser.gender)}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Ngày sinh</span>
                <div class="info-value">${this.formatDate(this.currentUser.dateOfBirth)}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Nhóm máu</span>
                <div class="info-value">${this.currentUser.bloodType || 'Chưa cập nhật'}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Địa chỉ</span>
                <div class="info-value">${this.currentUser.address}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Bảo hiểm y tế</span>
                <div class="info-value">${this.currentUser.insurance || 'Chưa cập nhật'}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Liên hệ khẩn cấp</span>
                <div class="info-value">${this.currentUser.emergencyContact || 'Chưa cập nhật'}</div>
            </div>
        `;
    }

    async loadMedicalHistory() {
        try {
            const response = await apiService.getAppointmentHistory(this.currentUser.id);
            
            if (response.success) {
                this.appointments = response.data || [];
            } else {
                this.appointments = [];
            }
        } catch (error) {
            console.error('Error loading medical history:', error);
            this.appointments = [];
        }

        this.renderMedicalHistory();
    }

    getMockAppointments() {
        // Return empty array to show "no data" message
        return [];
    }

    getMockAppointmentsWithData() {
        return [
            {
                id: 1,
                date: '2024-12-15',
                time: '14:30',
                doctor: {
                    name: 'BS. Nguyễn Thị Lan',
                    specialization: 'Tim mạch',
                    avatar: null
                },
                status: 'completed',
                diagnosis: 'Khám tổng quát',
                symptoms: 'Đau ngực, khó thở',
                prescription: 'Thuốc hạ huyết áp, nghỉ ngơi',
                notes: 'Bệnh nhân cần theo dõi huyết áp định kỳ',
                cost: 500000
            },
            {
                id: 2,
                date: '2024-11-20',
                time: '10:00',
                doctor: {
                    name: 'BS. Trần Văn Minh',
                    specialization: 'Nội tổng quát',
                    avatar: null
                },
                status: 'completed',
                diagnosis: 'Viêm dạ dày',
                symptoms: 'Đau bụng, buồn nôn',
                prescription: 'Thuốc kháng acid, chế độ ăn nhẹ',
                notes: 'Tái khám sau 2 tuần',
                cost: 300000
            },
            {
                id: 3,
                date: '2024-12-25',
                time: '09:00',
                doctor: {
                    name: 'BS. Lê Thị Hương',
                    specialization: 'Da liễu',
                    avatar: null
                },
                status: 'scheduled',
                diagnosis: null,
                symptoms: 'Khám da định kỳ',
                prescription: null,
                notes: 'Lịch khám sắp tới',
                cost: 400000
            }
        ];
    }

    renderMedicalHistory() {
        const historyContainer = document.getElementById('medical-history');
        
        if (this.appointments.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h4>Chưa có lịch sử khám bệnh</h4>
                    <p>Bạn chưa có lịch hẹn nào. <a href="index.html#services">Đặt lịch khám ngay</a></p>
                </div>
            `;
            return;
        }

        // Sort appointments by date descending
        const sortedAppointments = this.appointments.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        historyContainer.innerHTML = sortedAppointments.map(appointment => `
            <div class="appointment-card ${appointment.status}">
                <div class="appointment-header">
                    <div class="appointment-date">
                        <i class="fas fa-calendar-alt"></i>
                        ${this.formatDateTime(appointment.date, appointment.time)}
                    </div>
                    <span class="appointment-status status-${appointment.status}">
                        ${this.getStatusText(appointment.status)}
                    </span>
                </div>
                
                <div class="doctor-info">
                    <div class="doctor-avatar">
                        ${this.getDoctorInitials(appointment.doctor.name)}
                    </div>
                    <div class="doctor-details">
                        <h6>${appointment.doctor.name}</h6>
                        <small class="text-muted">${appointment.doctor.specialization}</small>
                    </div>
                </div>
                
                <div class="appointment-details">
                    <div class="detail-row">
                        <span class="detail-label">Triệu chứng:</span>
                        <span class="detail-value">${appointment.symptoms}</span>
                    </div>
                    ${appointment.diagnosis ? `
                        <div class="detail-row">
                            <span class="detail-label">Chẩn đoán:</span>
                            <span class="detail-value">${appointment.diagnosis}</span>
                        </div>
                    ` : ''}
                    ${appointment.prescription ? `
                        <div class="detail-row">
                            <span class="detail-label">Đơn thuốc:</span>
                            <span class="detail-value">${appointment.prescription}</span>
                        </div>
                    ` : ''}
                    ${appointment.notes ? `
                        <div class="detail-row">
                            <span class="detail-label">Ghi chú:</span>
                            <span class="detail-value">${appointment.notes}</span>
                        </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Chi phí:</span>
                        <span class="detail-value">${this.formatCurrency(appointment.cost)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadCurrentTreatments() {
        try {
            const response = await apiService.getCurrentTreatments(this.currentUser.id);
            
            if (response.success) {
                this.treatments = response.data || [];
            } else {
                this.treatments = [];
            }
        } catch (error) {
            console.error('Error loading treatments:', error);
            this.treatments = [];
        }

        this.renderCurrentTreatments();
    }

    getMockTreatments() {
        // Return empty array to show "no treatments" message
        return [];
    }

    getMockTreatmentsWithData() {
        // This method can be used for testing with sample data
        return [
            {
                id: 1,
                name: 'Điều trị cao huyết áp',
                doctor: 'BS. Nguyễn Thị Lan',
                startDate: '2024-11-01',
                endDate: '2025-02-01',
                status: 'active',
                progress: 65,
                description: 'Liệu trình điều trị cao huyết áp bằng thuốc và thay đổi lối sống',
                medications: [
                    { name: 'Amlodipine 5mg', dosage: '1 viên/ngày, sau ăn sáng', duration: '3 tháng' },
                    { name: 'Losartan 50mg', dosage: '1 viên/ngày, trước ăn tối', duration: '3tháng' }
                ],
                nextAppointment: '2024-12-30',
                notes: 'Theo dõi huyết áp hàng ngày, tập thể dục nhẹ'
            },
            {
                id: 2,
                name: 'Vật lý trị liệu cột sống',
                doctor: 'BS. Trần Văn Dũng',
                startDate: '2024-12-01',
                endDate: '2025-01-15',
                status: 'active',
                progress: 30,
                description: 'Liệu trình vật lý trị liệu cho đau lưng mãn tính',
                medications: [
                    { name: 'Diclofenac gel', dosage: 'Thoa 2-3 lần/ngày', duration: '2 tuần' }
                ],
                nextAppointment: '2024-12-28',
                notes: 'Tập các bài tập được hướng dẫn 3 lần/tuần'
            }
        ];
    }

    renderCurrentTreatments() {
        const treatmentsContainer = document.getElementById('current-treatments');
        
        if (this.treatments.length === 0) {
            treatmentsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-procedures"></i>
                    <h4>Không có liệu trình điều trị</h4>
                    <p>Bạn hiện tại không có liệu trình điều trị nào đang diễn ra.</p>
                </div>
            `;
            return;
        }

        treatmentsContainer.innerHTML = this.treatments.map(treatment => `
            <div class="treatment-card ${treatment.status}">
                <div class="treatment-header">
                    <h3 class="treatment-title">${treatment.name}</h3>
                    <span class="treatment-status status-${treatment.status}">
                        ${this.getTreatmentStatusText(treatment.status)}
                    </span>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>Bác sĩ điều trị:</strong> ${treatment.doctor}
                    </div>
                    <div class="col-md-6">
                        <strong>Thời gian:</strong> ${this.formatDate(treatment.startDate)} - ${this.formatDate(treatment.endDate)}
                    </div>
                </div>
                
                <p class="text-muted mb-3">${treatment.description}</p>
                
                <div class="progress-section">
                    <div class="progress-label">
                        <span><strong>Tiến độ điều trị</strong></span>
                        <span><strong>${treatment.progress}%</strong></span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" style="width: ${treatment.progress}%"></div>
                    </div>
                </div>
                
                <div class="medication-list">
                    <h6><i class="fas fa-pills"></i> Đơn thuốc:</h6>
                    ${treatment.medications.map(med => `
                        <div class="medication-item">
                            <div class="medication-icon">
                                <i class="fas fa-capsules"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div><strong>${med.name}</strong></div>
                                <small class="text-muted">${med.dosage} - ${med.duration}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="row mt-3">
                    <div class="col-md-6">
                        <strong>Lịch tái khám:</strong> ${this.formatDate(treatment.nextAppointment)}
                    </div>
                    <div class="col-md-6">
                        <small class="text-muted">${treatment.notes}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadStatistics() {
        try {
            // Calculate statistics from loaded data
            const totalAppointments = this.appointments.length;
            const completedAppointments = this.appointments.filter(apt => apt.status === 'completed').length;
            const activeTreatments = this.treatments.filter(treatment => treatment.status === 'active').length;

            console.log('ProfileService: Statistics calculated:', {
                totalAppointments,
                completedAppointments,
                activeTreatments
            });

            // Update statistics display (check if elements exist)
            const totalEl = document.getElementById('total-appointments');
            const completedEl = document.getElementById('completed-appointments');
            const activeEl = document.getElementById('active-treatments');
            
            if (totalEl) totalEl.textContent = totalAppointments;
            if (completedEl) completedEl.textContent = completedAppointments;
            if (activeEl) activeEl.textContent = activeTreatments;
            
            console.log('ProfileService: Statistics elements updated');
        } catch (error) {
            console.error('ProfileService: Error in loadStatistics:', error);
        }
    }

    // Edit profile functionality
    async editProfile() {
        // Populate edit form with current data
        document.getElementById('edit-first-name').value = this.currentUser.firstName;
        document.getElementById('edit-last-name').value = this.currentUser.lastName;
        document.getElementById('edit-phone').value = this.currentUser.phone;
        document.getElementById('edit-email').value = this.currentUser.email;
        document.getElementById('edit-gender').value = this.currentUser.gender;
        document.getElementById('edit-dob').value = this.currentUser.dateOfBirth;
        document.getElementById('edit-address').value = this.currentUser.address;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();
    }

    async saveProfile() {
        try {
            const formData = {
                firstName: document.getElementById('edit-first-name').value,
                lastName: document.getElementById('edit-last-name').value,
                phone: document.getElementById('edit-phone').value,
                gender: document.getElementById('edit-gender').value,
                dateOfBirth: document.getElementById('edit-dob').value,
                address: document.getElementById('edit-address').value
            };

            // Validate form
            if (!formData.firstName || !formData.lastName || !formData.phone) {
                this.showError('Vui lòng điền đầy đủ thông tin bắt buộc.');
                return;
            }

            // Update user object
            Object.assign(this.currentUser, formData);
            
            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(this.currentUser));

            // Try to save to API
            try {
                await apiService.put('/users/profile', formData);
            } catch (error) {
                console.log('API update failed, but local update successful');
            }

            // Refresh display
            this.loadPersonalInfo();
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            modal.hide();
            
            this.showSuccess('Cập nhật hồ sơ thành công!');

        } catch (error) {
            console.error('Error saving profile:', error);
            this.showError('Không thể cập nhật hồ sơ. Vui lòng thử lại.');
        }
    }

    // Utility functions
    formatDate(dateString) {
        if (!dateString) return 'Chưa cập nhật';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    formatDateTime(dateString, timeString) {
        const date = new Date(dateString);
        return `${date.toLocaleDateString('vi-VN')} lúc ${timeString}`;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    getGenderText(gender) {
        const genderMap = {
            'male': 'Nam',
            'female': 'Nữ',
            'other': 'Khác'
        };
        return genderMap[gender] || 'Chưa cập nhật';
    }

    getStatusText(status) {
        const statusMap = {
            'completed': 'Hoàn thành',
            'scheduled': 'Đã đặt lịch',
            'cancelled': 'Đã hủy',
            'in-progress': 'Đang khám'
        };
        return statusMap[status] || status;
    }

    getTreatmentStatusText(status) {
        const statusMap = {
            'active': 'Đang điều trị',
            'completed': 'Hoàn thành',
            'paused': 'Tạm dừng'
        };
        return statusMap[status] || status;
    }

    getDoctorInitials(doctorName) {
        const nameParts = doctorName.split(' ');
        return nameParts.length >= 2 ? 
            `${nameParts[nameParts.length-2].charAt(0)}${nameParts[nameParts.length-1].charAt(0)}` :
            doctorName.charAt(0);
    }

    showSuccess(message) {
        // You can implement a toast notification here
        alert(message);
    }

    showError(message) {
        // You can implement a toast notification here
        alert(message);
    }
}

// Global functions - profileService will be created in profile.html
function editProfile() {
    if (window.profileService) {
        window.profileService.editProfile();
    }
}

function saveProfile() {
    if (window.profileService) {
        window.profileService.saveProfile();
    }
}

// Note: Initialization is handled in profile.html script tag to avoid conflicts