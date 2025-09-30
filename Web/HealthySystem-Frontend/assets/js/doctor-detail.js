// Doctor Detail page JavaScript
class DoctorDetailPage {
    constructor() {
        this.doctor = null;
        this.doctorId = null;
        this.init();
    }

    init() {
        this.getDoctorIdFromUrl();
        this.bindEvents();
        this.loadDoctorDetail();
        this.updateAuthUI();
    }

    getDoctorIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.doctorId = urlParams.get('id');
        
        if (!this.doctorId) {
            this.showError('Không tìm thấy thông tin bác sĩ.');
            return;
        }
    }

    bindEvents() {
        // Book appointment button
        const bookBtn = document.getElementById('btn-book-appointment');
        if (bookBtn) {
            bookBtn.addEventListener('click', () => this.bookAppointment());
        }

        // Call button
        const callBtn = document.getElementById('btn-call');
        if (callBtn) {
            callBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.makeCall();
            });
        }

        // Email button
        const emailBtn = document.getElementById('btn-email');
        if (emailBtn) {
            emailBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendEmail();
            });
        }
    }

    async loadDoctorDetail() {
        try {
            this.showLoading();
            
            // Fetch doctor details from API
            const response = await apiService.getDoctor(this.doctorId);
            console.log('Doctor API Response:', response);
            
            if (response.success && response.data) {
                this.doctor = response.data;
                this.renderDoctorDetail();
            } else {
                throw new Error(response.error || 'Failed to load doctor details');
            }
            
        } catch (error) {
            console.error('Error loading doctor details:', error);
            
            // Try to use fallback data from localStorage or mock data
            this.doctor = this.getFallbackDoctorData();
            if (this.doctor) {
                console.log('Using fallback doctor data');
                this.renderDoctorDetail();
            } else {
                this.showError('Không thể tải thông tin bác sĩ. Vui lòng thử lại.');
            }
        } finally {
            this.hideLoading();
        }
    }

    renderDoctorDetail() {
        if (!this.doctor) return;

        // Update page title
        document.title = `${this.doctor.fullName} - HealthySystem`;

        // Doctor avatar
        const avatar = document.getElementById('doctor-avatar');
        if (avatar) {
            avatar.textContent = this.doctor.gender === 'F' ? '👩‍⚕️' : '👨‍⚕️';
        }

        // Basic information
        this.updateElement('doctor-name', this.doctor.fullName || 'N/A');
        this.updateElement('doctor-title', `${this.doctor.title || 'Bác sĩ'} - ${this.doctor.department || 'Tổng quát'}`);

        // Rating
        const stars = this.renderStars(this.doctor.averageRating || 0);
        this.updateElement('doctor-stars', stars);
        this.updateElement('doctor-rating-text', 
            `${this.doctor.averageRating || 0}/5 (${this.doctor.totalRatings || 0} đánh giá)`);

        // Contact buttons
        const callBtn = document.getElementById('btn-call');
        const emailBtn = document.getElementById('btn-email');
        
        if (callBtn && this.doctor.phone) {
            callBtn.href = `tel:${this.doctor.phone}`;
        }
        
        if (emailBtn && this.doctor.email) {
            emailBtn.href = `mailto:${this.doctor.email}`;
        }

        // Personal information
        this.updateElement('info-fullname', this.doctor.fullName || 'N/A');
        this.updateElement('info-email', this.doctor.email || 'N/A');
        this.updateElement('info-phone', this.doctor.phone || 'N/A');
        this.updateElement('info-gender', this.getGenderText(this.doctor.gender));

        // Professional information
        this.updateElement('info-department', this.doctor.department || 'N/A');
        this.updateElement('info-experience', `${this.doctor.yearsOfExperience || 0} năm`);
        this.updateElement('info-qualifications', this.doctor.qualifications || 'Bác sĩ đa khoa');

        // Specialties
        this.renderSpecialties();

        // Reviews
        this.renderReviews();

        // Show the profile
        this.showProfile();
    }

    renderSpecialties() {
        const container = document.getElementById('info-specialties');
        if (!container || !this.doctor.specialties) return;

        if (this.doctor.specialties.length === 0) {
            container.innerHTML = '<span class="specialty-tag">Tổng quát</span>';
            return;
        }

        const specialtiesHtml = this.doctor.specialties.map(specialty => 
            `<span class="specialty-tag">${specialty.name}</span>`
        ).join('');

        container.innerHTML = specialtiesHtml;
    }

    renderReviews() {
        const container = document.getElementById('reviews-section');
        if (!container) return;

        if (!this.doctor.ratings || this.doctor.ratings.length === 0) {
            container.innerHTML = `
                <div class="info-item">
                    <div class="info-content">
                        <div class="info-value">Chưa có đánh giá nào.</div>
                    </div>
                </div>
            `;
            return;
        }

        const reviewsHtml = this.doctor.ratings.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">${review.patientName || 'Bệnh nhân'}</span>
                    <span class="review-date">${this.formatDate(review.createdDate)}</span>
                </div>
                <div class="review-rating">${this.renderStars(review.ratingValue)}</div>
                <div class="review-text">${review.reviewText || 'Không có nhận xét.'}</div>
            </div>
        `).join('');

        container.innerHTML = reviewsHtml;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '⭐';
        }
        
        if (hasHalfStar) {
            stars += '⭐'; // Using full star for simplicity
        }

        // Fill remaining with empty stars (up to 5)
        const remainingStars = 5 - Math.ceil(rating);
        for (let i = 0; i < remainingStars; i++) {
            stars += '☆';
        }

        return stars;
    }

    getGenderText(gender) {
        switch(gender) {
            case 'M': return 'Nam';
            case 'F': return 'Nữ';
            default: return 'Không xác định';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'N/A';
        }
    }

    updateElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }

    bookAppointment() {
        // Redirect to book appointment page with doctor pre-selected
        const doctorId = this.doctor?.publicId || this.doctorId;
        if (doctorId) {
            window.location.href = `book-appointment.html?doctor=${doctorId}`;
        } else {
            window.location.href = 'book-appointment.html';
        }
    }

    makeCall() {
        if (this.doctor && this.doctor.phone) {
            // The href is already set in renderDoctorDetail
            // This is just for additional confirmation if needed
            if (confirm(`Gọi điện cho ${this.doctor.fullName}?\nSố điện thoại: ${this.doctor.phone}`)) {
                // Let the browser handle the tel: link
                return true;
            }
        } else {
            alert('Không có thông tin số điện thoại.');
        }
        return false;
    }

    sendEmail() {
        if (this.doctor && this.doctor.email) {
            // The href is already set in renderDoctorDetail
            // This is just for additional confirmation if needed
            if (confirm(`Gửi email cho ${this.doctor.fullName}?\nEmail: ${this.doctor.email}`)) {
                // Let the browser handle the mailto: link
                return true;
            }
        } else {
            alert('Không có thông tin email.');
        }
        return false;
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const profile = document.getElementById('doctor-profile');
        const error = document.getElementById('error-message');

        if (loading) loading.style.display = 'block';
        if (profile) profile.style.display = 'none';
        if (error) error.style.display = 'none';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    showProfile() {
        const profile = document.getElementById('doctor-profile');
        if (profile) profile.style.display = 'block';
    }

    showError(message) {
        const loading = document.getElementById('loading');
        const profile = document.getElementById('doctor-profile');
        const error = document.getElementById('error-message');

        if (loading) loading.style.display = 'none';
        if (profile) profile.style.display = 'none';
        if (error) {
            error.style.display = 'block';
            const errorP = error.querySelector('p');
            if (errorP) {
                errorP.textContent = message;
            }
        }
    }

    updateAuthUI() {
        const authLink = document.getElementById('auth-link');
        if (!authLink) return;

        if (AuthManager.isLoggedIn()) {
            const user = AuthManager.getCurrentUser();
            authLink.textContent = user ? `Xin chào, ${user.firstName}` : 'Tài khoản';
            authLink.href = '#';
            authLink.onclick = (e) => {
                e.preventDefault();
                this.showUserMenu();
            };
        } else {
            authLink.textContent = 'Đăng nhập';
            authLink.href = 'login.html';
            authLink.onclick = null;
        }
    }

    showUserMenu() {
        if (confirm('Bạn có muốn đăng xuất không?')) {
            AuthManager.logout();
            window.location.reload();
        }
    }

    getFallbackDoctorData() {
        // Try to get doctor data from the doctors list page (if available)
        const doctorsData = sessionStorage.getItem('doctorsData');
        if (doctorsData) {
            try {
                const doctors = JSON.parse(doctorsData);
                const doctor = doctors.find(d => 
                    d.publicId === this.doctorId || 
                    d.id === this.doctorId || 
                    d.id.toString() === this.doctorId
                );
                if (doctor) {
                    return this.transformDoctorData(doctor);
                }
            } catch (error) {
                console.error('Error parsing doctors data from sessionStorage:', error);
            }
        }

        // Return mock data based on doctor ID
        return this.getMockDoctorData();
    }

    transformDoctorData(doctor) {
        return {
            id: doctor.id,
            publicId: doctor.publicId,
            fullName: doctor.fullName || doctor.name,
            title: doctor.title || 'Bác sĩ',
            department: doctor.department || doctor.specialty,
            email: doctor.email,
            phone: doctor.phone,
            gender: doctor.gender,
            yearsOfExperience: doctor.yearsOfExperience || doctor.experience,
            qualifications: doctor.qualifications || 'Bác sĩ đa khoa',
            averageRating: doctor.averageRating || doctor.rating,
            totalRatings: doctor.totalRatings || doctor.reviewCount,
            specialties: doctor.specialties || [
                { name: doctor.specialty || 'Tổng quát' }
            ],
            ratings: doctor.ratings || []
        };
    }

    getMockDoctorData() {
        // Mock data for demonstration
        const mockDoctors = {
            '8DD4F358-849B-F011-A1CB-F46D3F6043FB': {
                id: 11,
                publicId: '8DD4F358-849B-F011-A1CB-F46D3F6043FB',
                fullName: 'BS. Nguyễn Văn An',
                title: 'Bác sĩ',
                department: 'Nội tổng quát',
                email: 'dr.an@clinic.local',
                phone: '0902000001',
                gender: 'M',
                yearsOfExperience: 3,
                qualifications: 'Bác sĩ đa khoa - Đại học Y Hà Nội',
                averageRating: 5,
                totalRatings: 1,
                specialties: [
                    { name: 'Nội tổng quát' },
                    { name: 'Tim mạch' }
                ],
                ratings: [
                    {
                        patientName: 'Bệnh nhân A',
                        ratingValue: 5,
                        reviewText: 'Bác sĩ rất tận tâm và chuyên nghiệp.',
                        createdDate: '2025-09-25T00:00:00'
                    }
                ]
            },
            '8ED4F358-849B-F011-A1CB-F46D3F6043FB': {
                id: 12,
                publicId: '8ED4F358-849B-F011-A1CB-F46D3F6043FB',
                fullName: 'BS. Trần Thị Bình',
                title: 'Bác sĩ',
                department: 'Nhi khoa',
                email: 'dr.binh@clinic.local',
                phone: '0902000002',
                gender: 'F',
                yearsOfExperience: 4,
                qualifications: 'Bác sĩ chuyên khoa Nhi - Đại học Y TP.HCM',
                averageRating: 4,
                totalRatings: 1,
                specialties: [
                    { name: 'Nhi khoa' }
                ],
                ratings: [
                    {
                        patientName: 'Bệnh nhân B',
                        ratingValue: 4,
                        reviewText: 'Bác sĩ khám rất kỹ cho trẻ em.',
                        createdDate: '2025-09-20T00:00:00'
                    }
                ]
            }
        };

        return mockDoctors[this.doctorId] || null;
    }
}

// Initialize when page is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.doctorDetailPage = new DoctorDetailPage();
});