document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const type = params.get('type') || 'movie'; // Default to movie

    if (!id) return;

    const apiKey = typeof TMDB_API_KEY !== 'undefined' ? TMDB_API_KEY : window.TMDB_API_KEY;
    const tmdb = new TMDBService(apiKey);

    let data;
    if (type === 'tv') {
        data = await tmdb.getTVDetails(id);
    } else {
        data = await tmdb.getMovieDetails(id);
    }

    if (!data) return;

    // Normalize data for TV
    if (type === 'tv') {
        data.title = data.name;
        data.original_title = data.original_name;
        data.release_date = data.first_air_date;
        // Runtime handling for TV (episode run time)
        if (data.episode_run_time && data.episode_run_time.length > 0) {
            data.runtime = data.episode_run_time[0];
        }
    }

    const backdrop = document.getElementById('details-backdrop');
    const poster = document.getElementById('details-poster');
    const title = document.getElementById('details-title');
    const genresEl = document.getElementById('details-genres');
    const year = document.getElementById('details-year');
    const runtime = document.getElementById('details-runtime');
    const cert = document.getElementById('details-cert');
    const ratingNum = document.getElementById('details-rating-num');
    const votes = document.getElementById('details-votes');
    const overview = document.getElementById('details-overview');
    const trailerBtn = document.getElementById('watch-trailer-btn');
    const watchlistBtn = document.getElementById('add-watchlist-btn');

    // use larger images for backdrop/poster
    const backdropImg = document.getElementById('backdrop-img');
    if (backdropImg) {
        const url = tmdb.getImageUrl(data.backdrop_path || data.poster_path, 'w1280') || tmdb.getImageUrl(data.backdrop_path || data.poster_path, 'original');
        backdropImg.style.backgroundImage = `url('${url}')`;
    }
    if (poster && data.poster_path) {
        const purl = tmdb.getImageUrl(data.poster_path, 'w780') || tmdb.getImageUrl(data.poster_path, 'w500');
        poster.style.backgroundImage = `url('${purl}')`;
        poster.style.backgroundSize = 'cover';
        poster.style.backgroundPosition = 'center';
    }

    if (title) title.textContent = data.title || data.original_title || 'Untitled';
    if (genresEl) genresEl.innerHTML = (data.genres || []).map(g => `<span class="px-2 py-1 rounded bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium uppercase tracking-wider">${g.name}</span>`).join(' ');
    if (year) year.textContent = (data.release_date || '').split('-')[0] || '—';
    if (runtime) runtime.textContent = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : '—';
    if (ratingNum) ratingNum.textContent = `${(data.vote_average || 0).toFixed(1)}/10`;
    if (votes) votes.textContent = `${(data.vote_count || 0).toLocaleString()} votes`;
    if (overview) overview.textContent = data.overview || 'No overview available.';

    const trailer = (data.videos && data.videos.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer && trailerBtn) {
        trailerBtn.addEventListener('click', () => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank'));
    } else if (trailerBtn) {
        trailerBtn.disabled = true;
        trailerBtn.classList.add('opacity-50', 'cursor-not-allowed');
        trailerBtn.textContent = 'Trailer unavailable';
    }

    // Check if movie is already in watchlist and update button state
    if (watchlistBtn) {
        const updateButtonState = (isInWatchlist) => {
            const icon = watchlistBtn.querySelector('span.material-symbols-outlined');
            const textSpan = watchlistBtn.querySelector('span.hidden');

            if (isInWatchlist) {
                watchlistBtn.classList.add('bg-primary/80');
                icon.textContent = 'bookmark';
                if (textSpan) textSpan.textContent = 'In Watchlist';
            } else {
                watchlistBtn.classList.remove('bg-primary/80');
                icon.textContent = 'bookmark_add';
                if (textSpan) textSpan.textContent = 'Watchlist';
            }
        };

        // Set initial state
        const list = JSON.parse(localStorage.getItem('watchlist')) || [];
        const isInWatchlist = list.find(m => m.id == data.id);
        updateButtonState(isInWatchlist);

        // Toggle add/remove on click
        watchlistBtn.addEventListener('click', () => {
            let currentList = JSON.parse(localStorage.getItem('watchlist')) || [];
            const existingIndex = currentList.findIndex(m => m.id == data.id);

            if (existingIndex === -1) {
                // Add to watchlist
                currentList.push({ id: data.id, title: data.title, poster: data.poster_path });
                localStorage.setItem('watchlist', JSON.stringify(currentList));
                updateButtonState(true);
                showToast('Added to Watchlist!');
            } else {
                // Remove from watchlist
                currentList.splice(existingIndex, 1);
                localStorage.setItem('watchlist', JSON.stringify(currentList));
                updateButtonState(false);
                showToast('Removed from Watchlist');
            }
        });
    }

    // Toast notification function
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'glass-toast toast-enter fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-medium z-50';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // Render cast (first 8)
    const castContainer = document.getElementById('details-cast');
    if (castContainer && data.credits && data.credits.cast && data.credits.cast.length) {
        const castHtml = data.credits.cast.map(person => {
            const img = tmdb.getImageUrl(person.profile_path, 'w185') || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'185\' height=\'278\' viewBox=\'0 0 185 278\'%3E%3Crect width=\'185\' height=\'278\' fill=\'%23333\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'sans-serif\' font-size=\'14\' fill=\'%23777\'%3ENo Photo%3C/text%3E%3C/svg%3E';
            return `
                <div class="inline-flex flex-col items-center w-36 mr-4 shrink-0">
                    <div class="w-32 h-44 rounded-lg overflow-hidden mb-2 bg-cover bg-center shadow-lg" style="background-image:url('${img}')"></div>
                    <div class="text-gray-900 dark:text-white text-sm font-semibold text-center truncate w-full px-1">${person.name}</div>
                    <div class="text-gray-600 dark:text-text-dim text-xs text-center truncate w-full px-1">${person.character || ''}</div>
                </div>
            `;
        }).join('');
        castContainer.innerHTML = `<h3 class="text-gray-900 dark:text-white text-xl font-bold mb-4">Cast</h3><div class="flex overflow-x-auto pb-4 no-scrollbar">${castHtml}</div>`;
    }

    // Render reviews (show up to 3)
    const reviewsContainer = document.getElementById('details-reviews');
    if (reviewsContainer && data.reviews && data.reviews.results && data.reviews.results.length) {
        const reviewsHtml = data.reviews.results.slice(0, 3).map(r => `
            <article class="bg-gray-100 dark:bg-white/5 p-4 rounded-lg mb-4">
                <header class="flex items-center justify-between mb-2">
                    <div class="text-sm font-semibold text-gray-900 dark:text-white">${r.author}</div>
                    <div class="text-xs text-gray-500 dark:text-text-dim">${new Date(r.created_at).toLocaleDateString()}</div>
                </header>
                <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-6">${r.content}</p>
            </article>
        `).join('');
        reviewsContainer.innerHTML = `<h3 class="text-gray-900 dark:text-white text-xl font-bold mb-4">Reviews</h3>${reviewsHtml}`;
    } else if (reviewsContainer) {
        reviewsContainer.innerHTML = `<h3 class="text-gray-900 dark:text-white text-xl font-bold mb-4">Reviews</h3><p class="text-gray-500 dark:text-text-dim">No reviews yet.</p>`;
    }
});