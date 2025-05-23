document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js - FIX] DOMContentLoaded fired.');

    // Debug: Check if kbSystemData is loaded
    console.log('[app.js - DEBUG] kbSystemData:', typeof kbSystemData !== 'undefined' ? kbSystemData : 'undefined');

    // --- Helper Functions ---
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function (match) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[match];
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
            console.error('[app.js] Error in highlightText regex:', e);
            return safeText;
        }
    }

    function truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // --- Authentication & Page Protection ---
    if (typeof protectPage === 'function') {
        console.log('[app.js - FIX] Calling protectPage().');
        protectPage();
    } else {
        console.warn('[app.js - FIX] protectPage function not found. Checking Auth object.');
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated) {
            if (!Auth.isAuthenticated()) {
                console.log('[app.js - FIX] Auth.isAuthenticated is false, redirecting via Auth.logout().');
                Auth.logout(); // This will redirect to login
                return; // Stop further execution if not authenticated
            }
            console.log('[app.js - FIX] User is authenticated via Auth object.');
        } else {
            console.error('[app.js - FIX] CRITICAL: Authentication mechanism not found. Potential redirect loop if not handled.');
            // Fallback redirect if Auth totally missing, to prevent broken page
            // window.location.href = 'login.html'; 
            // return;
        }
    }

    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    console.log('[app.js - FIX] Current user:', currentUser);

    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');

    if (currentUser) {
        const userDisplayName = currentUser.fullName || currentUser.email || 'User';
        if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
        // Welcome message on home page is updated when 'home' section is loaded
    }

    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    } else {
        console.warn('[app.js - FIX] kbSystemData or kbSystemData.meta not available for version info.');
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
        // Re-apply highlight styles if needed after theme change
        const isDark = htmlElement.classList.contains('dark');
        document.querySelectorAll('#searchResultsContainer mark, #sectionSearchResults mark').forEach(mark => {
            if (isDark) {
                mark.style.backgroundColor = '#78350f'; // Dark mode highlight bg
                mark.style.color = '#f3f4f6';       // Dark mode highlight text
            } else {
                mark.style.backgroundColor = '#fde047'; // Light mode highlight bg
                mark.style.color = '#1f2937';       // Light mode highlight text
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
            const isDarkMode = htmlElement.classList.toggle('dark');
            const newTheme = isDarkMode ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }
    loadTheme(); // Load theme on initial page load

    // --- Logout Button ---
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton && typeof Auth !== 'undefined' && Auth.logout) {
        logoutButton.addEventListener('click', () => {
            Auth.logout();
        });
    }

    // --- Report an Error Button ---
    const reportErrorBtn = document.getElementById('reportErrorBtn');
    if (reportErrorBtn) {
        reportErrorBtn.addEventListener('click', () => {
            const sectionTitleText = currentSectionTitleEl ? currentSectionTitleEl.textContent : 'Current Page';
            const pageUrl = window.location.href;
            // Replace with a more sophisticated error reporting mechanism
            alert(`Issue reporting triggered for: ${sectionTitleText}\nURL: ${pageUrl}\n(This is a placeholder. Implement actual reporting.)`);
            // Example: mailto link
            // const email = 'support@example.com';
            // const subject = `Issue Report: ${sectionTitleText}`;
            // const body = `I found an issue on the page: ${pageUrl}\n\nDescription of issue:\n[Please describe the issue here]`;
            // window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
    }
    
    // --- Sidebar Navigation & Content Loading ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');

    console.log('[app.js - DEBUG] pageContent:', pageContent ? 'Found' : 'Not found');
    console.log('[app.js - DEBUG] sidebarLinks:', sidebarLinks.length, 'links found');

    // Store the initial HTML of pageContent to restore the home screen
    const initialPageContent = pageContent ? pageContent.innerHTML : '<p>Error: Initial page content could not be loaded.</p>';

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            console.log(`[app.js - FIX] Highlighted sidebar link for section: "${sectionId}"`);
        } else {
            console.warn(`[app.js - FIX] No sidebar link found for section: "${sectionId}"`);
        }
    }
    
    function getThemeColors(themeColor = 'gray') {
        const color = typeof themeColor === 'string' ? themeColor.toLowerCase() : 'gray';
        // Tailwind JIT might not pick these up if not used elsewhere, consider safelisting if using purge
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

    function renderArticleCard_enhanced(article, sectionData, query = null) {
        const theme = getThemeColors(sectionData.themeColor);
        const cardIconClass = sectionData.icon || 'fas fa-file-alt'; // Fallback icon
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${article.id}" data-item-type="article">
                <div class="flex items-start mb-3"> {/* items-start for better alignment if title wraps */}
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${cardIconClass} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight flex-grow">${highlightText(article.title, query)}</h3>
                    <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${article.id}'); alert('Link copied!');" class="bookmark-link ml-2 pl-2 flex-shrink-0" title="Copy link to this article">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${highlightText(article.summary, query) || 'No summary available.'}</p>
                ${article.tags && article.tags.length > 0 ? `<div class="mb-4">${article.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div class="rating-container text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <span class="mr-1">Helpful?</span>
                        <button class="rating-btn p-1 hover:opacity-75" data-item-id="${article.id}" data-item-type="article" data-rating="up" title="Helpful"><i class="fas fa-thumbs-up text-green-500"></i></button>
                        <button class="rating-btn p-1 hover:opacity-75" data-item-id="${article.id}" data-item-type="article" data-rating="down" title="Not helpful"><i class="fas fa-thumbs-down text-red-500"></i></button>
                    </div>
                    <a href="${escapeHTML(article.contentPath)}" target="_blank" class="text-sm font-medium ${theme.cta} group">
                        Read More <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function renderItemCard_enhanced(item, sectionData, query = null) {
        const theme = getThemeColors(sectionData.themeColor);
        // Determine icon based on item type for Forms/Templates
        let itemIconClass = sectionData.icon || 'fas fa-file-alt'; // Default section icon
        if (sectionData.id === 'forms_templates') {
            if (item.type === 'checklist') itemIconClass = 'fas fa-tasks';
            else if (item.type === 'form') itemIconClass = 'fab fa-wpforms'; // Or 'fas fa-file-invoice'
            else if (item.type === 'template') itemIconClass = 'fas fa-puzzle-piece'; // Or 'fas fa-file-code'
        }

        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${item.id}" data-item-type="item">
                 <div class="flex items-start mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${itemIconClass} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight flex-grow">${highlightText(item.title, query)}</h3>
                    <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${item.id}'); alert('Link copied!');" class="bookmark-link ml-2 pl-2 flex-shrink-0" title="Copy link to this item">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${highlightText(item.description, query) || 'No description available.'}</p>
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs ${theme.tagBg} ${theme.tagText} px-3 py-1 rounded-full uppercase font-semibold tracking-wide">${escapeHTML(item.type)}</span>
                    <a href="${escapeHTML(item.url)}" target="_blank" class="text-sm font-medium ${theme.cta} group">
                        Open <i class="fas fa-external-link-alt ml-1 text-xs opacity-75 group-hover:scale-110 transition-transform duration-200"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function renderCaseCard_enhanced(caseItem, sectionData, query = null) {
        const theme = getThemeColors(sectionData.themeColor);
        const caseIcon = 'fas fa-briefcase'; // Specific icon for cases
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${caseItem.id}" data-item-type="case">
                <div class="flex items-start mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${caseIcon} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight flex-grow">${highlightText(caseItem.title, query)}</h3>
                     <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${caseItem.id}'); alert('Link copied!');" class="bookmark-link ml-2 pl-2 flex-shrink-0" title="Copy link to this case">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 flex-grow">${highlightText(caseItem.summary, query) || 'No summary.'}</p>
                ${caseItem.resolutionStepsPreview ? `<p class="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">Steps: ${escapeHTML(caseItem.resolutionStepsPreview)}</p>` : ''}
                ${caseItem.tags && caseItem.tags.length > 0 ? `<div class="mb-3">${caseItem.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-sm font-medium px-3 py-1 rounded-full ${theme.statusBg} ${theme.statusText} capitalize">${highlightText(caseItem.status, query)}</span>
                    ${caseItem.contentPath ? `<a href="${escapeHTML(caseItem.contentPath)}" target="_blank" class="text-sm font-medium ${theme.cta} group">Details <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i></a>` : `<div class="w-16"></div>` /* Placeholder for alignment */}
                </div>
            </div>
        `;
    }

    function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        console.log(`[app.js - FIX] displaySectionContent CALLED for sectionId: "${sectionId}", item: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);
        if (!pageContent) {
            console.error('[app.js - FIX] pageContent is NULL. Cannot display section.');
            // Potentially try to re-acquire pageContent if it can be dynamically created/destroyed, though not typical for this structure.
            // Or display an error message in a global error div if one exists.
            return;
        }
        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js - FIX] kbSystemData is UNDEFINED. Cannot display section.');
            pageContent.innerHTML = '<div class="p-6 text-center"><h2 class="text-xl font-semibold">Error</h2><p>Knowledge base data is not available. Please try again later.</p></div>';
            return;
        }

        if (sectionId === 'home') {
            pageContent.innerHTML = initialPageContent; // Restore home content
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Welcome';
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden'); // Ensure it's visible
            }
            // Update dynamic elements on home page
            const welcomeUserEl = document.getElementById('welcomeUserName');
            if (currentUser && welcomeUserEl) {
                 welcomeUserEl.textContent = `Welcome, ${currentUser.fullName || currentUser.email}!`;
            }
            const kbVersionEl = document.getElementById('kbVersion');
            const lastKbUpdateEl = document.getElementById('lastKbUpdate');
            if (kbSystemData.meta) {
                if(kbVersionEl) kbVersionEl.textContent = kbSystemData.meta.version;
                if(lastKbUpdateEl) lastKbUpdateEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }
            // Re-apply animations for home cards
            const initialCards = pageContent.querySelectorAll('.grid > .card-animate');
            initialCards.forEach((card, index) => {
                card.style.opacity = 0; // Reset for animation
                card.style.transform = 'translateY(20px)';
                card.style.animation = 'none'; // Remove previous animation
                card.offsetHeight; // Trigger reflow
                card.style.animation = `fadeInUp 0.5s ease-out forwards ${(index + 1) * 0.1}s`;
            });
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Ensure theme styles are correct
            console.log('[app.js - FIX] Home page loaded.');
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center card-animate"><h2 class="text-2xl font-semibold text-red-500 dark:text-red-400">Section Not Found</h2><p class="text-gray-600 dark:text-gray-300">The section with ID "${escapeHTML(sectionId)}" does not exist or could not be loaded.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Not Found';
             if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1">></span> <span class="text-red-500">Not Found</span>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            console.warn(`[app.js - FIX] Section "${sectionId}" not found in kbSystemData.`);
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);

        let contentHTML = `<div class="space-y-10">`; // Outer container for spacing

        // Section Header
        contentHTML += `
            <div class="card-animate"> {/* Animate header block */}
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                    <h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center mb-2 sm:mb-0">
                        <span class="p-2.5 rounded-lg ${theme.iconContainer} mr-3 sm:mr-4 inline-flex">
                            <i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i>
                        </span>
                        ${escapeHTML(sectionData.name)}
                    </h2>
                    <!-- Future: Add section-specific actions here e.g. "Add Article" button -->
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-lg">${escapeHTML(sectionData.description)}</p>
            </div>`;

        // Section-specific Search (if applicable, or if you want it on all sections)
        contentHTML += `
            <div class="my-6 p-4 bg-white dark:bg-gray-800/70 rounded-lg shadow-md card-animate" style="animation-delay: 0.1s;">
                <label for="sectionSearchInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ask about ${escapeHTML(sectionData.name)}:
                </label>
                <div class="flex">
                    <input type="text" id="sectionSearchInput" data-section-id="${sectionData.id}" 
                           class="flex-grow p-2.5 border border-gray-300 dark:border-gray-600 rounded-l-md dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500" 
                           placeholder="E.g., 'how to handle tickets', 'zendesk', 'SLA'">
                    <button id="sectionSearchBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md flex items-center transition-colors">
                        <i class="fas fa-search mr-2"></i>Ask
                    </button>
                </div>
                <div id="sectionSearchResults" class="mt-4 max-h-96 overflow-y-auto space-y-2"></div>
            </div>`;

        let hasContent = false;
        let animationDelayIndex = 1; // For staggering card animations

        // Articles
        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-8 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            animationDelayIndex++;
            sectionData.articles.forEach(article => {
                contentHTML += renderArticleCard_enhanced(article, sectionData);
            });
            contentHTML += `</div>`;
            hasContent = true;
        }

        // Cases
        if (sectionData.cases && sectionData.cases.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            animationDelayIndex++;
            sectionData.cases.forEach(caseItem => {
                contentHTML += renderCaseCard_enhanced(caseItem, sectionData);
            });
            contentHTML += `</div>`;
            hasContent = true;
        }

        // Items (e.g., Forms/Templates)
        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            animationDelayIndex++;
            sectionData.items.forEach(item => {
                contentHTML += renderItemCard_enhanced(item, sectionData);
            });
            contentHTML += `</div>`;
            hasContent = true;
        }
        
        // Sub-Categories
        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories</h3><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
            animationDelayIndex++;
            sectionData.subCategories.forEach(subCat => {
                // Determine icon for sub-category (could be generic or specific if defined in subCat object)
                let subCatIcon = 'fas fa-folder-open'; // Default
                if (subCat.id === 'cases') subCatIcon = 'fas fa-briefcase';
                if (subCat.id === 'tools') subCatIcon = 'fas fa-tools';
                if (subCat.id === 'escalation_procedures') subCatIcon = 'fas fa-exclamation-triangle';

                contentHTML += `
                    <a href="#" data-section-trigger="${sectionData.id}" data-subcat-filter="${subCat.id}" 
                       class="sub-category-link bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group border-l-4 ${theme.border} text-center flex flex-col items-center justify-center transform hover:-translate-y-1 card-animate" 
                       style="animation-delay: ${animationDelayIndex * 0.05}s;">
                        <i class="${subCatIcon} text-3xl mb-3 ${theme.icon} group-hover:scale-110 transition-transform"></i>
                        <h4 class="font-medium text-gray-700 dark:text-gray-200 group-hover:${theme.text}">${escapeHTML(subCat.name)}</h4>
                    </a>`;
            });
            contentHTML += `</div>`;
            // hasContent = true; // Subcategories are navigation, not primary content for "no content yet" message
        }

        // Glossary
        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-book mr-3 ${theme.text}"></i> Glossary</h3><div class="space-y-4">`;
            animationDelayIndex++;
            sectionData.glossary.forEach(entry => {
                contentHTML += `
                    <div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow card-animate border-l-4 ${theme.border}" style="animation-delay: ${animationDelayIndex * 0.05}s;">
                        <strong class="${theme.text}">${escapeHTML(entry.term)}:</strong> 
                        <span class="text-gray-700 dark:text-gray-300">${escapeHTML(entry.definition)}</span>
                    </div>`;
            });
            contentHTML += `</div>`;
            hasContent = true;
        }

        if (!hasContent && !(sectionData.subCategories && sectionData.subCategories.length > 0)) {
            contentHTML += `
                <div class="p-10 text-center bg-white dark:bg-gray-800 rounded-lg shadow-md card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;">
                    <i class="fas fa-info-circle text-4xl ${theme.icon} mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200">No content yet</h3>
                    <p class="text-gray-500 dark:text-gray-400">Content for "${escapeHTML(sectionData.name)}" is being prepared. Check back soon!</p>
                </div>`;
        }

        contentHTML += `</div>`; // Close outer space-y-10

        pageContent.innerHTML = contentHTML;
        console.log(`[app.js - FIX] Successfully set innerHTML for section "${sectionId}".`);
        
        // Apply card animations after content is in DOM
        pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
            // Reset animation properties for re-trigger if content is reloaded
            card.style.opacity = 0;
            card.style.transform = 'translateY(20px)';
            card.style.animation = 'none';
            card.offsetHeight; // Trigger reflow
            // Use existing animation-delay if set, otherwise calculate
            const delay = card.style.animationDelay || `${index * 0.07}s`;
            card.style.animation = `fadeInUp 0.5s ease-out forwards ${delay}`;
        });


        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            let bcHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(sectionData.name)}</span>`;
            if (subCategoryFilter) {
                const subCatData = sectionData.subCategories?.find(sc => sc.id === subCategoryFilter);
                if (subCatData) {
                     bcHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <a href="#" data-section-trigger="${sectionData.id}" class="hover:underline ${theme.text}">${escapeHTML(sectionData.name)}</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(subCatData.name)}</span>`;
                }
            }
            breadcrumbsContainer.innerHTML = bcHTML;
            breadcrumbsContainer.classList.remove('hidden');

            // Add event listeners to newly created breadcrumb links
            breadcrumbsContainer.querySelectorAll('a[data-section-trigger]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetSectionId = e.currentTarget.dataset.sectionTrigger;
                    handleSectionTrigger(targetSectionId); // Navigate to the section (will clear subCategoryFilter)
                });
            });
        }

        if (itemIdToFocus) {
            setTimeout(() => {
                const targetCard = pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item');
                    setTimeout(() => targetCard.classList.remove('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item'), 3500);
                } else {
                    console.warn(`[app.js - FIX] Item "${itemIdToFocus}" not found in section "${sectionId}" DOM for focusing.`);
                }
            }, 250); // Increased delay slightly to ensure DOM is fully ready
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Ensure theme styles are correct
    }

    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        console.log('[app.js - DEBUG] handleSectionTrigger called with:', { sectionId, itemId, subCategoryFilter });
        if (typeof kbSystemData === 'undefined') {
            console.error('[app.js - FIX] kbSystemData undefined in handleSectionTrigger! Cannot proceed.');
            if(pageContent) pageContent.innerHTML = "<p>Error: Knowledge base data is missing. Navigation failed.</p>";
            return;
        }
        highlightSidebarLink(sectionId); // Highlight first
        displaySectionContent(sectionId, itemId, subCategoryFilter); // Then display

        // Update URL hash
        let hash = sectionId;
        if (subCategoryFilter) { // Sub-category takes precedence for hash if itemID is not also present (or itemID is part of subcat)
            hash += `/${subCategoryFilter}`;
        }
        if (itemId) { // If itemID is present, it's the most specific part of the hash
             if (subCategoryFilter && !itemId.startsWith(subCategoryFilter)) { // If itemId is not part of subCat context (e.g. direct link to item)
                // This logic might need refinement based on how subCat filters content vs direct item links
                hash = `${sectionId}/${itemId}`; 
             } else if (!subCategoryFilter) {
                hash = `${sectionId}/${itemId}`;
             }
             // If itemId is implicitly part of subCategoryFilter context, the subCategoryFilter hash might be enough.
             // For now, assume itemId is specific enough.
        }
        
        // Avoid double slashes if itemId or subCategoryFilter is null/empty
        const parts = [sectionId, subCategoryFilter, itemId].filter(Boolean);
        if (parts.length === 3 && parts[1] === parts[2].substring(0, parts[1].length)) { // e.g. support/tools/tool001
            // This case is tricky. For now, let's assume itemId is primary if present.
            // If an item is directly linked, subCategoryFilter might be less relevant for the hash.
            // If navigating via subCategory, then item, hash should reflect that.
            // Simplification: if itemId exists, it's sectionId/itemId. If only subCat, sectionId/subCat.
            if (itemId) hash = `${sectionId}/${itemId}`;
            else if (subCategoryFilter) hash = `${sectionId}/${subCategoryFilter}`;
            else hash = sectionId;

        } else if (itemId) {
            hash = `${sectionId}/${itemId}`;
        } else if (subCategoryFilter) {
            hash = `${sectionId}/${subCategoryFilter}`;
        } else {
            hash = sectionId;
        }


        if (window.location.hash !== `#${hash}`) { // Only update if different to avoid redundant history entries
            window.history.pushState({ sectionId, itemId, subCategoryFilter }, sectionId, `#${hash}`);
        }
        console.log(`[app.js - FIX] Updated URL hash to: #${hash}`);
         // Scroll to top of main content area after navigation
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Parse URL hash to determine initial state
    function parseHash() {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return { sectionId: 'home', itemId: null, subCategoryFilter: null };
        
        const parts = hash.split('/');
        const sectionId = parts[0];
        let itemId = null;
        let subCategoryFilter = null;

        // Attempt to determine if the second part is an itemId or a subCategoryFilter
        if (parts.length > 1) {
            const potentialId = parts[1];
            const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
            if (sectionData) {
                const isSubCategory = sectionData.subCategories?.some(sc => sc.id === potentialId);
                const isArticle = sectionData.articles?.some(a => a.id === potentialId);
                const isCase = sectionData.cases?.some(c => c.id === potentialId);
                const isItem = sectionData.items?.some(i => i.id === potentialId);

                if (isSubCategory) {
                    subCategoryFilter = potentialId;
                    if (parts.length > 2) { // Potentially an item within a subcategory context
                        itemId = parts[2];
                    }
                } else if (isArticle || isCase || isItem) {
                    itemId = potentialId;
                } else {
                    // Could be an old/invalid ID, or a subCategory not yet identified
                    // For now, assume it could be an itemId if not a known subCategory
                    itemId = potentialId; 
                    console.warn(`[app.js] Hash part "${potentialId}" in section "${sectionId}" is not a known subCategory, article, case, or item. Assuming itemId for now.`);
                }
            } else {
                 // Section not found, parts[1] could be anything
                itemId = potentialId; // Best guess
            }
        }
        return { sectionId, itemId, subCategoryFilter };
    }
    
    // Sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            console.log(`[app.js - FIX] Sidebar link click, data-section: "${sectionId}"`);
            if (sectionId) {
                handleSectionTrigger(sectionId, null, null); // Clear itemId and subCategoryFilter
            } else {
                console.error('[app.js - FIX] No data-section attribute found on sidebar link:', this);
            }
        });
    });

    // Centralized click listener for dynamic content (quick links, search results, subcategories)
    document.body.addEventListener('click', function(e) {
        const triggerLink = e.target.closest('[data-section-trigger], [data-subcat-trigger]');

        if (triggerLink) {
            e.preventDefault();
            
            const sectionId = triggerLink.dataset.sectionTrigger;
            const itemId = triggerLink.dataset.itemId; // For specific item links (e.g. from search)
            const subcatFilterFromSectionTrigger = triggerLink.dataset.subcatFilter; // For subcategory cards

            const subcatTriggerValue = triggerLink.dataset.subcatTrigger; // For home page quick links like "support.tools"

            if (sectionId) {
                console.log(`[app.js - FIX] Body click on data-section-trigger: "${sectionId}", item: "${itemId}", subCat: "${subcatFilterFromSectionTrigger}"`);
                handleSectionTrigger(sectionId, itemId, subcatFilterFromSectionTrigger);
            } else if (subcatTriggerValue) {
                console.log(`[app.js - FIX] Body click on data-subcat-trigger: "${subcatTriggerValue}"`);
                if (subcatTriggerValue.includes('.')) {
                    const [sId, subId] = subcatTriggerValue.split('.');
                    handleSectionTrigger(sId, null, subId);
                     // Special handling for "Support Tools" quick link on home to scroll to Zendesk
                    if (sId === 'support' && subId === 'tools') {
                        setTimeout(() => {
                            // Ensure pageContent is updated before trying to find the card
                            const zendeskCard = Array.from(pageContent.querySelectorAll('.card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                            if (zendeskCard && zendeskCard.closest('.card')) {
                                zendeskCard.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'center' });
                                console.log('[app.js - FIX] Scrolled to Zendesk card from home quick link.');
                            } else {
                                console.warn('[app.js - FIX] Zendesk card not found after navigating to Support Tools.');
                            }
                        }, 300); // Delay to allow content to render
                    }
                } else {
                     console.error('[app.js - FIX] Invalid data-subcat-trigger value (must contain "."):', subcatTriggerValue);
                }
            }

            // Hide global search results if a link inside it was clicked
            if (triggerLink.closest('#searchResultsContainer')) {
                if (searchResultsContainer) searchResultsContainer.classList.add('hidden');
                if (globalSearchInput) globalSearchInput.value = ''; // Optionally clear search
            }
        }
    });

    // Global Search
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    let searchDebounceTimer;

    if (globalSearchInput && searchResultsContainer) {
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length > 1 && typeof searchKb === 'function') {
                    renderGlobalSearchResults_enhanced(searchKb(query), query);
                } else {
                    searchResultsContainer.innerHTML = '';
                    searchResultsContainer.classList.add('hidden');
                }
            }, 300);
        });
        // Hide search results when clicking outside
        document.addEventListener('click', (event) => {
            if (globalSearchInput && searchResultsContainer && !globalSearchInput.contains(event.target) && !searchResultsContainer.contains(event.target)) {
                searchResultsContainer.classList.add('hidden');
            }
        });
        // Show search results on focus if there's content
        globalSearchInput.addEventListener('focus', () => {
            if (globalSearchInput.value.trim().length > 1 && searchResultsContainer.children.length > 0) {
                searchResultsContainer.classList.remove('hidden');
            }
        });
    } else {
        console.warn('[app.js - FIX] Global search input or results container missing.');
    }

    function renderGlobalSearchResults_enhanced(results, query) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = ''; // Clear previous results
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<div class="p-3 text-sm text-gray-500 dark:text-gray-300">No results for "${escapeHTML(query)}".</div>`;
            searchResultsContainer.classList.remove('hidden');
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-gray-200 dark:divide-gray-700';
        results.slice(0, 10).forEach(result => { // Limit to 10 results
            const li = document.createElement('li');
            const a = document.createElement('a');
            // Critical: Ensure data-section-trigger and data-item-id are correctly set for navigation
            a.href = `javascript:void(0);`; // Prevent default link behavior
            a.dataset.sectionTrigger = result.sectionId; 
            if (result.type !== 'section_match' && result.type !== 'glossary_term') {
                 // Only add itemId if it's an actual item, not a section or glossary term itself
                 a.dataset.itemId = result.id;
            }
            // For glossary terms, we might want to scroll to the glossary section on the page, or open item directly.
            // For section_match, itemId is not applicable as it refers to the section itself.

            a.className = 'block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors global-search-result-link';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-semibold text-gray-800 dark:text-white';
            titleDiv.innerHTML = highlightText(result.title, query);
            
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 100), query) : '';
            
            const sectionDiv = document.createElement('div');
            const theme = getThemeColors(result.themeColor || 'gray'); // Use result's themeColor
            sectionDiv.className = `text-xs ${theme.text} mt-1 font-medium`;
            sectionDiv.textContent = `In: ${escapeHTML(result.sectionName || 'Unknown Section')}`;

            a.appendChild(titleDiv);
            if (result.summary && result.type !== 'section_match') a.appendChild(summaryDiv); // Don't show section description as summary here
            a.appendChild(sectionDiv);
            li.appendChild(a);
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
        searchResultsContainer.classList.remove('hidden');
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Re-apply mark styles
    }

    // Function to render section-specific search results
    function renderSectionSearchResults(results, query, containerElement, sectionThemeColor) {
        if (!containerElement) {
            console.error("[app.js] Section search results container not found.");
            return;
        }
        containerElement.innerHTML = ''; // Clear previous
        if (results.length === 0) {
            containerElement.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">No results found within this section for "${escapeHTML(query)}".</p>`;
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'space-y-2';
        const theme = getThemeColors(sectionThemeColor); // Use section's theme

        results.slice(0, 5).forEach(result => { // Show top 5 results
            // Only show results relevant to the current section IF the searchKb function doesn't already filter by section
            // Assuming searchKb returns global results, so we need to filter here
            const currentSectionId = containerElement.closest('[data-section-id]')?.dataset.sectionId || document.getElementById('sectionSearchInput')?.dataset.sectionId;
            if (result.sectionId !== currentSectionId && result.type !== 'glossary_term') { // Glossary can be global, or we filter it too
                 // return; // Skip if not in current section, unless it's a glossary term meant to be shown
            }

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `javascript:void(0);`;
            a.dataset.sectionTrigger = result.sectionId; // Keep sectionId for navigation
            if (result.type !== 'section_match' && result.type !== 'glossary_term') {
                a.dataset.itemId = result.id;
            }
            a.className = `block p-3 bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md shadow-sm border-l-4 ${theme.border} transition-all quick-link-button section-search-result-link`;

            const titleDiv = document.createElement('div');
            titleDiv.className = `font-semibold ${theme.text}`;
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 80), query) : 'Click to view details.';

            const typeBadge = document.createElement('span');
            typeBadge.className = `text-xs ${theme.tagBg} ${theme.tagText} px-2 py-0.5 rounded-full mr-2 font-medium capitalize`;
            typeBadge.textContent = result.type.replace(/_/g, ' ');

            const headerDiv = document.createElement('div');
            headerDiv.className = 'flex items-center justify-between mb-1';
            headerDiv.appendChild(titleDiv);
            headerDiv.appendChild(typeBadge);

            a.appendChild(headerDiv);
            a.appendChild(summaryDiv);
            li.appendChild(a);
            ul.appendChild(li);
        });
        if (ul.children.length === 0) { // If all results were filtered out
             containerElement.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">No relevant results found in this section for "${escapeHTML(query)}".</p>`;
        } else {
            containerElement.appendChild(ul);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Re-apply mark styles
    }


    // Event delegation for section-specific search and ratings within pageContent
    if (pageContent) {
        pageContent.addEventListener('click', (e) => {
            // Rating button
            const ratingTarget = e.target.closest('.rating-btn');
            if (ratingTarget) {
                e.preventDefault();
                const ratingContainer = ratingTarget.closest('.rating-container');
                if (ratingContainer) { // Provide simple feedback
                    ratingContainer.innerHTML = `<span class="text-xs text-green-500 dark:text-green-400 font-medium">Thanks for your feedback!</span>`;
                }
                // Here you would typically send this rating to a backend or store locally
                // const itemId = ratingTarget.dataset.itemId;
                // const itemType = ratingTarget.dataset.itemType;
                // const ratingValue = ratingTarget.dataset.rating;
                // console.log(`Rated item ${itemType} ${itemId} as ${ratingValue}`);
                return; // Stop further processing for this click
            }

            // Section Search button
            const sectionSearchBtn = e.target.closest('#sectionSearchBtn');
            if (sectionSearchBtn) {
                e.preventDefault();
                const inputEl = pageContent.querySelector('#sectionSearchInput');
                const resultsContainerEl = pageContent.querySelector('#sectionSearchResults');
                
                if (inputEl && resultsContainerEl) {
                    const currentSectionId = inputEl.dataset.sectionId;
                    const query = inputEl.value.trim();
                    const sectionData = kbSystemData.sections.find(s => s.id === currentSectionId);

                    if (query && query.length > 1 && typeof searchKb === 'function' && sectionData) {
                        const allResults = searchKb(query);
                        // Filter results to only those belonging to the current section for section search
                        const sectionSpecificResults = allResults.filter(r => r.sectionId === currentSectionId || r.type === 'glossary_term'); // Keep glossary terms if they are relevant globally or per section
                        renderSectionSearchResults(sectionSpecificResults, query, resultsContainerEl, sectionData.themeColor || 'gray');
                    } else if (query.length <= 1) {
                        resultsContainerEl.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">Please enter at least 2 characters to search.</p>`;
                    } else {
                         resultsContainerEl.innerHTML = `<p class="text-sm text-red-500 dark:text-red-400 p-3 bg-red-50 dark:bg-red-700/30 rounded-md">Could not perform search. Data missing.</p>`;
                    }
                } else {
                    console.error("[app.js] Section search input or results container not found in pageContent.");
                }
                return; // Stop further processing
            }
        });
         // Allow "Enter" key for section search
        pageContent.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.target.id === 'sectionSearchInput') {
                e.preventDefault();
                const searchButton = pageContent.querySelector('#sectionSearchBtn');
                if (searchButton) {
                    searchButton.click();
                }
            }
        });
    } else {
        console.error('[app.js - FIX] pageContent element not found on DOMContentLoaded. Dynamic event listeners will not be attached.');
    }
    

    // Handle URL hash on page load and hash changes (popstate for back/forward)
    window.addEventListener('popstate', (event) => {
        const { sectionId, itemId, subCategoryFilter } = parseHash(); // Re-parse hash
        console.log('[app.js - FIX] popstate event (hash changed via browser back/forward):', { sectionId, itemId, subCategoryFilter });
        // event.state might contain the state pushed via pushState, or null if hash changed directly
        if (event.state) {
             handleSectionTrigger(event.state.sectionId || 'home', event.state.itemId, event.state.subCategoryFilter);
        } else {
            // Fallback if state is null (e.g., manual hash change or initial load from bookmark)
            handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);
        }
    });

    // Initial load based on hash
    const { sectionId: initialSectionId, itemId: initialItemId, subCategoryFilter: initialSubCategoryFilter } = parseHash();
    console.log('[app.js - FIX] Initial page load hash parsing:', { initialSectionId, initialItemId, initialSubCategoryFilter });
    handleSectionTrigger(initialSectionId || 'home', initialItemId, initialSubCategoryFilter);

    console.log('[app.js - FIX] All initializations complete.');
});
