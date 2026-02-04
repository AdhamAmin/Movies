document.addEventListener('DOMContentLoaded', async () => {
    const input = document.getElementById('search-input') || document.getElementById('global-search');
    const params = new URLSearchParams(location.search);
    const initialQuery = params.get('q') || (input && input.value) || 'Action';
    const tmdb = new TMDBService(TMDB_API_KEY);

    
    const container = document.getElementById('search-results');
    if (!container) return; 

    async function runSearch(q) {
        if (!q) return;
        const res = await tmdb.searchMovies(q);
        const results = res && res.results ? res.results : [];
        container.innerHTML = results.map(movie => `
            <div data-movie-id="${movie.id}" class="group relative flex flex-col gap-2 cursor-pointer">
                <div class="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-dark shadow-xl ring-1 ring-white/5 transition-all duration-300">
                    <div class="w-full h-full bg-center bg-cover transition-transform duration-500 group-hover:scale-105" style="background-image:url('${tmdb.getImageUrl(movie.poster_path)}')"></div>
                    <div class="absolute top-2 right-2 bg-background-dark/80 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 z-10">
                        <span class="material-symbols-outlined text-yellow-500 text-[14px] fill-current">star</span>
                        ${movie.vote_average ? movie.vote_average.toFixed(1) : '—'}
                    </div>
                </div>
                <div class="flex flex-col px-1">
                    <h3 class="text-white font-semibold text-base truncate group-hover:text-primary transition-colors">${movie.title}</h3>
                    <div class="flex items-center justify-between mt-1">
                        <span class="text-text-secondary text-xs">${(movie.release_date||'').split('-')[0] || '—'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    await runSearch(initialQuery);

    if (input) {
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') await runSearch(input.value.trim());
        });
    }
});