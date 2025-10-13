// Doctors page JavaScript
class DoctorsPage {
    constructor() {
        this.doctors = [];
        this.filteredDoctors = [];
        this.isLoading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDoctors();
        this.updateAuthUI();
    }

    bindEvents() {
        // Search input
        const searchInput = document.getElementById('search-name');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.filterDoctors();
                }, 300);
            });
        }

        // Filter selects
        const specialtyFilter = document.getElementById('filter-specialty');
        const experienceFilter = document.getElementById('filter-experience');
        
        if (specialtyFilter) {
            specialtyFilter.addEventListener('change', () => this.filterDoctors());
        }
        
        if (experienceFilter) {
            experienceFilter.addEventListener('change', () => this.filterDoctors());
        }

        // Enter key support for search
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.filterDoctors();
                }
            });
        }
    }

    async loadDoctors() {
        try {
            this.showLoading();
            
            // Fetch real data from API
            const response = await apiService.getDoctors();
            console.log('API Response:', response);
            
            if (response.success && response.data) {
                this.doctors = this.transformApiData(response.data);
                this.filteredDoctors = [...this.doctors];
                
                // Save to sessionStorage for doctor detail page
                sessionStorage.setItem('doctorsData', JSON.stringify(response.data));
                
                this.renderDoctors();
            } else {
                throw new Error(response.error || 'Failed to load doctors');
            }
            
        } catch (error) {
            console.error('Error loading doctors:', error);
            this.showError('Không thể tải danh sách bác sĩ. Vui lòng thử lại.');
            
            // Fallback to mock data if API fails
            this.doctors = this.getMockDoctors();
            this.filteredDoctors = [...this.doctors];
            this.renderDoctors();
        } finally {
            this.hideLoading();
        }
    }

    transformApiData(apiDoctors) {
        return apiDoctors.map(doctor => ({
            id: doctor.id,
            publicId: doctor.publicId,
            name: doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
            specialty: doctor.specialties && doctor.specialties.length > 0 
                ? doctor.specialties[0].name 
                : 'Tổng quát',
            experience: doctor.yearsOfExperience || 0,
            rating: doctor.averageRating || 0,
            reviewCount: doctor.totalRatings || 0,
            education: 'Đại học Y Hà Nội', // Default value as API doesn't provide this
            hospital: doctor.department || 'HealthySystem Clinic',
            phone: doctor.phone || 'N/A',
            email: doctor.email || 'N/A',
            avatar: doctor.gender === 'F' ? '👩‍⚕️' : '👨‍⚕️',
            description: doctor.description || `Bác sĩ chuyên khoa ${doctor.specialties && doctor.specialties.length > 0 ? doctor.specialties[0].name : 'Tổng quát'}`,
            workingHours: 'T2-T6: 8:00-17:00, T7: 8:00-12:00', // Default value
            title: doctor.title || 'Bác sĩ',
            specialties: doctor.specialties || []
        }));
    }

    getMockDoctors() {
        return [
            {
                id: 1,
                name: 'BS. Nguyễn Văn An',
                specialty: 'Nội khoa',
                experience: 12,
                rating: 4.8,
                reviewCount: 156,
                education: 'Đại học Y Hà Nội',
                hospital: 'Bệnh viện Bạch Mai',
                phone: '0901234567',
                email: 'bs.nguyen.van.an@healthysystem.com',
                avatar: '👨‍⚕️',
                description: 'Chuyên điều trị các bệnh lý nội khoa, tim mạch và tiểu đường.',
                workingHours: 'T2-T6: 8:00-17:00, T7: 8:00-12:00'
            },
            {
                id: 2,
                name: 'BS. Trần Thị Bình',
                specialty: 'Sản phụ khoa',
                experience: 8,
                rating: 4.9,
                reviewCount: 203,
                education: 'Đại học Y TP.HCM',
                hospital: 'Bệnh viện Từ Dũ',
                phone: '0912345678',
                email: 'bs.tran.thi.binh@healthysystem.com',
                avatar: '👩‍⚕️',
                description: 'Chuyên khám thai, sinh thường và các vấn đề sức khỏe phụ nữ.',
                workingHours: 'T2-T7: 7:30-16:30'
            },
            {
                id: 3,
                name: 'BS. Lê Minh Cường',
                specialty: 'Ngoại khoa',
                experience: 15,
                rating: 4.7,
                reviewCount: 128,
                education: 'Đại học Y Huế',
                hospital: 'Bệnh viện Chợ Rẫy',
                phone: '0923456789',
                email: 'bs.le.minh.cuong@healthysystem.com',
                avatar: '👨‍⚕️',
                description: 'Chuyên phẫu thuật nội soi, phẫu thuật ổ bụng và ruột thừa.',
                workingHours: 'T2-T6: 7:00-16:00, T7: 7:00-11:00'
            },
            {
                id: 4,
                name: 'BS. Phạm Thị Dung',
                specialty: 'Nhi khoa',
                experience: 6,
                rating: 4.8,
                reviewCount: 189,
                education: 'Đại học Y Hà Nội',
                hospital: 'Bệnh viện Nhi Trung ương',
                phone: '0934567890',
                email: 'bs.pham.thi.dung@healthysystem.com',
                avatar: '👩‍⚕️',
                description: 'Chuyên điều trị các bệnh lý trẻ em, tiêm chủng và dinh dưỡng.',
                workingHours: 'T2-T6: 8:00-17:00, CN: 8:00-12:00'
            },
            {
                id: 5,
                name: 'BS. Hoàng Văn Em',
                specialty: 'Tai mũi họng',
                experience: 10,
                rating: 4.6,
                reviewCount: 94,
                education: 'Đại học Y Thái Bình',
                hospital: 'Bệnh viện Việt Đức',
                phone: '0945678901',
                email: 'bs.hoang.van.em@healthysystem.com',
                avatar: '👨‍⚕️',
                description: 'Chuyên điều trị các bệnh về tai, mũi, họng và phẫu thuật nội soi.',
                workingHours: 'T2-T7: 8:00-17:00'
            },
            {
                id: 6,
                name: 'BS. Vũ Thị Giang',
                specialty: 'Mắt',
                experience: 7,
                rating: 4.9,
                reviewCount: 167,
                education: 'Đại học Y TP.HCM',
                hospital: 'Bệnh viện Mắt TP.HCM',
                phone: '0956789012',
                email: 'bs.vu.thi.giang@healthysystem.com',
                avatar: '👩‍⚕️',
                description: 'Chuyên điều trị các bệnh về mắt, phẫu thuật cận thị và đục thủy tinh thể.',
                workingHours: 'T2-T6: 8:00-17:00, T7: 8:00-12:00'
            },
            {
                id: 7,
                name: 'BS. Đỗ Minh Hải',
                specialty: 'Tim mạch',
                experience: 18,
                rating: 4.8,
                reviewCount: 142,
                education: 'Đại học Y Hà Nội',
                hospital: 'Viện Tim mạch Việt Nam',
                phone: '0967890123',
                email: 'bs.do.minh.hai@healthysystem.com',
                avatar: '👨‍⚕️',
                description: 'Chuyên điều trị các bệnh lý tim mạch, cao huyết áp và rối loạn lipid máu.',
                workingHours: 'T2-T6: 7:30-16:30'
            },
            {
                id: 8,
                name: 'BS. Ngô Thị Lan',
                specialty: 'Da liễu',
                experience: 5,
                rating: 4.7,
                reviewCount: 113,
                education: 'Đại học Y Dược TP.HCM',
                hospital: 'Bệnh viện Da liễu TP.HCM',
                phone: '0978901234',
                email: 'bs.ngo.thi.lan@healthysystem.com',
                avatar: '👩‍⚕️',
                description: 'Chuyên điều trị các bệnh lý da, mụn trứng cá và thẩm mỹ da.',
                workingHours: 'T2-T7: 8:30-17:30'
            }
        ];
    }

    filterDoctors() {
        const searchName = document.getElementById('search-name')?.value.toLowerCase().trim() || '';
        const filterSpecialty = document.getElementById('filter-specialty')?.value || '';
        const filterExperience = document.getElementById('filter-experience')?.value || '';

        this.filteredDoctors = this.doctors.filter(doctor => {
            // Name filter
            const nameMatch = !searchName || 
                doctor.name.toLowerCase().includes(searchName) ||
                doctor.specialty.toLowerCase().includes(searchName);

            // Specialty filter
            const specialtyMatch = !filterSpecialty || doctor.specialty === filterSpecialty;

            // Experience filter
            let experienceMatch = true;
            if (filterExperience) {
                const experience = doctor.experience;
                switch (filterExperience) {
                    case '1-5':
                        experienceMatch = experience >= 1 && experience <= 5;
                        break;
                    case '5-10':
                        experienceMatch = experience > 5 && experience <= 10;
                        break;
                    case '10+':
                        experienceMatch = experience > 10;
                        break;
                }
            }

            return nameMatch && specialtyMatch && experienceMatch;
        });

        this.renderDoctors();
    }

    renderDoctors() {
        const container = document.getElementById('doctors-grid');
        const noResults = document.getElementById('no-results');

        if (!container) return;

        if (this.filteredDoctors.length === 0) {
            container.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        container.style.display = 'grid';

        container.innerHTML = this.filteredDoctors.map(doctor => {
            const doctorId = doctor.publicId || doctor.id;
            console.log('Rendering doctor card:', doctor.name, 'ID:', doctorId);
            return `
            <div class="doctor-card" onclick="window.doctorsPage && window.doctorsPage.goToDoctorDetail('${doctorId}')" style="cursor: pointer;">
                <div class="doctor-image">
                    ${doctor.avatar}
                </div>
                <div class="doctor-info">
                    <div class="doctor-name">${doctor.name}</div>
                    <div class="doctor-specialty">${doctor.specialty}</div>
                    
                    <div class="doctor-details">
                        <div class="doctor-detail">
                            <span>🎓</span> ${doctor.education}
                        </div>
                        <div class="doctor-detail">
                            <span>🏥</span> ${doctor.hospital}
                        </div>
                        <div class="doctor-detail">
                            <span>📞</span> ${doctor.phone}
                        </div>
                        <div class="doctor-detail">
                            <span>⏰</span> ${doctor.workingHours}
                        </div>
                        <div class="doctor-detail">
                            <span>💼</span> ${doctor.experience} năm kinh nghiệm
                        </div>
                    </div>

                    <div class="doctor-rating">
                        <div class="stars">${this.renderStars(doctor.rating)}</div>
                        <span class="rating-text">${doctor.rating}/5 (${doctor.reviewCount} đánh giá)</span>
                    </div>

                    <div class="doctor-actions">
                        <button class="btn-book" onclick="event.stopPropagation(); window.doctorsPage && window.doctorsPage.bookAppointment('${doctorId}')">
                            📅 Đặt lịch khám
                        </button>
                        <button class="btn-info" onclick="event.stopPropagation(); window.doctorsPage && window.doctorsPage.goToDoctorDetail('${doctorId}')" title="Xem thông tin chi tiết">
                            ℹ️
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        // Add backup event listeners for doctor cards
        this.addDoctorCardEventListeners();
    }

    addDoctorCardEventListeners() {
        const doctorCards = document.querySelectorAll('.doctor-card');
        doctorCards.forEach((card, index) => {
            if (this.filteredDoctors[index]) {
                const doctor = this.filteredDoctors[index];
                const doctorId = doctor.publicId || doctor.id;
                
                // Remove existing click listeners to avoid duplicates
                card.replaceWith(card.cloneNode(true));
                const newCard = document.querySelectorAll('.doctor-card')[index];
                
                // Add click event listener
                newCard.addEventListener('click', (e) => {
                    // Don't trigger if clicking on buttons
                    if (e.target.closest('.doctor-actions')) {
                        return;
                    }
                    console.log('Doctor card clicked:', doctor.name, 'ID:', doctorId);
                    this.goToDoctorDetail(doctorId);
                });
                
                // Make sure buttons still work
                const bookBtn = newCard.querySelector('.btn-book');
                const infoBtn = newCard.querySelector('.btn-info');
                
                if (bookBtn) {
                    bookBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.bookAppointment(doctorId);
                    });
                }
                
                if (infoBtn) {
                    infoBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.goToDoctorDetail(doctorId);
                    });
                }
            }
        });
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

        return stars;
    }

    bookAppointment(doctorId) {
        // Redirect to book appointment page with doctor pre-selected
        if (doctorId) {
            window.location.href = `book-appointment.html?doctor=${doctorId}`;
        } else {
            window.location.href = 'book-appointment.html';
        }
    }

    showDoctorInfo(doctorId) {
        // Redirect to detail page instead of showing alert
        this.goToDoctorDetail(doctorId);
    }

    goToDoctorDetail(doctorId) {
        console.log('goToDoctorDetail called with ID:', doctorId);
        
        if (!doctorId) {
            console.error('Doctor ID is required');
            alert('Lỗi: Không tìm thấy thông tin bác sĩ');
            return;
        }
        
        console.log('Navigating to doctor detail page...');
        
        // Navigate to doctor detail page with the doctor ID
        const url = `doctor-detail.html?id=${encodeURIComponent(doctorId)}`;
        console.log('URL:', url);
        window.location.href = url;
    }

    showLoading() {
        this.isLoading = true;
        const loading = document.getElementById('loading');
        const grid = document.getElementById('doctors-grid');
        const noResults = document.getElementById('no-results');

        if (loading) loading.style.display = 'block';
        if (grid) grid.style.display = 'none';
        if (noResults) noResults.style.display = 'none';
    }

    hideLoading() {
        this.isLoading = false;
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    showError(message) {
        alert(`Lỗi: ${message}`);
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

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global search function
function searchDoctors() {
    if (window.doctorsPage) {
        window.doctorsPage.filterDoctors();
    }
}

// Initialize when page is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing DoctorsPage...');
    window.doctorsPage = new DoctorsPage();
    console.log('DoctorsPage initialized:', window.doctorsPage);
});