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

        // Wait for header to be ready before init header controls
        if (document.getElementById('global-search')) {
            this.initSearch();
            this.initWatchlist();
            this.initShare();
        } else {
            document.addEventListener('headerLoaded', () => {
                this.initSearch();
                this.initWatchlist(); // Watchlist count/icon is in header too
                this.initShare();
            });
        }

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

        // Initialize Page State
        this.pageState = {
            recommended: 1,
            action: 1,
            trending: 1
        };

        this.initLoadMore();

        if (window.location.pathname.includes('search.html')) {
            await this.handleSearchPage();
            return;
        }

        if (window.location.pathname.includes('tv.html')) {
            await this.handleTVPage();
            return;
        }

        // Fetch data for homepage
        try {
            const [trending, topRated, action] = await Promise.all([
                tmdbService.getTrendingMovies('week'),
                tmdbService.getTopRated(),
                tmdbService.getMoviesByGenre(28) // 28 = Action
            ]);

            if (trending && trending.results) {
                this.populateSection('trending-container', trending.results);
            }
            if (topRated && topRated.results) {
                this.populateSection('recommended-container', topRated.results);
            }
            if (action && action.results) {
                this.populateSection('action-container', action.results);
            }
        } catch (e) {
            console.error('Error loading movies:', e);
            this.showNotification('Failed to load some movies.');
        }
    }

    async handleTVPage() {
        try {
            const [trending, topRated, scifi] = await Promise.all([
                tmdbService.getTrendingTV('week'),
                tmdbService.getTopRatedTV(),
                tmdbService.getTopRatedTV() // Placeholder, ideally specific genre
            ]);

            const normalize = (list) => list.map(item => ({
                ...item,
                title: item.name || item.title,
                release_date: item.first_air_date || item.release_date
            }));

            if (trending && trending.results) {
                this.populateSection('trending-container', normalize(trending.results));
            }
            if (topRated && topRated.results) {
                this.populateSection('recommended-container', normalize(topRated.results));
            }
            if (scifi && scifi.results) {
                // Just showing more top rated for now as placeholder or different sort
                this.populateSection('action-container', normalize(scifi.results));
            }

        } catch (e) {
            console.error('Error loading TV shows:', e);
            this.showNotification('Failed to load TV shows.');
        }
    }

    initLoadMore() {
        const loadMoreBtns = document.querySelectorAll('.load-more-btn');
        loadMoreBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.loadMore(section);
            });
        });
    }

    async loadMore(section) {
        if (!this.pageState[section]) return;
        this.pageState[section]++;
        const page = this.pageState[section];
        let results = null;

        const isTV = window.location.pathname.includes('tv.html');

        try {
            if (section === 'recommended') {
                results = isTV ? await tmdbService.getTopRatedTV(page) : await tmdbService.getTopRated(page);
            } else if (section === 'action') {
                // Action for movies is Genre 28. For TV in this app I used TopRated again as placeholder, 
                // but let's assume we want to load more of whatever was there.
                // If TV, I used getTopRatedTV for 'action-container' too in handleTVPage.
                // To support true 'Action' TV, I'd need getMoviesByGenre equivalent for TV.
                // For now, continuing the pattern:
                results = isTV ? await tmdbService.getTopRatedTV(page) : await tmdbService.getMoviesByGenre(28, page);
            }

            if (results && results.results) {
                let items = results.results;
                if (isTV) {
                    items = items.map(item => ({
                        ...item,
                        title: item.name || item.title,
                        release_date: item.first_air_date || item.release_date
                    }));
                }
                this.appendSection(`${section}-container`, items);
            }
        } catch (e) {
            console.error('Error loading more:', e);
        }
    }

    appendSection(containerId, movies) {
        const container = document.getElementById(containerId);
        if (!container || !movies || !movies.length) return;

        // Generate HTML but don't replace innerHTML
        const newHtml = this.generateCardsHtml(movies, false); // false = not trending
        container.insertAdjacentHTML('beforeend', newHtml);
    }

    generateCardsHtml(movies, isTrending) {
        return movies.map((movie, index) => {
            const delay = 0; // No stagger on manual load usually, or small fixed
            const style = `style="animation-delay: ${delay}s"`;

            if (isTrending) {
                // ... (trending card code)
                return ''; // Handled in populateSection usually
            } else {
                return `
                <div data-movie-id="${movie.id}" class="stagger-item flex flex-col gap-2 group cursor-pointer" ${style}>
                    <div class="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg shadow-black/50 hover-glow">
                        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${tmdbService.getImageUrl(movie.poster_path)}')"></div>
                        <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px] text-[#FFD700] filled">star</span>
                            <span class="text-xs font-bold text-white">${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
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
                </div>`;
            }
        }).join('');
    }

    populateSection(containerId, movies) {
        const container = document.getElementById(containerId);
        if (!container || !movies || !movies.length) return;

        const isTrending = containerId === 'trending-container';

        if (isTrending) {
            container.innerHTML = movies.map(movie => `
            <div data-movie-id="${movie.id}" class="stagger-item group relative flex-none w-[180px] md:w-[220px] aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 snap-start">
                <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${tmdbService.getImageUrl(movie.poster_path)}')"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3 class="text-white font-bold text-lg leading-tight">${movie.title}</h3>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-yellow-400 text-sm flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px] filled">star</span> ${movie.vote_average.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
        } else {
            container.innerHTML = this.generateCardsHtml(movies, false);
        }
    }

    // --- Missing Methods Implementation ---

    initPageTransitions() {
        // Handle internal links for smooth transitions
        document.addEventListener('click', e => {
            const link = e.target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin) && !link.hash && !link.dataset.noTransition) {
                e.preventDefault();
                document.body.classList.remove('loaded');
                setTimeout(() => {
                    window.location.href = link.href;
                }, 400); // Wait for fade out
            }
        });
    }

    initSearch() {
        const searchInput = document.getElementById('global-search');
        if (!searchInput) return;

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    initShare() {
        const shareBtn = document.getElementById('share-btn');
        const mobileShareBtn = document.getElementById('mobile-share-btn');

        const openShare = () => this.showShareModal();

        if (shareBtn) shareBtn.addEventListener('click', openShare);
        if (mobileShareBtn) mobileShareBtn.addEventListener('click', openShare);
    }

    showShareModal() {
        // Check if modal exists
        if (document.getElementById('share-modal')) return;

        const url = window.location.href;

        const modalHtml = `
        <div id="share-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div class="bg-gray-100 dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm m-4 shadow-2xl relative">
                <button id="close-share" class="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Share this page</h3>
                
                <div class="flex flex-col gap-4">
                    <button id="copy-link-btn" class="flex items-center gap-4 w-full p-4 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors group text-left">
                        <div class="size-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                             <span class="material-symbols-outlined">link</span>
                        </div>
                        <div>
                            <span class="block font-semibold text-gray-900 dark:text-white">Copy Link</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">Copy to clipboard</span>
                        </div>
                    </button>

                    <button id="whatsapp-btn" class="flex items-center gap-4 w-full p-4 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors group text-left">
                        <div class="size-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400">
                             <span class="material-symbols-outlined">chat</span>
                        </div>
                        <div>
                            <span class="block font-semibold text-gray-900 dark:text-white">WhatsApp</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">Share via WhatsApp</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('share-modal');
        const closeBtn = document.getElementById('close-share');
        const copyBtn = document.getElementById('copy-link-btn');
        const waBtn = document.getElementById('whatsapp-btn');

        const closeModal = () => modal.remove();

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('Link Copied!');
                closeModal();
            });
        });

        waBtn.addEventListener('click', () => {
            window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
            closeModal();
        });
    }

    initWatchlist() {
        // Event delegation for watchlist toggles
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.watchlist-btn'); // Assuming buttons have this class
            if (btn) {
                e.stopPropagation();
                const movieData = JSON.parse(btn.dataset.movie || '{}');
                this.toggleWatchlist(movieData);
            }
        });
    }

    toggleWatchlist(movie) {
        if (!movie || !movie.id) return;
        const index = this.watchlist.findIndex(m => m.id === movie.id);
        if (index === -1) {
            this.watchlist.push(movie);
            this.showNotification('Added to Watchlist');
        } else {
            this.watchlist.splice(index, 1);
            this.showNotification('Removed from Watchlist');
        }
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        this.updateWatchlistUI();
    }

    initFilters() {
        // Placeholder for filter logic if needed
        const genreSelect = document.getElementById('genre-select');
        if (genreSelect) {
            genreSelect.addEventListener('change', (e) => {
                // Implement filtering logic here
                console.log('Filter changed:', e.target.value);
            });
        }
    }

    initCustomSliders() {
        // Logic for custom drag scrolling is handled by CSS snap-x mostly, 
        // but we can add button controls here
        const sliders = document.querySelectorAll('.snap-x');
        sliders.forEach(slider => {
            slider.style.cursor = 'grab';
            let isDown = false;
            let startX;
            let scrollLeft;

            slider.addEventListener('mousedown', (e) => {
                isDown = true;
                slider.style.cursor = 'grabbing';
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
            });
            slider.addEventListener('mouseleave', () => {
                isDown = false;
                slider.style.cursor = 'grab';
            });
            slider.addEventListener('mouseup', () => {
                isDown = false;
                slider.style.cursor = 'grab';
            });
            slider.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - startX) * 2;
                slider.scrollLeft = scrollLeft - walk;
            });
        });
    }

    updateWatchlistUI() {
        // Update header counter or icon if exists
        const countBadge = document.getElementById('watchlist-count');
        if (countBadge) {
            countBadge.textContent = this.watchlist.length;
            countBadge.style.display = this.watchlist.length > 0 ? 'flex' : 'none';
        }
    }

    async handleSearchPage() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        const container = document.getElementById('search-results-container'); // Ensure this ID exists in search.html

        if (!container) return; // Not on search result area

        // Update title/header
        const titleEl = document.getElementById('search-title');
        if (titleEl && query) titleEl.textContent = `Results for "${query}"`;

        if (!query) {
            container.innerHTML = '<p class="text-center text-gray-500">Please enter a search term.</p>';
            return;
        }

        try {
            const results = await tmdbService.searchMovies(query);
            if (results && results.results && results.results.length > 0) {
                this.populateSection('search-results-container', results.results);
            } else {
                container.innerHTML = '<p class="text-center text-gray-500">No results found.</p>';
            }
        } catch (e) {
            console.error(e);
            container.innerHTML = '<p class="text-center text-red-500">Error searching movies.</p>';
        }
    }

    showNotification(msg) {
        // Simple alert or custom toast
        // Creating a simple toast for now
        const offset = document.querySelectorAll('.toast-notif').length * 60;
        const toast = document.createElement('div');
        toast.className = 'toast-notif fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded shadow-lg animate-fade-in z-50';
        toast.style.bottom = `${20 + offset}px`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}


document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-movie-id]');
    if (!card) return;
    const id = card.getAttribute('data-movie-id');
    if (id) window.location.href = `movie-details.html?id=${id}`;
});

const app = new MovieApp();