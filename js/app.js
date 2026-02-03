// Main Application Logic
class MovieApp {
    constructor() {
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initPageTransitions();
            this.initSearch();
            this.initWatchlist();
            this.initFilters();
            this.initSortControls();
        });
    }

    // Page Transitions
    initPageTransitions() {
        // Add page transition class
        document.body.classList.add('page-transition');

        // Smooth scroll to top on page load
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Handle navigation with transitions
        document.querySelectorAll('a[href*=".html"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#')) {
                    e.preventDefault();
                    document.body.style.opacity = '0';
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300);
                }
            });
        });
    }

    // Search Functionality
    initSearch() {
        const searchInput = document.getElementById('global-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            this.filterMovies(query);
        });
    }

    filterMovies(query) {
        const movieCards = document.querySelectorAll('[data-movie-title]');
        movieCards.forEach(card => {
            const title = card.getAttribute('data-movie-title').toLowerCase();
            if (title.includes(query)) {
                card.style.display = '';
                card.classList.add('animate-fade-in');
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Watchlist Management
    initWatchlist() {
        document.querySelectorAll('[data-watchlist-btn]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const movieId = btn.getAttribute('data-movie-id');
                this.toggleWatchlist(movieId, btn);
            });
        });
        this.updateWatchlistUI();
    }

    toggleWatchlist(movieId, btn) {
        const index = this.watchlist.indexOf(movieId);
        if (index > -1) {
            this.watchlist.splice(index, 1);
            btn.innerHTML = '<span class="material-symbols-outlined">bookmark_add</span>';
        } else {
            this.watchlist.push(movieId);
            btn.innerHTML = '<span class="material-symbols-outlined filled">bookmark</span>';
        }
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.showNotification(index > -1 ? 'Removed from watchlist' : 'Added to watchlist');
    }

    updateWatchlistUI() {
        document.querySelectorAll('[data-watchlist-btn]').forEach(btn => {
            const movieId = btn.getAttribute('data-movie-id');
            if (this.watchlist.includes(movieId)) {
                btn.innerHTML = '<span class="material-symbols-outlined filled">bookmark</span>';
            }
        });
    }

    // Filters for search page
    initFilters() {
        const genreCheckboxes = document.querySelectorAll('input[type="checkbox"][data-genre]');
        const ratingSlider = document.querySelector('[data-rating-slider]');
        const yearInputs = document.querySelectorAll('[data-year-input]');
        const resetBtn = document.querySelector('[data-reset-filters]');

        if (genreCheckboxes.length > 0) {
            genreCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => this.applyFilters());
            });
        }

        if (ratingSlider) {
            ratingSlider.addEventListener('input', () => this.applyFilters());
        }

        if (yearInputs.length > 0) {
            yearInputs.forEach(input => {
                input.addEventListener('change', () => this.applyFilters());
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters());
        }
    }

    applyFilters() {
        const selectedGenres = Array.from(document.querySelectorAll('input[type="checkbox"][data-genre]:checked'))
            .map(cb => cb.getAttribute('data-genre').toLowerCase());

        const movieCards = document.querySelectorAll('[data-movie-card]');

        movieCards.forEach(card => {
            const genres = (card.getAttribute('data-genres') || '').toLowerCase().split(',');
            const matchesGenre = selectedGenres.length === 0 ||
                selectedGenres.some(g => genres.includes(g));

            if (matchesGenre) {
                card.style.display = '';
                card.classList.add('animate-fade-in');
            } else {
                card.style.display = 'none';
            }
        });
    }

    resetFilters() {
        document.querySelectorAll('input[type="checkbox"][data-genre]').forEach(cb => {
            cb.checked = false;
        });
        this.applyFilters();
    }

    // Sort Controls
    initSortControls() {
        const sortSelect = document.querySelector('[data-sort-select]');
        if (!sortSelect) return;

        sortSelect.addEventListener('change', (e) => {
            this.sortMovies(e.target.value);
        });
    }

    sortMovies(criteria) {
        const container = document.querySelector('[data-movies-container]');
        if (!container) return;

        const cards = Array.from(container.children);
        cards.sort((a, b) => {
            switch (criteria) {
                case 'rating':
                    return parseFloat(b.getAttribute('data-rating') || 0) -
                        parseFloat(a.getAttribute('data-rating') || 0);
                case 'alphabetical':
                    return (a.getAttribute('data-movie-title') || '').localeCompare(
                        b.getAttribute('data-movie-title') || '');
                case 'release_date':
                    return parseInt(b.getAttribute('data-year') || 0) -
                        parseInt(a.getAttribute('data-year') || 0);
                default:
                    return 0;
            }
        });

        cards.forEach(card => container.appendChild(card));
    }

    // Notification System
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-surface-dark border border-primary text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Initialize App
const app = new MovieApp();
