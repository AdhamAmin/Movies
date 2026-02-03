document.addEventListener("DOMContentLoaded", function () {
    loadInclude('header-placeholder', 'includes/header.html');
    loadInclude('footer-placeholder', 'includes/footer.html');
});

function loadInclude(elementId, filePath) {
    const element = document.getElementById(elementId);
    if (!element) return;

    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error(`Could not load ${filePath}`);
            return response.text();
        })
        .then(data => {
            element.innerHTML = data;
        })
        .catch(error => console.error('Error loading include:', error));
}
