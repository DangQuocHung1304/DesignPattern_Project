// Specialty Detail page JavaScript
class SpecialtyDetailPage {
    constructor() {
        this.specialty = null;
        this.specialtyId = null;
        this.doctors = [];
        this.init();
    }

    init() {
        this.getSpecialtyIdFromUrl();
        this.bindEvents();
        this.loadSpecialtyDetail();
        this.updateAuthUI();
    }

    getSpecialtyIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.specialtyId = urlParams.get('id');
        
        if (!this.specialtyId) {
            this.showError('Không tìm thấy thông tin chuyên khoa.');
            return;
        }
    }

    bindEvents() {
        // Any additional event binding can be added here
    }

    normalizeSpecialtyName(rawName) {
        const source = (rawName || '').toString().trim();
        if (!source) {
            return 'Tổng quát';
        }

        const cleaned = source.replace(/^chuyên\s*khoa[\s:-]*/i, '').trim();
        return cleaned || 'Tổng quát';
    }

    getDisplaySpecialtyName() {
        if (!this.specialty) {
            return 'Tổng quát';
        }
        return this.normalizeSpecialtyName(this.specialty.name);
    }

    async loadSpecialtyDetail() {
        try {
            this.showLoading();
            
            // Load specialty information and doctors
            await Promise.all([
                this.loadSpecialtyInfo(),
                this.loadSpecialtyDoctors()
            ]);
            
        } catch (error) {
            console.error('Error loading specialty details:', error);
            this.showError('Không thể tải thông tin chuyên khoa. Vui lòng thử lại.');
        } finally {
            this.hideLoading();
        }
    }

    async loadSpecialtyInfo() {
        try {
            // First try to get from API
            const response = await apiService.getSpecialties();
            
            if (response.success && response.data) {
                this.specialty = response.data.find(s => s.id.toString() === this.specialtyId);
                
                if (this.specialty) {
                    this.renderSpecialtyInfo();
                    this.renderArticleContent();
                    return;
                }
            }
            
            // Fallback to mock data
            this.specialty = this.getMockSpecialtyData();
            this.renderSpecialtyInfo();
            this.renderArticleContent();
            
        } catch (error) {
            console.error('Error loading specialty info:', error);
            // Use fallback data
            this.specialty = this.getMockSpecialtyData();
            this.renderSpecialtyInfo();
            this.renderArticleContent();
        }
    }

    async loadSpecialtyDoctors() {
        try {
            this.showDoctorsLoading();
            
            // Try to get doctors for this specialty from API
            const response = await apiService.getSpecialtyDoctors(this.specialtyId);
            
            if (response.success && response.data && response.data.length > 0) {
                this.doctors = response.data;
            } else {
                // Fallback: get all doctors and filter by specialty
                const allDoctorsResponse = await apiService.getDoctors();
                if (allDoctorsResponse.success && allDoctorsResponse.data) {
                    this.doctors = this.filterDoctorsBySpecialty(allDoctorsResponse.data);
                } else {
                    this.doctors = this.getMockDoctorsData();
                }
            }
            
            this.renderDoctors();
            
        } catch (error) {
            console.error('Error loading specialty doctors:', error);
            this.doctors = this.getMockDoctorsData();
            this.renderDoctors();
        } finally {
            this.hideDoctorsLoading();
        }
    }

    filterDoctorsBySpecialty(allDoctors) {
        if (!this.specialty) return [];

        const specialtyName = this.getDisplaySpecialtyName().toLowerCase();
        
        return allDoctors.filter(doctor => {
            if (doctor.specialties && doctor.specialties.length > 0) {
                return doctor.specialties.some(spec => 
                    spec.name.toLowerCase().includes(specialtyName) ||
                    spec.id === this.specialty.id
                );
            }
            return false;
        });
    }

    renderSpecialtyInfo() {
        if (!this.specialty) return;

        const specialtyName = this.getDisplaySpecialtyName();
        const specialtyLabel = `Chuyên khoa ${specialtyName}`;

        // Update page title
        document.title = `${specialtyLabel} - HealthySystem`;

        // Update header information
        this.updateElement('specialty-icon', this.getSpecialtyIcon(this.specialty.name));
        this.updateElement('specialty-title', specialtyLabel);
        this.updateElement('specialty-page-title', specialtyLabel);
        this.updateElement('specialty-page-subtitle', `Thông tin chuyên khoa ${specialtyName} và đội ngũ bác sĩ theo từng lĩnh vực điều trị`);
        this.updateElement('specialty-subtitle', 
            `${specialtyLabel} tại HealthySystem với đội ngũ bác sĩ giàu kinh nghiệm`);

        // Update article title
        this.updateElement('article-title', `${specialtyLabel} tại HealthySystem`);
        
        // Update doctors subtitle
        this.updateElement('doctors-subtitle', 
            `Đội ngũ bác sĩ chuyên khoa ${specialtyName} tận tâm và giàu kinh nghiệm`);

        // Update current date
        const currentDate = new Date().toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        this.updateElement('article-date', currentDate);

        // Show sections
        this.showArticle();
        this.showDoctorsSection();
    }

    renderArticleContent() {
        if (!this.specialty) return;

        const articleContent = this.generateArticleContent(this.specialty);
        const contentElement = document.getElementById('article-content');
        if (contentElement) {
            contentElement.innerHTML = articleContent;
        }

        const statsContent = this.generateStatsContent(this.specialty);
        const statsElement = document.getElementById('stats-grid');
        if (statsElement) {
            statsElement.innerHTML = statsContent;
        }
    }

    generateArticleContent(specialty) {
        const specialtyName = this.normalizeSpecialtyName(specialty.name);

        const articles = {
            'Nội tổng quát': {
                introduction: `Chuyên khoa Nội tổng quát tại HealthySystem là một trong những chuyên khoa nòng cốt, chuyên điều trị các bệnh lý nội khoa phổ biến và phức tạp. Với đội ngũ bác sĩ giàu kinh nghiệm và trang thiết bị hiện đại, chúng tôi cam kết mang đến dịch vụ chăm sóc sức khỏe tốt nhất cho bệnh nhân.`,
                
                services: [
                    'Khám và điều trị các bệnh lý tim mạch',
                    'Điều trị bệnh tiểu đường và rối loạn nội tiết',
                    'Chăm sóc bệnh nhân cao huyết áp',
                    'Điều trị các bệnh lý gan, thận',
                    'Khám sức khỏe tổng quát định kỳ',
                    'Tư vấn dinh dưỡng và lối sống lành mạnh'
                ],
                
                equipment: [
                    'Máy siêu âm tim hiện đại',
                    'Máy đo điện tim 12 cần',
                    'Thiết bị xét nghiệm máu tự động',
                    'Máy đo huyết áp 24h',
                    'Hệ thống theo dõi bệnh nhân liên tục'
                ],
                
                approach: `Tại chuyên khoa Nội tổng quát HealthySystem, chúng tôi áp dụng phương pháp điều trị toàn diện, kết hợp giữa y học hiện đại và sự chăm sóc tận tình. Mỗi bệnh nhân được đánh giá kỹ lưỡng và xây dựng kế hoạch điều trị cá nhân hóa phù hợp với tình trạng sức khỏe và nhu cầu riêng.`
            },
            
            'Tim mạch': {
                introduction: `Chuyên khoa Tim mạch tại HealthySystem được trang bị công nghệ tiên tiến nhất để chẩn đoán và điều trị các bệnh lý tim mạch. Đội ngũ bác sĩ tim mạch của chúng tôi có nhiều năm kinh nghiệm trong việc điều trị các bệnh lý từ đơn giản đến phức tạp.`,
                
                services: [
                    'Siêu âm tim 2D, 3D và Doppler',
                    'Điện tim gắng sức và Holter 24h',
                    'Thông tim chẩn đoán và can thiệp',
                    'Điều trị rối loạn nhịp tim',
                    'Phẫu thuật tim mạch',
                    'Chăm sóc sau phẫu thuật tim'
                ],
                
                equipment: [
                    'Máy siêu âm tim 4D Real-time',
                    'Hệ thống thông tim số hóa',
                    'Máy tạo nhịp tim hiện đại',
                    'Thiết bị theo dõi huyết động',
                    'Phòng mổ tim hybrid'
                ],
                
                approach: `Chúng tôi cam kết áp dụng những phương pháp điều trị tiên tiến nhất, từ can thiệp tim mạch không xâm lấn đến phẫu thuật tim phức tạp. Sự an toàn và hiệu quả điều trị của bệnh nhân luôn được đặt lên hàng đầu.`
            },
            
            'Nhi khoa': {
                introduction: `Chuyên khoa Nhi tại HealthySystem chuyên cung cấp dịch vụ chăm sóc sức khỏe toàn diện cho trẻ em từ sơ sinh đến 18 tuổi. Với môi trường thân thiện và đội ngũ y bác sĩ có chuyên môn cao, chúng tôi đảm bảo trẻ em nhận được sự chăm sóc tốt nhất.`,
                
                services: [
                    'Khám sức khỏe định kỳ cho trẻ em',
                    'Tiêm chủng đầy đủ theo lịch',
                    'Điều trị các bệnh nhiễm trùng thường gặp',
                    'Tư vấn dinh dưỡng và phát triển',
                    'Theo dõi tăng trưởng và phát triển',
                    'Chăm sóc trẻ sơ sinh và trẻ nhỏ'
                ],
                
                equipment: [
                    'Phòng khám nhi thân thiện',
                    'Thiết bị siêu âm chuyên dụng cho trẻ em',
                    'Máy thở và hỗ trợ hô hấp cho trẻ',
                    'Tủ ấm và thiết bị chăm sóc trẻ sơ sinh',
                    'Hệ thống giải trí cho trẻ em'
                ],
                
                approach: `Chúng tôi hiểu rằng việc chăm sóc trẻ em đòi hỏi sự kiên nhẫn, tình yêu thương và chuyên môn cao. Đội ngũ bác sĩ nhi khoa của chúng tôi không chỉ điều trị bệnh mà còn tạo môi trường thoải mái để trẻ em cảm thấy an toàn và tin tưởng.`
            }
        };

        const defaultArticle = {
            introduction: `Chuyên khoa ${specialtyName} tại HealthySystem là một trong những chuyên khoa quan trọng, cung cấp dịch vụ chăm sóc sức khỏe chất lượng cao với đội ngũ bác sĩ giàu kinh nghiệm và trang thiết bị hiện đại.`,
            
            services: [
                `Khám và điều trị các bệnh lý thuộc chuyên khoa ${specialtyName}`,
                'Tư vấn và hướng dẫn chăm sóc sức khỏe',
                'Theo dõi và điều trị dài hạn',
                'Khám sức khỏe định kỳ',
                'Dịch vụ cấp cứu 24/7'
            ],
            
            equipment: [
                'Thiết bị chẩn đoán hiện đại',
                'Máy móc y tế tiên tiến',
                'Phòng khám được trang bị đầy đủ',
                'Hệ thống theo dõi bệnh nhân',
                'Công nghệ y tế số hóa'
            ],
            
            approach: `Tại HealthySystem, chúng tôi luôn đặt bệnh nhân làm trung tâm và áp dụng phương pháp điều trị cá nhân hóa, kết hợp giữa chuyên môn cao và sự chăm sóc tận tình để mang đến kết quả điều trị tốt nhất.`
        };

        const article = articles[specialtyName] || defaultArticle;

        return `
            <p>${article.introduction}</p>
            
            <h3>🩺 Dịch vụ chuyên môn</h3>
            <p>Chuyên khoa ${specialtyName} tại HealthySystem cung cấp đầy đủ các dịch vụ chuyên môn:</p>
            <ul>
                ${article.services.map(service => `<li>${service}</li>`).join('')}
            </ul>
            
            <div class="highlight-box">
                <h4>🎯 Cam kết chất lượng</h4>
                <p>Chúng tôi cam kết mang đến dịch vụ y tế chất lượng cao với chi phí hợp lý, luôn đặt sự hài lòng và sức khỏe của bệnh nhân lên hàng đầu.</p>
            </div>
            
            <h3>🏥 Trang thiết bị hiện đại</h3>
            <p>Phòng khám được đầu tư trang thiết bị y tế hiện đại:</p>
            <ul>
                ${article.equipment.map(equipment => `<li>${equipment}</li>`).join('')}
            </ul>
            
            <h3>👨‍⚕️ Phương pháp điều trị</h3>
            <p>${article.approach}</p>
            
            <h3>📞 Đặt lịch khám</h3>
            <p>Để đặt lịch khám tại chuyên khoa ${specialtyName}, quý khách có thể:</p>
            <ul>
                <li>Gọi điện trực tiếp: <strong>1900 2115</strong></li>
                <li>Đặt lịch online qua website</li>
                <li>Đến trực tiếp tại phòng khám</li>
                <li>Liên hệ qua các bác sĩ chuyên khoa bên dưới</li>
            </ul>
        `;
    }

    generateStatsContent(specialty) {
        const specialtyName = this.normalizeSpecialtyName(specialty.name);

        const stats = {
            'Nội tổng quát': [
                { number: '500+', label: 'Bệnh nhân khám/tháng' },
                { number: '98%', label: 'Tỷ lệ hài lòng' },
                { number: '15+', label: 'Năm kinh nghiệm' },
                { number: '24/7', label: 'Hỗ trợ cấp cứu' }
            ],
            'Tim mạch': [
                { number: '300+', label: 'Ca can thiệp/năm' },
                { number: '99%', label: 'Tỷ lệ thành công' },
                { number: '20+', label: 'Năm kinh nghiệm' },
                { number: '5', label: 'Bác sĩ chuyên môn cao' }
            ],
            'Nhi khoa': [
                { number: '800+', label: 'Trẻ em khám/tháng' },
                { number: '100%', label: 'An toàn cho trẻ' },
                { number: '12+', label: 'Năm kinh nghiệm' },
                { number: '95%', label: 'Phụ huynh hài lòng' }
            ]
        };

        const defaultStats = [
            { number: '200+', label: 'Bệnh nhân/tháng' },
            { number: '95%', label: 'Tỷ lệ hài lòng' },
            { number: '10+', label: 'Năm kinh nghiệm' },
            { number: '24/7', label: 'Hỗ trợ y tế' }
        ];

        const specialtyStats = stats[specialtyName] || defaultStats;

        return specialtyStats.map(stat => `
            <div class="stat-item">
                <span class="stat-number">${stat.number}</span>
                <div class="stat-label">${stat.label}</div>
            </div>
        `).join('');
    }

    renderDoctors() {
        const container = document.getElementById('doctors-grid');
        if (!container) return;

        const specialtyName = this.getDisplaySpecialtyName();

        if (this.doctors.length === 0) {
            this.showNoDoctors();
            return;
        }

        container.innerHTML = this.doctors.map(doctor => {
            const doctorId = this.resolveDoctorId(doctor);
            const hasValidDoctorId = Boolean(doctorId);
            const encodedDoctorId = hasValidDoctorId ? encodeURIComponent(doctorId) : '';
            const rating = doctor.averageRating || doctor.rating || 0;
            const reviewCount = doctor.totalRatings || doctor.reviewCount || 0;
            
            return `
                <div class="doctor-card" ${hasValidDoctorId ? `onclick="specialtyDetailPage.goToDoctorDetail('${doctorId}')"` : ''}>
                    <div class="doctor-image">
                        ${doctor.gender === 'F' ? '👩‍⚕️' : '👨‍⚕️'}
                    </div>
                    <div class="doctor-info">
                        <div class="doctor-name">${doctor.fullName || doctor.name}</div>
                        <div class="doctor-title">${doctor.title || 'Bác sĩ'} - ${doctor.department || specialtyName}</div>
                        
                        <div class="doctor-details">
                            <div class="doctor-detail">
                                <span>📞</span> ${doctor.phone || 'N/A'}
                            </div>
                            <div class="doctor-detail">
                                <span>💼</span> ${doctor.yearsOfExperience || doctor.experience || 0} năm kinh nghiệm
                            </div>
                            <div class="doctor-detail">
                                <span>🏥</span> ${doctor.department || specialtyName}
                            </div>
                        </div>

                        <div class="doctor-rating">
                            <div class="stars">${this.renderStars(rating)}</div>
                            <span class="rating-text">${rating}/5 (${reviewCount} đánh giá)</span>
                        </div>

                        <div class="doctor-actions">
                            <a href="${hasValidDoctorId ? `doctor-detail.html?id=${encodedDoctorId}` : '#'}" class="btn-view-profile" ${hasValidDoctorId ? '' : 'onclick="event.preventDefault(); return false;"'}>
                                Xem hồ sơ
                            </a>
                            <button class="btn-book" ${hasValidDoctorId ? `onclick="event.stopPropagation(); specialtyDetailPage.bookAppointment('${doctorId}')"` : 'disabled'}>
                                📅
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '⭐';
        }
        
        // Fill remaining with empty stars (up to 5)
        const remainingStars = 5 - fullStars;
        for (let i = 0; i < remainingStars; i++) {
            stars += '☆';
        }
        
        return stars;
    }

    normalizeDoctorId(rawId) {
        if (rawId === null || rawId === undefined) return null;

        const value = String(rawId).trim();
        if (!value) return null;
        if (/^(null|undefined|nan)$/i.test(value)) return null;

        return value;
    }

    resolveDoctorId(doctor) {
        return this.normalizeDoctorId(
            doctor?.publicId ?? doctor?.PublicId ?? doctor?.id ?? doctor?.Id ?? doctor?.userId ?? doctor?.UserId
        );
    }

    goToDoctorDetail(doctorId) {
        const validDoctorId = this.normalizeDoctorId(doctorId);
        if (!validDoctorId) {
            console.error('Doctor ID is invalid');
            return;
        }
        
        window.location.href = `doctor-detail.html?id=${encodeURIComponent(validDoctorId)}`;
    }

    bookAppointment(doctorId) {
        // Redirect to book appointment page with doctor pre-selected
        const validDoctorId = this.normalizeDoctorId(doctorId);
        if (validDoctorId) {
            window.location.href = `book-appointment.html?doctor=${encodeURIComponent(validDoctorId)}`;
        } else {
            window.location.href = 'book-appointment.html';
        }
    }

    getSpecialtyIcon(specialtyName) {
        const icons = {
            'Nội tổng quát': '🩺',
            'Tim mạch': '❤️',
            'Nhi khoa': '👶',
            'Tai mũi họng': '👂',
            'Mắt': '👁️',
            'Da liễu': '🧴',
            'Chẩn đoán hình ảnh': '📷',
            'Xét nghiệm': '🔬'
        };
        
        return icons[specialtyName] || '🏥';
    }

    getMockSpecialtyData() {
        const mockSpecialties = {
            '6': { id: 6, name: 'Nội tổng quát', description: 'Khám và điều trị bệnh nội khoa' },
            '7': { id: 7, name: 'Tim mạch', description: 'Chẩn đoán và điều trị bệnh tim mạch' },
            '8': { id: 8, name: 'Nhi khoa', description: 'Chăm sóc sức khỏe trẻ em' },
            '9': { id: 9, name: 'Xét nghiệm', description: 'Khoa xét nghiệm' },
            '10': { id: 10, name: 'Chẩn đoán hình ảnh', description: 'X-quang, siêu âm, CT, MRI' }
        };
        
        return mockSpecialties[this.specialtyId] || { 
            id: this.specialtyId, 
            name: 'Tổng quát', 
            description: 'Chuyên khoa y tế' 
        };
    }

    getMockDoctorsData() {
        // Return doctors based on specialty
        const mockDoctorsBySpecialty = {
            '6': [ // Nội tổng quát
                {
                    id: 11,
                    publicId: '8DD4F358-849B-F011-A1CB-F46D3F6043FB',
                    fullName: 'BS. Nguyễn Văn An',
                    gender: 'M',
                    phone: '0902000001',
                    yearsOfExperience: 3,
                    department: 'Nội tổng quát',
                    averageRating: 5,
                    totalRatings: 1
                }
            ],
            '8': [ // Nhi khoa
                {
                    id: 12,
                    publicId: '8ED4F358-849B-F011-A1CB-F46D3F6043FB',
                    fullName: 'BS. Trần Thị Bình',
                    gender: 'F',
                    phone: '0902000002',
                    yearsOfExperience: 4,
                    department: 'Nhi khoa',
                    averageRating: 4,
                    totalRatings: 1
                }
            ]
        };
        
        return mockDoctorsBySpecialty[this.specialtyId] || [];
    }

    updateElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const article = document.getElementById('article-section');
        const doctors = document.getElementById('doctors-section');
        const error = document.getElementById('error-message');

        if (loading) loading.style.display = 'block';
        if (article) article.style.display = 'none';
        if (doctors) doctors.style.display = 'none';
        if (error) error.style.display = 'none';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    showArticle() {
        const article = document.getElementById('article-section');
        if (article) article.style.display = 'block';
    }

    showDoctorsSection() {
        const doctors = document.getElementById('doctors-section');
        if (doctors) doctors.style.display = 'block';
    }

    showDoctorsLoading() {
        const loading = document.getElementById('doctors-loading');
        const grid = document.getElementById('doctors-grid');
        const noDoctors = document.getElementById('no-doctors');

        if (loading) loading.style.display = 'block';
        if (grid) grid.style.display = 'none';
        if (noDoctors) noDoctors.style.display = 'none';
    }

    hideDoctorsLoading() {
        const loading = document.getElementById('doctors-loading');
        if (loading) loading.style.display = 'none';
        
        const grid = document.getElementById('doctors-grid');
        if (grid) grid.style.display = 'grid';
    }

    showNoDoctors() {
        const grid = document.getElementById('doctors-grid');
        const noDoctors = document.getElementById('no-doctors');

        if (grid) grid.style.display = 'none';
        if (noDoctors) noDoctors.style.display = 'block';
    }

    showError(message) {
        const loading = document.getElementById('loading');
        const article = document.getElementById('article-section');
        const doctors = document.getElementById('doctors-section');
        const error = document.getElementById('error-message');

        if (loading) loading.style.display = 'none';
        if (article) article.style.display = 'none';
        if (doctors) doctors.style.display = 'none';
        if (error) {
            error.style.display = 'block';
            const errorP = error.querySelector('p');
            if (errorP) {
                errorP.textContent = message;
            }
        }
    }

    updateAuthUI() {
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

    showUserMenu() {
        // User menu is handled via sidebar links on this page.
    }
}

// Initialize when page is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing SpecialtyDetailPage...');
    window.specialtyDetailPage = new SpecialtyDetailPage();
    console.log('SpecialtyDetailPage initialized:', window.specialtyDetailPage);
});