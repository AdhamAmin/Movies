// AI Chat Assistant Logic - Cinematic Personality
class AIChat {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.apiKey = typeof TMDB_API_KEY !== 'undefined' ? TMDB_API_KEY : (typeof window.TMDB_API_KEY !== 'undefined' ? window.TMDB_API_KEY : null);
        this.tmdb = null;

        // Mood to Genre Mapping
        this.moodMap = {
            energetic: { genre: 28, label: 'Action-packed blockbusters' }, // Action
            sad: { genre: 18, label: 'Soul-stirring dramas' }, // Drama
            scared: { genre: 27, label: 'Heart-pounding horror' }, // Horror
            happy: { genre: 35, label: 'Feel-good comedies' }, // Comedy
            romantic: { genre: 10749, label: 'Timeless romances' } // Romance
        };

        this.init();
    }

    init() {
        if (this.apiKey) {
            this.tmdb = new TMDBService(this.apiKey);
        }

        document.addEventListener('DOMContentLoaded', () => this.setupHandlers());

        const checkInterval = setInterval(() => {
            if (document.getElementById('ai-chat-toggle')) {
                this.setupHandlers();
                clearInterval(checkInterval);
            }
        }, 500);
    }

    setupHandlers() {
        const toggleBtn = document.getElementById('ai-chat-toggle');
        const closeBtn = document.getElementById('ai-chat-close');
        const popup = document.getElementById('ai-chat-popup');
        const input = document.getElementById('ai-chat-input');
        const sendBtn = document.getElementById('ai-chat-send');
        const chips = document.querySelectorAll('.mood-chip');

        if (!toggleBtn || !popup) return;

        toggleBtn.onclick = () => this.togglePopup();
        if (closeBtn) closeBtn.onclick = () => this.togglePopup();

        if (sendBtn && input) {
            sendBtn.onclick = () => this.handleSendMessage();
            input.onkeypress = (e) => {
                if (e.key === 'Enter') this.handleSendMessage();
            };
        }

        chips.forEach(chip => {
            chip.onclick = () => {
                const mood = chip.dataset.mood;
                this.handleMoodSelection(mood);
            };
        });
    }

    togglePopup() {
        const popup = document.getElementById('ai-chat-popup');
        this.isOpen = !this.isOpen;
        popup.classList.toggle('hidden', !this.isOpen);
        if (this.isOpen) {
            setTimeout(() => document.getElementById('ai-chat-input')?.focus(), 100);
        }
    }

    setTyping(state) {
        this.isTyping = state;
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) indicator.classList.toggle('hidden', !state);
    }

    async handleSendMessage() {
        const input = document.getElementById('ai-chat-input');
        const text = input.value.trim();
        if (!text || this.isTyping) return;

        this.addMessage('user', text);
        input.value = '';

        this.setTyping(true);

        // Simple NLP for mood words
        const words = text.toLowerCase();
        let selectedMood = null;
        if (words.includes('action') || words.includes('fun') || words.includes('energy')) selectedMood = 'energetic';
        if (words.includes('cry') || words.includes('meaningful') || words.includes('deep')) selectedMood = 'sad';
        if (words.includes('scary') || words.includes('dark') || words.includes('horror')) selectedMood = 'scared';
        if (words.includes('laugh') || words.includes('happy') || words.includes('light')) selectedMood = 'happy';
        if (words.includes('love') || words.includes('romance')) selectedMood = 'romantic';

        setTimeout(async () => {
            if (selectedMood) {
                await this.recommendByMood(selectedMood);
            } else {
                this.generateGeneralResponse(text);
            }
            this.setTyping(false);
        }, 1500);
    }

    async handleMoodSelection(mood) {
        if (this.isTyping) return;

        const label = this.moodMap[mood]?.label || mood;
        this.addMessage('user', `I'm feeling ${mood}!`);

        this.setTyping(true);
        setTimeout(async () => {
            await this.recommendByMood(mood);
            this.setTyping(false);
        }, 1200);
    }

    async recommendByMood(mood) {
        const mapping = this.moodMap[mood];
        if (!mapping || !this.tmdb) {
            this.addMessage('ai', "Alas! My crystal ball is foggy. Try asking for a specific mood like 'Happy' or 'Scary'!");
            return;
        }

        try {
            const data = await this.tmdb.getMoviesByGenre(mapping.genre);
            const movies = data?.results?.slice(0, 3) || [];

            if (movies.length === 0) {
                this.addMessage('ai', "The box office is empty! I couldn't find any films for that vibe right now.");
                return;
            }

            const movieLinks = movies.map(m => `<a href="movie-details.html?id=${m.id}" class="text-primary font-bold hover:underline">"${m.title}"</a>`).join(', ');

            const intros = [
                `Direct from the velvet curtains! For that ${mood} vibe, you MUST see: `,
                `A standing ovation for your taste! Here are some ${mapping.label} to match your mood: `,
                `The projector is rolling! Based on your feeling, I've curated these gems: `
            ];

            const intro = intros[Math.floor(Math.random() * intros.length)];
            this.addMessage('ai', `${intro} ${movieLinks}. Click on their names to see the full trailer! 🍿`);
        } catch (e) {
            this.addMessage('ai', "Plot twist! Something went wrong while fetching those blockbusters. Try again in a moment?");
        }
    }

    generateGeneralResponse(text) {
        const query = text.toLowerCase();
        let response = "That's a fascinating sequel! I'm still auditioning for my full AI role, but I can help you find movies based on your mood. Try clicking one of the buttons above! 🎬";

        if (query.includes('hello') || query.includes('hi')) {
            response = "Greetings, film aficionado! 🎥 Welcome to the front row. How can I direct your movie night today?";
        } else if (query.includes('watchlist')) {
            response = "Keeping a private collection? I like your style. Just hit the bookmark icon on any movie page to save it for later!";
        }

        this.addMessage('ai', response);
    }

    addMessage(sender, text) {
        const container = document.getElementById('ai-chat-messages');
        if (!container) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `flex gap-3 ${sender === 'user' ? 'flex-row-reverse animate-slide-in-right' : 'animate-slide-in-left'}`;

        if (sender === 'ai') {
            msgDiv.innerHTML = `
                <div class="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-[18px] text-primary">smart_toy</span>
                </div>
                <div class="bg-white/10 rounded-2xl p-3 rounded-tl-none max-w-[80%] border border-white/5">
                    <div class="text-white text-sm leading-relaxed">${text}</div>
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="bg-primary rounded-2xl p-3 rounded-tr-none max-w-[80%] shadow-lg">
                    <p class="text-white text-sm">${text}</p>
                </div>
            `;
        }

        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }
}

// Global instance
window.aiChat = new AIChat();
