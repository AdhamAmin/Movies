class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        // Apply theme immediately, before DOM loads
        this.applyTheme(this.theme);
        this.init();
    }

    init() {
        // Wait for DOM to be ready, then wait for header to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.waitForButton());
        } else {
            this.waitForButton();
        }
    }

    waitForButton() {
        // Since header is loaded dynamically, we need to wait for it
        const checkButton = () => {
            const toggleBtn = document.getElementById('theme-toggle');
            if (toggleBtn) {
                this.setupToggle();
            } else {
                // Try again after a short delay
                setTimeout(checkButton, 100);
            }
        };
        checkButton();
    }

    setupToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
            this.updateToggleIcon();
            console.log('✅ Theme toggle initialized');
        }
    }

    applyTheme(theme) {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        this.theme = theme;
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.updateToggleIcon();

        // Add a subtle animation effect
        document.body.style.transition = 'background-color 0.3s ease';

        console.log(`🎨 Theme switched to: ${newTheme}`);
    }

    updateToggleIcon() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        const icon = toggleBtn.querySelector('.material-symbols-outlined');
        if (icon) {
            // Update icon based on current theme
            icon.textContent = this.theme === 'dark' ? 'light_mode' : 'dark_mode';
        }
    }
}

// Initialize theme manager immediately
const themeManager = new ThemeManager();
