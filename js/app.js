const tmdbService = new TMDBService(TMDB_API_KEY);

class MovieApp {
    constructor() {
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    async start() {
        const data = await tmdbService.getTrendingMovies('week');
        if (!data || !data.results) return;

        
        const heroContent = document.getElementById('hero-content');
        const heroBackdrop = document.getElementById('hero-backdrop');
        if (heroContent && heroBackdrop && data.results[0]) {
            this.populateHero(data.results[0]);
        }

        const trendingContainer = document.getElementById('trending-container');
        if (trendingContainer) {
            this.populateTrending(data.results.slice(1, 7));
        }

        const recommendedContainer = document.getElementById('recommended-container');
        if (recommendedContainer) {
            this.populateRecommended(data.results.slice(7, 19));
        }
    }

    populateHero(movie) {
        const heroContent = document.getElementById('hero-content');
        const heroBackdrop = document.getElementById('hero-backdrop');
        if (!heroContent || !heroBackdrop || !movie) return;

        heroBackdrop.style.backgroundImage = `url('${tmdbService.getImageUrl(movie.backdrop_path)}')`;

        heroContent.innerHTML = `
            <div class="flex flex-col gap-2">
                <h1 class="text-white text-5xl md:text-7xl font-black leading-none tracking-tight drop-shadow-xl">${movie.title}</h1>
                <div class="flex items-center gap-4 text-gray-300 text-sm md:text-base font-medium mt-2">
                    <span class="text-[#FFD700] flex items-center gap-1 font-bold">
                        <span class="material-symbols-outlined text-[18px] filled">star</span> ${movie.vote_average.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>${movie.release_date?.split('-')[0] || 'N/A'}</span>
                </div>
                <p class="text-gray-200 text-base md:text-lg leading-relaxed line-clamp-3 md:line-clamp-none max-w-xl mt-2 drop-shadow-md">${movie.overview}</p>
            </div>
            <div class="flex flex-wrap gap-4 mt-4">
                <button id="hero-watch-trailer" class="flex items-center justify-center gap-2 h-12 px-8 rounded-md bg-primary hover:bg-red-700 text-white font-bold tracking-wide transition-all shadow-lg hover:shadow-red-900/40">
                    <span class="material-symbols-outlined text-[24px] filled">play_arrow</span>
                    <span>Watch Trailer</span>
                </button>
                <button class="flex items-center justify-center gap-2 h-12 px-8 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold tracking-wide transition-all border border-white/10">
                    <span class="material-symbols-outlined text-[24px]">info</span>
                    <span>More Info</span>
                </button>
            </div>
        `;

        const heroBtn = document.getElementById('hero-watch-trailer');
        if (heroBtn) heroBtn.addEventListener('click', () => {
            window.location.href = `movie-details.html?id=${movie.id}`;
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
                    <h3 class="text-white font-semibold truncate group-hover:text-primary transition-colors">${movie.title}</h3>
                    <span class="text-gray-500 text-xs">${movie.release_date?.split('-')[0] || 'N/A'}</span>
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