// Additional Interactive Controls Enhancement
document.addEventListener('DOMContentLoaded', () => {

    // Horizontal Scroll Navigation Buttons
    const trendingSection = document.querySelector('.flex.overflow-x-auto.gap-5');
    if (trendingSection) {
        const leftBtn = trendingSection.parentElement.parentElement.querySelector('button:has(.material-symbols-outlined[textContent="chevron_left"])');
        const rightBtn = trendingSection.parentElement.parentElement.querySelector('button:has(.material-symbols-outlined[textContent="chevron_right"])');

        // Get all navigation button pairs
        document.querySelectorAll('.flex.gap-2').forEach(btnGroup => {
            const buttons = btnGroup.querySelectorAll('button');
            if (buttons.length === 2) {
                const scrollContainer = btnGroup.parentElement.parentElement.querySelector('.overflow-x-auto, .flex.overflow-x-auto');

                if (scrollContainer) {
                    // Left button
                    buttons[0].addEventListener('click', () => {
                        scrollContainer.scrollBy({
                            left: -300,
                            behavior: 'smooth'
                        });
                    });

                    // Right button
                    buttons[1].addEventListener('click', () => {
                        scrollContainer.scrollBy({
                            left: 300,
                            behavior: 'smooth'
                        });
                    });
                }
            }
        });
    }

    // View Mode Toggle (Grid/List)
    const viewModeInputs = document.querySelectorAll('input[name="view_mode"]');
    viewModeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const movieGrid = document.querySelector('.grid');
            if (movieGrid) {
                if (e.target.value === 'list') {
                    movieGrid.classList.remove('grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-5', 'xl:grid-cols-6');
                    movieGrid.classList.add('grid-cols-1', 'gap-4');
                } else {
                    movieGrid.classList.remove('grid-cols-1', 'gap-4');
                    movieGrid.classList.add('grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-5', 'xl:grid-cols-6');
                }
            }
        });
    });

    // Sort Dropdown Functionality
    const sortSelects = document.querySelectorAll('select');
    sortSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            console.log('Sort changed to:', e.target.value);
            // The MovieApp class handles the actual sorting
        });
    });

    // Mobile Menu Toggle (if header has menu button)
    const mobileMenuBtn = document.querySelector('button:has(.material-symbols-outlined[textContent="menu"])');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('aside');
            if (sidebar) {
                sidebar.classList.toggle('hidden');
                sidebar.classList.toggle('flex');
            }
        });
    }

    // Search Input Clear Button
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"]');
    searchInputs.forEach(input => {
        const clearBtn = input.parentElement.querySelector('button:has(.material-symbols-outlined)');
        if (clearBtn && clearBtn.querySelector('.material-symbols-outlined')?.textContent === 'close') {
            clearBtn.addEventListener('click', () => {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
    });

    // Accordion/Details Elements Enhancement
    const details = document.querySelectorAll('details');
    details.forEach(detail => {
        detail.addEventListener('toggle', (e) => {
            // Add smooth animation when opening/closing
            if (e.target.open) {
                const content = e.target.querySelector('div');
                if (content) {
                    content.style.animation = 'fadeIn 0.3s ease-out';
                }
            }
        });
    });

    // Play Button Hover Effects
    const playButtons = document.querySelectorAll('button:has(.material-symbols-outlined[textContent="play_arrow"])');
    playButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.style.transform = 'scale(1.2)';
                icon.style.transition = 'transform 0.2s ease';
            }
        });

        btn.addEventListener('mouseleave', () => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });

    console.log('✅ All interactive controls initialized');
});
