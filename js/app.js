// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // Protect page - Redirect to login if not authenticated
    if (typeof protectPage === 'function') {
        protectPage();
    } else {
        if (!Auth.isAuthenticated()) { Auth.logout(); return; }
    }

    const currentUser = Auth.getCurrentUser();
    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');


    if (currentUser) {
        const userDisplayName = currentUser.fullName || currentUser.email;
        if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
        if (welcomeUserName) welcomeUserName.textContent = `Welcome, ${userDisplayName}!`;
    }

    if (kbSystemData && kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    }


    // --- Theme Switcher ---
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const htmlElement = document.documentElement;

    function applyTheme(theme) {
        if (theme === 'dark') {
            htmlElement.classList.add('dark');
            if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
            if (themeText) themeText.textContent = 'Light Mode';
        } else {
            htmlElement.classList.remove('dark');
            if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
            if (themeText) themeText.textContent = 'Dark Mode';
        }
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    }

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const isDarkMode = htmlElement.classList.toggle('dark');
            const newTheme = isDarkMode ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }
    loadTheme();

    // --- Logout Button ---
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            Auth.logout();
        });
    }

    // --- Sidebar Navigation & Content Loading ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');
    const initialPageContent = pageContent.innerHTML; // Save initial content for home

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Helper to get Tailwind color classes based on themeColor from data.js
    function getThemeColors(themeColor = 'gray') {
        // Ensure themeColor is a string, default to 'gray' if undefined or null
        const color = typeof themeColor === 'string' ? themeColor.toLowerCase() : 'gray';
        const colorMap = {
            blue: {
                bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400',
                iconContainer: 'bg-blue-100 dark:bg-blue-800/50', icon: 'text-blue-500 dark:text-blue-400',
                cta: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
                border: 'border-blue-500',
                tagBg: 'bg-blue-100 dark:bg-blue-500/20', tagText: 'text-blue-700 dark:text-blue-300'
            },
            teal: {
                bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-600 dark:text-teal-400',
                iconContainer: 'bg-teal-100 dark:bg-teal-800/50', icon: 'text-teal-500 dark:text-teal-400',
                cta: 'text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300',
                border: 'border-teal-500',
                tagBg: 'bg-teal-100 dark:bg-teal-500/20', tagText: 'text-teal-700 dark:text-teal-300'
            },
            green: {
                bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600 dark:text-green-400',
                iconContainer: 'bg-green-100 dark:bg-green-800/50', icon: 'text-green-500 dark:text-green-400',
                cta: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
                border: 'border-green-500',
                tagBg: 'bg-green-100 dark:bg-green-500/20', tagText: 'text-green-700 dark:text-green-300'
            },
            indigo: {
                bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600 dark:text-indigo-400',
                iconContainer: 'bg-indigo-100 dark:bg-indigo-800/50', icon: 'text-indigo-500 dark:text-indigo-400',
                cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300',
                border: 'border-indigo-500',
                tagBg: 'bg-indigo-100 dark:bg-indigo-500/20', tagText: 'text-indigo-700 dark:text-indigo-300'
            },
            cyan: {
                bg: 'bg-cyan-100 dark:bg-cyan-900', text: 'text-cyan-600 dark:text-cyan-400',
                iconContainer: 'bg-cyan-100 dark:bg-cyan-800/50', icon: 'text-cyan-500 dark:text-cyan-400',
                cta: 'text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300',
                border: 'border-cyan-500',
                tagBg: 'bg-cyan-100 dark:bg-cyan-500/20', tagText: 'text-cyan-700 dark:text-cyan-300'
            },
            lime: {
                bg: 'bg-lime-100 dark:bg-lime-900', text: 'text-lime-600 dark:text-lime-400',
                iconContainer: 'bg-lime-100 dark:bg-lime-800/50', icon: 'text-lime-500 dark:text-lime-400',
                cta: 'text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300',
                border: 'border-lime-500',
                tagBg: 'bg-lime-100 dark:bg-lime-500/20', tagText: 'text-lime-700 dark:text-lime-300'
            },
            yellow: {
                bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600 dark:text-yellow-400',
                iconContainer: 'bg-yellow-100 dark:bg-yellow-800/50', icon: 'text-yellow-500 dark:text-yellow-400',
                cta: 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300',
                border: 'border-yellow-500',
                tagBg: 'bg-yellow-100 dark:bg-yellow-500/20', tagText: 'text-yellow-700 dark:text-yellow-300'
            },
            pink: {
                bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-600 dark:text-pink-400',
                iconContainer: 'bg-pink-100 dark:bg-pink-800/50', icon: 'text-pink-500 dark:text-pink-400',
                cta: 'text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300',
                border: 'border-pink-500',
                tagBg: 'bg-pink-100 dark:bg-pink-500/20', tagText: 'text-pink-700 dark:text-pink-300'
            },
            red: {
                bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-600 dark:text-red-400',
                iconContainer: 'bg-red-100 dark:bg-red-800/50', icon: 'text-red-500 dark:text-red-400',
                cta: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
                border: 'border-red-500',
                tagBg: 'bg-red-100 dark:bg-red-500/20', tagText: 'text-red-700 dark:text-red-300'
            },
            sky: {
                bg: 'bg-sky-100 dark:bg-sky-900', text: 'text-sky-600 dark:text-sky-400',
                iconContainer: 'bg-sky-100 dark:bg-sky-800/50', icon: 'text-sky-500 dark:text-sky-400',
                cta: 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300',
                border: 'border-sky-500',
                tagBg: 'bg-sky-100 dark:bg-sky-500/20', tagText: 'text-sky-700 dark:text-sky-300'
            },
            amber: {
                bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-600 dark:text-amber-400',
                iconContainer: 'bg-amber-100 dark:bg-amber-800/50', icon: 'text-amber-500 dark:text-amber-400',
                cta: 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300',
                border: 'border-amber-500',
                tagBg: 'bg-amber-100 dark:bg-amber-500/20', tagText: 'text-amber-700 dark:text-amber-300'
            },
            purple: {
                bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-600 dark:text-purple-400',
                iconContainer: 'bg-purple-100 dark:bg-purple-800/50', icon: 'text-purple-500 dark:text-purple-400',
                cta: 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300',
                border: 'border-purple-500',
                tagBg: 'bg-purple-100 dark:bg-purple-500/20', tagText: 'text-purple-700 dark:text-purple-300'
            },
            slate: { // For Operational Instructions
                bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400',
                iconContainer: 'bg-slate-100 dark:bg-slate-700/50', icon: 'text-slate-500 dark:text-slate-400',
                cta: 'text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300',
                border: 'border-slate-500',
                tagBg: 'bg-slate-200 dark:bg-slate-700', tagText: 'text-slate-700 dark:text-slate-300'
            },
            gray: { // Default/fallback
                bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400',
                iconContainer: 'bg-gray-100 dark:bg-gray-700/50', icon: 'text-gray-500 dark:text-gray-400',
                cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', // Default CTA to primary accent
                border: 'border-gray-500',
                tagBg: 'bg-gray-200 dark:bg-gray-700', tagText: 'text-gray-700 dark:text-gray-300'
            }
        };
        return colorMap[color] || colorMap.gray;
    }

    function renderArticleCard(article, section) {
        const theme = getThemeColors(section.themeColor);
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}">
                <div class="flex items-center mb-4">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${section.icon || 'fas fa-file-alt'} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${article.title}</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${article.summary || 'No summary available.'}</p>
                ${article.tags && article.tags.length > 0 ? `
                <div class="mb-4">
                    ${article.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${tag}</span>`).join('')}
                </div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Updated: ${article.lastUpdated}</span>
                    <a href="${article.contentPath}" target="_blank" class="text-sm font-medium ${theme.cta} group">
                        Read More <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function renderItemCard(item, section) { // For Forms/Templates items
        const theme = getThemeColors(section.themeColor);
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}">
                 <div class="flex items-center mb-4">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${section.icon || 'fas fa-file-alt'} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${item.title}</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${item.description || 'No description available.'}</p>
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs ${theme.tagBg} ${theme.tagText} px-3 py-1 rounded-full uppercase font-semibold tracking-wide">${item.type}</span>
                    <a href="${item.url}" target="_blank" class="text-sm font-medium ${theme.cta} group">
                        Open <i class="fas fa-external-link-alt ml-1 text-xs opacity-75 group-hover:scale-110 transition-transform duration-200"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function displaySectionContent(sectionId) {
        if (sectionId === 'home') {
            pageContent.innerHTML = initialPageContent;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Welcome";
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="dashboard.html" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            if (currentUser && welcomeUserName) {
                const userDisplayName = currentUser.fullName || currentUser.email;
                const welcomeUserEl = document.getElementById('welcomeUserName'); // Re-find element
                if(welcomeUserEl) welcomeUserEl.textContent = `Welcome, ${userDisplayName}!`;
            }
             if (kbSystemData && kbSystemData.meta) {
                const kbVerEl = document.getElementById('kbVersion');
                const lastUpdEl = document.getElementById('lastKbUpdate');
                if(kbVerEl) kbVerEl.textContent = kbSystemData.meta.version;
                if(lastUpdEl) lastUpdEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }
            const initialCards = pageContent.querySelectorAll('.grid > .card-animate');
            initialCards.forEach((card, index) => {
                card.classList.add('card-animate'); // Ensure class is present
                card.style.animationDelay = `${(index + 1) * 0.1}s`;
            });
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center"><h2 class="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Section not found</h2><p class="text-gray-600 dark:text-gray-400">The requested section "${escapeHTML(sectionId)}" does not exist.</p></div>`;
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);

        let contentHTML = `<div class="space-y-10">`; // Increased spacing
        contentHTML += `<div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                            <span class="p-2.5 rounded-lg ${theme.iconContainer} mr-4 hidden sm:inline-flex">
                                <i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i>
                            </span>
                            ${sectionData.name}
                          </h2>
                          <div>
                            <!-- Add any section-specific actions here, e.g. "Add new article" -->
                          </div>
                        </div>`;
        contentHTML += `<p class="text-gray-600 dark:text-gray-300 mt-1 mb-6 text-lg">${sectionData.description}</p>`;


        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles
                            </h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`; // Increased gap
            sectionData.articles.forEach(article => {
                contentHTML += renderArticleCard(article, sectionData); // Pass whole sectionData for themeColor
            });
            contentHTML += `</div>`;
        }

        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-archive mr-3 ${theme.text}"></i> Available ${sectionData.name}
                            </h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`; // Increased gap
            sectionData.items.forEach(item => {
                contentHTML += renderItemCard(item, sectionData); // Pass whole sectionData for themeColor
            });
            contentHTML += `</div>`;
        }

        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories
                            </h3>`;
            contentHTML += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`; // Standard gap
            sectionData.subCategories.forEach(subCat => {
                 contentHTML += `
                    <a href="#" data-section="${sectionId}" data-subcategory="${subCat.id}"
                       class="sub-category-link bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-center card-animate group
                              border-l-4 ${theme.border} hover:bg-gray-50 dark:hover:bg-gray-700/70">
                        <i class="fas fa-folder-open text-3xl mb-3 ${theme.icon} group-hover:scale-110 transition-transform"></i>
                        <h4 class="font-medium text-gray-700 dark:text-gray-200">${subCat.name}</h4>
                    </a>`;
            });
            contentHTML += `</div>`;
        }

        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-book mr-3 ${theme.text}"></i> Glossary
                            </h3>`;
            contentHTML += `<div class="space-y-4">`; // Increased spacing
            sectionData.glossary.forEach(entry => {
                contentHTML += `
                    <div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow card-animate border-l-4 ${theme.border}">
                        <strong class="${theme.text} font-semibold">${entry.term}:</strong>
                        <span class="text-gray-700 dark:text-gray-300 ml-2">${entry.definition}</span>
                    </div>
                `;
            });
            contentHTML += `</div>`;
        }

        if (!sectionData.articles?.length && !sectionData.items?.length && !sectionData.subCategories?.length && !sectionData.glossary?.length) {
             const noContentTheme = getThemeColors(sectionData.themeColor || 'gray');
            contentHTML += `<div class="bg-white dark:bg-gray-800/50 p-10 rounded-xl shadow-lg text-center card-animate border-2 border-dashed border-gray-300 dark:border-gray-700">
                                <i class="fas fa-info-circle text-5xl ${noContentTheme.icon} mb-6"></i>
                                <h3 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No content yet</h3>
                                <p class="text-gray-500 dark:text-gray-400 text-lg">Content for the "${sectionData.name}" section is being prepared. Please check back later.</p>
                            </div>`;
        }

        contentHTML += `</div>`;
        pageContent.innerHTML = contentHTML;

        const newCards = pageContent.querySelectorAll('.card-animate');
        newCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.07}s`; // Slightly adjusted staggering
        });

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="quick-link-button hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1.5 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${sectionData.name}</span>`;
            breadcrumbsContainer.classList.remove('hidden');
            breadcrumbsContainer.querySelector('[data-section-trigger="home"]').addEventListener('click', (e) => {
                e.preventDefault();
                handleSectionTrigger('home');
            });
        }
    }

    function handleSectionTrigger(sectionId) {
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId);
        // window.location.hash = sectionId; // Optional for deep linking
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            if (sectionId) {
                handleSectionTrigger(sectionId);
            }
        });
    });

    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('[data-section-trigger]');
        if (target) {
            e.preventDefault();
            const sectionId = target.dataset.sectionTrigger;
            handleSectionTrigger(sectionId);
        }
        const subCatTarget = e.target.closest('[data-subcat-trigger]');
        if (subCatTarget) {
             e.preventDefault();
             const [sectionId, subCategoryId] = subCatTarget.dataset.subcatTrigger.split('.');
             // First, navigate to the main section
             handleSectionTrigger(sectionId);
             // Then, attempt to scroll or highlight the subcategory.
             // This might require IDs on subcategory elements or more complex logic.
             // For now, just logging it.
             console.log(`Subcategory link clicked: Section ${sectionId}, SubCategory ${subCategoryId}`);
             // Example: try to find and scroll to an article related to 'tools' if subcat is 'tools'
             if (subCategoryId === 'tools') {
                 setTimeout(() => { // wait for content to render
                    const zendeskArticleCard = Array.from(pageContent.querySelectorAll('.card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                    if (zendeskArticleCard) {
                        zendeskArticleCard.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'center' });
                        zendeskArticleCard.closest('.card').classList.add('ring-2', 'ring-offset-2', 'ring-indigo-500');
                        setTimeout(() => zendeskArticleCard.closest('.card').classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-500'), 2500);
                    }
                 }, 200);
             }
        }
    });
    
    if (!window.location.hash) {
         highlightSidebarLink('home');
    } else {
        // const initialSection = window.location.hash.substring(1) || 'home';
        // handleSectionTrigger(initialSection); // Uncomment to enable hash-based navigation on load
    }


    // --- Global Search Functionality ---
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    let searchDebounceTimer;

    if (globalSearchInput && searchResultsContainer) {
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length > 1) {
                    const results = searchKb(query);
                    renderSearchResults(results, query);
                } else {
                    searchResultsContainer.innerHTML = '';
                    searchResultsContainer.classList.add('hidden');
                }
            }, 300);
        });

        document.addEventListener('click', (event) => {
            if (!globalSearchInput.contains(event.target) && !searchResultsContainer.contains(event.target)) {
                searchResultsContainer.classList.add('hidden');
            }
        });
        globalSearchInput.addEventListener('focus', () => {
            if (globalSearchInput.value.trim().length > 1 && searchResultsContainer.children.length > 0) {
                searchResultsContainer.classList.remove('hidden');
            }
        });
    }

    function renderSearchResults(results, query) {
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<div class="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">No results found for "<strong>${escapeHTML(query)}</strong>".</div>`;
            searchResultsContainer.classList.remove('hidden');
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-gray-200 dark:divide-gray-600';

        results.slice(0, 10).forEach(result => {
            const theme = getThemeColors(result.themeColor);
            const li = document.createElement('li');
            const a = document.createElement('a');
            // a.href = `#${result.sectionId}/${result.id}`; // Potential link structure
            a.className = `block p-3 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors`;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                handleSectionTrigger(result.sectionId);
                searchResultsContainer.classList.add('hidden');
                globalSearchInput.value = '';
                // TODO: Scroll to or highlight specific article if possible after section load
                // This is tricky because content loads async. A simple highlight:
                setTimeout(() => {
                    const articles = pageContent.querySelectorAll('.card');
                    articles.forEach(cardEl => {
                        const titleEl = cardEl.querySelector('h3');
                        if (titleEl && titleEl.textContent === result.title) {
                            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            cardEl.classList.add('ring-2', 'ring-offset-2', theme.border.replace('border-', 'ring-')); // Use theme color for ring
                            setTimeout(() => cardEl.classList.remove('ring-2', 'ring-offset-2', theme.border.replace('border-', 'ring-')), 2500);
                        }
                    });
                }, 300); // Delay to allow content to render
            });

            const titleDiv = document.createElement('div');
            titleDiv.className = `font-semibold text-gray-800 dark:text-gray-100`;
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 80), query) : '';
            
            const sectionDiv = document.createElement('div');
            sectionDiv.className = `text-xs ${theme.text} mt-1 font-medium`;
            sectionDiv.innerHTML = `<i class="${kbSystemData.sections.find(s=>s.id === result.sectionId)?.icon || 'fas fa-folder'} fa-fw mr-1.5 opacity-80"></i>Section: ${result.sectionName}`;

            a.appendChild(titleDiv);
            if (result.summary) a.appendChild(summaryDiv);
            a.appendChild(sectionDiv);
            li.appendChild(a);
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
        searchResultsContainer.classList.remove('hidden');
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function (match) {
            return { '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' }[match];
        });
    }

    function highlightText(text, query) {
        if (!text) return '';
        const safeText = escapeHTML(text);
        if (!query) return safeText;
        const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return safeText.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-500/70 text-black dark:text-white px-0.5 rounded-sm">$1</mark>');
    }
    
    function truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

});
