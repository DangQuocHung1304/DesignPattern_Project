class PricingPage {
    constructor() {
        this.groups = [];
        this.categories = [];
        this.currentCategory = 'all';
        this.loadingState = document.getElementById('pricing-loading-state');
        this.errorState = document.getElementById('pricing-error-state');
        this.card = document.getElementById('pricing-card');
        this.tableBody = document.getElementById('priceTableBody');
        this.emptyMessage = document.getElementById('pricing-empty-message');
        this.filterContainer = document.getElementById('category-filters');
        this.retryButton = document.getElementById('pricing-retry-btn');

        this.init();
    }

    init() {
        this.bindEvents();
        this.syncPublicSidebarAuth();
        this.loadPricingData();
    }

    bindEvents() {
        if (this.retryButton) {
            this.retryButton.addEventListener('click', () => this.loadPricingData());
        }

        if (this.filterContainer) {
            this.filterContainer.addEventListener('click', (event) => {
                const button = event.target.closest('.filter-btn');
                if (!button) return;
                const selected = button.getAttribute('data-category') || 'all';
                this.currentCategory = selected;
                this.setActiveFilterButton();
                this.renderTable();
                this.updateTopbar();
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (event) => this.handleLogout(event));
        }
    }

    async loadPricingData() {
        this.showLoading();

        try {
            const [categoriesResponse, servicesResponse] = await Promise.all([
                apiService.getServiceCategories(),
                apiService.getServices()
            ]);

            const servicePayload = this.extractArrayPayload(servicesResponse);
            this.groups = this.normalizeServiceGroups(servicePayload);

            if (!this.groups.length) {
                throw new Error('Không nhận được dữ liệu dịch vụ từ API.');
            }

            const categoryPayload = this.extractArrayPayload(categoriesResponse);
            this.categories = this.normalizeCategories(categoryPayload, this.groups);

            this.renderFilterButtons();
            this.renderTable();
            this.updateTopbar();
            this.updateLastUpdated();
            this.showContent();
        } catch (error) {
            console.error('Pricing page load error:', error);
            this.showError();
        }
    }

    extractArrayPayload(response) {
        if (!response) return [];

        if (Array.isArray(response)) return response;

        // Handle wrapped payloads from api.js and backend:
        // - { success: true, data: [...] }
        // - { success: true, data: { success: true, data: [...] } }
        // - { data: { items: [...] } }
        const queue = [response];
        const visited = new Set();

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current || typeof current !== 'object') continue;

            if (visited.has(current)) continue;
            visited.add(current);

            if (Array.isArray(current)) return current;

            const candidateArrays = [
                current.data,
                current.items,
                current.results,
                current.services,
                current.value,
                current.news
            ];

            for (const candidate of candidateArrays) {
                if (Array.isArray(candidate)) {
                    return candidate;
                }
            }

            const nestedObjects = [
                current.data,
                current.result,
                current.payload,
                current.value,
                current.response
            ];

            for (const nested of nestedObjects) {
                if (nested && typeof nested === 'object') {
                    queue.push(nested);
                }
            }
        }

        return [];
    }

    normalizeServiceGroups(payload) {
        if (!Array.isArray(payload)) return [];

        const grouped = [];

        const isGroupedShape = payload.some((item) => Array.isArray(item?.Services) || Array.isArray(item?.services));

        if (isGroupedShape) {
            payload.forEach((group) => {
                const code = this.toCategoryCode(
                    group?.Category || group?.category || group?.Code || group?.code || group?.CategoryName || group?.categoryName
                );
                const name = this.toCategoryName(
                    group?.CategoryName || group?.categoryName || group?.Name || group?.name,
                    code
                );

                const services = Array.isArray(group?.Services) ? group.Services : (Array.isArray(group?.services) ? group.services : []);

                const normalizedServices = services
                    .map((service) => this.normalizeService(service, code, name))
                    .filter((service) => service.name);

                grouped.push({
                    code,
                    name,
                    services: normalizedServices
                });
            });

            return grouped.filter((group) => group.services.length > 0);
        }

        const serviceRows = payload.map((service) => {
            const code = this.toCategoryCode(
                service?.Category || service?.category || service?.CategoryCode || service?.categoryCode || service?.CategoryName || service?.categoryName
            );
            const name = this.toCategoryName(
                service?.CategoryName || service?.categoryName || service?.Category || service?.category,
                code
            );
            return this.normalizeService(service, code, name);
        }).filter((service) => service.name);

        const bucket = new Map();

        serviceRows.forEach((service) => {
            if (!bucket.has(service.categoryCode)) {
                bucket.set(service.categoryCode, {
                    code: service.categoryCode,
                    name: service.categoryName,
                    services: []
                });
            }
            bucket.get(service.categoryCode).services.push(service);
        });

        return Array.from(bucket.values());
    }

    normalizeService(service, fallbackCategoryCode, fallbackCategoryName) {
        const rawPrice =
            service?.DefaultPrice ?? service?.defaultPrice ?? service?.Price ?? service?.price ??
            service?.Cost ?? service?.cost ?? null;

        const parsedPrice = Number(rawPrice);

        return {
            id: service?.Id ?? service?.id ?? service?.ServiceId ?? service?.serviceId ?? null,
            name: (service?.Name || service?.name || service?.ServiceName || service?.serviceName || '').toString().trim(),
            description: (service?.Description || service?.description || '').toString().trim(),
            duration: service?.Duration ?? service?.duration ?? service?.DurationMinutes ?? service?.durationMinutes ?? null,
            unit: (service?.Unit || service?.unit || 'Lần').toString().trim() || 'Lần',
            price: Number.isFinite(parsedPrice) ? parsedPrice : null,
            categoryCode: fallbackCategoryCode,
            categoryName: fallbackCategoryName
        };
    }

    normalizeCategories(categoryPayload, groups) {
        const fromApi = Array.isArray(categoryPayload)
            ? categoryPayload.map((item) => {
                const code = this.toCategoryCode(item?.Code || item?.code || item?.Category || item?.category || item?.Name || item?.name);
                return {
                    code,
                    name: this.toCategoryName(item?.Name || item?.name || item?.CategoryName || item?.categoryName, code),
                    icon: (item?.Icon || item?.icon || this.getCategoryIcon(code)).toString()
                };
            }).filter((item) => item.code)
            : [];

        if (fromApi.length > 0) {
            return fromApi;
        }

        return groups.map((group) => ({
            code: group.code,
            name: group.name,
            icon: this.getCategoryIcon(group.code)
        }));
    }

    renderFilterButtons() {
        if (!this.filterContainer) return;

        const allButton = `
            <button type="button" class="filter-btn" data-category="all">
                <i class="fas fa-layer-group"></i> Tất cả
            </button>
        `;

        const categoryButtons = this.categories.map((category) => `
            <button type="button" class="filter-btn" data-category="${this.escapeHtml(category.code)}">
                <span>${this.escapeHtml(category.icon)}</span> ${this.escapeHtml(category.name)}
            </button>
        `).join('');

        this.filterContainer.innerHTML = allButton + categoryButtons;
        this.setActiveFilterButton();
    }

    setActiveFilterButton() {
        if (!this.filterContainer) return;
        this.filterContainer.querySelectorAll('.filter-btn').forEach((button) => {
            const isActive = button.getAttribute('data-category') === this.currentCategory;
            button.classList.toggle('active', isActive);
        });
    }

    renderTable() {
        if (!this.tableBody || !this.emptyMessage) return;

        const visibleGroups = this.currentCategory === 'all'
            ? this.groups
            : this.groups.filter((group) => group.code === this.currentCategory);

        const rows = visibleGroups.flatMap((group) => {
            return group.services.map((service) => ({
                ...service,
                categoryCode: group.code,
                categoryName: group.name
            }));
        });

        if (!rows.length) {
            this.tableBody.innerHTML = '';
            this.emptyMessage.style.display = 'block';
            return;
        }

        this.emptyMessage.style.display = 'none';
        this.tableBody.innerHTML = rows.map((row) => {
            return `
                <tr>
                    <td>
                        <div class="price-service-name">${this.escapeHtml(row.name)}</div>
                        ${row.description ? `<p class="price-service-description">${this.escapeHtml(row.description)}</p>` : ''}
                    </td>
                    <td>
                        <span class="price-category-chip">${this.escapeHtml(this.getCategoryIcon(row.categoryCode))} ${this.escapeHtml(row.categoryName)}</span>
                    </td>
                    <td><span class="price-duration">${this.escapeHtml(this.formatDuration(row.duration))}</span></td>
                    <td>${this.escapeHtml(row.unit || 'Lần')}</td>
                    <td><span class="price-value">${this.escapeHtml(this.formatCurrency(row.price))}</span></td>
                </tr>
            `;
        }).join('');
    }

    updateLastUpdated() {
        const tag = document.getElementById('pricing-last-updated');
        if (!tag) return;
        const now = new Date();
        const dateText = now.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        tag.textContent = `Cập nhật ${dateText}`;
    }

    updateTopbar() {
        const titleElement = document.getElementById('pricing-page-title');
        const subtitleElement = document.getElementById('pricing-page-subtitle');

        const selected = this.currentCategory === 'all'
            ? { name: 'Tất cả dịch vụ' }
            : (this.categories.find((item) => item.code === this.currentCategory) || { name: 'Danh mục đã chọn' });

        if (titleElement) {
            titleElement.textContent = this.currentCategory === 'all'
                ? 'Danh mục dịch vụ'
                : `Danh mục dịch vụ - ${selected.name}`;
        }

        if (subtitleElement) {
            subtitleElement.textContent = this.currentCategory === 'all'
                ? 'Danh sách giá khám và điều trị được cập nhật theo danh mục dịch vụ'
                : `Đang hiển thị giá của danh mục ${selected.name.toLowerCase()}`;
        }

        document.title = titleElement ? `${titleElement.textContent} - HealthySystem` : 'Bảng giá dịch vụ - HealthySystem';
    }

    showLoading() {
        if (this.loadingState) {
            this.loadingState.style.display = 'block';
        }
        if (this.errorState) {
            this.errorState.style.display = 'none';
        }
        if (this.card) {
            this.card.style.display = 'none';
        }

        if (typeof window.renderSkeletons === 'function') {
            window.renderSkeletons('pricing-loading-skeleton', 4);
        } else {
            const fallback = document.getElementById('pricing-loading-skeleton');
            if (fallback) {
                fallback.innerHTML = '<p class="text-muted">Đang tải bảng giá...</p>';
            }
        }
    }

    showContent() {
        if (this.loadingState) {
            this.loadingState.style.display = 'none';
        }
        if (this.errorState) {
            this.errorState.style.display = 'none';
        }
        if (this.card) {
            this.card.style.display = 'grid';
        }
    }

    showError() {
        if (this.loadingState) {
            this.loadingState.style.display = 'none';
        }
        if (this.card) {
            this.card.style.display = 'none';
        }
        if (this.errorState) {
            this.errorState.style.display = 'grid';
        }
    }

    toCategoryCode(raw) {
        const fallback = (raw || 'other').toString().trim().toLowerCase();
        return fallback || 'other';
    }

    toCategoryName(name, code) {
        const normalized = (name || '').toString().trim();
        if (normalized) return normalized;

        const byCode = {
            consultation: 'Khám bệnh',
            laboratory: 'Xét nghiệm',
            lab: 'Xét nghiệm',
            imaging: 'Chẩn đoán hình ảnh',
            procedure: 'Thủ thuật',
            surgery: 'Phẫu thuật',
            package: 'Gói dịch vụ',
            other: 'Dịch vụ khác'
        };

        return byCode[code] || 'Dịch vụ khác';
    }

    getCategoryIcon(code) {
        const icons = {
            consultation: '🩺',
            laboratory: '🔬',
            lab: '🔬',
            imaging: '🧪',
            procedure: '⚕️',
            surgery: '🏥',
            package: '📦',
            other: '📋'
        };

        return icons[code] || '📋';
    }

    formatDuration(raw) {
        if (raw === null || raw === undefined || raw === '') {
            return '-';
        }

        const numeric = Number(raw);
        if (Number.isFinite(numeric) && numeric > 0) {
            return `${numeric} phút`;
        }

        return raw.toString();
    }

    formatCurrency(value) {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return 'Liên hệ';
        }

        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(Number(value));
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
    window.pricingPage = new PricingPage();
});
