// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    if (typeof protectPage === 'function') { protectPage(); }
    else { if (!Auth.isAuthenticated()) { Auth.logout(); return; } }

    const currentUser = Auth.getCurrentUser();
    // ... (كود تحديث اسم المستخدم ورسالة الترحيب كما هو) ...

    // --- Theme Switcher ---
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeIconEl = document.getElementById('themeIcon'); // Renamed from themeIcon to avoid conflict
    const themeText = document.getElementById('themeText');
    const htmlElement = document.documentElement;

    function updateThemeUI(isDarkMode) {
        if (isDarkMode) {
            htmlElement.classList.add('dark');
            if (themeIconEl) themeIconEl.innerHTML = lucide.icons.sun.toSvg({ class: 'h-5 w-5 mr-2' }); // Use Lucide SVG
            if (themeText) themeText.textContent = 'Light Mode';
        } else {
            htmlElement.classList.remove('dark');
            if (themeIconEl) themeIconEl.innerHTML = lucide.icons.moon.toSvg({ class: 'h-5 w-5 mr-2' }); // Use Lucide SVG
            if (themeText) themeText.textContent = 'Dark Mode';
        }
    }
    
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        updateThemeUI(savedTheme === 'dark' || (!savedTheme && prefersDark));
    }

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const isDarkMode = !htmlElement.classList.contains('dark');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            updateThemeUI(isDarkMode);
        });
    }
    loadTheme();

    // --- Logout Button ---
    // ... (كما هو) ...

    // --- Sidebar Navigation Highlighting & Content Loading ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle'); // Renamed
    const breadcrumbsContainerEl = document.getElementById('breadcrumbs'); // Renamed
    const pageContentEl = document.getElementById('pageContent'); // Renamed
    const welcomeBlock = document.getElementById('welcomeBlock');
    const quickLinksSection = document.getElementById('quickLinksSection');
    const contentGridTitle = document.getElementById('contentGridTitle');
    const articlesGrid = document.getElementById('articlesGrid');


    function setActiveSidebarLink(activeLink) {
        sidebarLinks.forEach(l => l.classList.remove('active-sidebar-link', 'bg-slate-700', 'dark:bg-slate-700', 'text-white'));
        if (activeLink) {
            activeLink.classList.add('active-sidebar-link', 'bg-slate-700', 'dark:bg-slate-700', 'text-white');
        }
    }
    
    // Function to render dashboard home (welcome, quick links, recent articles)
    function renderDashboardHome() {
        if (welcomeBlock) welcomeBlock.style.display = 'block';
        if (quickLinksSection) quickLinksSection.style.display = 'grid'; // Or 'flex' depending on layout
        if (contentGridTitle) contentGridTitle.textContent = 'Recently Updated Articles';
        if (articlesGrid) {
            // TODO: Populate articlesGrid with actual recent articles from data.js
            articlesGrid.innerHTML = `<!-- Placeholder: Load recent articles here -->`;
            // Example of adding a card (you'd loop through data)
            const exampleArticle = { title: "Example Recent Article", summary: "This is a summary...", category: "General", updated: "Nov 1, 2023" };
            articlesGrid.appendChild(createArticleCard(exampleArticle));
        }
        if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Dashboard';
        if (breadcrumbsContainerEl) breadcrumbsContainerEl.innerHTML = 'Home';
        setActiveSidebarLink(document.querySelector('[data-section="dashboard_home"]'));
    }


    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            setActiveSidebarLink(this);
            const sectionId = this.dataset.section;

            if (sectionId === "dashboard_home") {
                renderDashboardHome();
                return;
            }
            
            // Hide dashboard specific sections if not home
            if (welcomeBlock) welcomeBlock.style.display = 'none';
            if (quickLinksSection) quickLinksSection.style.display = 'none';

            const sectionData = kbSystemData.sections.find(s => s.id === sectionId); // Assuming kbSystemData is from data.js
            
            if (sectionData) {
                if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
                if (breadcrumbsContainerEl) breadcrumbsContainerEl.innerHTML = `<a href="#" data-section="dashboard_home" class="hover:underline sidebar-link">Home</a> <span class="mx-1 text-slate-400 dark:text-slate-500">></span> ${sectionData.name}`;
                
                if (contentGridTitle) contentGridTitle.textContent = `${sectionData.name} Articles`;
                if (articlesGrid) {
                    articlesGrid.innerHTML = ''; // Clear previous articles
                    if (sectionData.articles && sectionData.articles.length > 0) {
                        sectionData.articles.forEach(article => {
                            articlesGrid.appendChild(createArticleCard(article, sectionData.name));
                        });
                    } else {
                        articlesGrid.innerHTML = `<p class="col-span-full text-slate-500 dark:text-slate-400">No articles found in this section yet.</p>`;
                    }
                }
            } else {
                 if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Section Not Found";
                 if (articlesGrid) articlesGrid.innerHTML = `<p class="col-span-full text-red-500">Content for section ID "${sectionId}" not found.</p>`;
            }
             // Re-initialize Lucide icons if new ones were added dynamically
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    });

    // --- Article Card Creator ---
    function createArticleCard(article, sectionName = "General") {
        const card = document.createElement('div');
        card.className = 'card-load-initial bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group';
        // Determine icon and color based on sectionName or article type
        let iconName = "file-text";
        let iconColorClass = "text-sky-600 dark:text-sky-400";
        let badgeBgClass = "bg-sky-100 dark:bg-sky-500/30";
        let badgeTextClass = "text-sky-700 dark:text-sky-200";

        if (sectionName.toLowerCase().includes("logistics")) {
            iconName = "truck"; iconColorClass = "text-emerald-600 dark:text-emerald-400";
            badgeBgClass = "bg-emerald-100 dark:bg-emerald-500/30"; badgeTextClass = "text-emerald-700 dark:text-emerald-200";
        } else if (sectionName.toLowerCase().includes("support")) {
            iconName = "life-buoy"; iconColorClass = "text-blue-600 dark:text-blue-400";
             badgeBgClass = "bg-blue-100 dark:bg-blue-500/30"; badgeTextClass = "text-blue-700 dark:text-blue-200";
        }
        // Add more conditions for other sections

        card.innerHTML = `
            <div class="p-4 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                 <i data-lucide="${iconName}" class="h-16 w-16 ${iconColorClass} opacity-70"></i>
            </div>
            <div class="p-5">
                <span class="inline-block px-3 py-1 text-xs font-semibold ${badgeTextClass} ${badgeBgClass} rounded-full mb-2">${sectionName}</span>
                <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400">${article.title}</h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">${article.summary || "No summary available."}</p>
                <div class="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>Updated: ${article.lastUpdated || "N/A"}</span>
                    <a href="#" data-article-id="${article.id}" class="article-link inline-flex items-center font-medium text-sky-600 dark:text-sky-400 hover:underline">
                        Read More <i data-lucide="arrow-right" class="h-3 w-3 ml-1"></i>
                    </a>
                </div>
            </div>
        `;
        // Add load animation class
        setTimeout(() => card.classList.add('card-load-animate'), 50); // Small delay
        return card;
    }
    
    // Initial Load - Render Dashboard Home
    renderDashboardHome();


    // --- Global Search (Live Search with Dropdown) ---
    const searchInput = document.getElementById('globalSearchInput');
    const searchResultsDropdown = document.getElementById('searchResultsDropdown');

    searchInput.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        if (query.length < 2) {
            searchResultsDropdown.classList.add('hidden');
            searchResultsDropdown.innerHTML = '';
            return;
        }

        // Use the searchKb function from data.js (ensure data.js is loaded and kbSystemData exists)
        const results = typeof searchKb === 'function' ? searchKb(query) : [];
        
        searchResultsDropdown.innerHTML = ''; // Clear previous results
        if (results.length > 0) {
            results.slice(0, 7).forEach(article => { // Show top 7 results
                const item = document.createElement('a');
                item.href = `#`; // Later, link to the article page/view
                item.dataset.articleId = article.id;
                item.className = 'block px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors';
                
                // Highlighting (simple version)
                const title = article.title.replace(new RegExp(query, 'gi'), (match) => `<mark class="bg-yellow-200 dark:bg-yellow-600 rounded px-0.5">${match}</mark>`);
                item.innerHTML = `
                    <div class="font-semibold">${title}</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">In: ${article.sectionName || 'Unknown Section'}</div>
                `;
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    // TODO: Implement logic to display this specific article
                    console.log("Clicked search result, article ID:", article.id);
                    searchResultsDropdown.classList.add('hidden');
                    searchInput.value = article.title; // Optional: fill search bar with selected title
                    // You would typically call a function here like renderArticle(article.id)
                });
                searchResultsDropdown.appendChild(item);
            });
            searchResultsDropdown.classList.remove('hidden');
        } else {
            const noResultsItem = document.createElement('div');
            noResultsItem.className = 'px-4 py-3 text-sm text-slate-500 dark:text-slate-400';
            noResultsItem.textContent = 'No results found.';
            searchResultsDropdown.appendChild(noResultsItem);
            searchResultsDropdown.classList.remove('hidden');
        }
    });
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target) && !searchResultsDropdown.contains(event.target)) {
            searchResultsDropdown.classList.add('hidden');
        }
    });


    // --- Initialize Lucide Icons after dynamic content might be added ---
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
