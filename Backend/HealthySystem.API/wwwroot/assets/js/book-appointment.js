// Book Appointment JavaScript
class BookAppointmentPage {
    constructor() {
        this.currentStep = 1;
        this.selectedDoctor = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.doctors = [];
        this.specialties = [];
        this.availableSlots = [];
        this.appointmentData = {};
        
        this.init();
    }

    async init() {
        console.log('🏥 Book Appointment Page Starting...');
        
        // Load initial data
        await this.loadDoctors();
        await this.loadSpecialties();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check if user is logged in and pre-fill data
        this.checkUserLogin();
        
        // Check for pre-selected doctor from URL
        this.checkPreSelectedDoctor();
        
        console.log('✅ Book Appointment Page Ready!');
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('next-to-step2').addEventListener('click', () => this.goToStep(2));
        document.getElementById('next-to-step3').addEventListener('click', () => this.goToStep(3));
        document.getElementById('next-to-step4').addEventListener('click', () => this.goToStep(4));
        
        document.getElementById('back-to-step1').addEventListener('click', () => this.goToStep(1));
        document.getElementById('back-to-step2').addEventListener('click', () => this.goToStep(2));
        document.getElementById('back-to-step3').addEventListener('click', () => this.goToStep(3));
        
        // Confirm appointment
        document.getElementById('confirm-appointment').addEventListener('click', () => this.confirmAppointment());
        
        // Search and filter
        document.getElementById('doctor-search').addEventListener('input', () => this.filterDoctors());
        document.getElementById('specialty-filter').addEventListener('change', () => this.filterDoctors());
        
        // Form validation
        document.getElementById('patient-info-form').addEventListener('input', () => this.validateStep3());
    }

    checkUserLogin() {
        const user = authService.getCurrentUser();
        if (user) {
            // Pre-fill user data
            document.getElementById('patient-name').value = user.fullName || '';
            document.getElementById('patient-phone').value = user.phone || '';
            document.getElementById('patient-email').value = user.email || '';
            document.getElementById('patient-dob').value = user.dateOfBirth || '';
            document.getElementById('patient-gender').value = user.gender || '';
            document.getElementById('patient-address').value = user.address || '';
        }
    }

    checkPreSelectedDoctor() {
        const urlParams = new URLSearchParams(window.location.search);
        const doctorId = urlParams.get('doctor');
        
        if (doctorId) {
            // Wait a bit for doctors to load, then select the pre-selected doctor
            setTimeout(() => {
                this.selectDoctor(doctorId);
            }, 1000);
        }
    }

    async loadDoctors() {
        this.showLoading(true);
        
        try {
            const response = await apiService.getDoctors();
            
            if (response.success && response.data) {
                console.log('Loaded doctors from API:', response.data);
                this.doctors = this.transformDoctorData(response.data);
                this.renderDoctors();
            } else {
                console.log('API failed, using mock doctors');
                this.doctors = this.getMockDoctors();
                this.renderDoctors();
                this.showError('Không thể tải danh sách bác sĩ. Đang hiển thị dữ liệu mẫu.');
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
            console.log('Using mock doctors due to error');
            this.doctors = this.getMockDoctors();
            this.renderDoctors();
            this.showError('Lỗi kết nối. Đang hiển thị dữ liệu mẫu.');
        } finally {
            this.showLoading(false);
        }
    }

    async loadSpecialties() {
        try {
            const response = await apiService.getSpecialties();
            
            if (response.success && response.data) {
                this.specialties = response.data;
                this.renderSpecialtyFilter();
            } else {
                this.specialties = this.getMockSpecialties();
                this.renderSpecialtyFilter();
            }
        } catch (error) {
            console.error('Error loading specialties:', error);
            this.specialties = this.getMockSpecialties();
            this.renderSpecialtyFilter();
        }
    }

    transformDoctorData(apiDoctors) {
        return apiDoctors.map(doctor => ({
            id: doctor.publicId,
            name: `${doctor.title || 'BS.'} ${doctor.fullName}`,
            specialty: doctor.specialties?.[0]?.name || 'Đa khoa',
            department: doctor.department || 'Khoa Nội',
            experience: doctor.yearsOfExperience || 5,
            rating: doctor.rating || 4.5,
            consultationFee: doctor.consultationFee || 200000,
            avatar: doctor.avatar || 'assets/images/default-doctor.jpg',
            phone: doctor.phone,
            email: doctor.email,
            description: doctor.bio || 'Bác sĩ giàu kinh nghiệm trong lĩnh vực chuyên môn.'
        }));
    }

    getMockDoctors() {
        return [
            {
                id: 'BS001',
                name: 'BS. Nguyễn Văn An',
                specialty: 'Nội tổng quát',
                department: 'Khoa Nội',
                experience: 10,
                rating: 4.8,
                consultationFee: 250000,
                avatar: 'assets/images/default-doctor.jpg',
                phone: '0901234567',
                email: 'bs.nguyen@healthysystem.vn',
                description: 'Chuyên gia về bệnh lý nội khoa với hơn 10 năm kinh nghiệm.'
            },
            {
                id: 'BS002',
                name: 'BS. Trần Thị Bình',
                specialty: 'Tim mạch',
                department: 'Khoa Tim mạch',
                experience: 8,
                rating: 4.7,
                consultationFee: 300000,
                avatar: 'assets/images/default-doctor.jpg',
                phone: '0901234568',
                email: 'bs.tran@healthysystem.vn',
                description: 'Bác sĩ chuyên khoa tim mạch với nhiều năm kinh nghiệm điều trị.'
            },
            {
                id: 'BS003',
                name: 'BS. Lê Văn Cường',
                specialty: 'Nhi khoa',
                department: 'Khoa Nhi',
                experience: 12,
                rating: 4.9,
                consultationFee: 280000,
                avatar: 'assets/images/default-doctor.jpg',
                phone: '0901234569',
                email: 'bs.le@healthysystem.vn',
                description: 'Chuyên gia nhi khoa với tình yêu và sự tận tâm với trẻ em.'
            }
        ];
    }

    getMockSpecialties() {
        return [
            { id: 1, name: 'Nội tổng quát' },
            { id: 2, name: 'Tim mạch' },
            { id: 3, name: 'Nhi khoa' },
            { id: 4, name: 'Da liễu' },
            { id: 5, name: 'Mắt' }
        ];
    }

    renderSpecialtyFilter() {
        const select = document.getElementById('specialty-filter');
        select.innerHTML = '<option value="">Tất cả chuyên khoa</option>';
        
        this.specialties.forEach(specialty => {
            const option = document.createElement('option');
            option.value = specialty.name;
            option.textContent = specialty.name;
            select.appendChild(option);
        });
    }

    renderDoctors(doctorsToRender = null) {
        const container = document.getElementById('doctors-list');
        const doctors = doctorsToRender || this.doctors;
        
        if (doctors.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-user-md fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Không tìm thấy bác sĩ phù hợp</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = doctors.map(doctor => `
            <div class="doctor-card" data-doctor-id="${doctor.id}">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${doctor.avatar}" alt="${doctor.name}" class="rounded-circle" style="width: 60px; height: 60px; object-fit: cover;">
                    </div>
                    <div class="col-md-7">
                        <h6 class="mb-1">${doctor.name}</h6>
                        <p class="text-muted mb-1">
                            <i class="fas fa-stethoscope"></i> ${doctor.specialty} - ${doctor.department}
                        </p>
                        <p class="text-muted mb-1">
                            <i class="fas fa-star text-warning"></i> ${doctor.rating} 
                            <span class="ms-2"><i class="fas fa-user-clock"></i> ${doctor.experience} năm kinh nghiệm</span>
                        </p>
                        <p class="small text-muted mb-0">${doctor.description}</p>
                    </div>
                    <div class="col-md-3 text-end">
                        <p class="fw-bold text-primary mb-2">${this.formatCurrency(doctor.consultationFee)}</p>
                        <small class="text-muted">Phí khám</small>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click events
        container.querySelectorAll('.doctor-card').forEach(card => {
            card.addEventListener('click', () => {
                const doctorId = card.dataset.doctorId;
                this.selectDoctor(doctorId);
            });
        });
    }

    filterDoctors() {
        const searchTerm = document.getElementById('doctor-search').value.toLowerCase();
        const selectedSpecialty = document.getElementById('specialty-filter').value;
        
        let filtered = this.doctors.filter(doctor => {
            const matchesSearch = doctor.name.toLowerCase().includes(searchTerm) ||
                                doctor.specialty.toLowerCase().includes(searchTerm);
            const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
            
            return matchesSearch && matchesSpecialty;
        });
        
        this.renderDoctors(filtered);
    }

    selectDoctor(doctorId) {
        // Remove previous selection
        document.querySelectorAll('.doctor-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked card
        const selectedCard = document.querySelector(`[data-doctor-id="${doctorId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            this.selectedDoctor = this.doctors.find(d => d.id === doctorId);
            document.getElementById('next-to-step2').disabled = false;
        }
    }

    async goToStep(step) {
        if (step === 2 && !this.selectedDoctor) {
            this.showError('Vui lòng chọn bác sĩ');
            return;
        }
        
        if (step === 3 && (!this.selectedDate || !this.selectedTime)) {
            this.showError('Vui lòng chọn ngày và giờ khám');
            return;
        }
        
        if (step === 4 && !this.validateStep3()) {
            this.showError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Show target step
        document.getElementById(`step${step}`).style.display = 'block';
        
        // Update step indicators
        this.updateStepIndicators(step);
        
        // Load data for specific steps
        if (step === 2) {
            this.renderCalendar();
        } else if (step === 4) {
            this.renderAppointmentSummary();
        }
        
        this.currentStep = step;
    }

    updateStepIndicators(currentStep) {
        for (let i = 1; i <= 4; i++) {
            const indicator = document.getElementById(`step${i}-indicator`);
            indicator.classList.remove('active', 'completed');
            
            if (i < currentStep) {
                indicator.classList.add('completed');
            } else if (i === currentStep) {
                indicator.classList.add('active');
            }
        }
    }

    renderCalendar() {
        const container = document.getElementById('calendar-container');
        if (!this.currentCalendarDate) {
            this.currentCalendarDate = new Date();
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        // First day of the month and last day
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
        
        const monthNames = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        
        container.innerHTML = `
            <div class="calendar-header d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-outline-primary btn-sm" id="prev-month-btn">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h6 class="mb-0">${monthNames[month]} ${year}</h6>
                <button class="btn btn-outline-primary btn-sm" id="next-month-btn">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-weekdays mb-2" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.25rem;">
                <div class="text-center small fw-bold">CN</div>
                <div class="text-center small fw-bold">T2</div>
                <div class="text-center small fw-bold">T3</div>
                <div class="text-center small fw-bold">T4</div>
                <div class="text-center small fw-bold">T5</div>
                <div class="text-center small fw-bold">T6</div>
                <div class="text-center small fw-bold">T7</div>
            </div>
            <div class="calendar-grid">
                ${this.generateCalendarDays(startDate, lastDay, today, month)}
            </div>
        `;
        
        // Add event listeners for navigation buttons
        document.getElementById('prev-month-btn').addEventListener('click', () => this.previousMonth());
        document.getElementById('next-month-btn').addEventListener('click', () => this.nextMonth());
        
        // Add event listeners for calendar days
        container.querySelectorAll('.calendar-day:not(.disabled):not(.other-month)').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                this.selectDate(dateStr);
            });
        });
    }

    generateCalendarDays(startDate, lastDay, today, currentMonth) {
        const days = [];
        const date = new Date(startDate);
        
        for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
            const isCurrentMonth = date.getMonth() === currentMonth;
            const isPast = date < today;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dateStr = date.toISOString().split('T')[0];
            
            let classes = 'calendar-day';
            if (!isCurrentMonth) classes += ' other-month';
            if (isPast) classes += ' disabled';
            if (isWeekend && isCurrentMonth) classes += ' weekend';
            
            const clickHandler = (!isPast && isCurrentMonth) ? 
                `onclick="bookingPage.selectDate('${dateStr}')"` : '';
            
            days.push(`
                <div class="${classes}" data-date="${dateStr}" ${clickHandler}>
                    <div class="date-number">${date.getDate()}</div>
                    ${isWeekend && isCurrentMonth ? '<small class="weekend-label">Nghỉ</small>' : ''}
                </div>
            `);
            
            date.setDate(date.getDate() + 1);
        }
        
        return days.join('');
    }

    previousMonth() {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
        this.renderCalendar();
    }

    generateCalendarDays(startDate, lastDay, today, currentMonth) {
        const days = [];
        const date = new Date(startDate);
        
        for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
            const isCurrentMonth = date.getMonth() === currentMonth;
            const isPast = date < today;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dateStr = date.toISOString().split('T')[0];
            
            let classes = 'calendar-day';
            if (!isCurrentMonth) classes += ' other-month';
            if (isPast) classes += ' disabled';
            if (isWeekend && isCurrentMonth) classes += ' weekend';
            
            const clickHandler = (!isPast && isCurrentMonth) ? 
                `onclick="bookingPage.selectDate('${dateStr}')"` : '';
            
            days.push(`
                <div class="${classes}" data-date="${dateStr}" ${clickHandler}>
                    <div class="date-number">${date.getDate()}</div>
                    ${isWeekend && isCurrentMonth ? '<small class="weekend-label">Nghỉ</small>' : ''}
                </div>
            `);
            
            date.setDate(date.getDate() + 1);
        }
        
        return days.join('');
    }

    previousMonth() {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
        this.renderCalendar();
    }

    async selectDate(dateStr) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Add selection
        const selectedDay = document.querySelector(`[data-date="${dateStr}"]`);
        if (selectedDay && !selectedDay.classList.contains('disabled')) {
            selectedDay.classList.add('selected');
            this.selectedDate = dateStr;
            
            // Load available time slots
            await this.loadAvailableSlots(dateStr);
        }
    }

    async loadAvailableSlots(date) {
        const container = document.getElementById('time-slots-container');
        container.innerHTML = '<p class="text-muted">Đang tải khung giờ...</p>';
        
        console.log('Loading time slots for date:', date);
        
        try {
            // Try to get real available slots
            const response = await apiService.getDoctorAvailableSlots(this.selectedDoctor.id, date);
            
            if (response.success && response.data) {
                console.log('Got real API data:', response.data);
                this.availableSlots = response.data;
            } else {
                console.log('Using mock data instead');
                // Use mock data
                this.availableSlots = this.getMockTimeSlots(date);
            }
            
            this.renderTimeSlots();
        } catch (error) {
            console.error('Error loading time slots:', error);
            console.log('Falling back to mock data');
            this.availableSlots = this.getMockTimeSlots(date);
            this.renderTimeSlots();
        }
    }

    getMockTimeSlots(date) {
        const slots = [];
        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();
        
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return [];
        }
        
        // Morning slots (8:00 - 11:30)
        const morningSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
        // Afternoon slots (14:00 - 17:30)
        const afternoonSlots = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
        
        // Add morning slots
        morningSlots.forEach(time => {
            slots.push({
                time: time,
                available: Math.random() > 0.2, // 80% chance of being available
                period: 'morning'
            });
        });
        
        // Add afternoon slots
        afternoonSlots.forEach(time => {
            slots.push({
                time: time,
                available: Math.random() > 0.2, // 80% chance of being available
                period: 'afternoon'
            });
        });
        
        console.log('Generated mock time slots:', slots); // Debug log
        return slots;
    }

    renderTimeSlots() {
        const container = document.getElementById('time-slots-container');
        
        console.log('Rendering time slots:', this.availableSlots); // Debug log
        
        if (!this.availableSlots || this.availableSlots.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-0">Không có khung giờ khám trong ngày này</p>
                    <small class="text-muted">Vui lòng chọn ngày khác</small>
                </div>
            `;
            return;
        }
        
        const morningSlots = this.availableSlots.filter(slot => slot.period === 'morning');
        const afternoonSlots = this.availableSlots.filter(slot => slot.period === 'afternoon');
        
        let html = '';
        
        if (morningSlots.length > 0) {
            html += `
                <div class="mb-3">
                    <h6 class="mb-2"><i class="fas fa-sun text-warning"></i> Buổi sáng (8:00 - 12:00)</h6>
                    <div class="time-slots-wrapper">
                        ${morningSlots.map(slot => `
                            <div class="time-slot ${slot.available ? '' : 'unavailable'}" 
                                 data-time="${slot.time}"
                                 ${slot.available ? `onclick="bookingPage.selectTime('${slot.time}')"` : ''}>
                                ${slot.time}
                                ${!slot.available ? '<small>Đã đặt</small>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (afternoonSlots.length > 0) {
            html += `
                <div class="mb-3">
                    <h6 class="mb-2"><i class="fas fa-sun text-primary"></i> Buổi chiều (14:00 - 18:00)</h6>
                    <div class="time-slots-wrapper">
                        ${afternoonSlots.map(slot => `
                            <div class="time-slot ${slot.available ? '' : 'unavailable'}" 
                                 data-time="${slot.time}"
                                 ${slot.available ? `onclick="bookingPage.selectTime('${slot.time}')"` : ''}>
                                ${slot.time}
                                ${!slot.available ? '<small>Đã đặt</small>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (html === '') {
            html = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-0">Không có khung giờ khám trong ngày này</p>
                    <small class="text-muted">Bác sĩ không làm việc vào ngày này</small>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // Add event listeners for time slots
        container.querySelectorAll('.time-slot:not(.unavailable)').forEach(slot => {
            slot.addEventListener('click', () => {
                const time = slot.dataset.time;
                this.selectTime(time);
            });
        });
    }

    selectTime(time) {
        // Remove previous selection
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Add selection
        const selectedSlot = document.querySelector(`[data-time="${time}"]`);
        if (selectedSlot && !selectedSlot.classList.contains('unavailable')) {
            selectedSlot.classList.add('selected');
            this.selectedTime = time;
            document.getElementById('next-to-step3').disabled = false;
        }
    }

    validateStep3() {
        const requiredFields = ['patient-name', 'patient-phone', 'patient-dob', 'patient-gender', 'appointment-reason'];
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        return isValid;
    }

    renderAppointmentSummary() {
        const container = document.getElementById('appointment-summary');
        const appointmentDateTime = new Date(`${this.selectedDate}T${this.selectedTime}`);
        
        container.innerHTML = `
            <h5><i class="fas fa-clipboard-list"></i> Thông tin đặt lịch</h5>
            <hr>
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-user-md"></i> Bác sĩ khám</h6>
                    <p class="mb-2">${this.selectedDoctor.name}</p>
                    <p class="text-muted small mb-3">${this.selectedDoctor.specialty} - ${this.selectedDoctor.department}</p>
                    
                    <h6><i class="fas fa-calendar-alt"></i> Thời gian</h6>
                    <p class="mb-2">${this.formatDate(appointmentDateTime)}</p>
                    <p class="text-muted small mb-3">${this.formatTime(appointmentDateTime)}</p>
                </div>
                <div class="col-md-6">
                    <h6><i class="fas fa-user"></i> Thông tin bệnh nhân</h6>
                    <p class="mb-1"><strong>Họ tên:</strong> ${document.getElementById('patient-name').value}</p>
                    <p class="mb-1"><strong>SĐT:</strong> ${document.getElementById('patient-phone').value}</p>
                    <p class="mb-1"><strong>Email:</strong> ${document.getElementById('patient-email').value || 'Không có'}</p>
                    <p class="mb-3"><strong>Ngày sinh:</strong> ${this.formatDate(new Date(document.getElementById('patient-dob').value))}</p>
                    
                    <h6><i class="fas fa-notes-medical"></i> Lý do khám</h6>
                    <p class="small">${document.getElementById('appointment-reason').value}</p>
                </div>
            </div>
            <hr>
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="text-muted">Phí khám:</span>
                    <span class="fw-bold text-primary fs-5">${this.formatCurrency(this.selectedDoctor.consultationFee)}</span>
                </div>
                ${document.getElementById('is-emergency').checked ? 
                    '<span class="badge bg-warning"><i class="fas fa-exclamation-triangle"></i> Cấp cứu</span>' : 
                    ''}
            </div>
        `;
    }

    async confirmAppointment() {
        const confirmBtn = document.getElementById('confirm-appointment');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        
        try {
            // Prepare appointment data
            const appointmentData = {
                doctorPublicId: this.selectedDoctor.id,
                patientPublicId: authService.getCurrentUser()?.publicId || 'guest',
                appointmentStart: new Date(`${this.selectedDate}T${this.selectedTime}`).toISOString(),
                appointmentEnd: new Date(new Date(`${this.selectedDate}T${this.selectedTime}`).getTime() + 30 * 60000).toISOString(),
                notes: document.getElementById('appointment-reason').value,
                isEmergency: document.getElementById('is-emergency').checked
            };
            
            // If user is not logged in, create guest appointment
            if (!authService.getCurrentUser()) {
                appointmentData.guestInfo = {
                    name: document.getElementById('patient-name').value,
                    phone: document.getElementById('patient-phone').value,
                    email: document.getElementById('patient-email').value,
                    dateOfBirth: document.getElementById('patient-dob').value,
                    gender: document.getElementById('patient-gender').value,
                    address: document.getElementById('patient-address').value
                };
            }
            
            const response = await apiService.createAppointment(appointmentData);
            
            if (response.success) {
                this.showSuccess('Đặt lịch thành công!');
                this.showSuccessStep(response.data);
            } else {
                throw new Error(response.error || 'Không thể tạo lịch hẹn');
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            this.showError('Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại sau.');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Xác nhận đặt lịch';
        }
    }

    showSuccessStep(appointmentData) {
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Show success step
        document.getElementById('success-step').style.display = 'block';
        
        // Update final summary
        const container = document.getElementById('final-summary');
        const appointmentDateTime = new Date(appointmentData.appointmentStart);
        
        container.innerHTML = `
            <div class="text-center">
                <h6>Mã lịch hẹn: <span class="text-primary">#${appointmentData.id}</span></h6>
                <p class="mb-2"><strong>${this.selectedDoctor.name}</strong></p>
                <p class="mb-2">${this.formatDate(appointmentDateTime)} - ${this.formatTime(appointmentDateTime)}</p>
                <p class="text-muted">${this.selectedDoctor.specialty}</p>
            </div>
        `;
        
        // Update all step indicators to completed
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`step${i}-indicator`).classList.add('completed');
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    formatTime(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    getDayName(dayIndex) {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return days[dayIndex];
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        spinner.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.bookingPage = new BookAppointmentPage();
});