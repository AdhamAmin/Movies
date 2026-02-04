class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.theme);

        document.addEventListener('contentLoaded', (e) => {
            if (e.detail === 'header-placeholder') {
                const toggleBtn = document.getElementById('theme-toggle');
                if (toggleBtn) {
                    toggleBtn.addEventListener('click', () => this.toggleTheme());
                    this.updateToggleIcon();
                }
            }
        });
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
    }

    updateToggleIcon() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        const icon = toggleBtn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = this.theme === 'dark' ? 'light_mode' : 'dark_mode';
        }
    }
}

const themeManager = new ThemeManager();