// ==================== NOTIFICATION SYSTEM ====================

class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
            this.container = container;
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    show(message, type = 'info', duration = 4000) {
        const toast = this.createToast(message, type, duration);
        this.container.appendChild(toast);

        // Auto remove after duration
        const timeout = setTimeout(() => {
            this.remove(toast);
        }, duration);

        // Store timeout for manual removal
        toast._timeout = timeout;

        return toast;
    }

    createToast(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const titles = {
            success: 'Thành công',
            error: 'Lỗi',
            warning: 'Cảnh báo',
            info: 'Thông tin'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${titles[type] || titles.info}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="notification.remove(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
            <div class="toast-progress" style="width: 100%; transition-duration: ${duration}ms;"></div>
        `;

        // Start progress animation
        setTimeout(() => {
            const progress = toast.querySelector('.toast-progress');
            if (progress) {
                progress.style.width = '0%';
            }
        }, 10);

        return toast;
    }

    remove(toast) {
        if (!toast || toast.classList.contains('hiding')) return;

        // Clear timeout if exists
        if (toast._timeout) {
            clearTimeout(toast._timeout);
        }

        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4500) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }

    // Remove all toasts
    clear() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.remove(toast));
    }
}

// Create global instance
const notification = new NotificationSystem();

// ==================== LOADING SYSTEM ====================

class LoadingSystem {
    constructor() {
        this.overlay = null;
    }

    show(message = 'Đang xử lý...') {
        // Remove existing overlay if any
        this.hide();

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;

        document.body.appendChild(this.overlay);
        document.body.style.overflow = 'hidden';
    }

    hide() {
        if (this.overlay && this.overlay.parentElement) {
            this.overlay.parentElement.removeChild(this.overlay);
            this.overlay = null;
            document.body.style.overflow = '';
        }
    }

    update(message) {
        if (this.overlay) {
            const textElement = this.overlay.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = message;
            }
        }
    }
}

// Create global instance
const loading = new LoadingSystem();

// ==================== FORM VALIDATION ====================

class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.validators = {
            required: this.validateRequired,
            email: this.validateEmail,
            phone: this.validatePhone,
            minLength: this.validateMinLength,
            maxLength: this.validateMaxLength,
            pattern: this.validatePattern,
            match: this.validateMatch,
            date: this.validateDate,
            time: this.validateTime,
            number: this.validateNumber
        };
    }

    // Validation methods
    validateRequired(value) {
        return {
            valid: value.trim() !== '',
            message: 'Trường này không được để trống'
        };
    }

    validateEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            valid: emailRegex.test(value),
            message: 'Email không hợp lệ'
        };
    }

    validatePhone(value) {
        const phoneRegex = /^(0|\+84)[0-9]{9}$/;
        return {
            valid: phoneRegex.test(value.replace(/\s/g, '')),
            message: 'Số điện thoại không hợp lệ'
        };
    }

    validateMinLength(value, minLength) {
        return {
            valid: value.length >= minLength,
            message: `Tối thiểu ${minLength} ký tự`
        };
    }

    validateMaxLength(value, maxLength) {
        return {
            valid: value.length <= maxLength,
            message: `Tối đa ${maxLength} ký tự`
        };
    }

    validatePattern(value, pattern) {
        const regex = new RegExp(pattern);
        return {
            valid: regex.test(value),
            message: 'Định dạng không hợp lệ'
        };
    }

    validateMatch(value, matchValue) {
        return {
            valid: value === matchValue,
            message: 'Giá trị không khớp'
        };
    }

    validateDate(value) {
        const date = new Date(value);
        return {
            valid: !isNaN(date.getTime()),
            message: 'Ngày không hợp lệ'
        };
    }

    validateTime(value) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return {
            valid: timeRegex.test(value),
            message: 'Thời gian không hợp lệ'
        };
    }

    validateNumber(value, min = null, max = null) {
        const num = parseFloat(value);
        let valid = !isNaN(num);
        let message = 'Phải là số hợp lệ';

        if (valid && min !== null && num < min) {
            valid = false;
            message = `Giá trị tối thiểu là ${min}`;
        }

        if (valid && max !== null && num > max) {
            valid = false;
            message = `Giá trị tối đa là ${max}`;
        }

        return { valid, message };
    }

    // Validate single field
    validateField(field) {
        const rules = this.getFieldRules(field);
        const value = field.value;
        let isValid = true;
        let errorMessage = '';

        for (const rule of rules) {
            const result = this.validators[rule.type].call(this, value, rule.param);
            
            if (!result.valid) {
                isValid = false;
                errorMessage = rule.message || result.message;
                break;
            }
        }

        this.updateFieldUI(field, isValid, errorMessage);
        return isValid;
    }

    // Get validation rules from field attributes
    getFieldRules(field) {
        const rules = [];

        if (field.required || field.hasAttribute('required')) {
            rules.push({ type: 'required' });
        }

        if (field.type === 'email') {
            rules.push({ type: 'email' });
        }

        if (field.getAttribute('data-validate-phone')) {
            rules.push({ type: 'phone' });
        }

        const minLength = field.getAttribute('minlength');
        if (minLength) {
            rules.push({ type: 'minLength', param: parseInt(minLength) });
        }

        const maxLength = field.getAttribute('maxlength');
        if (maxLength) {
            rules.push({ type: 'maxLength', param: parseInt(maxLength) });
        }

        const pattern = field.getAttribute('pattern');
        if (pattern) {
            rules.push({ type: 'pattern', param: pattern });
        }

        const match = field.getAttribute('data-match');
        if (match) {
            const matchField = this.form.querySelector(`[name="${match}"]`);
            if (matchField) {
                rules.push({ type: 'match', param: matchField.value });
            }
        }

        if (field.type === 'date') {
            rules.push({ type: 'date' });
        }

        if (field.type === 'time') {
            rules.push({ type: 'time' });
        }

        if (field.type === 'number') {
            const min = field.getAttribute('min');
            const max = field.getAttribute('max');
            rules.push({ type: 'number', param: { min, max } });
        }

        return rules;
    }

    // Update field UI
    updateFieldUI(field, isValid, errorMessage) {
        const feedbackElement = field.parentElement.querySelector('.invalid-feedback');

        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            if (feedbackElement) {
                feedbackElement.textContent = '';
            }
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            
            if (feedbackElement) {
                feedbackElement.textContent = errorMessage;
            } else {
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = errorMessage;
                field.parentElement.appendChild(feedback);
            }
        }
    }

    // Validate entire form
    validateForm() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        let isValid = true;

        fields.forEach(field => {
            // Skip disabled and hidden fields
            if (field.disabled || field.type === 'hidden') return;

            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Reset validation
    reset() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
            const feedback = field.parentElement.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.textContent = '';
            }
        });
    }

    // Initialize real-time validation
    init() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            // Validate on blur
            field.addEventListener('blur', () => {
                if (field.value) {
                    this.validateField(field);
                }
            });

            // Clear validation on focus
            field.addEventListener('focus', () => {
                field.classList.remove('is-invalid');
            });

            // Validate on input for real-time feedback
            field.addEventListener('input', () => {
                if (field.classList.contains('is-invalid')) {
                    this.validateField(field);
                }
            });
        });

        // Prevent default form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (this.validateForm()) {
                // Form is valid, can submit
                notification.success('Form hợp lệ!');
            } else {
                notification.error('Vui lòng kiểm tra lại thông tin!');
                
                // Focus on first invalid field
                const firstInvalid = this.form.querySelector('.is-invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                }
            }
        });
    }
}

// Helper function to create validator
function createValidator(formId) {
    const form = document.getElementById(formId);
    if (form) {
        const validator = new FormValidator(form);
        validator.init();
        return validator;
    }
    return null;
}
