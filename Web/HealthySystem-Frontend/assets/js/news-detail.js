class NewsDetailPage {
    constructor() {
        this.newsId = null;
        this.newsData = null;

        this.loadingState = document.getElementById('news-loading-state');
        this.errorState = document.getElementById('news-error-state');
        this.content = document.getElementById('newsContent');
        this.relatedSection = document.getElementById('related-news-section');

        this.init();
    }

    init() {
        this.newsId = this.getNewsIdFromUrl();
        this.bindEvents();
        this.syncPublicSidebarAuth();
        this.loadNewsDetail();
    }

    bindEvents() {
        const retryButton = document.getElementById('news-retry-btn');
        if (retryButton) {
            retryButton.addEventListener('click', () => this.loadNewsDetail());
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (event) => this.handleLogout(event));
        }
    }

    getNewsIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    async loadNewsDetail() {
        if (!this.newsId) {
            this.showError('Không tìm thấy mã bài viết trong URL.');
            return;
        }

        this.showLoading();

        try {
            const response = await apiService.getNewsDetail(this.newsId);
            const raw = response?.data || response;
            const normalized = this.normalizeNews(raw);

            if (!normalized.title) {
                throw new Error('Dữ liệu bài viết không hợp lệ.');
            }

            this.newsData = normalized;
            this.renderNews();
            this.showContent();
        } catch (error) {
            console.error('News detail load error:', error);
            this.showError('Không thể tải bài viết. Vui lòng thử lại sau.');
        }
    }

    normalizeNews(raw) {
        const source = raw && raw.data ? raw.data : raw;
        const news = source || {};

        const relatedRaw = Array.isArray(news.RelatedNews)
            ? news.RelatedNews
            : (Array.isArray(news.relatedNews) ? news.relatedNews : []);

        const tagsRaw = Array.isArray(news.Tags)
            ? news.Tags
            : (Array.isArray(news.tags) ? news.tags : []);

        return {
            id: news.Id ?? news.id ?? null,
            title: (news.Title || news.title || '').toString().trim(),
            category: (news.CategoryName || news.categoryName || news.Category || news.category || 'Sức khỏe').toString().trim(),
            summary: (news.Summary || news.summary || news.Description || news.description || '').toString().trim(),
            content: news.Content || news.content || '',
            image: (news.Image || news.image || news.ImageUrl || news.imageUrl || 'https://via.placeholder.com/1200x675?text=HealthySystem+News').toString(),
            author: (news.Author || news.author || 'Ban biên tập').toString().trim(),
            views: Number(news.Views ?? news.views ?? news.ViewCount ?? news.viewCount ?? 0) || 0,
            publishedDate: news.PublishedDate || news.publishedDate || news.CreatedAt || news.createdAt || null,
            tags: tagsRaw.map((tag) => (tag || '').toString().trim()).filter(Boolean),
            related: relatedRaw.map((item) => ({
                id: item.Id ?? item.id ?? null,
                title: (item.Title || item.title || 'Bài viết liên quan').toString().trim(),
                image: (item.Image || item.image || item.ImageUrl || item.imageUrl || 'https://via.placeholder.com/800x450?text=News').toString(),
                publishedDate: item.PublishedDate || item.publishedDate || item.CreatedAt || item.createdAt || null
            })).filter((item) => item.id)
        };
    }

    renderNews() {
        if (!this.newsData) return;

        const {
            title,
            category,
            summary,
            content,
            image,
            author,
            views,
            publishedDate,
            tags,
            related
        } = this.newsData;

        this.updateText('news-page-title', title);
        this.updateText('news-page-subtitle', `Bài viết thuộc chuyên mục ${category.toLowerCase()} được cập nhật ${this.formatDate(publishedDate)}.`);
        this.updateText('news-breadcrumb-current', title);
        this.updateText('news-category', category);
        this.updateText('news-title', title);
        this.updateText('news-author', author);
        this.updateText('news-published-date', this.formatDate(publishedDate));
        this.updateText('news-views', views.toString());
        this.updateText('news-summary', summary || 'Nội dung tóm tắt đang được cập nhật.');

        const imageElement = document.getElementById('news-image');
        if (imageElement) {
            imageElement.src = image;
            imageElement.alt = title || 'Ảnh bài viết';
            imageElement.onerror = function() {
                this.src = 'https://via.placeholder.com/1200x675?text=HealthySystem+News';
            };
        }

        const contentContainer = document.getElementById('news-body-content');
        if (contentContainer) {
            contentContainer.innerHTML = this.toContentHtml(content, summary);
        }

        this.renderTags(tags);
        this.renderRelated(related);

        document.title = `${title} - HealthySystem`;
    }

    renderTags(tags) {
        const wrap = document.getElementById('news-tags-wrap');
        const container = document.getElementById('news-tags');
        if (!wrap || !container) return;

        if (!Array.isArray(tags) || tags.length === 0) {
            wrap.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        container.innerHTML = tags.map((tag) => `<span class="news-tag">#${this.escapeHtml(tag)}</span>`).join('');
        wrap.style.display = 'grid';
    }

    renderRelated(items) {
        const section = this.relatedSection;
        const grid = document.getElementById('related-news-grid');
        if (!section || !grid) return;

        if (!Array.isArray(items) || items.length === 0) {
            section.style.display = 'none';
            grid.innerHTML = '';
            return;
        }

        grid.innerHTML = items.map((item) => `
            <article class="related-item" onclick="window.location.href='news-detail.html?id=${encodeURIComponent(item.id)}'">
                <img src="${this.escapeAttribute(item.image)}" alt="${this.escapeAttribute(item.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/800x450?text=News'">
                <div class="related-item-content">
                    <h4>${this.escapeHtml(item.title)}</h4>
                    <p><i class="fas fa-calendar-days"></i> ${this.escapeHtml(this.formatDate(item.publishedDate))}</p>
                </div>
            </article>
        `).join('');

        section.style.display = 'grid';
    }

    toContentHtml(content, summary) {
        const source = (content || '').toString().trim();
        if (!source) {
            return `<p>${this.escapeHtml(summary || 'Nội dung đang được cập nhật.')}</p>`;
        }

        const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(source);
        if (hasHtmlTag) {
            return source;
        }

        const paragraphs = source
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => `<p>${this.escapeHtml(paragraph)}</p>`)
            .join('');

        return paragraphs || `<p>${this.escapeHtml(source)}</p>`;
    }

    showLoading() {
        if (this.loadingState) {
            this.loadingState.style.display = 'block';
        }
        if (this.errorState) {
            this.errorState.style.display = 'none';
        }
        if (this.content) {
            this.content.style.display = 'none';
        }
        if (this.relatedSection) {
            this.relatedSection.style.display = 'none';
        }

        if (typeof window.renderSkeletons === 'function') {
            window.renderSkeletons('news-loading-skeleton', 3);
        } else {
            const fallback = document.getElementById('news-loading-skeleton');
            if (fallback) {
                fallback.innerHTML = '<p class="text-muted">Đang tải bài viết...</p>';
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
        if (this.content) {
            this.content.style.display = 'grid';
        }
    }

    showError(message) {
        if (this.loadingState) {
            this.loadingState.style.display = 'none';
        }
        if (this.content) {
            this.content.style.display = 'none';
        }
        if (this.relatedSection) {
            this.relatedSection.style.display = 'none';
        }

        if (this.errorState) {
            this.errorState.style.display = 'grid';
            const p = this.errorState.querySelector('p');
            if (p) {
                p.textContent = message;
            }
        }

        this.updateText('news-page-title', 'Không thể tải bài viết');
        this.updateText('news-page-subtitle', 'Vui lòng thử lại hoặc quay về trang tin tức.');
    }

    updateText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
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
    window.newsDetailPage = new NewsDetailPage();
});
