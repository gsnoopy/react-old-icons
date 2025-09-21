class IconBrowser {
    constructor() {
        this.icons = [];
        this.filteredIcons = [];
        this.categories = new Set();
        this.currentSize = 32;
        this.currentPage = 1;
        this.iconsPerPage = 50;
        this.totalPages = 1;

        this.init();
    }

    async init() {
        await this.loadIcons();
        this.setupEventListeners();
        this.calculatePagination();
        this.renderCurrentPage();
        this.updateStats();
        this.hideLoading();
    }

    async loadIcons() {
        try {
            const response = await fetch('./icons.jsonl');
            const text = await response.text();

            this.icons = text.trim().split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const icon = JSON.parse(line);
                    this.categories.add(icon.category);
                    const githubUrl = `https://raw.githubusercontent.com/gsnoopy/react-old-icons/main/Icons/${encodeURIComponent(icon.component)}.webp`;

                    return {
                        name: icon.name,
                        componentName: icon.component,
                        category: icon.category,
                        githubUrl: githubUrl,
                        normalized: icon.normalized
                    };
                });

            this.filteredIcons = [...this.icons];
            this.populateCategories();

        } catch (error) {
            console.error('Error loading icons:', error);
            document.getElementById('loading').innerHTML = `
                <div class="hourglass" style="background: url('data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 32 32\\'%3E%3Ctext y=\\'24\\' font-size=\\'24\\'%3E❌%3C/text%3E%3C/svg%3E');"></div>
                <p>Error loading icons. Please check if icons.jsonl exists.</p>
            `;
        }
    }

    populateCategories() {
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">All Categories</option>';

        Array.from(this.categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = `${category} (${this.icons.filter(icon => icon.category === category).length})`;
            categorySelect.appendChild(option);
        });
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search');
        searchInput.addEventListener('input', () => {
            this.currentPage = 1;
            this.filterIcons();
        });

        const categorySelect = document.getElementById('category');
        categorySelect.addEventListener('change', () => {
            this.currentPage = 1;
            this.filterIcons();
        });

        const sizeSlider = document.getElementById('size-slider');
        const sizeDisplay = document.getElementById('size-display');

        sizeSlider.addEventListener('input', (e) => {
            this.currentSize = parseInt(e.target.value);
            sizeDisplay.textContent = `${this.currentSize}px`;
            this.updateIconSizes();
        });

        const perPageSelect = document.getElementById('per-page');
        perPageSelect.addEventListener('change', (e) => {
            this.iconsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.calculatePagination();
            this.renderCurrentPage();
            this.updateStats();
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                this.currentPage = parseInt(e.target.dataset.page);
                this.renderCurrentPage();
                this.updateStats();
                this.scrollToTop();
            }
            if (e.target.id === 'prev-page') {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderCurrentPage();
                    this.updateStats();
                    this.scrollToTop();
                }
            }
            if (e.target.id === 'next-page') {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.renderCurrentPage();
                    this.updateStats();
                    this.scrollToTop();
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'f') {
                    e.preventDefault();
                    searchInput.focus();
                }
            }
            if (e.key === 'Escape') {
                searchInput.value = '';
                categorySelect.value = '';
                this.currentPage = 1;
                this.filterIcons();
            }
            if (e.key === 'ArrowLeft' && this.currentPage > 1) {
                this.currentPage--;
                this.renderCurrentPage();
                this.updateStats();
                this.scrollToTop();
            }
            if (e.key === 'ArrowRight' && this.currentPage < this.totalPages) {
                this.currentPage++;
                this.renderCurrentPage();
                this.updateStats();
                this.scrollToTop();
            }
        });
    }

    filterIcons() {
        const searchTerm = document.getElementById('search').value.toLowerCase().trim();
        const selectedCategory = document.getElementById('category').value;

        this.filteredIcons = this.icons.filter(icon => {
            let matchesSearch = true;

            if (searchTerm) {
                const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
                matchesSearch = searchWords.every(word =>
                    icon.normalized.includes(word) ||
                    icon.componentName.toLowerCase().includes(word) ||
                    icon.name.toLowerCase().includes(word)
                );
            }

            const matchesCategory = !selectedCategory || icon.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        this.calculatePagination();
        this.renderCurrentPage();
        this.updateStats();
    }

    calculatePagination() {
        this.totalPages = Math.ceil(this.filteredIcons.length / this.iconsPerPage);
        if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }
    }

    getCurrentPageIcons() {
        const startIndex = (this.currentPage - 1) * this.iconsPerPage;
        const endIndex = startIndex + this.iconsPerPage;
        return this.filteredIcons.slice(startIndex, endIndex);
    }

    renderCurrentPage() {
        const grid = document.getElementById('icons-grid');
        const currentIcons = this.getCurrentPageIcons();

        grid.innerHTML = '';

        if (this.filteredIcons.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 8px;">🔍</div>
                    <div>No icons found matching your criteria</div>
                    <div style="font-size: 10px; margin-top: 4px;">Try different search terms or category</div>
                </div>
            `;
            this.renderPagination();
            return;
        }

        currentIcons.forEach(icon => {
            const iconElement = this.createIconElement(icon);
            grid.appendChild(iconElement);
        });

        this.renderPagination();
    }

    renderPagination() {
        let paginationHtml = '';

        if (this.totalPages > 1) {
            paginationHtml = '<div class="pagination">';

            paginationHtml += `<button id="prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>◀ Prev</button>`;

            paginationHtml += '<div class="page-numbers">';

            const maxVisible = 5;
            let startPage, endPage;

            if (this.totalPages <= maxVisible) {
                startPage = 1;
                endPage = this.totalPages;
            } else {
                const half = Math.floor(maxVisible / 2);
                startPage = Math.max(1, this.currentPage - half);
                endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

                if (endPage - startPage + 1 < maxVisible) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                }
            }

            if (startPage > 1) {
                paginationHtml += `<button class="page-btn" data-page="1">1</button>`;
                if (startPage > 2) {
                    paginationHtml += `<span class="page-dots">...</span>`;
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                paginationHtml += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }

            if (endPage < this.totalPages) {
                if (endPage < this.totalPages - 1) {
                    paginationHtml += `<span class="page-dots">...</span>`;
                }
                paginationHtml += `<button class="page-btn" data-page="${this.totalPages}">${this.totalPages}</button>`;
            }

            paginationHtml += '</div>';

            paginationHtml += `<button id="next-page" ${this.currentPage === this.totalPages ? 'disabled' : ''}>Next ▶</button>`;

            paginationHtml += '</div>';
        }

        const container = document.querySelector('.icons-container');
        let paginationDiv = container.querySelector('.pagination-container');
        if (!paginationDiv) {
            paginationDiv = document.createElement('div');
            paginationDiv.className = 'pagination-container';
            container.appendChild(paginationDiv);
        }
        paginationDiv.innerHTML = paginationHtml;
    }

    scrollToTop() {
        document.querySelector('.icons-container').scrollTop = 0;
    }

    createIconElement(icon) {
        const div = document.createElement('div');
        div.className = 'icon-item';
        div.title = `Click to copy: ${icon.componentName}`;

        div.innerHTML = `
            <img
                src="${icon.githubUrl}"
                alt="${icon.name}"
                class="icon-image"
                width="${this.currentSize}"
                height="${this.currentSize}"
                loading="lazy"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 32 32\\'%3E%3Ctext y=\\'24\\' font-size=\\'20\\'%3E❓%3C/text%3E%3C/svg%3E'"
            >
            <div class="icon-name">${icon.componentName}</div>
        `;

        div.addEventListener('click', () => {
            this.copyComponentName(icon.componentName);
        });

        return div;
    }

    updateIconSizes() {
        const images = document.querySelectorAll('.icon-image');
        images.forEach(img => {
            img.width = this.currentSize;
            img.height = this.currentSize;
        });
    }

    copyComponentName(componentName) {
        const code = `<${componentName} size={32} />`;

        navigator.clipboard.writeText(code).then(() => {
            this.showCopyNotification();
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopyNotification();
        });
    }

    showCopyNotification() {
        const notification = document.getElementById('copy-notification');
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    updateStats() {
        const totalCount = this.icons.length;
        const filteredCount = this.filteredIcons.length;
        const startIndex = (this.currentPage - 1) * this.iconsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.iconsPerPage, filteredCount);

        document.getElementById('total-icons').textContent = `Total: ${totalCount.toLocaleString()} icons`;

        if (filteredCount === 0) {
            document.getElementById('filtered-count').textContent = 'No icons shown';
        } else if (this.totalPages === 1) {
            document.getElementById('filtered-count').textContent = `${filteredCount.toLocaleString()} icons shown`;
        } else {
            document.getElementById('filtered-count').textContent = `Showing ${startIndex}-${endIndex} of ${filteredCount.toLocaleString()} icons (Page ${this.currentPage}/${this.totalPages})`;
        }

        document.getElementById('status-count').textContent = filteredCount.toLocaleString();

        const statusField = document.querySelector('.status-bar-field');
        if (filteredCount === totalCount && this.totalPages === 1) {
            statusField.textContent = 'Ready';
        } else {
            statusField.textContent = `Page ${this.currentPage}/${this.totalPages}`;
        }
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new IconBrowser();
});