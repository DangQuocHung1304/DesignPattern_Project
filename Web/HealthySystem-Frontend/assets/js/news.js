class NewsPage {
    constructor() {
        this.news = [];
        this.categories = [];
        this.currentCategory = '';
        this.currentPage = 1;
        this.pageSize = 9;
        this.totalPages = 1;

        this.loadingState = document.getElementById('news-loading-state');
        this.errorState = document.getElementById('news-error-state');
        this.listCard = document.getElementById('news-list-card');
        this.newsContainer = document.getElementById('newsContainer');
        this.emptyState = document.getElementById('news-empty-state');
        this.pagination = document.getElementById('news-pagination');
        this.categoryFilters = document.getElementById('news-category-filters');
        this.totalChip = document.getElementById('news-total-chip');

        this.init();
    }

    init() {
        this.bindEvents();
        this.syncPublicSidebarAuth();
        this.loadPageData();
    }

    bindEvents() {
        const retryBtn = document.getElementById('news-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.loadPageData());
        }

        if (this.categoryFilters) {
            this.categoryFilters.addEventListener('click', (event) => {
                const button = event.target.closest('.filter-btn');
                if (!button) return;

                const category = button.getAttribute('data-category') || '';
                this.currentCategory = category;
                this.currentPage = 1;
                this.setActiveCategoryButton();
                this.fetchNews();
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (event) => this.handleLogout(event));
        }
    }

    async loadPageData() {
        this.showLoading();

        try {
            await this.loadCategories();
            await this.fetchNews();
        } catch (error) {
            console.error('Load news page error:', error);
            this.showError();
        }
    }

    async loadCategories() {
        const response = await apiService.getNewsCategories();
        const payload = this.extractPayload(response);
        const categoryRows = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);

        this.categories = categoryRows.map((item) => {
            const code = (item?.Code || item?.code || item?.Category || item?.category || '').toString().trim();
            const name = (item?.Name || item?.name || item?.CategoryName || item?.categoryName || code || 'Khác').toString().trim();
            const icon = (item?.Icon || item?.icon || '📰').toString();
            return { code, name, icon };
        }).filter((item) => item.code);

        this.renderCategoryButtons();
    }

    async fetchNews() {
        this.showLoading();

        try {
            const response = await apiService.getNews(this.currentPage, this.pageSize, this.currentCategory || null);
            const payload = this.extractPayload(response);

            const list = this.extractNewsList(payload);
            this.news = list.map((row) => this.normalizeNewsItem(row)).filter((item) => item.id);

            this.syncCategoryFromNews();
            this.renderNews();
            this.renderPagination(payload);
            this.updateTopbar();
            this.showContent();
        } catch (error) {
            console.error('Fetch news error:', error);
            this.showError();
        }
    }

    extractPayload(response) {
        if (!response) return null;
        return response.data ?? response;
    }

    extractNewsList(payload) {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.news)) return payload.news;
        if (Array.isArray(payload.items)) return payload.items;
        if (payload.data) {
            if (Array.isArray(payload.data)) return payload.data;
            if (Array.isArray(payload.data.news)) return payload.data.news;
            if (Array.isArray(payload.data.items)) return payload.data.items;
        }
        return [];
    }

    normalizeNewsItem(item) {
        return {
            id: item?.Id ?? item?.id ?? null,
            title: (item?.Title || item?.title || 'Bài viết').toString().trim(),
            summary: (item?.Summary || item?.summary || item?.Description || item?.description || '').toString().trim(),
            image: (item?.Image || item?.image || item?.ImageUrl || item?.imageUrl || 'https://via.placeholder.com/1200x675?text=News').toString(),
            categoryCode: (item?.Category || item?.category || item?.CategoryCode || item?.categoryCode || '').toString().trim(),
            categoryName: (item?.CategoryName || item?.categoryName || 'Tin tức').toString().trim(),
            author: (item?.Author || item?.author || 'Ban biên tập').toString().trim(),
            views: Number(item?.Views ?? item?.views ?? 0) || 0,
            publishedDate: item?.PublishedDate || item?.publishedDate || item?.CreatedAt || item?.createdAt || null
        };
    }

    syncCategoryFromNews() {
        if (!this.news.length) return;

        const codes = new Set(this.categories.map((item) => item.code));
        const extra = [];

        this.news.forEach((item) => {
            const code = item.categoryCode || item.categoryName;
            if (!code || codes.has(code)) return;
            codes.add(code);
            extra.push({
                code,
                name: item.categoryName || code,
                icon: '📰'
            });
        });

        if (extra.length) {
            this.categories = [...this.categories, ...extra];
            this.renderCategoryButtons();
        }
    }

    renderCategoryButtons() {
        if (!this.categoryFilters) return;

        const allButton = `
            <button type="button" class="filter-btn" data-category="">
                <i class="fas fa-layer-group"></i> Tất cả
            </button>
        `;

        const categoryButtons = this.categories.map((category) => `
            <button type="button" class="filter-btn" data-category="${this.escapeHtml(category.code)}">
                <span>${this.escapeHtml(category.icon)}</span> ${this.escapeHtml(category.name)}
            </button>
        `).join('');

        this.categoryFilters.innerHTML = allButton + categoryButtons;
        this.setActiveCategoryButton();
    }

    setActiveCategoryButton() {
        if (!this.categoryFilters) return;
        this.categoryFilters.querySelectorAll('.filter-btn').forEach((button) => {
            const isActive = (button.getAttribute('data-category') || '') === this.currentCategory;
            button.classList.toggle('active', isActive);
        });
    }

    renderNews() {
        if (!this.newsContainer || !this.emptyState || !this.totalChip) return;

        this.totalChip.textContent = `${this.news.length} bài viết`;

        if (!this.news.length) {
            this.newsContainer.innerHTML = '';
            this.emptyState.style.display = 'block';
            return;
        }

        this.emptyState.style.display = 'none';

        this.newsContainer.innerHTML = this.news.map((item) => `
            <article class="news-item" data-news-id="${this.escapeAttribute(item.id)}">
                <img class="news-cover" src="${this.escapeAttribute(item.image)}" alt="${this.escapeAttribute(item.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/1200x675?text=News'">
                <div class="news-body">
                    <span class="news-category-chip">${this.escapeHtml(item.categoryName)}</span>
                    <h4 class="news-title">${this.escapeHtml(item.title)}</h4>
                    <p class="news-summary">${this.escapeHtml(item.summary || 'Nội dung tóm tắt đang cập nhật.')}</p>
                    <div class="news-meta">
                        <span><i class="fas fa-user-doctor"></i> ${this.escapeHtml(item.author)}</span>
                        <span><i class="fas fa-eye"></i> ${item.views}</span>
                        <span><i class="fas fa-calendar-days"></i> ${this.escapeHtml(this.formatDate(item.publishedDate))}</span>
                    </div>
                </div>
            </article>
        `).join('');

        this.newsContainer.querySelectorAll('.news-item').forEach((element) => {
            element.addEventListener('click', () => {
                const newsId = element.getAttribute('data-news-id');
                if (!newsId) return;
                window.location.href = `news-detail.html?id=${encodeURIComponent(newsId)}`;
            });
        });
    }

    renderPagination(payload) {
        if (!this.pagination) return;

        const pageInfo = payload?.pagination || payload?.Pagination || null;
        const totalPages = Number(pageInfo?.totalPages ?? pageInfo?.TotalPages ?? payload?.totalPages ?? payload?.TotalPages ?? 1) || 1;

        this.totalPages = totalPages;

        if (this.totalPages <= 1) {
            this.pagination.innerHTML = '';
            return;
        }

        const start = Math.max(1, this.currentPage - 2);
        const end = Math.min(this.totalPages, start + 4);

        const pages = [];
        for (let page = start; page <= end; page += 1) {
            pages.push(page);
        }

        this.pagination.innerHTML = `
            <button type="button" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">Trước</button>
            ${pages.map((page) => `<button type="button" class="${page === this.currentPage ? 'active' : ''}" data-page="${page}">${page}</button>`).join('')}
            <button type="button" ${this.currentPage >= this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">Sau</button>
        `;

        this.pagination.querySelectorAll('button[data-page]').forEach((button) => {
            button.addEventListener('click', () => {
                const page = Number(button.getAttribute('data-page'));
                if (!Number.isFinite(page) || page < 1 || page > this.totalPages || page === this.currentPage) return;
                this.currentPage = page;
                this.fetchNews();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    updateTopbar() {
        const title = document.getElementById('news-page-title');
        const subtitle = document.getElementById('news-page-subtitle');

        const selectedCategory = this.currentCategory
            ? this.categories.find((item) => item.code === this.currentCategory)
            : null;

        if (title) {
            title.textContent = selectedCategory
                ? `Tin tức - ${selectedCategory.name}`
                : 'Cập nhật kiến thức sức khỏe';
        }

        if (subtitle) {
            subtitle.textContent = selectedCategory
                ? `Đang hiển thị các bài viết thuộc danh mục ${selectedCategory.name.toLowerCase()}.`
                : 'Tin tức mới nhất từ đội ngũ chuyên môn và hệ sinh thái chăm sóc sức khỏe';
        }

        document.title = title ? `${title.textContent} - HealthySystem` : 'Tin tức y tế - HealthySystem';
    }

    showLoading() {
        if (this.loadingState) this.loadingState.style.display = 'block';
        if (this.errorState) this.errorState.style.display = 'none';
        if (this.listCard) this.listCard.style.display = 'none';

        if (typeof window.renderSkeletons === 'function') {
            window.renderSkeletons('news-list-loading-skeleton', 4);
        } else {
            const fallback = document.getElementById('news-list-loading-skeleton');
            if (fallback) {
                fallback.innerHTML = '<p class="text-muted">Đang tải tin tức...</p>';
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
    window.newsPage = new NewsPage();
});
