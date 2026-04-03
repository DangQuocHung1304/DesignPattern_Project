class DoctorsPage {
    constructor() {
        this.doctors = [];
        this.filteredDoctors = [];

        this.searchInput = document.getElementById('doctor-search-input');
        this.specialtyFilter = document.getElementById('specialty-filter-select');
        this.experienceFilter = document.getElementById('experience-filter-select');

        this.loadingState = document.getElementById('doctors-loading-state');
        this.errorState = document.getElementById('doctors-error-state');
        this.listCard = document.getElementById('doctors-list-card');
        this.grid = document.getElementById('doctors-grid');
        this.emptyState = document.getElementById('doctors-empty-state');
        this.resultsCount = document.getElementById('doctors-results-count');

        this.init();
    }

    init() {
        this.bindEvents();
        this.syncPublicSidebarAuth();
        this.loadDoctors();
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                clearTimeout(this.searchDebounce);
                this.searchDebounce = setTimeout(() => this.applyFilters(), 200);
            });
        }

        if (this.specialtyFilter) {
            this.specialtyFilter.addEventListener('change', () => this.applyFilters());
        }

        if (this.experienceFilter) {
            this.experienceFilter.addEventListener('change', () => this.applyFilters());
        }

        const retryBtn = document.getElementById('doctors-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.loadDoctors());
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (event) => this.handleLogout(event));
        }
    }

    async loadDoctors() {
        this.showLoading();

        try {
            const response = await apiService.getDoctors();
            const source = this.extractDoctorArray(response);
            this.doctors = this.normalizeDoctors(source);

            if (!this.doctors.length) {
                throw new Error('Không có dữ liệu bác sĩ từ API.');
            }

            this.populateSpecialtyFilter();
            this.applyFilters();
            this.showContent();
        } catch (error) {
            console.error('Doctors load error:', error);
            this.showError();
        }
    }

    extractDoctorArray(response) {
        if (!response) return [];

        if (Array.isArray(response)) return response;
        if (Array.isArray(response.data)) return response.data;

        const payload = response.data || response;
        if (Array.isArray(payload?.items)) return payload.items;
        if (Array.isArray(payload?.doctors)) return payload.doctors;

        return [];
    }

    normalizeDoctors(rows) {
        if (!Array.isArray(rows)) return [];

        return rows.map((doctor) => {
            const specialties = Array.isArray(doctor?.Specialties)
                ? doctor.Specialties
                : (Array.isArray(doctor?.specialties) ? doctor.specialties : []);

            const specialtyNames = specialties
                .map((item) => (item?.name || item?.Name || '').toString().trim())
                .filter(Boolean);

            const fullName = (doctor?.fullName || doctor?.FullName || doctor?.name || `${doctor?.firstName || ''} ${doctor?.lastName || ''}`)
                .toString()
                .trim();

            const experience = Number(doctor?.yearsOfExperience ?? doctor?.YearsOfExperience ?? doctor?.experience ?? 0) || 0;
            const rating = Number(doctor?.averageRating ?? doctor?.AverageRating ?? doctor?.rating ?? 0) || 0;
            const reviews = Number(doctor?.totalRatings ?? doctor?.TotalRatings ?? doctor?.reviewCount ?? 0) || 0;

            const fallbackName = encodeURIComponent(fullName || 'Doctor');
            const profileImage = doctor?.profileImageUrl || doctor?.profileImage || doctor?.avatarUrl || doctor?.Image || doctor?.image || `https://ui-avatars.com/api/?name=${fallbackName}&background=0F172A&color=FFFFFF&size=600`;

            const publicId = doctor?.publicId ?? doctor?.PublicId ?? doctor?.id ?? doctor?.Id ?? null;

            return {
                id: publicId,
                fullName: fullName || 'Bác sĩ',
                title: (doctor?.title || doctor?.Title || 'Bác sĩ').toString().trim(),
                department: (doctor?.department || doctor?.Department || 'Đang cập nhật').toString().trim(),
                specialtyNames,
                primarySpecialty: specialtyNames[0] || 'Tổng quát',
                experience,
                rating,
                reviews,
                phone: (doctor?.phone || doctor?.Phone || 'Đang cập nhật').toString().trim(),
                email: (doctor?.email || doctor?.Email || 'Đang cập nhật').toString().trim(),
                profileImage,
                workingHours: (doctor?.workingHours || doctor?.WorkingHours || 'T2 - T6: 08:00 - 17:00').toString().trim()
            };
        }).filter((doctor) => doctor.id);
    }

    populateSpecialtyFilter() {
        if (!this.specialtyFilter) return;

        const specialties = new Set();
        this.doctors.forEach((doctor) => {
            if (Array.isArray(doctor.specialtyNames) && doctor.specialtyNames.length) {
                doctor.specialtyNames.forEach((name) => specialties.add(name));
            } else {
                specialties.add(doctor.primarySpecialty);
            }
        });

        const sorted = Array.from(specialties).filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi'));

        this.specialtyFilter.innerHTML = '<option value="">Tất cả chuyên khoa</option>';
        sorted.forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            this.specialtyFilter.appendChild(option);
        });
    }

    applyFilters() {
        const search = (this.searchInput?.value || '').toLowerCase().trim();
        const specialty = this.specialtyFilter?.value || '';
        const experience = this.experienceFilter?.value || '';

        this.filteredDoctors = this.doctors.filter((doctor) => {
            const specialtyText = doctor.specialtyNames.join(' ').toLowerCase();
            const baseText = `${doctor.fullName} ${doctor.department} ${doctor.primarySpecialty}`.toLowerCase();

            const matchesSearch = !search || baseText.includes(search) || specialtyText.includes(search);

            const matchesSpecialty = !specialty || doctor.specialtyNames.includes(specialty) || doctor.primarySpecialty === specialty;

            const matchesExperience = this.matchExperience(experience, doctor.experience);

            return matchesSearch && matchesSpecialty && matchesExperience;
        });

        this.renderDoctors();
    }

    matchExperience(filter, years) {
        if (!filter) return true;

        switch (filter) {
            case '0-5':
                return years >= 0 && years <= 5;
            case '6-10':
                return years >= 6 && years <= 10;
            case '11+':
                return years >= 11;
            default:
                return true;
        }
    }

    renderDoctors() {
        if (!this.grid || !this.emptyState || !this.resultsCount) return;

        this.resultsCount.textContent = `${this.filteredDoctors.length} bác sĩ`;

        if (!this.filteredDoctors.length) {
            this.grid.innerHTML = '';
            this.emptyState.style.display = 'block';
            return;
        }

        this.emptyState.style.display = 'none';
        this.grid.innerHTML = this.filteredDoctors.map((doctor) => {
            const stars = this.renderStars(doctor.rating);

            return `
                <article class="doctor-card">
                    <img src="${this.escapeAttribute(doctor.profileImage)}" alt="${this.escapeAttribute(doctor.fullName)}" class="doctor-cover" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=Doctor&background=0F172A&color=FFFFFF&size=600'">
                    <div class="doctor-body">
                        <h4 class="doctor-name">${this.escapeHtml(doctor.title)} ${this.escapeHtml(doctor.fullName)}</h4>
                        <p class="doctor-subtitle">${this.escapeHtml(doctor.primarySpecialty)} - ${this.escapeHtml(doctor.department)}</p>

                        <div class="doctor-meta">
                            <span><i class="fas fa-briefcase-medical"></i> ${doctor.experience} năm kinh nghiệm</span>
                            <span><i class="fas fa-clock"></i> ${this.escapeHtml(doctor.workingHours)}</span>
                            <span><i class="fas fa-phone"></i> ${this.escapeHtml(doctor.phone)}</span>
                        </div>

                        <div class="doctor-rating">
                            <span class="doctor-stars">${this.escapeHtml(stars)}</span>
                            <span>${doctor.rating.toFixed(1)}/5 (${doctor.reviews} đánh giá)</span>
                        </div>

                        <div class="doctor-actions">
                            <button type="button" class="btn btn-brand" data-action="book" data-doctor-id="${this.escapeAttribute(doctor.id)}">Đăng ký lịch khám</button>
                            <button type="button" class="btn btn-soft" data-action="detail" data-doctor-id="${this.escapeAttribute(doctor.id)}">Chi tiết</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        this.bindDoctorActions();
    }

    bindDoctorActions() {
        if (!this.grid) return;

        this.grid.querySelectorAll('button[data-action="book"]').forEach((button) => {
            button.addEventListener('click', () => {
                const doctorId = button.getAttribute('data-doctor-id');
                this.goToAppointment(doctorId);
            });
        });

        this.grid.querySelectorAll('button[data-action="detail"]').forEach((button) => {
            button.addEventListener('click', () => {
                const doctorId = button.getAttribute('data-doctor-id');
                this.goToDoctorDetail(doctorId);
            });
        });
    }

    normalizeDoctorId(rawId) {
        if (rawId === null || rawId === undefined) return null;

        const value = String(rawId).trim();
        if (!value) return null;
        if (/^(null|undefined|nan)$/i.test(value)) return null;

        return value;
    }

    goToAppointment(doctorId) {
        const validDoctorId = this.normalizeDoctorId(doctorId);
        if (!validDoctorId) return;
        window.location.href = `appointment-registration.html?doctor=${encodeURIComponent(validDoctorId)}`;
    }

    goToDoctorDetail(doctorId) {
        const validDoctorId = this.normalizeDoctorId(doctorId);
        if (!validDoctorId) return;
        window.location.href = `doctor-detail.html?id=${encodeURIComponent(validDoctorId)}`;
    }

    renderStars(rating) {
        const score = Math.max(0, Math.min(5, Number(rating) || 0));
        const full = Math.floor(score);
        const empty = 5 - full;
        return `${'★'.repeat(full)}${'☆'.repeat(empty)}`;
    }

    showLoading() {
        if (this.loadingState) this.loadingState.style.display = 'block';
        if (this.errorState) this.errorState.style.display = 'none';
        if (this.listCard) this.listCard.style.display = 'none';

        if (typeof window.renderSkeletons === 'function') {
            window.renderSkeletons('doctors-loading-skeleton', 4);
        } else {
            const fallback = document.getElementById('doctors-loading-skeleton');
            if (fallback) {
                fallback.innerHTML = '<p class="text-muted">Đang tải danh sách bác sĩ...</p>';
            }
        }
    }

    showContent() {
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.errorState) this.errorState.style.display = 'none';
        if (this.listCard) this.listCard.style.display = 'grid';
    }

    showError() {
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.listCard) this.listCard.style.display = 'none';
        if (this.errorState) this.errorState.style.display = 'grid';
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    escapeAttribute(value) {
        return this.escapeHtml(value).replace(/`/g, '&#96;');
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
    window.doctorsPage = new DoctorsPage();
});
