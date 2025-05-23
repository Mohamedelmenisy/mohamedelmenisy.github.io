// js/app.js (VERY SIMPLIFIED TEST VERSION)
document.addEventListener('DOMContentLoaded', () => {
    console.log("Simplified app.js loaded and DOMContentLoaded fired!");

    const homeLink = document.querySelector('.sidebar-link[data-section="home"]');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Home link clicked from simplified app.js!");
            const pageContent = document.getElementById('pageContent');
            if (pageContent) {
                pageContent.innerHTML = '<h1>Home Content Loaded by Simplified JS!</h1>';
            }
        });
        console.log("Home link event listener attached by simplified app.js.");
    } else {
        console.error("Home link not found by simplified app.js.");
    }
});
console.log("Simplified app.js script parsed.");
