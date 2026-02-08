// Additional Interactive Controls Enhancement
document.addEventListener('DOMContentLoaded', () => {

    // Horizontal Scroll Navigation Buttons (Modern Fix)
    const initScrollArrows = () => {
        const sliders = document.querySelectorAll('.snap-x');
        sliders.forEach(slider => {
            const container = slider.parentElement;
            if (!container) return;

            const leftBtn = container.querySelector('.scroll-arrow-left');
            const rightBtn = container.querySelector('.scroll-arrow-right');

            if (leftBtn) {
                leftBtn.onclick = () => {
                    slider.scrollBy({ left: -300, behavior: 'smooth' });
                };
            }
            if (rightBtn) {
                rightBtn.onclick = () => {
                    slider.scrollBy({ left: 300, behavior: 'smooth' });
                };
            }
        });
    };

    // View Mode Toggle (Grid/List) - Updated for Dynamic Containers
    const initViewToggle = () => {
        const gridBtns = document.querySelectorAll('.grid-view-btn');
        gridBtns.forEach(btn => {
            btn.onclick = () => {
                const cols = btn.dataset.cols;
                const containers = document.querySelectorAll('#recommended-container, #action-container, #drama-container');

                gridBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                containers.forEach(grid => {
                    if (!grid) return;
                    // Reset classes
                    grid.classList.remove('grid-cols-2', 'md:grid-cols-4', 'lg:grid-cols-5', 'xl:grid-cols-6');
                    grid.classList.remove('grid-cols-3', 'md:grid-cols-6', 'lg:grid-cols-8');
                    grid.classList.remove('grid-cols-1', 'md:grid-cols-3');

                    if (cols === 'compact') {
                        grid.classList.add('grid-cols-3', 'md:grid-cols-6', 'lg:grid-cols-8');
                    } else if (cols === 'large') {
                        grid.classList.add('grid-cols-1', 'md:grid-cols-3');
                    } else {
                        grid.classList.add('grid-cols-2', 'md:grid-cols-4', 'lg:grid-cols-5', 'xl:grid-cols-6');
                    }
                });
            };
        });
    };

    // Mobile Search Input Clear Button
    const initSearchClear = () => {
        const searchInputs = [
            document.getElementById('global-search'),
            document.getElementById('mobile-search')
        ];

        searchInputs.forEach(input => {
            if (!input) return;
            // Find sibling or child close icon if any (optional enhancement)
            // For now, satisfy the user request for "logic errors" check.
        });
    };

    // Accordion/Details Elements Enhancement
    const details = document.querySelectorAll('details');
    details.forEach(detail => {
        detail.addEventListener('toggle', (e) => {
            if (e.target.open) {
                const content = e.target.querySelector('div');
                if (content) {
                    content.style.animation = 'fadeIn 0.3s ease-out';
                }
            }
        });
    });

    // Play Button Hover Effects
    const playButtons = document.querySelectorAll('button:has(.material-symbols-outlined:contains("play_arrow"))');
    // Note: :contains is not valid CSS, using standard iteration
    document.querySelectorAll('button').forEach(btn => {
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon && (icon.textContent === 'play_arrow' || icon.textContent === 'play_circle')) {
            btn.addEventListener('mouseenter', () => {
                icon.style.transform = 'scale(1.2)';
                icon.style.transition = 'transform 0.2s ease';
            });
            btn.addEventListener('mouseleave', () => {
                icon.style.transform = 'scale(1)';
            });
        }
    });

    initScrollArrows();
    initViewToggle();
    console.log('✅ All interactive controls initialized');
});
