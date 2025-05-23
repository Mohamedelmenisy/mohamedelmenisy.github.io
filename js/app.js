// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js] DOMContentLoaded. Using YOUR navigation logic as base.');

    // Protect page - Redirect to login if not authenticated (FROM YOUR FILE)
    if (typeof protectPage === 'function') {
        protectPage();
    } else {
        // Fallback or check for Auth object directly if protectPage is not global
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated) {
            if (!Auth.isAuthenticated()) {
                Auth.logout();
                return; // Stop further execution
            }
        } else {
            console.error("CRITICAL: Authentication mechanism (protectPage or Auth object) not found.");
            // Potentially redirect or show error if auth is mandatory
            // For now, assume if Auth is not there, it's a dev environment without auth
        }
    }

    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName'); // Element on initial page
    const kbVersionSpan = document.getElementById('kbVersion'); // Element on initial page
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate'); // Element on initial page
    const footerKbVersionSpan = document.getElementById('footerKbVersion');


    if (currentUser) {
        const userDisplayName = currentUser.fullName || currentUser.email || "User";
        if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
        if (welcomeUserName) welcomeUserName.textContent = `Welcome, ${userDisplayName}!`;
    }

    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    }


    // --- Theme Switcher (FROM YOUR FILE, slight mods for consistency) ---
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
        // ADDED: Update mark colors based on theme
        const isDark = htmlElement.classList.contains('dark');
        document.querySelectorAll('#searchResultsContainer mark, #sectionSearchResults mark').forEach(mark => {
            if (isDark) {
                mark.style.backgroundColor = '#78350f'; // amber-800 from your dash.txt
                mark.style.color = '#f3f4f6';       // gray-100 from your dash.txt
            } else {
                mark.style.backgroundColor = '#fde047'; // yellow-400 from your dash.txt
                mark.style.color = '#1f2937';       // gray-800 from your dash.txt
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
            const isDarkMode = htmlElement.classList.toggle('dark'); // Toggle returns new state
            const newTheme = isDarkMode ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }
    loadTheme();

    // --- Logout Button (FROM YOUR FILE) ---
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton && typeof Auth !== 'undefined' && Auth.logout) {
        logoutButton.addEventListener('click', () => {
            Auth.logout();
        });
    }

    // ADDED: Report an error button
    const reportErrorBtn = document.getElementById('reportErrorBtn');
    if (reportErrorBtn) {
        reportErrorBtn.addEventListener('click', () => {
            const sectionTitleText = currentSectionTitleEl ? currentSectionTitleEl.textContent : 'Current Page';
            // Since we are not using hash for navigation, window.location.href is simpler
            const pageUrl = window.location.href; 
            console.log(`"Report an issue" clicked for section: ${sectionTitleText}, URL: ${pageUrl}`);
            alert(`Thank you for helping improve InfiniBase!\n\nSection: ${sectionTitleText}\n(This is a placeholder. A reporting form will be implemented here.)`);
        });
    }

    // --- Sidebar Navigation & Content Loading (Core logic from YOUR FILE) ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');
    const initialPageContent = pageContent.innerHTML; 

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    // --- Helper Functions (escapeHTML, highlightText, truncateText) - FROM YOUR FILE ---
    function escapeHTML(str) { // FROM YOUR FILE
        if (typeof str !== 'string') return ''; // Added safety
        return str.replace(/[&<>"']/g, function (match) {
            return { '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' }[match]; // Corrected entities
        });
    }

    function highlightText(text, query) { // FROM YOUR FILE, with escapeHTML correction
        if (!text) return ''; // Added safety
        const safeText = escapeHTML(text);
        if (!query) return safeText;
        const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); 
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return safeText.replace(regex, '<mark>$1</mark>');
    }
    
    function truncateText(text, maxLength) { // FROM YOUR FILE
        if (!text || text.length <= maxLength) return text; // Added safety
        return text.substring(0, maxLength) + '...';
    }

    // ADDED: getThemeColors (from our previous iterations, essential for new card styling)
    function getThemeColors(themeColor = 'gray') {
        const color = typeof themeColor === 'string' ? themeColor.toLowerCase() : 'gray';
        const colorMap = { /* ... Full map from our previous correct version ... */ 
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
    
    // MODIFIED: renderArticleCard to use getThemeColors and add new features
    function renderArticleCard(article, sectionData) { // sectionData is the full section object from kbSystemData
        const theme = getThemeColors(sectionData.themeColor); // Get theme based on section's themeColor
        // Your original renderArticleCard uses 'section.iconColorClass' etc.
        // We will use 'theme.iconContainer' etc. from getThemeColors for consistency.
        // If sectionData.themeColor is not defined, getThemeColors defaults to 'gray'.
        
        // The icon class for the card header should come from the main sectionData.icon, not the passed 'displayInfo'
        const cardIconClass = sectionData.icon || 'fas fa-file-alt'; 
        
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${article.id}" data-item-type="article">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${cardIconClass} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(article.title)}</h3>
                    <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${article.id}'); alert('Link copied!');" class="bookmark-link ml-auto pl-2" title="Copy link to this article">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
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

    // MODIFIED: renderItemCard (e.g., for Forms/Templates) to use getThemeColors
    function renderItemCard(item, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        const cardIconClass = sectionData.icon || 'fas fa-file-alt';
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${item.id}" data-item-type="item">
                 <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${cardIconClass} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(item.title)}</h3>
                    <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${item.id}'); alert('Link copied!');" class="bookmark-link ml-auto pl-2" title="Copy link to this item">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
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

    // ADDED: renderCaseCard
    function renderCaseCard(caseItem, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        // Cases might have a specific icon, or fallback to section icon
        const caseIcon = 'fas fa-briefcase'; // Or sectionData.caseIcon if you add it
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${caseItem.id}" data-item-type="case">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${caseIcon} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(caseItem.title)}</h3>
                     <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${caseItem.id}'); alert('Link copied!');" class="bookmark-link ml-auto pl-2" title="Copy link to this case">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
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
                    </a>` : `<div class="w-16"></div>`} {/* Placeholder for alignment if no link */}
                </div>
            </div>
        `;
    }

    // MODIFIED: displaySectionContent to use new render functions, themeColors, and add new sections
    function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        console.log(`[displaySectionContent] Called with sectionId: "${sectionId}", itemId: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);
        if (!pageContent) { console.error("pageContent is null in displaySectionContent"); return; }
        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error("kbSystemData is undefined in displaySectionContent");
            pageContent.innerHTML = "<p>Error: Data not loaded.</p>";
            return;
        }

        if (sectionId === 'home') {
            pageContent.innerHTML = initialPageContent; // Use original initial content
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Welcome";
            if (breadcrumbsContainer) {
                // Make breadcrumb home link trigger JS, not full page reload
                breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            // Re-apply dynamic welcome/meta to initial content, as it might have been wiped
            const welcomeUserEl = document.getElementById('welcomeUserName'); // Re-find
            if (currentUser && welcomeUserEl) {
                welcomeUserEl.textContent = `Welcome, ${currentUser.fullName || currentUser.email}!`;
            }
            const kbVersionEl = document.getElementById('kbVersion'); // Re-find
            const lastKbUpdateEl = document.getElementById('lastKbUpdate'); // Re-find
            if (kbSystemData.meta) {
                if (kbVersionEl) kbVersionEl.textContent = kbSystemData.meta.version;
                if (lastKbUpdateEl) lastKbUpdateEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }
            const initialCards = pageContent.querySelectorAll('.grid > .card-animate'); // Use class from dash.html
            initialCards.forEach((card, index) => {
                card.style.animationDelay = `${(index + 1) * 0.1}s`;
            });
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Ensure mark styles
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center"><h2 class="text-xl font-semibold mb-3">Section not found</h2><p>The requested section "${escapeHTML(sectionId)}" does not exist.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Not Found";
            return;
        }

        // Use getThemeColors for styling
        const theme = getThemeColors(sectionData.themeColor); // sectionData.themeColor was added to data.js

        let contentHTML = `<div class="space-y-10">`; // Changed from space-y-8 for more spacing
        // Section Header - more aligned with modern dash.html
        contentHTML += `<div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                            <span class="p-2.5 rounded-lg ${theme.iconContainer} mr-4 hidden sm:inline-flex">
                                <i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i>
                            </span>
                            ${escapeHTML(sectionData.name)}
                          </h2>
                        </div>`;
        contentHTML += `<p class="text-gray-600 dark:text-gray-300 mt-1 mb-6 text-lg">${escapeHTML(sectionData.description)}</p>`;

        // ADDED: Section-specific "Ask" input
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
        
        let contentRenderedForThisSection = false;

        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`; // gap-8 for consistency
            sectionData.articles.forEach(article => {
                contentHTML += renderArticleCard(article, sectionData); // Pass full sectionData
            });
            contentHTML += `</div>`;
            contentRenderedForThisSection = true;
        }

        // ADDED: Render Cases
        if (sectionData.cases && sectionData.cases.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.cases.forEach(caseItem => {
                contentHTML += renderCaseCard(caseItem, sectionData);
            });
            contentHTML += `</div>`;
            contentRenderedForThisSection = true;
        }

        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> Available ${escapeHTML(sectionData.name)}</h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.items.forEach(item => {
                contentHTML += renderItemCard(item, sectionData); // Pass full sectionData
            });
            contentHTML += `</div>`;
            contentRenderedForThisSection = true;
        }
        
        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories</h3>`;
            contentHTML += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`; // gap-6 for subcats
            sectionData.subCategories.forEach(subCat => {
                 contentHTML += `
                    <a href="#" data-section-trigger="${sectionData.id}" data-subcat-filter="${subCat.id}" 
                       class="sub-category-link bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-center card-animate group
                              border-l-4 ${theme.border} hover:bg-gray-50 dark:hover:bg-gray-700/70 quick-link-button">
                        <i class="fas fa-folder-open text-3xl mb-3 ${theme.icon} group-hover:scale-110 transition-transform"></i>
                        <h4 class="font-medium text-gray-700 dark:text-gray-200">${escapeHTML(subCat.name)}</h4>
                    </a>`;
            });
            contentHTML += `</div>`;
            // contentRenderedForThisSection = true; // Not primary content on its own
        }

        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-book mr-3 ${theme.text}"></i> Glossary</h3>`;
            contentHTML += `<div class="space-y-4">`; // space-y-4 for glossary
            sectionData.glossary.forEach(entry => {
                contentHTML += `
                    <div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow card-animate border-l-4 ${theme.border}">
                        <strong class="${theme.text} font-semibold">${escapeHTML(entry.term)}:</strong>
                        <span class="text-gray-700 dark:text-gray-300 ml-2">${escapeHTML(entry.definition)}</span>
                    </div>
                `;
            });
            contentHTML += `</div>`;
            contentRenderedForThisSection = true;
        }

        if (!contentRenderedForThisSection && !(sectionData.subCategories && sectionData.subCategories.length > 0)) {
            const noContentTheme = getThemeColors(sectionData.themeColor || 'gray');
            contentHTML += `<div class="bg-white dark:bg-gray-800/50 p-10 rounded-xl shadow-lg text-center card-animate border-2 border-dashed border-gray-300 dark:border-gray-700">
                                <i class="fas fa-info-circle text-5xl ${noContentTheme.icon} mb-6"></i>
                                <h3 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No content yet</h3>
                                <p class="text-gray-500 dark:text-gray-400 text-lg">Content for the "${escapeHTML(sectionData.name)}" section is being prepared. Please check back later.</p>
                            </div>`;
        }

        contentHTML += `</div>`; 
        try {
            pageContent.innerHTML = contentHTML;
            console.log(`[displaySectionContent] Successfully set innerHTML for section "${sectionId}".`);
        } catch (e) {
            console.error(`[displaySectionContent] Error setting innerHTML for section "${sectionId}":`, e);
            pageContent.innerHTML = `<p>Error rendering content for ${sectionId}.</p>`;
        }


        const newCards = pageContent.querySelectorAll('.card-animate');
        newCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.07}s`; // Use consistent animation delay
        });


        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            let breadcrumbHTML = `<a href="#" data-section-trigger="home" class="quick-link-button hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1.5 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(sectionData.name)}</span>`;
             if (subCategoryFilter && sectionData.subCategories) { // Check if subCategoryFilter is present
                const subCatData = sectionData.subCategories.find(sc => sc.id === subCategoryFilter);
                if (subCatData) {
                    breadcrumbHTML += ` <span class="mx-1.5 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(subCatData.name)}</span>`;
                }
            }
            breadcrumbsContainer.innerHTML = breadcrumbHTML;
            breadcrumbsContainer.classList.remove('hidden');
            // Re-attach listener for dynamically created breadcrumb home link
            const homeBreadcrumbLink = breadcrumbsContainer.querySelector('[data-section-trigger="home"]');
            if (homeBreadcrumbLink) { // This was missing in your original file's displaySectionContent
                homeBreadcrumbLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleSectionTrigger('home');
                });
            }
        }
        
        // ADDED: Scroll to focused item if itemIdToFocus is provided
        if (itemIdToFocus) {
            setTimeout(() => {
                const targetCard = pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item');
                    setTimeout(() => targetCard.classList.remove('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item'), 3500);
                } else {
                    console.warn(`[displaySectionContent] Item to focus not found: ${itemIdToFocus}`);
                }
            }, 200); // Small delay for DOM to settle
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Ensure mark styles
    }

    // MODIFIED: handleSectionTrigger to accept itemId and subCategoryFilter
    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        console.log(`[handleSectionTrigger] Called for section: "${sectionId}", item: "${itemId}", subCat: "${subCategoryFilter}"`);
        if (typeof kbSystemData === 'undefined') {
            console.error("[handleSectionTrigger] kbSystemData is undefined. Cannot proceed.");
             if(pageContent) pageContent.innerHTML = "<p class='text-red-500 p-4'>Error: Data not loaded. Please refresh.</p>";
            return;
        }
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId, itemId, subCategoryFilter); 
        // We are NOT using window.location.hash for navigation in this simplified model.
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Crucial: prevent default link action (which might be a page reload or hash change if href is not "#")
            const sectionId = this.dataset.section;
            console.log(`[app.js] Sidebar link clicked for section: ${sectionId}`);
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
            const subCatFilter = target.dataset.subcatFilter; // For subcategory links on section page
            const itemId = target.dataset.itemId; // For item specific links if any (e.g. from search)

            console.log(`[Body Click Trigger] section: "${sectionId}", subCat: "${subCatFilter}", item: "${itemId}"`);
            if (sectionId) {
                handleSectionTrigger(sectionId, itemId, subCatFilter);

                // If this click came from a global search result, hide the search results
                if (target.closest('#searchResultsContainer')) {
                    if(searchResultsContainer) searchResultsContainer.classList.add('hidden');
                    if(globalSearchInput) globalSearchInput.value = '';
                }
            }
        }

        // Handle data-subcat-trigger for "Support Tools" on HOME PAGE (from your dash.html)
        const homeSubcatTrigger = e.target.closest('[data-subcat-trigger]');
        if (homeSubcatTrigger && pageContent.querySelector('#welcomeUserName')) { // Check if on home page
            e.preventDefault();
            const triggerValue = homeSubcatTrigger.dataset.subcatTrigger; // e.g., "support.tools"
            console.log(`[Home Quick Link] data-subcat-trigger: "${triggerValue}"`);
            if (triggerValue && triggerValue.includes('.')) {
                const [sectionId, subId] = triggerValue.split('.');
                handleSectionTrigger(sectionId, null, subId);

                // If it's the "Support Tools" link, try to scroll to Zendesk article
                if (sectionId === 'support' && subId === 'tools') {
                    setTimeout(() => {
                        const zendeskArticleCard = Array.from(pageContent.querySelectorAll('.card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                        if (zendeskArticleCard) {
                            const cardElement = zendeskArticleCard.closest('.card');
                            if (cardElement) {
                                cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                cardElement.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400');
                                setTimeout(() => cardElement.classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400'), 2500);
                            }
                        }
                    }, 400); // Delay for content to render
                }
            }
        }
    });

    // Initial load (FROM YOUR FILE - defaults to home, highlights link)
    if (!window.location.hash) { // Your old file didn't use hash for initial load
         highlightSidebarLink('home');
         // handleSectionTrigger('home'); // Call this to ensure home content is rendered if not already by HTML
    }
    // To ensure home content is actually rendered by JS logic if initialPageContent is just a shell:
    handleSectionTrigger('home');


    // --- Global Search Functionality (FROM YOUR FILE, adapted for new nav) ---
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    let searchDebounceTimer;

    if (globalSearchInput && searchResultsContainer) {
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length > 1 && typeof searchKb === 'function') { // check searchKb
                    const results = searchKb(query); 
                    renderGlobalSearchResults(results, query); // Use new global renderer
                } else {
                    searchResultsContainer.innerHTML = '';
                    searchResultsContainer.classList.add('hidden');
                }
            }, 300); 
        });

        document.addEventListener('click', (event) => {
            if (globalSearchInput && searchResultsContainer && 
                !globalSearchInput.contains(event.target) && 
                !searchResultsContainer.contains(event.target)) {
                searchResultsContainer.classList.add('hidden');
            }
        });
        globalSearchInput.addEventListener('focus', () => {
            if (globalSearchInput.value.trim().length > 1 && searchResultsContainer.children.length > 0) {
                searchResultsContainer.classList.remove('hidden');
            }
        });
    }

    // MODIFIED: renderGlobalSearchResults to use data-section-trigger
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
            // Use data-attributes for the body click listener to handle navigation
            a.href = `javascript:void(0);`; // Prevent default navigation
            a.dataset.sectionTrigger = result.sectionId;
            if (result.type !== 'section_match' && result.type !== 'glossary_term') {
                 a.dataset.itemId = result.id; // For potential focusing
            }
            // Add a class to identify these links if specific post-click actions are needed (like closing search)
            a.className = 'block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors global-search-result-link'; 
            
            // The actual click is handled by the body event listener for data-section-trigger.
            // That listener will also need to hide searchResultsContainer and clear globalSearchInput.

            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-semibold text-gray-800 dark:text-gray-100';
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 100), query) : '';
            
            const sectionDiv = document.createElement('div');
            // Get theme for section text from result.themeColor added in data.js searchKb
            const theme = getThemeColors(result.themeColor || 'gray'); 
            sectionDiv.className = `text-xs ${theme.text} mt-1 font-medium`; // Use themed text
            sectionDiv.textContent = `In: ${escapeHTML(result.sectionName || (result.type === 'section_match' ? result.title : 'Unknown Section'))}`;

            a.appendChild(titleDiv);
            if (result.summary && result.type !== 'section_match') a.appendChild(summaryDiv);
            a.appendChild(sectionDiv);
            li.appendChild(a);
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
        searchResultsContainer.classList.remove('hidden');
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Ensure mark styles
    }

    // ADDED: renderSectionSearchResults (for "Ask" feature)
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
            a.href = `javascript:void(0);`; // Click handled by body listener
            a.dataset.sectionTrigger = result.sectionId;
             if (result.type !== 'section_match' && result.type !== 'glossary_term') {
                a.dataset.itemId = result.id; 
            }
            a.className = `block p-3 bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md shadow-sm border-l-4 ${theme.border} transition-all quick-link-button`;
            
            const titleDiv = document.createElement('div');
            titleDiv.className = `font-semibold ${theme.text}`;
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 80), query) : 'Click to view details.';
            
            const typeBadge = document.createElement('span');
            typeBadge.className = `text-xs ${theme.tagBg} ${theme.tagText} px-2 py-0.5 rounded-full mr-2 font-medium`;
            typeBadge.textContent = result.type.replace(/_/g, ' '); // Replace underscores

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
    
    // ADDED: Delegated event listeners for dynamic content (rating, section search)
    // This needs to be attached to an element that exists on page load, like pageContent or document.body
    if (pageContent) {
        pageContent.addEventListener('click', (e) => {
            // Rating buttons
            const ratingTarget = e.target.closest('.rating-btn');
            if (ratingTarget) {
                e.preventDefault();
                const itemId = ratingTarget.dataset.itemId;
                const itemType = ratingTarget.dataset.itemType;
                const rating = ratingTarget.dataset.rating;
                console.log(`[Rating Click] Item: ${itemType} ${itemId}, Rating: ${rating}`);
                const ratingContainer = ratingTarget.closest('.rating-container');
                if (ratingContainer) {
                     ratingContainer.innerHTML = `<span class="text-xs text-green-500 dark:text-green-400">Thanks for your feedback!</span>`;
                }
                return; 
            }

            // Section-specific search button
            const sectionSearchBtn = e.target.closest('#sectionSearchBtn');
            if (sectionSearchBtn) {
                e.preventDefault(); // Prevent form submission if it were a form
                const input = pageContent.querySelector('#sectionSearchInput');
                const currentSectionId = input ? input.dataset.sectionId : null;
                const query = input ? input.value.trim() : '';

                if (query.length > 1 && typeof searchKb === 'function' && currentSectionId) {
                    console.log(`[Section Search] Query: "${query}" in section "${currentSectionId}"`);
                    const results = searchKb(query); 
                    const sectionData = kbSystemData.sections.find(s => s.id === currentSectionId);
                    const themeColor = sectionData ? sectionData.themeColor : 'gray';
                    const resultsContainerEl = pageContent.querySelector('#sectionSearchResults');
                    if (resultsContainerEl) {
                        renderSectionSearchResults(results, query, resultsContainerEl, themeColor);
                    }
                    if (input) input.focus();
                } else if (input && query.length <=1) {
                     const resultsContainerEl = pageContent.querySelector('#sectionSearchResults');
                     if (resultsContainerEl) resultsContainerEl.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400">Please enter at least 2 characters.</p>`;
                }
                return; 
            }
        });
    }

    console.log('[app.js] All initializations complete. Application ready.');
});
