// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js] DOMContentLoaded event fired.');

    // --- Authentication & Page Protection ---
    if (typeof protectPage === 'function') {
        console.log('[app.js] Calling protectPage().');
        protectPage();
    } else {
        console.warn('[app.js] protectPage function not found. Checking Auth object.');
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated) {
            if (!Auth.isAuthenticated()) {
                console.log('[app.js] Auth.isAuthenticated is false, calling Auth.logout().');
                Auth.logout(); // Redirects to login
                return; 
            }
            console.log('[app.js] User is authenticated via Auth object.');
        } else {
            console.error('[app.js] CRITICAL: Auth object or Auth.isAuthenticated method not found. Page protection might not be active.');
        }
    }

    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    console.log('[app.js] Current user:', currentUser);

    // --- DOM Element References ---
    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const htmlElement = document.documentElement;
    const logoutButton = document.getElementById('logoutButton');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const reportErrorBtn = document.getElementById('reportErrorBtn');

    if (!pageContent) {
        console.error('[app.js] CRITICAL: pageContent element not found in DOM. Content display will fail.');
        return; // Stop further execution if critical element is missing
    }
    const initialPageContentHTML = pageContent.innerHTML; // Store initial home content


    // --- User and KB Meta Info Update ---
    if (currentUser) {
        const userDisplayName = currentUser.fullName || currentUser.email || "User";
        if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
        if (welcomeUserName) welcomeUserName.textContent = `Welcome, ${userDisplayName}!`;
        console.log('[app.js] User display name set to:', userDisplayName);
    }
    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
        const version = kbSystemData.meta.version;
        const lastUpdate = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
        if (kbVersionSpan) kbVersionSpan.textContent = version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = lastUpdate;
        console.log('[app.js] KB Meta data applied.');
    }

    // --- Theme Management ---
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
        // Update mark colors based on theme
        const isDark = htmlElement.classList.contains('dark');
        document.querySelectorAll('#searchResultsContainer mark, #sectionSearchResults mark').forEach(mark => {
            if (isDark) {
                mark.style.backgroundColor = '#d97706'; // amber-600
                mark.style.color = '#f9fafb'; // gray-50
            } else {
                mark.style.backgroundColor = '#fde047'; // yellow-400
                mark.style.color = '#1f2937'; // gray-800
            }
        });
    }
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    }
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const newTheme = htmlElement.classList.contains('dark') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }
    loadTheme();


    // --- Logout ---
    if (logoutButton && typeof Auth !== 'undefined' && Auth.logout) {
        logoutButton.addEventListener('click', () => { Auth.logout(); });
    }
    
    // --- Report Error Button ---
    if (reportErrorBtn) {
        reportErrorBtn.addEventListener('click', () => {
            const sectionTitleText = currentSectionTitleEl ? currentSectionTitleEl.textContent : 'Current Page';
            const pageUrl = window.location.href;
            console.log(`"Report an issue" clicked for section: ${sectionTitleText}, URL: ${pageUrl}`);
            alert(`Thank you for helping improve InfiniBase!\n\nSection: ${sectionTitleText}\nURL: ${pageUrl}\n\n(This is a placeholder. A reporting form will be implemented here.)`);
        });
    }

    // --- Helper Functions ---
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function (match) {
            return {
                '&': '&',
                '<': '<',
                '>': '>',
                '"': '"',
                "'": '''
            }[match];
        });
    }

    function highlightText(text, query) {
        if (!text) return '';
        const safeText = escapeHTML(text);
        if (!query) return safeText;
        try {
            const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})`, 'gi');
            return safeText.replace(regex, '<mark>$1</mark>');
        } catch (e) {
            console.error("Error in highlightText regex:", e);
            return safeText; // Fallback to unhighlighted text
        }
    }
    
    function truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    function getThemeColors(themeColor = 'gray') {
        const color = typeof themeColor === 'string' ? themeColor.toLowerCase() : 'gray';
        // Tailwind JIT needs full class names. This map helps centralize color logic.
        const colorMap = {
            blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400', iconContainer: 'bg-blue-100 dark:bg-blue-800/50', icon: 'text-blue-500 dark:text-blue-400', cta: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300', border: 'border-blue-500', tagBg: 'bg-blue-100 dark:bg-blue-500/20', tagText: 'text-blue-700 dark:text-blue-300', statusBg: 'bg-blue-100 dark:bg-blue-500/20', statusText: 'text-blue-700 dark:text-blue-400' },
            teal: { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-600 dark:text-teal-400', iconContainer: 'bg-teal-100 dark:bg-teal-800/50', icon: 'text-teal-500 dark:text-teal-400', cta: 'text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300', border: 'border-teal-500', tagBg: 'bg-teal-100 dark:bg-teal-500/20', tagText: 'text-teal-700 dark:text-teal-300', statusBg: 'bg-teal-100 dark:bg-teal-500/20', statusText: 'text-teal-700 dark:text-teal-400' },
            green: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600 dark:text-green-400', iconContainer: 'bg-green-100 dark:bg-green-800/50', icon: 'text-green-500 dark:text-green-400', cta: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300', border: 'border-green-500', tagBg: 'bg-green-100 dark:bg-green-500/20', tagText: 'text-green-700 dark:text-green-300', statusBg: 'bg-green-100 dark:bg-green-500/20', statusText: 'text-green-700 dark:text-green-400' },
            indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600 dark:text-indigo-400', iconContainer: 'bg-indigo-100 dark:bg-indigo-800/50', icon: 'text-indigo-500 dark:text-indigo-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-indigo-500', tagBg: 'bg-indigo-100 dark:bg-indigo-500/20', tagText: 'text-indigo-700 dark:text-indigo-300', statusBg: 'bg-indigo-100 dark:bg-indigo-500/20', statusText: 'text-indigo-700 dark:text-indigo-400' },
            cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900', text: 'text-cyan-600 dark:text-cyan-400', iconContainer: 'bg-cyan-100 dark:bg-cyan-800/50', icon: 'text-cyan-500 dark:text-cyan-400', cta: 'text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300', border: 'border-cyan-500', tagBg: 'bg-cyan-100 dark:bg-cyan-500/20', tagText: 'text-cyan-700 dark:text-cyan-300', statusBg: 'bg-cyan-100 dark:bg-cyan-500/20', statusText: 'text-cyan-700 dark:text-cyan-400' },
            lime: { bg: 'bg-lime-100 dark:bg-lime-900', text: 'text-lime-600 dark:text-lime-400', iconContainer: 'bg-lime-100 dark:bg-lime-800/50', icon: 'text-lime-500 dark:text-lime-400', cta: 'text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300', border: 'border-lime-500', tagBg: 'bg-lime-100 dark:bg-lime-500/20', tagText: 'text-lime-700 dark:text-lime-300', statusBg: 'bg-lime-100 dark:bg-lime-500/20', statusText: 'text-lime-700 dark:text-lime-400' },
            yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600 dark:text-yellow-400', iconContainer: 'bg-yellow-100 dark:bg-yellow-800/50', icon: 'text-yellow-500 dark:text-yellow-400', cta: 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300', border: 'border-yellow-500', tagBg: 'bg-yellow-100 dark:bg-yellow-500/20', tagText: 'text-yellow-700 dark:text-yellow-300', statusBg: 'bg-yellow-100 dark:bg-yellow-500/20', statusText: 'text-yellow-700 dark:text-yellow-400' },
            pink: { bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-600 dark:text-pink-400', iconContainer: 'bg-pink-100 dark:bg-pink-800/50', icon: 'text-pink-500 dark:text-pink-400', cta: 'text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300', border: 'border-pink-500', tagBg: 'bg-pink-100 dark:bg-pink-500/20', tagText: 'text-pink-700 dark:text-pink-300', statusBg: 'bg-pink-100 dark:bg-pink-500/20', statusText: 'text-pink-700 dark:text-pink-400' },
            red: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-600 dark:text-red-400', iconContainer: 'bg-red-100 dark:bg-red-800/50', icon: 'text-red-500 dark:text-red-400', cta: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300', border: 'border-red-500', tagBg: 'bg-red-100 dark:bg-red-500/20', tagText: 'text-red-700 dark:text-red-300', statusBg: 'bg-red-100 dark:bg-red-500/20', statusText: 'text-red-700 dark:text-red-400' },
            sky: { bg: 'bg-sky-100 dark:bg-sky-900', text: 'text-sky-600 dark:text-sky-400', iconContainer: 'bg-sky-100 dark:bg-sky-800/50', icon: 'text-sky-500 dark:text-sky-400', cta: 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300', border: 'border-sky-500', tagBg: 'bg-sky-100 dark:bg-sky-500/20', tagText: 'text-sky-700 dark:text-sky-300', statusBg: 'bg-sky-100 dark:bg-sky-500/20', statusText: 'text-sky-700 dark:text-sky-400' },
            amber: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-600 dark:text-amber-400', iconContainer: 'bg-amber-100 dark:bg-amber-800/50', icon: 'text-amber-500 dark:text-amber-400', cta: 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300', border: 'border-amber-500', tagBg: 'bg-amber-100 dark:bg-amber-500/20', tagText: 'text-amber-700 dark:text-amber-300', statusBg: 'bg-amber-100 dark:bg-amber-500/20', statusText: 'text-amber-700 dark:text-amber-400' },
            purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-600 dark:text-purple-400', iconContainer: 'bg-purple-100 dark:bg-purple-800/50', icon: 'text-purple-500 dark:text-purple-400', cta: 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300', border: 'border-purple-500', tagBg: 'bg-purple-100 dark:bg-purple-500/20', tagText: 'text-purple-700 dark:text-purple-300', statusBg: 'bg-purple-100 dark:bg-purple-500/20', statusText: 'text-purple-700 dark:text-purple-400' },
            slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', iconContainer: 'bg-slate-100 dark:bg-slate-700/50', icon: 'text-slate-500 dark:text-slate-400', cta: 'text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300', border: 'border-slate-500', tagBg: 'bg-slate-200 dark:bg-slate-700', tagText: 'text-slate-700 dark:text-slate-300', statusBg: 'bg-slate-200 dark:bg-slate-600', statusText: 'text-slate-700 dark:text-slate-300' },
            gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', iconContainer: 'bg-gray-100 dark:bg-gray-700/50', icon: 'text-gray-500 dark:text-gray-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-gray-500', tagBg: 'bg-gray-200 dark:bg-gray-700', tagText: 'text-gray-700 dark:text-gray-300', statusBg: 'bg-gray-200 dark:bg-gray-600', statusText: 'text-gray-700 dark:text-gray-300' }
        };
        return colorMap[color] || colorMap.gray;
    }

    // --- Content Rendering Functions ---
    function renderArticleCard(article, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${article.id}" data-item-type="article">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${sectionData.icon || 'fas fa-file-alt'} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(article.title)}</h3>
                    <a href="#${sectionData.id}/${article.id}" class="bookmark-link ml-auto pl-2" title="Link to this article">
                        <i class="fas fa-bookmark text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${escapeHTML(article.summary) || 'No summary available.'}</p>
                ${article.tags && article.tags.length > 0 ? `
                <div class="mb-4">
                    ${article.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}
                </div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div class="rating-container text-xs text-gray-500 dark:text-gray-400">
                        <span class="mr-1">Helpful?</span>
                        <button class="rating-btn p-1 hover:opacity-75" data-item-id="${article.id}" data-item-type="article" data-rating="up" title="Helpful"><i class="fas fa-thumbs-up text-green-500"></i></button>
                        <button class="rating-btn p-1 hover:opacity-75" data-item-id="${article.id}" data-item-type="article" data-rating="down" title="Not helpful"><i class="fas fa-thumbs-down text-red-500"></i></button>
                    </div>
                    <a href="${article.contentPath}" target="_blank" class="text-sm font-medium ${theme.cta} group">
                        Read More <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function renderItemCard(item, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${item.id}" data-item-type="item">
                 <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${sectionData.icon || 'fas fa-file-alt'} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(item.title)}</h3>
                    <a href="#${sectionData.id}/${item.id}" class="bookmark-link ml-auto pl-2" title="Link to this item">
                        <i class="fas fa-bookmark text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${escapeHTML(item.description) || 'No description available.'}</p>
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs ${theme.tagBg} ${theme.tagText} px-3 py-1 rounded-full uppercase font-semibold tracking-wide">${escapeHTML(item.type)}</span>
                    <a href="${item.url}" target="_blank" class="text-sm font-medium ${theme.cta} group">
                        Open <i class="fas fa-external-link-alt ml-1 text-xs opacity-75 group-hover:scale-110 transition-transform duration-200"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function renderCaseCard(caseItem, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${caseItem.id}" data-item-type="case">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="fas fa-briefcase text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(caseItem.title)}</h3>
                     <a href="#${sectionData.id}/${caseItem.id}" class="bookmark-link ml-auto pl-2" title="Link to this case">
                        <i class="fas fa-bookmark text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 flex-grow">${escapeHTML(caseItem.summary) || 'No summary.'}</p>
                ${caseItem.resolutionStepsPreview ? `<p class="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">Steps: ${escapeHTML(caseItem.resolutionStepsPreview)}</p>` : ''}
                ${caseItem.tags && caseItem.tags.length > 0 ? `
                <div class="mb-3">
                    ${caseItem.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}
                </div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-sm font-medium px-3 py-1 rounded-full ${theme.statusBg} ${theme.statusText}">${escapeHTML(caseItem.status)}</span>
                    ${caseItem.contentPath ? `
                    <a href="${caseItem.contentPath}" target="_blank" class="text-sm font-medium ${theme.cta} group">
                        Details <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i>
                    </a>` : `<div></div>`}
                </div>
            </div>
        `;
    }
    
    function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        if (!pageContent) return;

        if (sectionId === 'home') {
            // Only redraw home content if it's not already showing or if forced (e.g. explicit #home click)
            // This check can be subtle. A simple check might be:
            // if (pageContent.querySelector('#welcomeUserName') && !itemIdToFocus && !subCategoryFilter) {
            //    console.log('[app.js] Home content likely already displayed. Skipping full redraw unless forced.');
            //    // Still need to ensure correct sidebar highlight and breadcrumbs for home
            //    if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Welcome";
            //    if (breadcrumbsContainer) {
            //        breadcrumbsContainer.innerHTML = `<a href="#home" class="quick-link-button hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
            //        breadcrumbsContainer.classList.remove('hidden', 'md:hidden');
            //    }
            //    return;
            // }
            // For simplicity and to ensure state consistency after other navigations, we redraw home.
            // More sophisticated state management (like virtual DOM) would handle this better.
            
            pageContent.innerHTML = initialPageContentHTML;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Welcome";
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="#home" class="quick-link-button hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden', 'md:hidden');
            }
            const welcomeUserEl = document.getElementById('welcomeUserName');
            if (currentUser && welcomeUserEl) welcomeUserEl.textContent = `Welcome, ${currentUser.fullName || currentUser.email}!`;
            const kbVersionEl = document.getElementById('kbVersion');
            const lastKbUpdateEl = document.getElementById('lastKbUpdate');
            if (kbSystemData.meta && kbVersionEl) kbVersionEl.textContent = kbSystemData.meta.version;
            if (kbSystemData.meta && lastKbUpdateEl) lastKbUpdateEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            
            const initialCards = pageContent.querySelectorAll('.grid > .card-animate');
            initialCards.forEach((card, index) => {
                card.style.animationDelay = `${(index + 1) * 0.1}s`;
            });
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center"><h2 class="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Section not found</h2><p class="text-gray-600 dark:text-gray-400">The requested section "${escapeHTML(sectionId)}" does not exist.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Error";
            if (breadcrumbsContainer) breadcrumbsContainer.innerHTML = `<a href="#home" class="quick-link-button hover:underline">Home</a> > Error`;
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);
        let contentHTML = `<div class="space-y-10">`;
        contentHTML += `<div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                            <span class="p-2.5 rounded-lg ${theme.iconContainer} mr-4 hidden sm:inline-flex">
                                <i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i>
                            </span>
                            ${escapeHTML(sectionData.name)}
                          </h2>
                        </div>`;
        contentHTML += `<p class="text-gray-600 dark:text-gray-300 mt-1 mb-6 text-lg">${escapeHTML(sectionData.description)}</p>`;
        contentHTML += `
            <div class="my-6 p-4 bg-white dark:bg-gray-800/70 dark:border dark:border-gray-700 rounded-lg shadow-md card-animate">
                <label for="sectionSearchInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ask a question about ${escapeHTML(sectionData.name)}:</label>
                <div class="flex">
                    <input type="text" id="sectionSearchInput" data-section-id="${sectionData.id}" class="flex-grow p-2.5 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200" placeholder="e.g., How to handle P1 tickets?">
                    <button id="sectionSearchBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md flex items-center"><i class="fas fa-search mr-2"></i>Ask</button>
                </div>
                <div id="sectionSearchResults" class="mt-4 max-h-96 overflow-y-auto space-y-2"></div>
            </div>
        `;

        let contentRendered = false;
        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles
                            </h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.articles.forEach(article => { contentHTML += renderArticleCard(article, sectionData); });
            contentHTML += `</div>`;
            contentRendered = true;
        }
        if (sectionData.cases && sectionData.cases.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases
                            </h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.cases.forEach(caseItem => { contentHTML += renderCaseCard(caseItem, sectionData); });
            contentHTML += `</div>`;
            contentRendered = true;
        }
        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-archive mr-3 ${theme.text}"></i> Available ${escapeHTML(sectionData.name)}
                            </h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.items.forEach(item => { contentHTML += renderItemCard(item, sectionData); });
            contentHTML += `</div>`;
            contentRendered = true;
        }
        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center">
                              <i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories
                            </h3>`;
            contentHTML += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
            sectionData.subCategories.forEach(subCat => {
                 contentHTML += `
                    <a href="#${sectionData.id}?subcat=${subCat.id}" 
                       class="sub-category-link bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-center card-animate group
                              border-l-4 ${theme.border} hover:bg-gray-50 dark:hover:bg-gray-700/70">
                        <i class="fas fa-folder-open text-3xl mb-3 ${theme.icon} group-hover:scale-110 transition-transform"></i>
                        <h4 class="font-medium text-gray-700 dark:text-gray-200">${escapeHTML(subCat.name)}</h4>
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
                        <strong class="${theme.text} font-semibold">${escapeHTML(entry.term)}:</strong>
                        <span class="text-gray-700 dark:text-gray-300 ml-2">${escapeHTML(entry.definition)}</span>
                    </div>
                `;
            });
            contentHTML += `</div>`;
            contentRendered = true;
        }
        if (!contentRendered && !(sectionData.subCategories && sectionData.subCategories.length > 0) ) {
            const noContentTheme = getThemeColors(sectionData.themeColor || 'gray');
            contentHTML += `<div class="bg-white dark:bg-gray-800/50 p-10 rounded-xl shadow-lg text-center card-animate border-2 border-dashed border-gray-300 dark:border-gray-700">
                                <i class="fas fa-info-circle text-5xl ${noContentTheme.icon} mb-6"></i>
                                <h3 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No content yet</h3>
                                <p class="text-gray-500 dark:text-gray-400 text-lg">Content for the "${escapeHTML(sectionData.name)}" section is being prepared. Please check back later.</p>
                            </div>`;
        }
        contentHTML += `</div>`;
        pageContent.innerHTML = contentHTML;

        const newCards = pageContent.querySelectorAll('.card-animate');
        newCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.07}s`;
        });

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            let breadcrumbHTML = `<a href="#home" class="quick-link-button hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1.5 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(sectionData.name)}</span>`;
            if (subCategoryFilter && sectionData.subCategories) {
                const subCatData = sectionData.subCategories.find(sc => sc.id === subCategoryFilter);
                if (subCatData) {
                    breadcrumbHTML += ` <span class="mx-1.5 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(subCatData.name)}</span>`;
                }
            }
            breadcrumbsContainer.innerHTML = breadcrumbHTML;
            breadcrumbsContainer.classList.remove('hidden');
        }

        if (itemIdToFocus) {
            setTimeout(() => {
                const targetCard = pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item');
                    setTimeout(() => targetCard.classList.remove('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item'), 3500);
                }
            }, 150);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }


    // --- Navigation and Page State Management ---
    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    function handleSectionTrigger(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        console.log(`[app.js] handleSectionTrigger called. Section: "${sectionId}", Item: "${itemIdToFocus}", SubCat: "${subCategoryFilter}"`);
        if (typeof kbSystemData === 'undefined') {
            console.error("[app.js] CRITICAL: kbSystemData is not defined when handleSectionTrigger is called. Aborting.");
            if(pageContent) pageContent.innerHTML = "<p class='text-red-500 p-4'>Error: Knowledge base data could not be loaded. Please try refreshing the page or contact support.</p>";
            return;
        }
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId, itemIdToFocus, subCategoryFilter);
    }

    // MODIFIED Function to parse hash and trigger content loading
    function processHash() {
        console.log('[app.js] processHash function TRIGGERED.');
        let sectionToLoad = 'home';
        let itemIdToFocus = null;
        let subCategoryFilter = null;

        const currentHash = window.location.hash.substring(1);
        console.log(`[app.js] Current hash for processing: "${currentHash}"`);

        if (currentHash) {
            let pathPart = currentHash;
            let queryParams = '';

            if (currentHash.includes('?')) {
                [pathPart, queryParams] = currentHash.split('?', 2);
            }

            const pathSegments = pathPart.split('/'); 
            const sectionFromHash = pathSegments[0];

            if (sectionFromHash) {
                if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
                     console.error("[app.js] processHash: kbSystemData is not available for parsing hash. Defaulting to home.");
                     sectionToLoad = 'home'; // Default to home if data is missing
                } else if (kbSystemData.sections.some(s => s.id === sectionFromHash)) {
                    sectionToLoad = sectionFromHash;
                    if (pathSegments.length > 1 && pathSegments[1]) {
                        itemIdToFocus = pathSegments[1];
                    }
                    console.log(`[DEBUG] Parsed from hash - Section: ${sectionToLoad}, Item: ${itemIdToFocus}`);
                } else {
                    console.warn(`[app.js] Section from hash "${sectionFromHash}" not found in kbSystemData. Defaulting to home.`);
                    sectionToLoad = 'home';
                    // window.history.replaceState(null, null, '#home'); // Optionally clear invalid hash
                }
            } else { // If hash is just "#" or something invalid after substring(1)
                 sectionToLoad = 'home';
            }

            if (queryParams) {
                const params = new URLSearchParams(queryParams);
                subCategoryFilter = params.get('subcat');
                console.log(`[DEBUG] Parsed from hash - SubCategory Filter: ${subCategoryFilter}`);
            }
        } else {
            console.log('[app.js] No hash found, will load "home".');
            sectionToLoad = 'home';
        }
        
        console.log(`[DEBUG] Forcing handleSectionTrigger for: Section="${sectionToLoad}", Item="${itemIdToFocus}", SubCat="${subCategoryFilter}"`);
        handleSectionTrigger(sectionToLoad, itemIdToFocus, subCategoryFilter);
    }

    // Initial page load based on hash
    if (typeof kbSystemData !== 'undefined') {
        processHash();
    } else {
        console.warn("[app.js] kbSystemData not immediately available on DOMContentLoaded. Initial hash processing might be delayed or use defaults.");
        setTimeout(() => {
            if (typeof kbSystemData !== 'undefined') {
                 console.log("[app.js] Retrying processHash after short delay as data might have loaded late.");
                 processHash();
            } else {
                console.error("[app.js] kbSystemData still not available after delay. Cannot process initial hash. Loading home by default.");
                handleSectionTrigger('home');
            }
        }, 200);
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        console.log('[app.js] hashchange event detected.');
        processHash();
    });

    // Sidebar link click handlers
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            console.log(`[app.js] Sidebar link clicked: ${this.getAttribute('href')}. Default <a> action will change hash and trigger hashchange listener.`);
        });
    });

    // Delegated event listeners for dynamic content within pageContent
    pageContent.addEventListener('click', (e) => {
        const ratingTarget = e.target.closest('.rating-btn');
        if (ratingTarget) {
            e.preventDefault();
            const itemId = ratingTarget.dataset.itemId;
            const itemType = ratingTarget.dataset.itemType;
            const rating = ratingTarget.dataset.rating;
            console.log(`Rating for ${itemType} ${itemId}: ${rating}`);
            const ratingContainer = ratingTarget.closest('.rating-container');
            if (ratingContainer) {
                 ratingContainer.innerHTML = `<span class="text-xs text-green-500 dark:text-green-400">Thanks for your feedback!</span>`;
            }
            return; 
        }

        const sectionSearchBtn = e.target.closest('#sectionSearchBtn');
        if (sectionSearchBtn) {
            const input = pageContent.querySelector('#sectionSearchInput');
            const currentSectionId = input ? input.dataset.sectionId : null;
            const query = input ? input.value.trim() : '';

            if (query.length > 1 && typeof searchKb === 'function' && currentSectionId) {
                console.log(`[app.js] Section-specific search for: "${query}" in section "${currentSectionId}"`);
                const results = searchKb(query);
                const sectionData = kbSystemData.sections.find(s => s.id === currentSectionId);
                const themeColor = sectionData ? sectionData.themeColor : 'gray';
                const resultsContainerEl = pageContent.querySelector('#sectionSearchResults');
                if (resultsContainerEl) {
                    renderSectionSearchResults(results, query, resultsContainerEl, themeColor);
                }
                if (input) input.focus();
            } else if (query.length <=1 && input) {
                 const resultsContainerEl = pageContent.querySelector('#sectionSearchResults');
                 if (resultsContainerEl) resultsContainerEl.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400">Please enter at least 2 characters.</p>`;
            }
            return; 
        }

        const quickLinkTarget = e.target.closest('a[href^="#"]');
        if (quickLinkTarget && quickLinkTarget.closest('#pageContent')) {
            console.log(`[app.js] Hash link clicked within pageContent: ${quickLinkTarget.getAttribute('href')}. Default action will trigger hashchange.`);
        }
        
        const subCatTriggerHome = e.target.closest('[data-subcat-trigger]');
         if (subCatTriggerHome && pageContent.querySelector('#welcomeUserName')) {
             e.preventDefault();
             const triggerValue = subCatTriggerHome.dataset.subcatTrigger;
             if (triggerValue && triggerValue.includes('.')) {
                const [sectionId, subId] = triggerValue.split('.');
                window.location.hash = `${sectionId}?subcat=${subId}`;
                
                if (subId === 'tools') {
                     setTimeout(() => {
                        if (document.getElementById('pageContent')) {
                            const zendeskArticleCard = Array.from(document.querySelectorAll('#pageContent .card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                            if (zendeskArticleCard) {
                                const cardElement = zendeskArticleCard.closest('.card');
                                if (cardElement) {
                                    cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    cardElement.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-500');
                                    setTimeout(() => cardElement.classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-500'), 2500);
                                }
                            } else {
                                console.log('[app.js] Zendesk card not found after loading support section for tools subcat.');
                            }
                        }
                     }, 600);
                 }
             }
         }
    });


    // Section-specific search results renderer
    function renderSectionSearchResults(results, query, container, themeColor) {
        container.innerHTML = '';
        if (results.length === 0) {
            container.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">No results found for "${escapeHTML(query)}".</p>`;
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'space-y-2';
        const theme = getThemeColors(themeColor);

        results.slice(0, 5).forEach(result => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            let itemSpecificId = result.id;
            if (result.type === 'section_match') {
                a.href = `#${result.sectionId}`;
            } else if (result.type === 'glossary_term') {
                 a.href = `#${result.sectionId}`;
                 itemSpecificId = result.id; 
            } else {
                 a.href = `#${result.sectionId}/${result.id}`;
            }

            a.className = `block p-3 bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md shadow-sm border-l-4 ${theme.border} transition-all`;
            
            const titleDiv = document.createElement('div');
            titleDiv.className = `font-semibold ${theme.text}`;
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 80), query) : 'Click to view details.';
            
            const typeBadge = document.createElement('span');
            typeBadge.className = `text-xs ${theme.tagBg} ${theme.tagText} px-2 py-0.5 rounded-full mr-2 font-medium`;
            typeBadge.textContent = result.type.replace('_', ' ');


            const headerDiv = document.createElement('div');
            headerDiv.className = 'flex items-center justify-between mb-1';
            headerDiv.appendChild(titleDiv);
            headerDiv.appendChild(typeBadge);

            a.appendChild(headerDiv);
            a.appendChild(summaryDiv);
            
            li.appendChild(a);
            ul.appendChild(li);
        });
        container.appendChild(ul);
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }


    // --- Global Search Functionality ---
    let searchDebounceTimer;
    if (globalSearchInput && searchResultsContainer) {
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length > 1 && typeof searchKb === 'function') {
                    const results = searchKb(query);
                    renderGlobalSearchResults(results, query);
                } else {
                    searchResultsContainer.innerHTML = '';
                    searchResultsContainer.classList.add('hidden');
                }
            }, 300);
        });

        document.addEventListener('click', (event) => {
            if (globalSearchInput && searchResultsContainer && !globalSearchInput.contains(event.target) && !searchResultsContainer.contains(event.target)) {
                searchResultsContainer.classList.add('hidden');
            }
        });
        globalSearchInput.addEventListener('focus', () => {
            if (globalSearchInput.value.trim().length > 1 && searchResultsContainer.children.length > 0) {
                searchResultsContainer.classList.remove('hidden');
            }
        });
    }

    function renderGlobalSearchResults(results, query) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<div class="p-3 text-sm text-gray-500 dark:text-gray-400">No results found for "${escapeHTML(query)}".</div>`;
            searchResultsContainer.classList.remove('hidden');
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-gray-200 dark:divide-gray-700';

        results.slice(0, 10).forEach(result => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            
            if (result.type === 'section_match') {
                a.href = `#${result.id}`;
            } else if (result.type === 'glossary_term') {
                a.href = `#${result.sectionId}`; 
            } else { 
                a.href = `#${result.sectionId}/${result.id}`;
            }

            a.className = 'block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
            a.addEventListener('click', (e) => { 
                if (searchResultsContainer) searchResultsContainer.classList.add('hidden');
                if (globalSearchInput) globalSearchInput.value = ''; 
            });

            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-semibold text-gray-800 dark:text-gray-100';
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 100), query) : '';
            
            const sectionDiv = document.createElement('div');
            const sectionDataForTheme = kbSystemData.sections.find(s=>s.id === result.sectionId);
            const theme = getThemeColors(sectionDataForTheme ? sectionDataForTheme.themeColor : 'gray');
            sectionDiv.className = `text-xs ${theme.text} mt-1 font-medium`;
            sectionDiv.textContent = `In: ${escapeHTML(result.sectionName || (result.type === 'section_match' ? result.title : 'Unknown Section'))}`;


            a.appendChild(titleDiv);
            if (result.summary && result.type !== 'section_match') a.appendChild(summaryDiv); 
            a.appendChild(sectionDiv);
            li.appendChild(a);
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
        searchResultsContainer.classList.remove('hidden');
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }
    
    console.log('[app.js] All initializations complete. Application ready.');
});
