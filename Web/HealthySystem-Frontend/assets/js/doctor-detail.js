class DoctorDetailPage {
    constructor() {
        this.doctor = null;
        this.doctorId = null;

        this.init();
    }

    init() {
        this.doctorId = this.getDoctorIdFromUrl();
        this.bindEvents();
        this.syncPublicSidebarAuth();

        if (!this.doctorId) {
            this.showError('Không tìm thấy mã bác sĩ trong URL.');
            return;
        }

        this.loadDoctorDetail();
    }

    getDoctorIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return this.normalizeDoctorId(
            params.get('id') || params.get('doctor') || params.get('doctorId') || params.get('publicId')
        );
    }

    normalizeDoctorId(rawId) {
        if (rawId === null || rawId === undefined) return null;

        const value = String(rawId).trim();
        if (!value) return null;
        if (/^(null|undefined|nan)$/i.test(value)) return null;

        return value;
    }

    bindEvents() {
        const retryButton = document.getElementById('doctor-retry-btn');
        if (retryButton) {
            retryButton.addEventListener('click', () => this.loadDoctorDetail());
        }

        const bookButton = document.getElementById('btn-book-appointment');
        if (bookButton) {
            bookButton.addEventListener('click', () => this.bookAppointment());
        }

        const callBtn = document.getElementById('btn-call');
        if (callBtn) {
            callBtn.addEventListener('click', (event) => this.makeCall(event));
        }

        const emailBtn = document.getElementById('btn-email');
        if (emailBtn) {
            emailBtn.addEventListener('click', (event) => this.sendEmail(event));
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (event) => this.handleLogout(event));
        }
    }

    async loadDoctorDetail() {
        this.doctorId = this.normalizeDoctorId(this.doctorId) || this.getDoctorIdFromUrl();
        if (!this.doctorId) {
            this.showError('Mã bác sĩ không hợp lệ. Vui lòng quay lại danh sách bác sĩ và thử lại.');
            return;
        }

        this.showLoading();

        try {
            const response = await apiService.getDoctor(this.doctorId);
            const normalized = this.normalizeDoctor(response?.data || response);

            if (!normalized.fullName) {
                throw new Error('Dữ liệu bác sĩ không hợp lệ.');
            }

            this.doctor = normalized;
            this.renderDoctorDetail();
            this.showProfile();
        } catch (error) {
            console.error('Doctor detail load error:', error);

            const fallbackDoctor = await this.getFallbackDoctorDataAsync();
            if (fallbackDoctor) {
                this.doctor = fallbackDoctor;
                this.renderDoctorDetail();
                this.showProfile();
                return;
            }

            this.showError('Không thể tải thông tin bác sĩ. Vui lòng thử lại sau.');
        } finally {
            this.hideLoading();
        }
    }

    normalizeDoctor(raw) {
        const source = raw && raw.data ? raw.data : raw;
        const doctor = source || {};

        const specialtiesRaw = Array.isArray(doctor.Specialties)
            ? doctor.Specialties
            : (Array.isArray(doctor.specialties) ? doctor.specialties : []);

        const ratingsRaw = Array.isArray(doctor.Ratings)
            ? doctor.Ratings
            : (Array.isArray(doctor.ratings) ? doctor.ratings : []);

        const fullName = (doctor.fullName || doctor.FullName || doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`)
            .toString()
            .trim();

        const years = Number(
            doctor.yearsOfExperience ?? doctor.YearsOfExperience ?? doctor.experience ?? 0
        );

        const averageRating = Number(
            doctor.averageRating ?? doctor.AverageRating ?? doctor.rating ?? 0
        );

        const totalRatings = Number(
            doctor.totalRatings ?? doctor.TotalRatings ?? doctor.reviewCount ?? ratingsRaw.length ?? 0
        );

        const normalizedSpecialties = specialtiesRaw
            .map((item) => {
                if (typeof item === 'string') {
                    return { name: item.trim() };
                }

                return {
                    id: item?.id ?? item?.Id ?? null,
                    name: (item?.name || item?.Name || '').toString().trim()
                };
            })
            .filter((item) => item.name);

        const normalizedRatings = ratingsRaw.map((rating) => ({
            patientName: (rating?.patientName || rating?.PatientName || rating?.author || 'Bệnh nhân').toString().trim(),
            ratingValue: Number(rating?.ratingValue ?? rating?.RatingValue ?? rating?.rating ?? 0) || 0,
            reviewText: (rating?.reviewText || rating?.ReviewText || rating?.comment || '').toString().trim(),
            createdDate: rating?.createdDate || rating?.CreatedDate || rating?.date || null
        }));

        return {
            id: doctor.id ?? doctor.Id ?? null,
            publicId: doctor.publicId ?? doctor.PublicId ?? doctor.id ?? doctor.Id ?? null,
            fullName,
            title: (doctor.title || doctor.Title || 'Bác sĩ').toString().trim(),
            department: (doctor.department || doctor.Department || doctor.specialty || doctor.Specialty || 'Tổng quát').toString().trim(),
            email: (doctor.email || doctor.Email || '').toString().trim(),
            phone: (doctor.phone || doctor.Phone || '').toString().trim(),
            gender: (doctor.gender || doctor.Gender || '').toString().trim().toUpperCase(),
            yearsOfExperience: Number.isFinite(years) ? years : 0,
            qualifications: (doctor.qualifications || doctor.Qualifications || doctor.degree || 'Bác sĩ đa khoa').toString().trim(),
            averageRating: Number.isFinite(averageRating) ? averageRating : 0,
            totalRatings: Number.isFinite(totalRatings) ? totalRatings : 0,
            profileImage: doctor.profileImageUrl || doctor.profileImage || doctor.avatarUrl || doctor.Image || doctor.image || '',
            specialties: normalizedSpecialties,
            ratings: normalizedRatings,
            schedule: this.normalizeSchedule(doctor.schedules || doctor.Schedules || doctor.workingHours || null)
        };
    }

    normalizeSchedule(rawSchedule) {
        if (Array.isArray(rawSchedule) && rawSchedule.length > 0) {
            return rawSchedule.map((item) => {
                const day = item?.day || item?.Day || item?.dayOfWeek || item?.DayOfWeek || 'Lịch làm việc';
                const start = item?.startTime || item?.StartTime || item?.from || '';
                const end = item?.endTime || item?.EndTime || item?.to || '';
                const time = start || end ? `${start || '--:--'} - ${end || '--:--'}` : (item?.time || item?.Time || 'Đang cập nhật');
                return { day: day.toString(), time: time.toString() };
            });
        }

        if (typeof rawSchedule === 'string' && rawSchedule.trim()) {
            return [{ day: 'Lịch làm việc', time: rawSchedule.trim() }];
        }

        return [
            { day: 'Thứ 2 - Thứ 6', time: '08:00 - 17:00' },
            { day: 'Thứ 7', time: '08:00 - 12:00' },
            { day: 'Chủ nhật', time: 'Nghỉ' }
        ];
    }

    renderDoctorDetail() {
        if (!this.doctor) return;

        const doctorName = this.doctor.fullName || 'Bác sĩ';
        const doctorTitle = `${this.doctor.title || 'Bác sĩ'} - ${this.doctor.department || 'Tổng quát'}`;

        this.updateText('doctor-name', doctorName);
        this.updateText('doctor-title', doctorTitle);
        this.updateText('doctor-page-title', doctorName);
        this.updateText('doctor-page-subtitle', `Thông tin chi tiết, lịch làm việc và đánh giá của ${doctorName}.`);

        this.updateText('doctor-stars', this.renderStars(this.doctor.averageRating));
        this.updateText('doctor-rating-text', `${this.doctor.averageRating.toFixed(1)}/5 (${this.doctor.totalRatings} đánh giá)`);

        this.updateText('info-fullname', doctorName);
        this.updateText('info-email', this.doctor.email || 'Đang cập nhật');
        this.updateText('info-phone', this.doctor.phone || 'Đang cập nhật');
        this.updateText('info-gender', this.getGenderText(this.doctor.gender));
        this.updateText('info-department', this.doctor.department || 'Đang cập nhật');
        this.updateText('info-experience', `${this.doctor.yearsOfExperience || 0} năm`);
        this.updateText('info-qualifications', this.doctor.qualifications || 'Đang cập nhật');

        this.renderDoctorImage();
        this.renderSpecialties();
        this.renderSchedule();
        this.renderReviews();
        this.bindContactLinks();

        document.title = `${doctorName} - HealthySystem`;
    }

    renderDoctorImage() {
        const imageElement = document.getElementById('doctor-image');
        const avatarElement = document.getElementById('doctor-avatar');
        if (!imageElement || !avatarElement) return;

        const fallbackName = encodeURIComponent(this.doctor.fullName || 'Doctor');
        const fallback = `https://ui-avatars.com/api/?name=${fallbackName}&background=0F172A&color=FFFFFF&size=600`;

        const profileImage = this.doctor.profileImage || fallback;
        imageElement.src = profileImage;
        imageElement.alt = `Ảnh ${this.doctor.fullName || 'bác sĩ'}`;
        imageElement.onerror = function() {
            this.src = fallback;
        };

        avatarElement.textContent = this.doctor.gender === 'F' ? '👩‍⚕️' : '👨‍⚕️';
    }

    renderSpecialties() {
        const container = document.getElementById('info-specialties');
        if (!container) return;

        if (!Array.isArray(this.doctor.specialties) || this.doctor.specialties.length === 0) {
            container.innerHTML = '<span class="specialty-tag">Tổng quát</span>';
            return;
        }

        container.innerHTML = this.doctor.specialties
            .map((specialty) => `<span class="specialty-tag">${this.escapeHtml(specialty.name)}</span>`)
            .join('');
    }

    renderSchedule() {
        const tbody = document.getElementById('schedule-table-body');
        if (!tbody) return;

        const schedule = Array.isArray(this.doctor.schedule) && this.doctor.schedule.length
            ? this.doctor.schedule
            : this.normalizeSchedule(null);

        tbody.innerHTML = schedule.map((item) => `
            <tr>
                <td>${this.escapeHtml(item.day)}</td>
                <td>${this.escapeHtml(item.time)}</td>
            </tr>
        `).join('');
    }

    renderReviews() {
        const container = document.getElementById('reviews-section');
        if (!container) return;

        if (!Array.isArray(this.doctor.ratings) || this.doctor.ratings.length === 0) {
            container.innerHTML = '<div class="empty-message">Chưa có đánh giá nào.</div>';
            return;
        }

        container.innerHTML = this.doctor.ratings.map((review) => `
            <article class="review-item">
                <div class="review-header">
                    <span class="review-author">${this.escapeHtml(review.patientName || 'Bệnh nhân')}</span>
                    <span class="review-date">${this.escapeHtml(this.formatDate(review.createdDate))}</span>
                </div>
                <div class="review-rating">${this.escapeHtml(this.renderStars(review.ratingValue || 0))}</div>
                <p class="review-text">${this.escapeHtml(review.reviewText || 'Không có nhận xét.')}</p>
            </article>
        `).join('');
    }

    bindContactLinks() {
        const callBtn = document.getElementById('btn-call');
        const emailBtn = document.getElementById('btn-email');

        if (callBtn) {
            if (this.doctor.phone) {
                callBtn.href = `tel:${this.doctor.phone}`;
            } else {
                callBtn.href = '#';
            }
        }

        if (emailBtn) {
            if (this.doctor.email) {
                emailBtn.href = `mailto:${this.doctor.email}`;
            } else {
                emailBtn.href = '#';
            }
        }
    }

    renderStars(rating) {
        const score = Math.max(0, Math.min(5, Number(rating) || 0));
        const full = Math.floor(score);
        const empty = 5 - full;
        return `${'★'.repeat(full)}${'☆'.repeat(empty)}`;
    }

    getGenderText(gender) {
        switch ((gender || '').toUpperCase()) {
            case 'M':
            case 'MALE':
                return 'Nam';
            case 'F':
            case 'FEMALE':
                return 'Nữ';
            default:
                return 'Không xác định';
        }
    }

    updateText(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    bookAppointment() {
        const doctorPublicId = this.doctor?.publicId || this.doctorId;
        if (doctorPublicId) {
            window.location.href = `book-appointment.html?doctor=${encodeURIComponent(doctorPublicId)}`;
            return;
        }

        window.location.href = 'book-appointment.html';
    }

    makeCall(event) {
        if (!this.doctor?.phone) {
            event.preventDefault();
            alert('Bác sĩ này chưa cập nhật số điện thoại.');
        }
    }

    sendEmail(event) {
        if (!this.doctor?.email) {
            event.preventDefault();
            alert('Bác sĩ này chưa cập nhật email.');
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const profile = document.getElementById('doctor-profile');
        const error = document.getElementById('error-message');

        if (loading) loading.style.display = 'block';
        if (profile) profile.style.display = 'none';
        if (error) error.style.display = 'none';

        if (typeof window.renderSkeletons === 'function') {
            window.renderSkeletons('doctor-loading-skeleton', 4);
        } else {
            const fallback = document.getElementById('doctor-loading-skeleton');
            if (fallback) {
                fallback.innerHTML = '<p class="text-muted">Đang tải thông tin bác sĩ...</p>';
            }
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    showProfile() {
        const profile = document.getElementById('doctor-profile');
        if (profile) profile.style.display = 'grid';
    }

    showError(message) {
        const loading = document.getElementById('loading');
        const profile = document.getElementById('doctor-profile');
        const error = document.getElementById('error-message');

        if (loading) loading.style.display = 'none';
        if (profile) profile.style.display = 'none';
        if (error) {
            error.style.display = 'grid';
            const content = error.querySelector('p');
            if (content) {
                content.textContent = message;
            }
        }

        this.updateText('doctor-page-title', 'Không thể tải hồ sơ bác sĩ');
        this.updateText('doctor-page-subtitle', 'Vui lòng thử lại hoặc quay về trang danh sách bác sĩ.');
    }

    async getFallbackDoctorDataAsync() {
        const fromSession = this.findInSessionStorage();
        if (fromSession) {
            return fromSession;
        }

        try {
            const listResponse = await apiService.getDoctors();
            const doctors = Array.isArray(listResponse?.data) ? listResponse.data : [];
            const matched = this.findDoctorById(doctors, this.doctorId);
            if (matched) {
                return this.transformDoctorData(matched);
            }
        } catch (error) {
            console.warn('Fallback API getDoctors failed:', error);
        }

        return this.getMockDoctorData();
    }

    findInSessionStorage() {
        const raw = sessionStorage.getItem('doctorsData');
        if (!raw) return null;

        try {
            const doctors = JSON.parse(raw);
            if (!Array.isArray(doctors)) return null;

            const matched = this.findDoctorById(doctors, this.doctorId);
            return matched ? this.transformDoctorData(matched) : null;
        } catch (error) {
            console.warn('SessionStorage doctorsData parse failed:', error);
            return null;
        }
    }

    findDoctorById(doctors, targetId) {
        if (!Array.isArray(doctors)) return null;

        return doctors.find((doctor) => {
            return this.areIdsEqual(doctor?.publicId, targetId) || this.areIdsEqual(doctor?.id, targetId);
        }) || null;
    }

    areIdsEqual(a, b) {
        if (a === undefined || a === null || b === undefined || b === null) return false;
        return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    }

    transformDoctorData(doctor) {
        return this.normalizeDoctor({
            ...doctor,
            fullName: doctor.fullName || doctor.name,
            department: doctor.department || doctor.specialty,
            yearsOfExperience: doctor.yearsOfExperience || doctor.experience,
            averageRating: doctor.averageRating || doctor.rating,
            totalRatings: doctor.totalRatings || doctor.reviewCount,
            specialties: doctor.specialties || [{ name: doctor.specialty || 'Tổng quát' }]
        });
    }

    getMockDoctorData() {
        const mockDoctors = {
            '8dd4f358-849b-f011-a1cb-f46d3f6043fb': {
                publicId: '8DD4F358-849B-F011-A1CB-F46D3F6043FB',
                fullName: 'BS. Nguyễn Văn An',
                title: 'Bác sĩ',
                department: 'Nội tổng quát',
                email: 'dr.an@clinic.local',
                phone: '0902000001',
                gender: 'M',
                yearsOfExperience: 8,
                qualifications: 'Bác sĩ đa khoa - Đại học Y Hà Nội',
                averageRating: 4.9,
                totalRatings: 37,
                specialties: [{ name: 'Nội tổng quát' }, { name: 'Tim mạch' }],
                ratings: [
                    {
                        patientName: 'Bệnh nhân A',
                        ratingValue: 5,
                        reviewText: 'Bác sĩ thăm khám kỹ và tư vấn rất dễ hiểu.',
                        createdDate: '2026-03-15T00:00:00'
                    }
                ]
            },
            '8ed4f358-849b-f011-a1cb-f46d3f6043fb': {
                publicId: '8ED4F358-849B-F011-A1CB-F46D3F6043FB',
                fullName: 'BS. Trần Thị Bình',
                title: 'Bác sĩ',
                department: 'Nhi khoa',
                email: 'dr.binh@clinic.local',
                phone: '0902000002',
                gender: 'F',
                yearsOfExperience: 6,
                qualifications: 'Bác sĩ chuyên khoa Nhi - Đại học Y Dược TP.HCM',
                averageRating: 4.8,
                totalRatings: 28,
                specialties: [{ name: 'Nhi khoa' }],
                ratings: [
                    {
                        patientName: 'Bệnh nhân B',
                        ratingValue: 5,
                        reviewText: 'Rất tận tâm với trẻ nhỏ, hướng dẫn chăm sóc rõ ràng.',
                        createdDate: '2026-03-10T00:00:00'
                    }
                ]
            }
        };

        const key = String(this.doctorId || '').trim().toLowerCase();
        const matched = mockDoctors[key];
        return matched ? this.normalizeDoctor(matched) : null;
    }

    formatDate(value) {
        if (!value) return 'đang cập nhật';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'đang cập nhật';

        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    syncPublicSidebarAuth() {
        const loginBtn = document.getElementById('login-btn');
        const userMenu = document.getElementById('user-menu');
        const userDisplayName = document.getElementById('user-display-name');
        const logoutBtn = document.getElementById('logout-btn');

        const configUserKey = (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS)
            ? CONFIG.STORAGE_KEYS.USER
            : null;

        const storedUser = localStorage.getItem(configUserKey || 'user') || localStorage.getItem('user');
        let user = null;

        if (storedUser) {
            try {
                user = JSON.parse(storedUser);
            } catch (error) {
                user = null;
            }
        }

        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userDisplayName) {
                userDisplayName.textContent = user.fullName || user.name || user.email || 'Tài khoản';
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    handleLogout(event) {
        event.preventDefault();

        if (window.authManager && typeof window.authManager.logout === 'function') {
            window.authManager.logout();
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEYS) {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
                localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
            }
        }

        this.syncPublicSidebarAuth();
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.doctorDetailPage = new DoctorDetailPage();
});