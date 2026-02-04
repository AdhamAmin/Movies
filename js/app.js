const API_KEY = typeof TMDB_API_KEY !== 'undefined' ? TMDB_API_KEY : window.TMDB_API_KEY;

if (!API_KEY) {
    console.error('CRITICAL: TMDB_API_KEY is missing!');
    alert('Critical Error: API Key missing. Please check config.js.');
}

let tmdbService;
try {
    tmdbService = new TMDBService(API_KEY);
} catch (e) {
    console.error('Failed to init service:', e);
}

class MovieApp {
    constructor() {
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.boot());
        } else {
            this.boot();
        }
    }

    async boot() {
        this.initPageTransitions();
        this.initSearch();
        this.initWatchlist();
        this.initFilters();
        this.initCustomSliders();
        this.updateWatchlistUI();

        // Trigger page fade-in
        requestAnimationFrame(() => {
            document.body.classList.add('loaded');
        });

        await this.start();
    }

    async start() {
        if (!tmdbService) {
            this.showNotification('TMDB Service Unavailable');
            console.error('TMDB Service not initialized');
            return;
        }

        // Route basics
        if (window.location.pathname.includes('search.html')) {
            await this.handleSearchPage();
            return; // Don't load trending on search page
        }

        // Fetch data for homepage
        const trendingData = await tmdbService.getTrendingMovies('week');
        if (trendingData && trendingData.results) {
            this.populateTrending(trendingData.results.slice(0, 10));
            this.populateRecommended(trendingData.results.slice(10, 20));
        } else {
            this.showNotification('Failed to load movies. Check API Key.');
            const container = document.getElementById('trending-container');
            if (container) {
                container.innerHTML = '<div class="p-8 text-red-500 text-center w-full">Error loading movies. Please check your API key / Internet.</div>';
            }
        }
    }

    // Page Transitions
    initPageTransitions() {
        document.body.classList.add('page-transition');

        // Handle navigation with transitions
        document.querySelectorAll('a[href*=".html"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.includes('javascript:')) {
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
    // Search Functionality
    initSearch() {
        const searchInput = document.getElementById('global-search');

        // Handle Header Search
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = e.target.value.trim();
                    if (query) {
                        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                    }
                }
            });
        }

        // Handle Search Page Input
        const pageSearchInput = document.getElementById('search-input');
        if (pageSearchInput) {
            pageSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const query = e.target.value.trim();
                    if (query) {
                        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                    }
                }
            });
        }
    }

    async handleSearchPage() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        const container = document.getElementById('search-results');
        const input = document.getElementById('search-input');

        if (input && query) input.value = query;

        if (query && container) {
            container.innerHTML = '<div class="col-span-full text-center text-white p-8">Searching...</div>';
            const data = await tmdbService.searchMovies(query);

            if (data && data.results && data.results.length > 0) {
                container.innerHTML = data.results.map(movie => `
                    <div data-movie-id="${movie.id}" class="flex flex-col gap-2 group cursor-pointer animate-fade-in-up">
                        <div class="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg bg-surface-dark">
                            <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
                                style="background-image: url('${tmdbService.getImageUrl(movie.poster_path) || 'img/no-poster.png'}')">
                                ${!movie.poster_path ? '<div class="flex h-full items-center justify-center text-gray-500">No Image</div>' : ''}
                            </div>
                            <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span class="text-xs font-bold text-white">${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
                            </div>
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span class="material-symbols-outlined text-white text-4xl transform scale-50 group-hover:scale-100 transition-transform">play_circle</span>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <h3 class="text-white font-medium truncate group-hover:text-primary transition-colors">${movie.title}</h3>
                            <span class="text-text-secondary text-sm">${movie.release_date?.split('-')[0] || '—'}</span>
                        </div>
                    </div>
                `).join('');

                // Add click listeners to new cards
                container.querySelectorAll('[data-movie-id]').forEach(card => {
                    card.addEventListener('click', () => {
                        window.location.href = `movie-details.html?id=${card.dataset.movieId}`;
                    });
                });
            } else {
                container.innerHTML = '<div class="col-span-full text-center text-text-secondary p-8">No results found.</div>';
            }
        } else if (container) {
            container.innerHTML = '<div class="col-span-full text-center text-text-secondary p-8">Type something to search...</div>';
        }
    }

    // Watchlist Management
    initWatchlist() {
        // Use event delegation for dynamically added buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-watchlist-btn]');
            if (btn) {
                e.stopPropagation();
                e.preventDefault();
                const movieId = btn.getAttribute('data-movie-id');
                this.toggleWatchlist(movieId, btn);
            }
        });
        this.updateWatchlistUI();
    }

    toggleWatchlist(movieId, btn) {
        if (!movieId) return;

        const index = this.watchlist.indexOf(movieId);
        if (index > -1) {
            this.watchlist.splice(index, 1);
            // Update UI for this button
            if (btn) btn.innerHTML = '<span class="material-symbols-outlined">bookmark_add</span>';
        } else {
            this.watchlist.push(movieId);
            // Update UI for this button
            if (btn) btn.innerHTML = '<span class="material-symbols-outlined filled">bookmark</span>';
        }
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.showNotification(index > -1 ? 'Removed from watchlist' : 'Added to watchlist');

        // Update all other buttons for the same movie
        this.updateWatchlistUI();
    }

    updateWatchlistUI() {
        document.querySelectorAll('[data-watchlist-btn]').forEach(btn => {
            const movieId = btn.getAttribute('data-movie-id');
            if (this.watchlist.includes(movieId)) {
                btn.innerHTML = '<span class="material-symbols-outlined filled">bookmark</span>';
            } else {
                btn.innerHTML = '<span class="material-symbols-outlined">bookmark_add</span>';
            }
        });
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

    // Custom slider controls
    initCustomSliders() {
        // Find all custom sliders (visual sliders with draggable handles)
        const sliders = document.querySelectorAll('.relative.h-1');

        sliders.forEach(slider => {
            const handle = slider.querySelector('.size-3');
            const track = slider.querySelector('.absolute.left-0');

            if (!handle || !track) return;

            let isDragging = false;

            handle.addEventListener('mousedown', (e) => {
                isDragging = true;
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const sliderRect = slider.getBoundingClientRect();
                let percentage = ((e.clientX - sliderRect.left) / sliderRect.width) * 100;
                percentage = Math.max(0, Math.min(100, percentage));

                // Update visual position
                handle.style.left = `${percentage}%`;
                track.style.width = `${percentage}%`;

                // Update rating value if applicable
                const ratingValue = (percentage / 100) * 10;
                const ratingDisplay = slider.parentElement.querySelector('.text-white');
                if (ratingDisplay) {
                    ratingDisplay.textContent = ratingValue.toFixed(1) + '+';
                }
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    this.applyFilters();
                }
            });
        });
    }

    populateTrending(movies) {
        const container = document.getElementById('trending-container');
        if (!container || !movies || !movies.length) return;

        container.innerHTML = movies.map(movie => `
            <div data-movie-id="${movie.id}" class="group relative flex-none w-[180px] md:w-[220px] aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 snap-start">
                <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${tmdbService.getImageUrl(movie.poster_path)}')"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3 class="text-white font-bold text-lg leading-tight">${movie.title}</h3>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-yellow-400 text-sm flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px] filled">star</span> ${movie.vote_average.toFixed(1)}
                        </span>
                        <button class="size-8 rounded-full bg-primary flex items-center justify-center text-white">
                            <span class="material-symbols-outlined text-[16px]">add</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    populateRecommended(movies) {
        const container = document.getElementById('recommended-container');
        if (!container || !movies || !movies.length) return;

        container.innerHTML = movies.map(movie => `
            <div data-movie-id="${movie.id}" class="flex flex-col gap-2 group cursor-pointer">
                <div class="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg shadow-black/50">
                    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${tmdbService.getImageUrl(movie.poster_path)}')"></div>
                    <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px] text-[#FFD700] filled">star</span>
                        <span class="text-xs font-bold text-white">${movie.vote_average.toFixed(1)}</span>
                    </div>
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div class="size-12 rounded-full bg-primary/90 flex items-center justify-center text-white shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75">
                            <span class="material-symbols-outlined filled">play_arrow</span>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col">
                    <h3 class="text-gray-900 dark:text-white font-semibold truncate group-hover:text-primary transition-colors">${movie.title}</h3>
                    <span class="text-gray-600 dark:text-gray-500 text-xs">${movie.release_date?.split('-')[0] || 'N/A'}</span>
                </div>
            </div>
        `).join('');
    }
}


document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-movie-id]');
    if (!card) return;
    const id = card.getAttribute('data-movie-id');
    if (id) window.location.href = `movie-details.html?id=${id}`;
});

const app = new MovieApp();