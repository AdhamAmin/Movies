// Render watchlist from localStorage, fetch real posters, wire remove/mark-watched
document.addEventListener('DOMContentLoaded', async () => {
    const tmdb = new TMDBService(TMDB_API_KEY);
    const grid = document.getElementById('watchlist-grid');
    const countEl = document.getElementById('watchlist-count');
    const searchInput = document.getElementById('watchlist-search');
    const sortSelect = document.getElementById('watchlist-sort');

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
            } catch (e) { /* ignore */ }
        }
        return results;
    }

    function renderCards(items) {
        countEl.textContent = items.length;
        if (!items.length) {
            grid.innerHTML = '<p class="text-text-dim">Your watchlist is empty.</p>';
            return;
        }

        grid.innerHTML = items.map(movie => {
            const poster = tmdb.getImageUrl(movie.poster_path, 'w342') || '';
            const rating = (movie.vote_average || '—').toString();
            return `
                <div class="group relative flex flex-col gap-3" data-id="${movie.id}">
                    <div class="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg ring-1 ring-[#3a2526]">
                        <div class="w-full h-full bg-center bg-cover" style="background-image:url('${poster}')"></div>
                        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button class="remove-btn size-10 rounded-full bg-primary text-white" title="Remove"><span class="material-symbols-outlined">delete</span></button>
                            <button class="watched-btn size-10 rounded-full bg-white text-background-dark" title="Mark watched"><span class="material-symbols-outlined">check</span></button>
                        </div>
                        <div class="absolute top-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white flex items-center gap-1">${rating}</div>
                    </div>
                    <div>
                        <h3 class="text-gray-900 dark:text-white text-base font-medium truncate">${movie.title}</h3>
                        <p class="text-gray-600 dark:text-[#ba9c9d] text-sm mt-1">${(movie.release_date || '').split('-')[0] || '—'} • ${(movie.genres && movie.genres[0] && movie.genres[0].name) || ''}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function refresh() {
        const raw = getList();
        const search = (searchInput && searchInput.value || '').toLowerCase().trim();
        const sorted = raw.slice();
        const sort = sortSelect?.value || 'date_added';
        if (sort === 'rating') sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        else if (sort === 'alphabetical') sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        const details = await fetchDetailsFor(sorted);
        const filtered = details.filter(m => !search || (m.title || '').toLowerCase().includes(search));
        renderCards(filtered);
        attachCardHandlers();
    }

    function attachCardHandlers() {
        if (!grid) return;
        grid.querySelectorAll('[data-id]').forEach(el => {
            const id = el.getAttribute('data-id');
            const remove = el.querySelector('.remove-btn');
            const watched = el.querySelector('.watched-btn');
            el.addEventListener('click', (e) => {
                if (e.target.closest('.remove-btn')) return;
                if (e.target.closest('.watched-btn')) return;
                window.location.href = `movie-details.html?id=${id}`;
            });
            if (remove) remove.onclick = (e) => {
                e.stopPropagation();
                const list = getList().filter(i => i.id != id);
                saveList(list);
                refresh();
            };
            if (watched) watched.onclick = (e) => {
                e.stopPropagation();
                const list = getList().map(i => i.id == id ? Object.assign({}, i, { watched: true }) : i);
                saveList(list);
                watched.classList.add('opacity-60');
            };
        });
    }

    if (searchInput) searchInput.addEventListener('input', () => refresh());
    if (sortSelect) sortSelect.addEventListener('change', () => refresh());

    await refresh();
});