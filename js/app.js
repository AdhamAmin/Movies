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
        } else {
            document.addEventListener('headerLoaded', () => {
                this.initSearch();
                this.initWatchlist(); // Watchlist count/icon is in header too
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

        // Route basics
        if (window.location.pathname.includes('search.html')) {
            await this.handleSearchPage();
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
                this.populateSection('recommended-container', topRated.results.slice(0, 10)); // Reusing recommended for Top Rated
            }
            if (action && action.results) {
                this.populateSection('action-container', action.results.slice(0, 10));
            }
        } catch (e) {
            console.error('Error loading movies:', e);
            this.showNotification('Failed to load some movies.');
        }
    }

    populateSection(containerId, movies) {
        const container = document.getElementById(containerId);
        if (!container || !movies || !movies.length) return;

        // Different layout for Trending (horizontal scroll) vs others (grid/list)
        // Actually, let's keep trending as snap-scroll and others as grid or similar?
        // User asked for "More movies". Let's assume index.html has containers.
        // For now, I'll use the generic card style.

        const isTrending = containerId === 'trending-container';

        container.innerHTML = movies.map((movie, index) => {
            // Stagger delay calculation
            const delay = index * 0.05;
            const style = `style="animation-delay: ${delay}s"`;

            if (isTrending) {
                return `
                <div data-movie-id="${movie.id}" class="stagger-item group relative flex-none w-[180px] md:w-[220px] aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 snap-start" ${style}>
                    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${tmdbService.getImageUrl(movie.poster_path)}')"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 class="text-white font-bold text-lg leading-tight">${movie.title}</h3>
                        <div class="flex items-center justify-between mt-2">
                            <span class="text-yellow-400 text-sm flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px] filled">star</span> ${movie.vote_average.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>`;
            } else {
                return `
                <div data-movie-id="${movie.id}" class="stagger-item flex flex-col gap-2 group cursor-pointer" ${style}>
                    <div class="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg shadow-black/50 hover-glow">
                        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${tmdbService.getImageUrl(movie.poster_path)}')"></div>
                        <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span class="text-xs font-bold text-white">${movie.vote_average.toFixed(1)}</span>
                        </div>
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-4xl transform scale-50 group-hover:scale-100 transition-transform">play_circle</span>
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

    // ... (rest of the file) ...

    populateTrending(movies) {
        const container = document.getElementById('trending-container');
        if (!container || !movies || !movies.length) return;

        container.innerHTML = movies.map(movie => `
            <div data-movie-id="${movie.id}" class="stagger-item group relative flex-none w-[180px] md:w-[220px] aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 snap-start">
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
            <div data-movie-id="${movie.id}" class="stagger-item flex flex-col gap-2 group cursor-pointer">
                <div class="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg shadow-black/50 hover-glow">
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