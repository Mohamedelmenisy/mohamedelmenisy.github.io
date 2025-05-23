// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js] DOMContentLoaded event fired.');

    // Protect page - Redirect to login if not authenticated
    if (typeof protectPage === 'function') {
        console.log('[app.js] Calling protectPage().');
        protectPage();
    } else {
        console.warn('[app.js] protectPage function not found. Checking Auth object.');
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated) {
            if (!Auth.isAuthenticated()) {
                console.log('[app.js] Auth.isAuthenticated is false, calling Auth.logout().');
                Auth.logout();
                return; // Stop further execution if not authenticated
            }
            console.log('[app.js] User is authenticated via Auth object.');
        } else {
            console.error('[app.js] CRITICAL: Auth object or Auth.isAuthenticated method not found. Page protection might not be active.');
        }
    }

    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    console.log('[app.js] Current user:', currentUser);

    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');

    if (currentUser) {
        const userDisplayName = currentUser.fullName || currentUser.email;
        if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
        if (welcomeUserName) welcomeUserName.textContent = `Welcome, ${userDisplayName}!`;
        console.log('[app.js] User display name set to:', userDisplayName);
    } else {
        console.log('[app.js] No current user found or Auth.getCurrentUser not available.');
    }

    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
        console.log('[app.js] KB Meta data (version, last update) applied.');
    } else {
        console.warn('[app.js] kbSystemData or kbSystemData.meta not found. KB version/update info might be missing.');
    }

    // --- Theme Switcher ---
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const htmlElement = document.documentElement;

    function applyTheme(theme) {
        console.log('[app.js] Applying theme:', theme);
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
        console.log('[app.js] Loading theme preference.');
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    }

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            console.log('[app.js] Theme switcher clicked.');
            const isDarkMode = htmlElement.classList.toggle('dark');
            const newTheme = isDarkMode ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
        console.log('[app.js] Theme switcher event listener attached.');
    } else {
        console.warn('[app.js] Theme switcher element not found.');
    }
    loadTheme();

    // --- Logout Button ---
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton && typeof Auth !== 'undefined' && Auth.logout) {
        logoutButton.addEventListener('click', () => {
            console.log('[app.js] Logout button clicked.');
            Auth.logout();
        });
        console.log('[app.js] Logout button event listener attached.');
    } else {
        console.warn('[app.js] Logout button or Auth.logout not available.');
    }

    // --- Sidebar Navigation & Content Loading ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    console.log('[app.js] Found sidebar links:', sidebarLinks.length);
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');
    const initialPageContent = pageContent ? pageContent.innerHTML : '<p>Error: pageContent element not found initially.</p>';

    if (!pageContent) {
        console.error('[app.js] CRITICAL: pageContent element not found in DOM. Content display will fail.');
    }


    function highlightSidebarLink(sectionId) {
        console.log('[app.js] Highlighting sidebar link for section:', sectionId);
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            console.log('[app.js] Active class added to link for section:', sectionId);
        } else {
            console.warn('[app.js] Could not find sidebar link for section to highlight:', sectionId);
        }
    }

    function getThemeColors(themeColor = 'gray') {
        // ... (getThemeColors function remains the same as previous full version)
        const color = typeof themeColor === 'string' ? themeColor.toLowerCase() : 'gray';
        const colorMap = {
            blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400', iconContainer: 'bg-blue-100 dark:bg-blue-800/50', icon: 'text-blue-500 dark:text-blue-400', cta: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300', border: 'border-blue-500', tagBg: 'bg-blue-100 dark:bg-blue-500/20', tagText: 'text-blue-700 dark:text-blue-300' },
            teal: { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-600 dark:text-teal-400', iconContainer: 'bg-teal-100 dark:bg-teal-800/50', icon: 'text-teal-500 dark:text-teal-400', cta: 'text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300', border: 'border-teal-500', tagBg: 'bg-teal-100 dark:bg-teal-500/20', tagText: 'text-teal-700 dark:text-teal-300' },
            green: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600 dark:text-green-400', iconContainer: 'bg-green-100 dark:bg-green-800/50', icon: 'text-green-500 dark:text-green-400', cta: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300', border: 'border-green-500', tagBg: 'bg-green-100 dark:bg-green-500/20', tagText: 'text-green-700 dark:text-green-300' },
            indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600 dark:text-indigo-400', iconContainer: 'bg-indigo-100 dark:bg-indigo-800/50', icon: 'text-indigo-500 dark:text-indigo-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-indigo-500', tagBg: 'bg-indigo-100 dark:bg-indigo-500/20', tagText: 'text-indigo-700 dark:text-indigo-300' },
            cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900', text: 'text-cyan-600 dark:text-cyan-400', iconContainer: 'bg-cyan-100 dark:bg-cyan-800/50', icon: 'text-cyan-500 dark:text-cyan-400', cta: 'text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300', border: 'border-cyan-500', tagBg: 'bg-cyan-100 dark:bg-cyan-500/20', tagText: 'text-cyan-700 dark:text-cyan-300' },
            lime: { bg: 'bg-lime-100 dark:bg-lime-900', text: 'text-lime-600 dark:text-lime-400', iconContainer: 'bg-lime-100 dark:bg-lime-800/50', icon: 'text-lime-500 dark:text-lime-400', cta: 'text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300', border: 'border-lime-500', tagBg: 'bg-lime-100 dark:bg-lime-500/20', tagText: 'text-lime-700 dark:text-lime-300' },
            yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600 dark:text-yellow-400', iconContainer: 'bg-yellow-100 dark:bg-yellow-800/50', icon: 'text-yellow-500 dark:text-yellow-400', cta: 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300', border: 'border-yellow-500', tagBg: 'bg-yellow-100 dark:bg-yellow-500/20', tagText: 'text-yellow-700 dark:text-yellow-300' },
            pink: { bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-600 dark:text-pink-400', iconContainer: 'bg-pink-100 dark:bg-pink-800/50', icon: 'text-pink-500 dark:text-pink-400', cta: 'text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300', border: 'border-pink-500', tagBg: 'bg-pink-100 dark:bg-pink-500/20', tagText: 'text-pink-700 dark:text-pink-300' },
            red: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-600 dark:text-red-400', iconContainer: 'bg-red-100 dark:bg-red-800/50', icon: 'text-red-500 dark:text-red-400', cta: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300', border: 'border-red-500', tagBg: 'bg-red-100 dark:bg-red-500/20', tagText: 'text-red-700 dark:text-red-300' },
            sky: { bg: 'bg-sky-100 dark:bg-sky-900', text: 'text-sky-600 dark:text-sky-400', iconContainer: 'bg-sky-100 dark:bg-sky-800/50', icon: 'text-sky-500 dark:text-sky-400', cta: 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300', border: 'border-sky-500', tagBg: 'bg-sky-100 dark:bg-sky-500/20', tagText: 'text-sky-700 dark:text-sky-300' },
            amber: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-600 dark:text-amber-400', iconContainer: 'bg-amber-100 dark:bg-amber-800/50', icon: 'text-amber-500 dark:text-amber-400', cta: 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300', border: 'border-amber-500', tagBg: 'bg-amber-100 dark:bg-amber-500/20', tagText: 'text-amber-700 dark:text-amber-300' },
            purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-600 dark:text-purple-400', iconContainer: 'bg-purple-100 dark:bg-purple-800/50', icon: 'text-purple-500 dark:text-purple-400', cta: 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300', border: 'border-purple-500', tagBg: 'bg-purple-100 dark:bg-purple-500/20', tagText: 'text-purple-700 dark:text-purple-300' },
            slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', iconContainer: 'bg-slate-100 dark:bg-slate-700/50', icon: 'text-slate-500 dark:text-slate-400', cta: 'text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300', border: 'border-slate-500', tagBg: 'bg-slate-200 dark:bg-slate-700', tagText: 'text-slate-700 dark:text-slate-300' },
            gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', iconContainer: 'bg-gray-100 dark:bg-gray-700/50', icon: 'text-gray-500 dark:text-gray-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-gray-500', tagBg: 'bg-gray-200 dark:bg-gray-700', tagText: 'text-gray-700 dark:text-gray-300' }
        };
        return colorMap[color] || colorMap.gray;
    }

    function renderArticleCard(article, section) {
        // ... (renderArticleCard function remains the same)
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

    function renderItemCard(item, section) {
        // ... (renderItemCard function remains the same)
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
        console.log(`[app.js] displaySectionContent called for sectionId: "${sectionId}"`);
        if (!pageContent) {
            console.error("[app.js] displaySectionContent: pageContent element not found in DOM. Cannot display content.");
            return;
        }
        if (sectionId === 'home') {
            console.log('[app.js] Displaying home content.');
            pageContent.innerHTML = initialPageContent;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Welcome";
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="dashboard.html" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            // Re-apply dynamic data for home if necessary
            if (currentUser && document.getElementById('welcomeUserName')) {
                document.getElementById('welcomeUserName').textContent = `Welcome, ${currentUser.fullName || currentUser.email}!`;
            }
            if (typeof kbSystemData !== 'undefined' && kbSystemData.meta && document.getElementById('kbVersion')) {
                 document.getElementById('kbVersion').textContent = kbSystemData.meta.version;
                 document.getElementById('lastKbUpdate').textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }
            const initialCards = pageContent.querySelectorAll('.grid > .card-animate');
            initialCards.forEach((card, index) => {
                card.classList.add('card-animate');
                card.style.animationDelay = `${(index + 1) * 0.1}s`;
            });
            console.log('[app.js] Home content displayed.');
            return;
        }

        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error("[app.js] displaySectionContent: kbSystemData is not defined or has no sections. Cannot find section data.");
            pageContent.innerHTML = `<p>Error: Knowledge base data (kbSystemData) is missing or malformed.</p>`;
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            console.warn(`[app.js] Section data not found for sectionId: "${sectionId}"`);
            pageContent.innerHTML = `<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center"><h2 class="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Section not found</h2><p class="text-gray-600 dark:text-gray-400">The requested section "${escapeHTML(sectionId)}" does not exist.</p></div>`;
            return;
        }
        console.log('[app.js] Found sectionData:', sectionData);

        const theme = getThemeColors(sectionData.themeColor);
        let contentHTML = `<div class="space-y-10">`;
        // ... (Rest of HTML generation logic remains the same as previous full version) ...
        contentHTML += `<div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                            <span class="p-2.5 rounded-lg ${theme.iconContainer} mr-4 hidden sm:inline-flex">
                                <i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i>
                            </span>
                            ${sectionData.name}
                          </h2>
                          <div></div>
                        </div>`;
        contentHTML += `<p class="text-gray-600 dark:text-gray-300 mt-1 mb-6 text-lg">${sectionData.description}</p>`;


        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles
                            </h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.articles.forEach(article => {
                contentHTML += renderArticleCard(article, sectionData);
            });
            contentHTML += `</div>`;
        }

        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-archive mr-3 ${theme.text}"></i> Available ${sectionData.name}
                            </h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.items.forEach(item => {
                contentHTML += renderItemCard(item, sectionData);
            });
            contentHTML += `</div>`;
        }

        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories
                            </h3>`;
            contentHTML += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
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
            contentHTML += `<div class="space-y-4">`;
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
        contentHTML += `</div>`; // End of space-y-10
        pageContent.innerHTML = contentHTML;
        console.log(`[app.js] Content for section "${sectionId}" set to pageContent.innerHTML.`);

        const newCards = pageContent.querySelectorAll('.card-animate');
        newCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.07}s`;
        });

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="quick-link-button hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1.5 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${sectionData.name}</span>`;
            breadcrumbsContainer.classList.remove('hidden');
            const homeBreadcrumbLink = breadcrumbsContainer.querySelector('[data-section-trigger="home"]');
            if (homeBreadcrumbLink) {
                homeBreadcrumbLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('[app.js] Home breadcrumb link clicked.');
                    handleSectionTrigger('home');
                });
            }
        }
        console.log(`[app.js] UI updated for section "${sectionId}" (title, breadcrumbs).`);
    }

    function handleSectionTrigger(sectionId) {
        console.log(`[app.js] handleSectionTrigger called for sectionId: "${sectionId}"`);
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId);
        // window.location.hash = sectionId; // Optional for deep linking
    }

    if (sidebarLinks.length > 0) {
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.dataset.section;
                console.log(`[app.js] Sidebar link clicked. data-section: "${sectionId}"`);
                if (sectionId) {
                    handleSectionTrigger(sectionId);
                } else {
                    console.warn('[app.js] Clicked sidebar link has no data-section attribute.');
                }
            });
        });
        console.log('[app.js] Event listeners attached to all sidebar links.');
    } else {
        console.warn('[app.js] No sidebar links found to attach event listeners.');
    }


    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('[data-section-trigger]');
        if (target) {
            e.preventDefault();
            const sectionId = target.dataset.sectionTrigger;
            console.log(`[app.js] Body click detected a data-section-trigger. Section: "${sectionId}"`);
            if (sectionId) {
                handleSectionTrigger(sectionId);
            }
        }
        const subCatTarget = e.target.closest('[data-subcat-trigger]');
        if (subCatTarget) {
             e.preventDefault();
             const triggerValue = subCatTarget.dataset.subcatTrigger;
             console.log(`[app.js] Body click detected a data-subcat-trigger. Value: "${triggerValue}"`);
             if (triggerValue && triggerValue.includes('.')) {
                const [sectionId, subCategoryId] = triggerValue.split('.');
                handleSectionTrigger(sectionId); // Navigate to main section first
                console.log(`[app.js] Subcategory link processed: Section ${sectionId}, SubCategory ${subCategoryId}`);
                // Attempt to highlight/scroll to specific sub-content (e.g., Zendesk article)
                if (subCategoryId === 'tools') {
                    setTimeout(() => {
                        if (!pageContent) return;
                        const zendeskArticleCard = Array.from(pageContent.querySelectorAll('.card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                        if (zendeskArticleCard) {
                            const cardElement = zendeskArticleCard.closest('.card');
                            if (cardElement) {
                                cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                cardElement.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-500');
                                setTimeout(() => cardElement.classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-500'), 2500);
                                console.log('[app.js] Scrolled to and highlighted Zendesk article.');
                            }
                        }
                    }, 200);
                }
             } else {
                console.warn("[app.js] Malformed data-subcat-trigger value:", triggerValue);
             }
        }
    });
    console.log('[app.js] Body click listener for data-section-trigger and data-subcat-trigger attached.');
    
    // Initial state setup
    if (typeof window !== 'undefined' && !window.location.hash) {
         console.log('[app.js] No hash in URL, highlighting "home" section by default.');
         highlightSidebarLink('home');
    } else if (typeof window !== 'undefined') {
        const initialSectionFromHash = window.location.hash.substring(1);
        if (initialSectionFromHash) {
            console.log(`[app.js] Found hash in URL: "${initialSectionFromHash}". Attempting to load this section.`);
            // Check if this section exists in kbSystemData before triggering
            if (typeof kbSystemData !== 'undefined' && kbSystemData.sections && kbSystemData.sections.some(s => s.id === initialSectionFromHash)) {
                handleSectionTrigger(initialSectionFromHash);
            } else if (initialSectionFromHash !== 'home') { // Avoid double-loading home if hash is invalid
                console.warn(`[app.js] Section from hash "${initialSectionFromHash}" not found in data. Defaulting to home.`);
                handleSectionTrigger('home'); // Default to home if hash section is invalid
            } else if (initialSectionFromHash === 'home') {
                 handleSectionTrigger('home');
            }
        } else {
            console.log('[app.js] Hash is present but empty, highlighting "home" section.');
            highlightSidebarLink('home');
        }
    }

    // --- Global Search Functionality ---
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    let searchDebounceTimer;

    if (globalSearchInput && searchResultsContainer) {
        // ... (Search functionality remains the same as previous full version, including its own console.log messages)
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length > 1 && typeof searchKb === 'function') {
                    console.log(`[app.js] Searching for: "${query}"`);
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
        console.log('[app.js] Global search functionality initialized.');
    } else {
        console.warn('[app.js] Global search input or results container not found.');
    }


    function renderSearchResults(results, query) {
        // ... (renderSearchResults function remains the same)
        if (!searchResultsContainer) return;
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
            a.className = `block p-3 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors`;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`[app.js] Search result clicked: Section "${result.sectionId}", Title "${result.title}"`);
                handleSectionTrigger(result.sectionId);
                if (searchResultsContainer) searchResultsContainer.classList.add('hidden');
                if (globalSearchInput) globalSearchInput.value = '';
                
                setTimeout(() => {
                    if (!pageContent || typeof kbSystemData === 'undefined' || !kbSystemData.sections) return;
                    const articles = pageContent.querySelectorAll('.card');
                    articles.forEach(cardEl => {
                        const titleEl = cardEl.querySelector('h3');
                        if (titleEl && titleEl.textContent === result.title) {
                            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            const sectionForTheme = kbSystemData.sections.find(s => s.id === result.sectionId);
                            const cardTheme = getThemeColors(sectionForTheme ? sectionForTheme.themeColor : 'gray');
                            const ringColorClass = cardTheme.border ? cardTheme.border.replace('border-', 'ring-') : 'ring-indigo-500';
                            cardEl.classList.add('ring-2', 'ring-offset-2', ringColorClass);
                            setTimeout(() => cardEl.classList.remove('ring-2', 'ring-offset-2', ringColorClass), 2500);
                        }
                    });
                }, 300);
            });

            const titleDiv = document.createElement('div');
            titleDiv.className = `font-semibold text-gray-800 dark:text-gray-100`;
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 80), query) : '';
            
            const sectionDataForIcon = (typeof kbSystemData !== 'undefined' && kbSystemData.sections) ? kbSystemData.sections.find(s=>s.id === result.sectionId) : null;
            const sectionIcon = sectionDataForIcon ? sectionDataForIcon.icon : 'fas fa-folder';
            sectionDiv.className = `text-xs ${theme.text} mt-1 font-medium`;
            sectionDiv.innerHTML = `<i class="${sectionIcon} fa-fw mr-1.5 opacity-80"></i>Section: ${result.sectionName}`;

            a.appendChild(titleDiv);
            if (result.summary) a.appendChild(summaryDiv);
            a.appendChild(sectionDiv);
            li.appendChild(a);
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
        searchResultsContainer.classList.remove('hidden');
    }

   // أعد كتابة هذه الدالة يدويًا في app.js
function escapeHTML(str) {
    if (typeof str !== 'string') {
        return '';
    }
    return str.replace(/[&<>"']/g, function (match) {
        const escapeChars = {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '''
        };
        return escapeChars[match];
    });
}

    function highlightText(text, query) {
        // ... (highlightText function remains the same)
        if (!text) return '';
        const safeText = escapeHTML(text);
        if (!query) return safeText;
        const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return safeText.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-500/70 text-black dark:text-white px-0.5 rounded-sm">$1</mark>');
    }
    
    function truncateText(text, maxLength) {
        // ... (truncateText function remains the same)
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    console.log('[app.js] Script execution finished.');
});
