// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // Protect page - Redirect to login if not authenticated
    if (typeof protectPage === 'function') { // Check if auth.js loaded protectPage
        protectPage();
    } else { // Fallback if auth.js didn't load or protectPage isn't global
        if (!Auth.isAuthenticated()) { Auth.logout(); return; }
    }

    const currentUser = Auth.getCurrentUser();
    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');

    if (currentUser) {
        if(userNameDisplay) userNameDisplay.textContent = currentUser.fullName || currentUser.email;
        if(welcomeUserName) welcomeUserName.textContent = `Welcome, ${currentUser.fullName || currentUser.email}!`;
    }

    // --- Theme Switcher ---
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const htmlElement = document.documentElement; // <html> tag

    // Load saved theme from localStorage or default to system preference
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            htmlElement.classList.add('dark');
            if(themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
            if(themeText) themeText.textContent = 'Light Mode';
        } else {
            htmlElement.classList.remove('dark');
            if(themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
            if(themeText) themeText.textContent = 'Dark Mode';
        }
    }

    if(themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            htmlElement.classList.toggle('dark');
            const isDarkMode = htmlElement.classList.contains('dark');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            if (isDarkMode) {
                if(themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
                if(themeText) themeText.textContent = 'Light Mode';
            } else {
                if(themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
                if(themeText) themeText.textContent = 'Dark Mode';
            }
        });
    }
    loadTheme(); // Load theme on page load

    // --- Logout Button ---
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            Auth.logout();
        });
    }

    // --- Sidebar Navigation (Basic Highlighting) ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitle = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent'); // Where dynamic content will load

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            const sectionName = this.textContent.trim(); // Or use data-attribute
            if(currentSectionTitle) currentSectionTitle.textContent = sectionName;
            if(breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="dashboard.html" class="hover:underline">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> ${sectionName}`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            // TODO: Load content for this section into #pageContent
            // For now, just a placeholder
            if(pageContent) pageContent.innerHTML = `
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 class="text-xl font-semibold mb-3">Content for ${sectionName}</h2>
                    <p class="text-gray-600 dark:text-gray-300">This is where the articles, forms, or tools for the "${sectionName}" section will be displayed. Stay tuned for more awesomeness!</p>
                </div>`;
        });
    });

    // TODO: Implement Global Search
    // TODO: Implement "Ask a Question"
    // TODO: Dynamic content loading from data.js for each section
});
