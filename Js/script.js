document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#waitlist-form');
    const inputGroup = form.querySelector('.input-group');
    const nameInput = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const submitBtn = form.querySelector('button');
    const glassCard = document.querySelector('.glass-card');
    const successMsg = document.querySelector('.success-message');
    const mainTitle = document.querySelector('.main-title');
    const socialLinks = document.querySelector('.social-links');

    // Default Elements to Hide on Success
    const elementsToHide = [
        form,
        document.querySelector('.glass-card h2'), // "Join our waitlist!"
        document.querySelector('.glass-card p')   // "Sign up for..."
    ];

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const name = nameInput.value;
        const originalBtnText = submitBtn.textContent;

        if (!email || !name) return;

        // 1. Loading State
        submitBtn.disabled = true;
        submitBtn.textContent = 'Joining...';

        // GOOGLE SHEETS URL (User needs to replace this)
        // GOOGLE SHEETS URL
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbznH6KD90pwo2V4Wf52a_hGjeRLDTDdBAlL-aAuLqPEU_gFj1ug5hatgLe7HYu_MYUZMg/exec';

        // Payload
        const requestPayload = {
            name: name,
            email: email,
            timestamp: new Date().toISOString()
        };

        // Simulate network request (or real one)
        const requestPromise = (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE')
            ? new Promise(resolve => setTimeout(resolve, 1500)) // Simulation delay
            : fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(requestPayload)
            });

        requestPromise
            .then(() => {
                // SUCCESS TRANSITION
                triggerSuccessTransition();
            })
            .catch(error => {
                console.error('Error!', error.message);
                alert('Something went wrong. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            });
    });

    function triggerSuccessTransition() {
        // Step 1: Fade out old elements
        elementsToHide.forEach(el => {
            el.style.opacity = '0';
            // Wait for fade out then hide completely to allow layout reflow
            setTimeout(() => {
                el.style.display = 'none';
            }, 300);
        });

        // Hide title and social links for cleaner look
        mainTitle.style.opacity = '0';
        socialLinks.style.opacity = '0';

        // Step 2: Morph Card & Show Success
        setTimeout(() => {
            glassCard.classList.add('success'); // Shrinks card, adds green glow
            successMsg.style.display = 'flex'; // Show new content
        }, 300);
    }
});
