// Watchlist page logic
document.addEventListener('DOMContentLoaded', async () => {
    const tmdb = new TMDBService(TMDB_API_KEY);
    const container = document.getElementById('watchlist-container');
    const emptyState = document.getElementById('empty-state');
    const countHero = document.getElementById('watchlist-count-hero');
    const modal = document.getElementById('credits-modal');
    const closeBtn = document.getElementById('credits-close-btn');

    // Credits Modal - Show once
    const hasSeenCredits = localStorage.getItem('hasSeenCredits');
    if (!hasSeenCredits && modal) {
        modal.classList.remove('hidden');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.classList.add('hidden');
                localStorage.setItem('hasSeenCredits', 'true');
            };
        }
    }

    function getList() {
        return JSON.parse(localStorage.getItem('watchlist') || '[]');
    }

    function saveList(list) {
        localStorage.setItem('watchlist', JSON.stringify(list));
    }

    async function fetchDetailsFor(list) {
        const results = [];
        for (const item of list) {
            try {
                const data = await tmdb.getMovieDetails(item.id);
                results.push(Object.assign({}, data, { _addedAt: item.addedAt || 0 }));
            } catch (e) {
                console.warn('Failed to fetch details for', item.id);
            }
        }
        return results;
    }

    function renderCards(items) {
        if (countHero) countHero.textContent = items.length;

        if (!items.length) {
            if (container) container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        if (container) {
            container.innerHTML = items.map(movie => {
                const poster = tmdb.getImageUrl(movie.poster_path, 'w342') || '';
                const rating = (movie.vote_average || 0).toFixed(1);
                return `
                    <div class="stagger-item group relative flex flex-col gap-3 cursor-pointer" data-id="${movie.id}">
                        <div class="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10 hover-lift">
                            <div class="w-full h-full bg-center bg-cover transition-transform duration-500 group-hover:scale-110" 
                                 style="background-image:url('${poster}')"></div>
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                                <button class="remove-btn size-10 rounded-full bg-primary/90 hover:bg-primary text-white backdrop-blur-sm transition-all hover:scale-110" 
                                        title="Remove">
                                    <span class="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                                <button class="info-btn size-10 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all hover:scale-110" 
                                        title="View Details">
                                    <span class="material-symbols-outlined text-[20px]">info</span>
                                </button>
                            </div>
                            <div class="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px] text-yellow-400 filled">star</span>
                                ${rating}
                            </div>
                        </div>
                        <div>
                            <h3 class="text-white text-sm md:text-base font-semibold truncate group-hover:text-primary transition-colors">${movie.title}</h3>
                            <p class="text-gray-400 text-xs md:text-sm mt-1">
                                ${(movie.release_date || '').split('-')[0] || '—'} • ${(movie.genres && movie.genres[0] && movie.genres[0].name) || 'Movie'}
                            </p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        attachCardHandlers();
    }

    function attachCardHandlers() {
        if (!container) return;
        container.querySelectorAll('[data-id]').forEach(el => {
            const id = el.getAttribute('data-id');
            const removeBtn = el.querySelector('.remove-btn');
            const infoBtn = el.querySelector('.info-btn');

            if (removeBtn) {
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    const list = getList().filter(i => i.id != id);
                    saveList(list);
                    refresh();

                    // Show notification
                    if (typeof MovieApp !== 'undefined' && MovieApp.instance) {
                        MovieApp.instance.showNotification('Removed from watchlist');
                    }
                };
            }

            if (infoBtn) {
                infoBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.location.href = `movie-details.html?id=${id}`;
                };
            }

            el.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                window.location.href = `movie-details.html?id=${id}`;
            });
        });
    }

    async function refresh() {
        const raw = getList();
        const details = await fetchDetailsFor(raw);
        renderCards(details);
    }

    await refresh();
});