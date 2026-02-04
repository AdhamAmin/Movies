(() => {
    function buildHeaderHTML() {
        return `
        <header class="sticky top-0 z-50 bg-white/90 dark:bg-[#0b0b0b]/90 backdrop-blur-sm border-b border-white/5">
            <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
                <a href="index.html" class="flex items-center gap-3">
                    <div class="text-2xl font-black text-primary">CineScope</div>
                </a>
                <div class="flex items-center gap-3 flex-1 max-w-xl">
                    <input id="global-search" type="search" placeholder="Search movies..." class="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white focus:outline-none" />
                    <button id="global-search-btn" class="px-4 py-2 rounded-lg bg-primary text-white font-semibold">Search</button>
                </div>
                <div class="flex items-center gap-3">
                    <button id="global-watchlist-btn" class="px-4 py-2 rounded-lg bg-white/10 text-white">Watchlist</button>
                </div>
            </div>
        </header>
        `;
    }

    function attachHandlers(root) {
        const input = root.querySelector('#global-search');
        const btn = root.querySelector('#global-search-btn');
        const watchBtn = root.querySelector('#global-watchlist-btn');

        const doSearch = (q) => {
            const val = (q || (input && input.value) || '').trim();
            if (!val) return;
            window.location.href = `search.html?q=${encodeURIComponent(val)}`;
        };

        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') doSearch();
            });
        }
        if (btn) btn.addEventListener('click', () => doSearch());
        if (watchBtn) watchBtn.addEventListener('click', () => {
            
            if (location.pathname.endsWith('watchlist.html') || location.origin) {
                window.location.href = 'watchlist.html';
            } else {
                const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
                alert(list.length ? `Watchlist: ${list.map(m=>m.title).join(', ')}` : 'Watchlist is empty');
            }
        });
    }

    function renderHeader() {
        
        const placeholder = document.getElementById('header-placeholder');
        if (placeholder) {
            placeholder.innerHTML = buildHeaderHTML();
            attachHandlers(placeholder);
            return;
        }
        const container = document.createElement('div');
        container.innerHTML = buildHeaderHTML();
        document.body.insertBefore(container.firstElementChild, document.body.firstChild);
        attachHandlers(document);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderHeader);
    } else {
        renderHeader();
    }
})();