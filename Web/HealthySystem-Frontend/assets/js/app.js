// Main application logic
class HealthySystemApp {
    constructor() {
        this.specialties = [];
        this.doctors = [];
        this.appointments = [];
        this.init();
    }
    
    // Initialize application
    async init() {
        console.log('🏥 HealthySystem App Starting...');
        
        // Check API health
        await this.checkApiHealth();
        
        // Load initial data
        await this.loadSpecialties();
        await this.loadDoctors();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ HealthySystem App Ready!');
    }
    
    // Check API health status
    async checkApiHealth() {
        const statusElement = document.getElementById('api-status');
        
        try {
            const response = await apiService.checkHealth();
            
            if (response.success) {
                statusElement.textContent = 'Hoạt động bình thường';
                statusElement.className = 'text-success';
            } else {
                throw new Error('API not responding');
            }
        } catch (error) {
            statusElement.textContent = 'Không kết nối được';
            statusElement.className = 'text-danger';
            Utils.showNotification('Không thể kết nối đến server API', 'error');
        }
    }
    
    // Load specialties
    async loadSpecialties() {
        const container = document.getElementById('specialties-list');
        Utils.showLoading(container);
        
        try {
            const response = await apiService.getSpecialties();
            
            if (response.success && response.data) {
                this.specialties = response.data;
                this.renderSpecialties();
            } else {
                throw new Error('Failed to load specialties');
            }
        } catch (error) {
            console.error('Error loading specialties:', error);
            container.innerHTML = `
                <div class="col-12">
                    <div class="card text-center">
                        <div class="card-body">
                            <p class="text-danger">Không thể tải danh sách chuyên khoa</p>
                            <button class="btn btn-primary" onclick="app.loadSpecialties()">Thử lại</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // Render specialties
    renderSpecialties() {
        const container = document.getElementById('specialties-list');
        
        if (this.specialties.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="card text-center">
                        <div class="card-body">
                            <p>Chưa có dữ liệu chuyên khoa</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        const specialtiesHtml = this.specialties.map(specialty => `
            <div class="col-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${specialty.name}</h5>
                        <p class="card-text">${specialty.description || 'Chuyên khoa ' + specialty.name}</p>
                        <button class="btn btn-primary" onclick="app.viewSpecialtyDoctors(${specialty.id})">
                            Xem thêm
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = specialtiesHtml;
    }
    
    // Load doctors
    async loadDoctors() {
        const container = document.getElementById('doctors-list');
        Utils.showLoading(container);
        
        try {
            const response = await apiService.getDoctors();
            
            if (response.success && response.data) {
                this.doctors = response.data;
                this.renderDoctors();
            } else {
                throw new Error('Failed to load doctors');
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
            container.innerHTML = `
                <div class="col-12">
                    <div class="card text-center">
                        <div class="card-body">
                            <p class="text-danger">Không thể tải danh sách bác sĩ</p>
                            <button class="btn btn-primary" onclick="app.loadDoctors()">Thử lại</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // Render doctors
    renderDoctors() {
        const container = document.getElementById('doctors-list');
        
        if (this.doctors.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="card text-center">
                        <div class="card-body">
                            <p>Chưa có dữ liệu bác sĩ</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        const doctorsHtml = this.doctors.slice(0, 6).map(doctor => `
            <div class="col-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${doctor.title || 'BS.'} ${doctor.fullName}</h5>
                        <p class="card-text">
                            <strong>Chuyên khoa:</strong> ${doctor.specialties.map(s => s.name).join(', ')}<br>
                            <strong>Khoa:</strong> ${doctor.department || 'Không xác định'}<br>
                            <strong>Kinh nghiệm:</strong> ${doctor.yearsOfExperience || 0} năm
                        </p>
                        <div class="mb-2">
                            <span class="text-warning">
                                ${'★'.repeat(Math.floor(doctor.averageRating || 0))}${'☆'.repeat(5 - Math.floor(doctor.averageRating || 0))}
                            </span>
                            <small class="text-muted">(${doctor.totalRatings || 0} đánh giá)</small>
                        </div>
                        <button class="btn btn-primary" onclick="app.viewDoctor('${doctor.publicId}')">
                            Xem chi tiết
                        </button>
                        <button class="btn btn-success btn-sm" onclick="app.bookAppointment('${doctor.publicId}')">
                            Đặt lịch
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = doctorsHtml;
    }
    
    // View specialty doctors
    viewSpecialtyDoctors(specialtyId) {
        // Redirect to specialty detail page
        window.location.href = `specialty-detail.html?id=${specialtyId}`;
    }
    
    // Show doctors modal
    showDoctorsModal(doctors, title) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        ${doctors.map(doctor => `
                            <div class="col-6 mb-3">
                                <div class="card">
                                    <div class="card-body">
                                        <h6>${doctor.title || 'BS.'} ${doctor.fullName}</h6>
                                        <p class="small">
                                            <strong>Khoa:</strong> ${doctor.department || 'Không xác định'}<br>
                                            <strong>Kinh nghiệm:</strong> ${doctor.yearsOfExperience || 0} năm
                                        </p>
                                        <button class="btn btn-primary btn-sm" onclick="app.viewDoctor('${doctor.publicId}')">
                                            Chi tiết
                                        </button>
                                        <button class="btn btn-success btn-sm" onclick="app.bookAppointment('${doctor.publicId}')">
                                            Đặt lịch
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
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
    
    // View doctor details
    async viewDoctor(publicId) {
        // Chuyển đến trang chi tiết bác sĩ
        window.location.href = `doctor-detail.html?id=${publicId}`;
    }
    
    // Show doctor detail modal
    showDoctorDetailModal(doctor) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>${doctor.title || 'BS.'} ${doctor.fullName}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-6">
                            <h5>Thông tin cơ bản</h5>
                            <p><strong>Chuyên khoa:</strong> ${doctor.specialties.map(s => s.name).join(', ')}</p>
                            <p><strong>Khoa:</strong> ${doctor.department || 'Không xác định'}</p>
                            <p><strong>Kinh nghiệm:</strong> ${doctor.yearsOfExperience || 0} năm</p>
                            <p><strong>Email:</strong> ${doctor.email}</p>
                            <p><strong>Số điện thoại:</strong> ${doctor.phone || 'Không có'}</p>
                            
                            <h5>Đánh giá</h5>
                            <div class="mb-2">
                                <span class="text-warning">
                                    ${'★'.repeat(Math.floor(doctor.averageRating || 0))}${'☆'.repeat(5 - Math.floor(doctor.averageRating || 0))}
                                </span>
                                <span class="ml-2">${(doctor.averageRating || 0).toFixed(1)}/5.0 (${doctor.totalRatings || 0} đánh giá)</span>
                            </div>
                        </div>
                        <div class="col-6">
                            <h5>Mô tả</h5>
                            <p>${doctor.description || 'Chưa có mô tả'}</p>
                            
                            ${doctor.ratings && doctor.ratings.length > 0 ? `
                                <h5>Đánh giá gần đây</h5>
                                <div style="max-height: 200px; overflow-y: auto;">
                                    ${doctor.ratings.map(rating => `
                                        <div class="mb-2 p-2 border rounded">
                                            <div class="d-flex justify-content-between">
                                                <strong>${rating.patientName}</strong>
                                                <span class="text-warning">${'★'.repeat(rating.ratingValue)}${'☆'.repeat(5 - rating.ratingValue)}</span>
                                            </div>
                                            <p class="small mb-1">${rating.reviewText || 'Không có nhận xét'}</p>
                                            <small class="text-muted">${Utils.formatDate(rating.createdDate)}</small>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p><em>Chưa có đánh giá</em></p>'}
                        </div>
                    </div>
                    <div class="text-center mt-3">
                        <button class="btn btn-success btn-lg" onclick="app.bookAppointment('${doctor.publicId}')">
                            Đặt lịch khám
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
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
    
    // Book appointment
    bookAppointment(doctorPublicId) {
        // Redirect to book appointment page with doctor pre-selected
        if (doctorPublicId) {
            window.location.href = `book-appointment.html?doctor=${doctorPublicId}`;
        } else {
            window.location.href = 'book-appointment.html';
        }
    }
    
    // Show booking modal
    async showBookingModal(doctorPublicId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>Đặt lịch khám</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="booking-form">
                        <div class="form-group">
                            <label class="form-label">Ngày khám:</label>
                            <input type="date" class="form-control" name="appointmentDate" required min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Khung giờ trống:</label>
                            <div id="available-slots" class="mt-2">
                                <p class="text-muted">Vui lòng chọn ngày để xem khung giờ trống</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Ghi chú:</label>
                            <textarea class="form-control" name="notes" rows="3" placeholder="Mô tả triệu chứng hoặc lý do khám..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" name="isEmergency"> Khám cấp cứu
                            </label>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary" disabled>Đặt lịch</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        let selectedSlot = null;
        
        // Handle date change
        const dateInput = modal.querySelector('input[name="appointmentDate"]');
        dateInput.addEventListener('change', async (e) => {
            const date = e.target.value;
            const slotsContainer = modal.querySelector('#available-slots');
            
            Utils.showLoading(slotsContainer);
            
            try {
                const response = await apiService.getDoctorAvailableSlots(doctorPublicId, date);
                
                if (response.success && response.data) {
                    const slots = response.data;
                    
                    if (slots.length === 0) {
                        slotsContainer.innerHTML = '<p class="text-muted">Không có khung giờ trống cho ngày này</p>';
                    } else {
                        const slotsHtml = slots.map(slot => `
                            <button type="button" class="btn btn-outline btn-sm m-1 slot-btn" 
                                    data-start="${slot.StartTime}" data-end="${slot.EndTime}">
                                ${Utils.formatDate(slot.StartTime, 'dd/mm/yyyy hh:mm')} - ${Utils.formatDate(slot.EndTime, 'hh:mm')}
                            </button>
                        `).join('');
                        
                        slotsContainer.innerHTML = slotsHtml;
                        
                        // Handle slot selection
                        slotsContainer.querySelectorAll('.slot-btn').forEach(btn => {
                            btn.addEventListener('click', () => {
                                // Remove previous selection
                                slotsContainer.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('btn-success'));
                                slotsContainer.querySelectorAll('.slot-btn').forEach(b => b.classList.add('btn-outline'));
                                
                                // Select this slot
                                btn.classList.remove('btn-outline');
                                btn.classList.add('btn-success');
                                
                                selectedSlot = {
                                    start: btn.dataset.start,
                                    end: btn.dataset.end
                                };
                                
                                // Enable submit button
                                modal.querySelector('button[type="submit"]').disabled = false;
                            });
                        });
                    }
                } else {
                    slotsContainer.innerHTML = '<p class="text-danger">Không thể tải khung giờ trống</p>';
                }
            } catch (error) {
                slotsContainer.innerHTML = '<p class="text-danger">Lỗi khi tải khung giờ trống</p>';
            }
        });
        
        // Handle form submission
        const form = modal.querySelector('#booking-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!selectedSlot) {
                Utils.showNotification('Vui lòng chọn khung giờ khám', 'warning');
                return;
            }
            
            const formData = new FormData(form);
            const appointmentData = {
                patientPublicId: authManager.getCurrentUser().publicId,
                doctorPublicId: doctorPublicId,
                appointmentStart: selectedSlot.start,
                appointmentEnd: selectedSlot.end,
                notes: formData.get('notes'),
                isEmergency: formData.get('isEmergency') === 'on'
            };
            
            try {
                const response = await apiService.createAppointment(appointmentData);
                
                if (response.success) {
                    Utils.showNotification('Đặt lịch khám thành công!', 'success');
                    modal.remove();
                    
                    // Reload appointments if user is on appointments page
                    if (typeof window.loadAppointments === 'function') {
                        window.loadAppointments();
                    }
                } else {
                    Utils.showNotification(response.error || 'Không thể đặt lịch khám', 'error');
                }
            } catch (error) {
                Utils.showNotification('Lỗi khi đặt lịch khám', 'error');
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
    
    // Load appointments (for authenticated users)
    async loadAppointments() {
        if (!authManager.isAuthenticated()) {
            return;
        }
        
        const container = document.getElementById('appointments-list');
        Utils.showLoading(container);
        
        try {
            const response = await apiService.getAppointments();
            
            if (response.success && response.data) {
                this.appointments = response.data;
                this.renderAppointments();
            } else {
                throw new Error('Failed to load appointments');
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
            container.innerHTML = `
                <div class="card text-center">
                    <div class="card-body">
                        <p class="text-danger">Không thể tải danh sách lịch hẹn</p>
                        <button class="btn btn-primary" onclick="app.loadAppointments()">Thử lại</button>
                    </div>
                </div>
            `;
        }
    }
    
    // Render appointments
    renderAppointments() {
        const container = document.getElementById('appointments-list');
        
        if (this.appointments.length === 0) {
            container.innerHTML = `
                <div class="card text-center">
                    <div class="card-body">
                        <p>Bạn chưa có lịch hẹn nào</p>
                        <button class="btn btn-primary" onclick="document.getElementById('doctors').scrollIntoView()">
                            Đặt lịch khám ngay
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const appointmentsHtml = this.appointments.map(appointment => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-8">
                            <h5>Khám với ${appointment.doctor.title || 'BS.'} ${appointment.doctor.fullName}</h5>
                            <p>
                                <strong>Thời gian:</strong> ${Utils.formatDate(appointment.appointmentStart, 'dd/mm/yyyy hh:mm')} - ${Utils.formatDate(appointment.appointmentEnd, 'hh:mm')}<br>
                                <strong>Chuyên khoa:</strong> ${appointment.doctor.specialties.map(s => s.name).join(', ')}<br>
                                <strong>Khoa:</strong> ${appointment.doctor.department || 'Không xác định'}<br>
                                <strong>Ghi chú:</strong> ${appointment.notes || 'Không có'}
                            </p>
                        </div>
                        <div class="col-4 text-right">
                            <span class="badge badge-${this.getStatusClass(appointment.status)} mb-2">${this.getStatusText(appointment.status)}</span><br>
                            ${appointment.isEmergency ? '<span class="badge badge-danger">Cấp cứu</span><br>' : ''}
                            <small class="text-muted">Đặt lúc: ${Utils.formatDate(appointment.createdDate, 'dd/mm/yyyy hh:mm')}</small>
                        </div>
                    </div>
                    <div class="text-right mt-2">
                        ${appointment.status === 'scheduled' || appointment.status === 'confirmed' ? `
                            <button class="btn btn-danger btn-sm" onclick="app.cancelAppointment(${appointment.id})">
                                Hủy lịch
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = appointmentsHtml;
    }
    
    // Get status class for badge
    getStatusClass(status) {
        const statusClasses = {
            'scheduled': 'primary',
            'confirmed': 'success',
            'completed': 'info',
            'cancelled': 'danger',
            'no_show': 'warning',
            'rescheduled': 'secondary'
        };
        return statusClasses[status] || 'secondary';
    }
    
    // Get status text
    getStatusText(status) {
        const statusTexts = {
            'scheduled': 'Đã đặt',
            'confirmed': 'Đã xác nhận',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy',
            'no_show': 'Không đến',
            'rescheduled': 'Đã dời lịch'
        };
        return statusTexts[status] || status;
    }
    
    // Cancel appointment
    async cancelAppointment(appointmentId) {
        if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
            return;
        }
        
        try {
            const response = await apiService.cancelAppointment(appointmentId);
            
            if (response.success) {
                Utils.showNotification('Hủy lịch hẹn thành công', 'success');
                this.loadAppointments();
            } else {
                Utils.showNotification('Không thể hủy lịch hẹn', 'error');
            }
        } catch (error) {
            Utils.showNotification('Lỗi khi hủy lịch hẹn', 'error');
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Smooth scrolling for navigation links
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
    }
}

// Global function for loading appointments (referenced in auth.js)
window.loadAppointments = function() {
    if (window.app) {
        window.app.loadAppointments();
    }
};

// Load pricing preview on homepage
async function loadPricingPreview() {
    const pricingContainer = document.getElementById('pricing-preview');
    if (!pricingContainer) return;

    try {
        const response = await apiService.getServices();
        if (response.success && response.data) {
            const servicesData = response.data;
            
            // Take first 3 categories
            const previewCategories = servicesData.slice(0, 3);
            
            pricingContainer.innerHTML = previewCategories.map(category => `
                <div class="col-4">
                    <div class="card">
                        <div class="card-body">
                            <h4 style="color: var(--primary-color); margin-bottom: 15px;">
                                ${getCategoryIcon(category.Category)} ${category.CategoryName}
                            </h4>
                            <ul style="list-style: none; padding: 0;">
                                ${category.Services.slice(0, 4).map(service => `
                                    <li style="padding: 8px 0; border-bottom: 1px solid #f0f2f5;">
                                        <div style="display: flex; justify-content: space-between;">
                                            <span>${service.Name}</span>
                                            <strong style="color: var(--primary-color);">
                                                ${formatCurrency(service.DefaultPrice)}
                                            </strong>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading pricing preview:', error);
    }
}

// Load news on homepage
async function loadNewsPreview() {
    const newsContainer = document.getElementById('news-list');
    if (!newsContainer) return;

    try {
        const response = await apiService.getFeaturedNews(4);
        if (response.success && response.data) {
            const newsList = response.data;
            
            newsContainer.innerHTML = `
                <div class="row">
                    ${newsList.map(news => `
                        <div class="col-3">
                            <div class="card" style="cursor: pointer;" onclick="window.location.href='news-detail.html?id=${news.Id}'">
                                <img src="${news.Image}" alt="${news.Title}" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/400x200?text=News'">
                                <div class="card-body">
                                    <span style="display: inline-block; padding: 4px 10px; background: #e8f5e9; color: #2e7d32; border-radius: 6px; font-size: 12px; margin-bottom: 10px;">
                                        ${news.CategoryName}
                                    </span>
                                    <h4 style="font-size: 18px; margin-bottom: 10px; line-height: 1.4;">${news.Title}</h4>
                                    <p style="color: #6c757d; font-size: 14px; line-height: 1.6;">${news.Summary}</p>
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #6c757d; margin-top: 10px;">
                                        <span><i class="fas fa-user-md"></i> ${news.Author}</span>
                                        <span><i class="fas fa-eye"></i> ${news.Views}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading news preview:', error);
    }
}

// Helper functions
function getCategoryIcon(category) {
    const icons = {
        'consultation': '👨‍⚕️',
        'lab': '🔬',
        'imaging': '📷',
        'procedure': '⚕️',
        'medication': '💊',
        'other': '📋'
    };
    return icons[category] || '📋';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new HealthySystemApp();
    
    // Load homepage sections if on homepage
    if (document.getElementById('pricing-preview')) {
        loadPricingPreview();
    }
    if (document.getElementById('news-list')) {
        loadNewsPreview();
    }
});