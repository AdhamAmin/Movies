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
        this.initGridControls();
        this.updateWatchlistUI();

        // Show credits modal on first visit (only on homepage)
        this.initCreditsModal();

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
            drama: 1,
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
                // Populate Hero with #1 Trending
                if (trending.results.length > 0) {
                    this.populateHero(trending.results[0], 'movie');
                }
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
            const [trending, topRated, scifi, drama] = await Promise.all([
                tmdbService.getTrendingTV('week'),
                tmdbService.getTopRatedTV(),
                tmdbService.discover('tv', { genre: 10765 }), // Sci-Fi & Fantasy
                tmdbService.discover('tv', { genre: 18 })     // Drama
            ]);

            const normalize = (list) => list.map(item => ({
                ...item,
                title: item.name || item.title,
                release_date: item.first_air_date || item.release_date
            }));

            if (trending && trending.results) {
                // Populate Hero with #1 Trending
                if (trending.results.length > 0) {
                    this.populateHero(trending.results[0], 'tv');
                }
                this.populateSection('trending-container', normalize(trending.results));
            }
            if (topRated && topRated.results) {
                this.populateSection('recommended-container', normalize(topRated.results));
            }
            if (scifi && scifi.results) {
                this.populateSection('action-container', normalize(scifi.results));
            }
            if (drama && drama.results) {
                this.populateSection('drama-container', normalize(drama.results));
            }

        } catch (e) {
            console.error('Error loading TV shows:', e);
            this.showNotification('Failed to load TV shows.');
        }
    }

    async populateHero(item, type) {
        if (!item) return;

        // Fetch full details to get extra info like runtime, proper genres, etc.
        // Note: For Trending items, we have some info, but details gave us videos and runtime.
        let details = item;
        try {
            // We need a method in service to get TV details similar to movie details if we want parity, 
            // but let's use what we have or generic getMovieDetails if it handles TV (likely needs separation or update).
            // Currently tmdb-service only has getMovieDetails. Let's assume we use basic info for now + fetch video if possible.
            // Or better, let's assume we display what we have and maybe fetch video on click or lazy load.
            // For better "real movie" feel, let's try to get details if it's a movie.
            if (type === 'movie') {
                const fullDetails = await tmdbService.getMovieDetails(item.id);
                if (fullDetails) details = fullDetails;
            } else if (tmdbService.baseUrl) {
                // naive check if we can fetch tv details? Service doesn't have explicit getTVDetails.
                // Let's stick to basic item for now and just set background/title.
                // If we want trailer, we definitely need video endpoint. 
                // Let's assume playTrailer will handle fetching video on demand.
            }
        } catch (e) { console.warn('Hero details fetch failed', e); }

        const bgEl = document.getElementById('hero-bg');
        const titleEl = document.getElementById('hero-title');
        const ratingEl = document.getElementById('hero-rating');
        const yearEl = document.getElementById('hero-year');
        const descriptionEl = document.getElementById('hero-description');
        const watchBtn = document.getElementById('hero-watch-btn');
        const infoBtn = document.getElementById('hero-info-btn');
        const genresEl = document.getElementById('hero-genres');
        const durationEl = document.getElementById('hero-duration');

        if (bgEl) {
            // Prefer original for hero
            const bgPath = details.backdrop_path || details.poster_path;
            bgEl.style.backgroundImage = `url('${tmdbService.getImageUrl(bgPath, 'original')}')`;
        }

        if (titleEl) titleEl.textContent = details.title || details.name;
        if (ratingEl) ratingEl.innerHTML = `<span class="material-symbols-outlined text-[18px] filled">star</span> ${details.vote_average ? details.vote_average.toFixed(1) : 'N/A'}`;
        if (yearEl) yearEl.textContent = (details.release_date || details.first_air_date || '').split('-')[0];
        if (descriptionEl) descriptionEl.textContent = details.overview;

        // Genres
        if (genresEl) {
            // If details has genres array (detail endpoint) use it, else use generic IDs map?
            // Trending result only has genre_ids.
            if (details.genres && details.genres.length) {
                genresEl.textContent = details.genres.map(g => g.name).slice(0, 2).join(' / ');
            } else {
                genresEl.textContent = 'Trending'; // Fallback
            }
        }

        // Duration / Seasons
        if (durationEl) {
            if (type === 'movie' && details.runtime) {
                const h = Math.floor(details.runtime / 60);
                const m = details.runtime % 60;
                durationEl.textContent = `${h}h ${m}m`;
            } else if (type === 'tv') {
                // If we didn't fetch details, we might not have seasons. Trending result doesn't usually have it.
                // We could just clear it or put "Series".
                durationEl.textContent = 'Series';
            }
        }

        // Action Buttons
        if (watchBtn) {
            watchBtn.onclick = () => this.playTrailer(item.id, type);
        }
        if (infoBtn) {
            infoBtn.onclick = () => window.location.href = `movie-details.html?id=${item.id}`; // Note: details page might need update for TV
        }
    }

    async playTrailer(id, type) {
        // Simple trailer player: fetch video, open in new tab or modal
        try {
            const endpoint = type === 'tv' ? 'tv' : 'movie';
            // We need a way to fetch videos since tmdbService only has getMovieDetails (which appends videos).
            // Let's force a fetch using raw fetch here or add a method. 
            // Quickest: construct URL manually since we have API Key key access via tmdbService property? 
            // tmdbService.apiKey is accessible.

            const response = await fetch(`${tmdbService.baseUrl}/${endpoint}/${id}/videos?api_key=${tmdbService.apiKey}`);
            const data = await response.json();

            if (data && data.results) {
                const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || data.results.find(v => v.site === 'YouTube');
                if (trailer) {
                    window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
                } else {
                    this.showNotification('No trailer available');
                }
            }
        } catch (e) {
            console.error('Trailer error:', e);
            this.showNotification('Error loading trailer');
        }
    }

    initLoadMore() {
        const loadMoreBtns = document.querySelectorAll('.load-more-btn');
        loadMoreBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.loadMore(section, btn);
            });
        });
    }

    async loadMore(section, btn) {
        if (!this.pageState[section]) {
            this.pageState[section] = 1;
        }

        this.pageState[section]++;
        const page = this.pageState[section];

        // Show loading state
        const originalText = btn.textContent;
        btn.textContent = 'Loading...';
        btn.disabled = true;

        try {
            let response;
            const isTV = window.location.pathname.includes('tv.html');

            // Determine which API to call based on section
            if (section === 'recommended') {
                response = isTV
                    ? await tmdbService.getTopRatedTV(page)
                    : await tmdbService.getTopRated(page);
            } else if (section === 'action') {
                response = isTV
                    ? await tmdbService.discover('tv', { genre: 10765 }, page) // 10765 = Sci-Fi & Fantasy
                    : await tmdbService.getMoviesByGenre(28, page); // 28 = Action
            } else if (section === 'drama') {
                response = isTV
                    ? await tmdbService.discover('tv', { genre: 18 }, page) // 18 = Drama
                    : await tmdbService.getMoviesByGenre(18, page); // 18 = Drama
            } else if (section === 'trending') {
                response = isTV
                    ? await tmdbService.getTrendingTV('week', page)
                    : await tmdbService.getTrendingMovies('week', page);
            }

            if (response && response.results && response.results.length > 0) {
                let movies = response.results;

                // Normalize TV show data
                if (isTV) {
                    movies = movies.map(item => ({
                        ...item,
                        title: item.name || item.title,
                        release_date: item.first_air_date || item.release_date
                    }));
                }

                // Append to existing content
                this.appendToSection(`${section}-container`, movies);

                // this.showNotification(`Loaded ${movies.length} more items!`, 'success');
            } else {
                this.showNotification('No more items to load', 'info');
            }
        } catch (error) {
            console.error('Error loading more:', error);
            this.showNotification('Failed to load more items', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }


    appendToSection(containerId, movies) {
        const container = document.getElementById(containerId);
        if (!container || !movies || !movies.length) return;

        // Detect if this is the trending container (horizontal slider)
        const isTrending = containerId === 'trending-container';

        // Generate new cards with isAppend=true to make them visible immediately
        const newCards = this.generateCardsHtml(movies, isTrending, true);

        // Append (not replace)
        container.insertAdjacentHTML('beforeend', newCards);

        // Wire up watchlist buttons for new cards
        const newElements = container.querySelectorAll('.add-to-watchlist-btn:not([data-initialized])');
        newElements.forEach(btn => {
            btn.dataset.initialized = 'true';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();

                const movieId = btn.dataset.movieId;
                const movieTitle = btn.dataset.movieTitle;

                this.addToWatchlist({ id: movieId, title: movieTitle });
            });
        });
    }


    generateCardsHtml(movies, isTrending, isAppend = false) {
        return movies.map((movie, index) => {
            // For appended items, skip stagger animation and force visibility
            const animClass = isAppend ? 'animate-fade-in' : 'stagger-item';
            const style = isAppend ? '' : `style="animation-delay: ${index * 0.05}s"`; // Dynamic delay based on index

            // Initial opacity should be 1 if appending (handled by animate-fade-in or just default)
            // But stagger-item has opacity: 0. So we switch to a different class or inline style.
            const visibilityClass = isAppend ? 'opacity-100' : 'opacity-0';

            if (isTrending) {
                return `
                <div data-movie-id="${movie.id}" class="${animClass} group relative flex-none w-[180px] md:w-[220px] aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-10 snap-start">
                    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${tmdbService.getImageUrl(movie.poster_path)}')"></div>
                    
                    <!-- Watchlist Add Button (Trending) -->
                    <button class="add-to-watchlist-btn absolute top-2 left-2 size-8 rounded-full bg-black/70 hover:bg-primary backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110 z-20 opacity-0 group-hover:opacity-100"
                            data-movie-id="${movie.id}"
                            data-movie-title="${(movie.title || '').replace(/"/g, '&quot;')}"
                            title="Add to Watchlist">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                    </button>

                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 class="text-white font-bold text-lg leading-tight truncate">${movie.title}</h3>
                        <div class="flex items-center justify-between mt-2">
                            <span class="text-yellow-400 text-sm flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px] filled">star</span> ${movie.vote_average.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>`;
            } else {
                return `
                <div data-movie-id="${movie.id}" class="${animClass} flex flex-col gap-2 group cursor-pointer" ${style}>
                    <div class="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg shadow-black/50 hover-glow">
                        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${tmdbService.getImageUrl(movie.poster_path)}')"></div>
                        
                        <!-- Watchlist Add Button -->
                        <button class="add-to-watchlist-btn absolute top-2 left-2 size-8 rounded-full bg-black/70 hover:bg-primary backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110 z-10 opacity-0 group-hover:opacity-100"
                                data-movie-id="${movie.id}"
                                data-movie-title="${(movie.title || '').replace(/"/g, '&quot;')}"
                                title="Add to Watchlist">
                            <span class="material-symbols-outlined text-[18px]">add</span>
                        </button>
                        
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
                        <h3 class="text-main dark:text-white font-semibold truncate group-hover:text-primary transition-colors">${movie.title}</h3>
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
            container.innerHTML = this.generateCardsHtml(movies, true);

            // Wire up watchlist add buttons for trending
            container.querySelectorAll('.add-to-watchlist-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const movieId = btn.dataset.movieId;
                    const movieTitle = btn.dataset.movieTitle;

                    // Add to watchlist
                    this.addToWatchlist({ id: movieId, title: movieTitle });
                });
            });

        } else {
            container.innerHTML = this.generateCardsHtml(movies, false);

            // Wire up watchlist add buttons
            container.querySelectorAll('.add-to-watchlist-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const movieId = btn.dataset.movieId;
                    const movieTitle = btn.dataset.movieTitle;

                    // Add to watchlist
                    this.addToWatchlist({ id: movieId, title: movieTitle });
                });
            });
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
                    this.performInlineSearch(query);
                    searchInput.blur();
                }
            }
        });
    }

    async performInlineSearch(query) {
        // Update header logic similar to filters
        const header = document.querySelector('#recommended-container').previousElementSibling;
        if (header) {
            header.innerHTML = `Search Results: "${query}" <span class="material-symbols-outlined text-primary">search</span>`;
        }

        // Hide other sections
        const otherSection = document.querySelector('#action-container')?.parentElement;
        const trendSection = document.querySelector('#trending-container')?.parentElement;
        const filterSection = document.querySelector('#recommended-container').parentElement.previousElementSibling; // Filter bar usually

        if (otherSection) otherSection.style.display = 'none';
        if (trendSection) trendSection.style.display = 'none';
        // Keep filter bar visible? Maybe hide it for search results to avoid confusion or keep it to filter *search results* (advanced). 
        // For simplicity, let's keep it but maybe it doesn't apply to search results yet unless we combine logic. 
        // The user just asked for search in main screen. Let's hide filters for now to focus on search.
        if (filterSection && filterSection.classList.contains('glass-heavy')) filterSection.style.display = 'none';

        // Reset page state
        this.pageState.filtered = 1; // Reuse filtered state or adding new one?
        this.currentSearchQuery = query; // Store for loadMore

        const container = document.getElementById('recommended-container');
        if (container) container.innerHTML = '<div class="col-span-full text-center py-10"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div></div>';

        // Add a "Clear Search" button
        const clearBtnId = 'clear-search-btn';
        let clearBtn = document.getElementById(clearBtnId);
        if (!clearBtn) {
            clearBtn = document.createElement('button');
            clearBtn.id = clearBtnId;
            clearBtn.className = 'fixed bottom-8 right-8 bg-primary hover:bg-red-700 text-white rounded-full p-4 shadow-2xl z-50 animate-bounce flex items-center gap-2 font-bold';
            clearBtn.innerHTML = '<span class="material-symbols-outlined">close</span> Clear Search';
            clearBtn.onclick = () => window.location.reload(); // Simple way to reset everything for now
            document.body.appendChild(clearBtn);
        }

        try {
            const results = await tmdbService.searchMovies(query);

            if (results && results.results) {
                if (results.results.length === 0) {
                    container.innerHTML = '<div class="col-span-full text-center text-gray-400 py-10">No results found for your search.</div>';
                    return;
                }
                this.populateSection('recommended-container', results.results);

                // Update specific load more button
                const loadMoreBtn = container.parentElement.querySelector('.load-more-btn');
                if (loadMoreBtn) {
                    loadMoreBtn.dataset.section = 'search';
                }
            }
        } catch (e) {
            console.error('Search error:', e);
            if (container) container.innerHTML = '<div class="col-span-full text-center text-red-500">Error performing search.</div>';
        }
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
                <button id="close-share" class="absolute top-4 right-4 text-gray-500 hover:text-main dark:text-gray-400 dark:hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
                <h3 class="text-xl font-bold text-main dark:text-white mb-6">Share this page</h3>
                
                <div class="flex flex-col gap-4">
                    <button id="copy-link-btn" class="flex items-center gap-4 w-full p-4 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors group text-left">
                        <div class="size-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                             <span class="material-symbols-outlined">link</span>
                        </div>
                        <div>
                            <span class="block font-semibold text-main dark:text-white">Copy Link</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">Copy to clipboard</span>
                        </div>
                    </button>

                    <button id="whatsapp-btn" class="flex items-center gap-4 w-full p-4 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors group text-left">
                        <div class="size-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400">
                             <span class="material-symbols-outlined">chat</span>
                        </div>
                        <div>
                            <span class="block font-semibold text-main dark:text-white">WhatsApp</span>
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
        const applyBtn = document.getElementById('apply-filters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyFilters());
        }
    }

    async applyFilters() {
        const genre = document.getElementById('genre-filter').value;
        const minRating = document.getElementById('rating-filter').value;
        const isTV = window.location.pathname.includes('tv.html');
        const type = isTV ? 'tv' : 'movie';

        // Update header text to reflect filtering
        const header = document.querySelector('#recommended-container').previousElementSibling;
        if (header) {
            header.innerHTML = `Filtered Results <span class="material-symbols-outlined text-primary">filter_alt</span>`;
        }

        // Hide other sections to focus on results
        const actionSection = document.querySelector('#action-container')?.parentElement;
        const trendSection = document.querySelector('#trending-container')?.parentElement;

        if (actionSection) actionSection.style.display = 'none';
        if (trendSection) trendSection.style.display = 'none';

        // Reset page state for infinite scroll on filtered results
        this.pageState.filtered = 1;
        this.currentFilters = { genre, minRating }; // Store for loadMore

        const container = document.getElementById('recommended-container');
        if (container) container.innerHTML = '<div class="col-span-full text-center py-10"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div></div>';

        // Add a "Clear Filters" button if not exists (reusing search clear style)
        const clearBtnId = 'clear-filter-btn';
        if (!document.getElementById(clearBtnId)) {
            const clearBtn = document.createElement('button');
            clearBtn.id = clearBtnId;
            clearBtn.className = 'fixed bottom-8 right-8 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-4 shadow-2xl z-50 animate-bounce flex items-center gap-2 font-bold border border-white/10';
            clearBtn.innerHTML = '<span class="material-symbols-outlined">restart_alt</span> Reset View';
            clearBtn.onclick = () => window.location.reload();
            document.body.appendChild(clearBtn);
        }

        try {
            const results = await tmdbService.discover(type, { genre, minRating });

            if (results && results.results) {
                let items = results.results;
                if (isTV) {
                    items = items.map(item => ({
                        ...item,
                        title: item.name || item.title,
                        release_date: item.first_air_date || item.release_date
                    }));
                }

                if (items.length === 0) {
                    container.innerHTML = '<div class="col-span-full text-center text-gray-400 py-10">No results found matching your criteria.</div>';
                    return;
                }

                this.populateSection('recommended-container', items);

                // Update Load More button to use 'filtered' mode
                const loadMoreBtn = container.parentElement.querySelector('.load-more-btn');
                if (loadMoreBtn) {
                    loadMoreBtn.dataset.section = 'filtered';
                    // Reset listener by cloning (simple trick) or just rely on the boolean logic inside loadMore? 
                    // Actually initLoadMore only adds one listener that calls loadMore(btn.dataset.section). 
                    // Since we updated dataset.section, it will work!
                }
            }
        } catch (e) {
            console.error('Filter error:', e);
            if (container) container.innerHTML = '<div class="col-span-full text-center text-red-500">Error loading filtered results.</div>';
        }
    }

    initCustomSliders() {
        // ... (existing slider logic remains)
        // Adding initialization for grid controls here as well for convenience
        // this.initGridControls(); // Moved to boot()

        const sliders = document.querySelectorAll('.snap-x');
        sliders.forEach(slider => {
            // ... (existing slider code)
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

        // Initialize trending navigation arrows
        this.initTrendingNavigation();
    }

    initTrendingNavigation() {
        const leftArrows = document.querySelectorAll('.scroll-arrow-left');
        const rightArrows = document.querySelectorAll('.scroll-arrow-right');

        leftArrows.forEach(arrow => {
            arrow.addEventListener('click', () => {
                const container = arrow.parentElement.querySelector('#trending-container');
                if (container) {
                    container.scrollBy({
                        left: -400,
                        behavior: 'smooth'
                    });
                }
            });
        });

        rightArrows.forEach(arrow => {
            arrow.addEventListener('click', () => {
                const container = arrow.parentElement.querySelector('#trending-container');
                if (container) {
                    container.scrollBy({
                        left: 400,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    initGridControls() {
        const buttons = document.querySelectorAll('.grid-view-btn');
        console.log('Grid controls found:', buttons.length);
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Grid button clicked:', btn.dataset.cols);
                this.setGridDensity(btn.dataset.cols);

                // Update active state
                buttons.forEach(b => {
                    b.classList.remove('active', 'text-white', 'bg-white/10');
                    b.classList.add('text-gray-400');
                });
                btn.classList.add('active', 'text-white', 'bg-white/10');
                btn.classList.remove('text-gray-400');
            });
        });
    }

    setGridDensity(density) {
        console.log('Setting density to:', density);

        // Target ALL grid containers on the page, not just specific ones
        const containers = document.querySelectorAll('.grid');

        const classesToRemove = [
            'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5', 'grid-cols-6', 'grid-cols-7', 'grid-cols-8',
            'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-5', 'md:grid-cols-6',
            'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5', 'lg:grid-cols-6', 'lg:grid-cols-7', 'lg:grid-cols-8',
            'xl:grid-cols-4', 'xl:grid-cols-5', 'xl:grid-cols-6', 'xl:grid-cols-7', 'xl:grid-cols-8'
        ];

        let newClasses = [];
        switch (density) {
            case 'compact':
                // Dense: more columns
                newClasses = ['grid-cols-3', 'md:grid-cols-5', 'lg:grid-cols-7', 'xl:grid-cols-8'];
                break;
            case 'large':
                // Large: fewer columns
                newClasses = ['grid-cols-1', 'md:grid-cols-3', 'lg:grid-cols-4'];
                break;
            case 'normal':
            default:
                // Default
                newClasses = ['grid-cols-2', 'md:grid-cols-4', 'lg:grid-cols-5', 'xl:grid-cols-6'];
                break;
        }

        console.log('Applying classes to', containers.length, 'grid containers:', newClasses);

        containers.forEach(container => {
            if (container) {
                // Safe remove spread
                classesToRemove.forEach(cls => container.classList.remove(cls));
                // Add new
                container.classList.add(...newClasses);
            }
        });
    }

    addToWatchlist(movie) {
        // Check if already in watchlist
        const exists = this.watchlist.find(item => item.id == movie.id);
        if (exists) {
            this.showNotification('Already in your watchlist', 'info');
            return;
        }

        // Add to watchlist with timestamp
        const watchlistItem = {
            id: movie.id,
            title: movie.title,
            addedAt: Date.now()
        };

        this.watchlist.push(watchlistItem);
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));

        // Update UI
        this.updateWatchlistUI();

        // Show success notification
        this.showNotification(`Added "${movie.title}" to watchlist`);
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

    showNotification(msg, type = 'success') {
        // Remove existing toasts to prevent stacking (optional, or stack them)
        const existing = document.querySelector('.toast-notification');
        if (existing) {
            existing.classList.remove('toast-enter');
            existing.classList.add('toast-exit');
            setTimeout(() => existing.remove(), 300);
        }

        const icon = type === 'success' ? 'check_circle' : 'info';
        const colorClass = type === 'success' ? 'text-green-500' : 'text-blue-500';

        const toast = document.createElement('div');
        toast.className = 'toast-notification fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 rounded-2xl glass-toast z-[100] toast-enter';

        toast.innerHTML = `
            <div class="flex items-center justify-center size-8 rounded-full bg-white/10 ${colorClass}">
                <span class="material-symbols-outlined text-[20px]">${icon}</span>
            </div>
            <span class="text-white font-medium text-sm md:text-base tracking-wide">${msg}</span>
        `;

        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.remove('toast-enter');
                toast.classList.add('toast-exit');
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    }

    initCreditsModal() {
        const modal = document.getElementById('credits-modal');
        const closeBtn = document.getElementById('credits-close-btn');

        if (!modal || !closeBtn) return; // Not on a page with the modal

        const hasSeenCredits = localStorage.getItem('hasSeenCredits');
        if (!hasSeenCredits) {
            setTimeout(() => {
                modal.classList.remove('hidden');
            }, 500); // Small delay for nice effect

            closeBtn.onclick = () => {
                modal.classList.add('hidden');
                localStorage.setItem('hasSeenCredits', 'true');
            };
        }
    }
}


document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-movie-id]');
    if (!card) return;
    const id = card.getAttribute('data-movie-id');
    if (id) window.location.href = `movie-details.html?id=${id}`;
});

// Initialize the app
const app = new MovieApp();
MovieApp.instance = app;