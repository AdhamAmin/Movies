// Mobile Menu Handler
class MobileMenu {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.waitForMenuElements();
        });

        // Also listen for when header is loaded
        document.addEventListener('headerLoaded', () => {
            this.setupMenuHandlers();
        });
    }

    waitForMenuElements() {
        const checkElements = () => {
            const toggleBtn = document.getElementById('mobile-menu-toggle');
            const menu = document.getElementById('mobile-menu');

            if (toggleBtn && menu) {
                this.setupMenuHandlers();
            } else {
                setTimeout(checkElements, 100);
            }
        };
        checkElements();
    }

    setupMenuHandlers() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const closeBtn = document.getElementById('mobile-menu-close');
        const overlay = document.getElementById('mobile-menu-overlay');
        const menu = document.getElementById('mobile-menu');
        const menuLinks = menu.querySelectorAll('a');

        if (!toggleBtn || !menu) return;

        // Open menu
        toggleBtn.addEventListener('click', () => {
            menu.classList.remove('translate-x-full');
            menu.classList.add('translate-x-0');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        });

        // Close menu function
        const closeMenu = () => {
            menu.classList.remove('translate-x-0');
            menu.classList.add('translate-x-full');
            document.body.style.overflow = ''; // Restore scrolling
        };

        // Close on close button
        if (closeBtn) {
            closeBtn.addEventListener('click', closeMenu);
        }

        // Close on overlay click
        if (overlay) {
            overlay.addEventListener('click', closeMenu);
        }

        // Close on link click
        menuLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !menu.classList.contains('translate-x-full')) {
                closeMenu();
            }
        });

        console.log('✅ Mobile menu initialized');
    }
}

// Initialize mobile menu
const mobileMenu = new MobileMenu();
