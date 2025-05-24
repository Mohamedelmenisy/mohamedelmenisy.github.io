ocument.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js - MODIFIED] DOMContentLoaded fired.');

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

    function generateUniqueId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    }

    // --- Authentication & Page Protection ---
    if (typeof protectPage === 'function') {
        protectPage();
    } else {
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated) {
            if (!Auth.isAuthenticated()) { Auth.logout(); return; }
        } else {
            console.error('[app.js] CRITICAL: Authentication mechanism not found.');
        }
    }

    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    const userNameForLog = currentUser ? (currentUser.fullName || currentUser.email) : 'Anonymous User';

    const userNameDisplay = document.getElementById('userNameDisplay');
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');

    if (currentUser && userNameDisplay) {
        userNameDisplay.textContent = currentUser.fullName || currentUser.email || 'User';
    }

    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
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
        const isDark = htmlElement.classList.contains('dark');
        document.querySelectorAll('#searchResultsContainer mark, #sectionSearchResults mark, #modalBody mark').forEach(mark => {
            mark.style.backgroundColor = isDark ? '#78350f' : '#fde047';
            mark.style.color = isDark ? '#f3f4f6' : '#1f2937';
        });
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    }

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const newTheme = htmlElement.classList.toggle('dark') ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }
    loadTheme();

    // --- Logout Button ---
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton && typeof Auth !== 'undefined' && Auth.logout) {
        logoutButton.addEventListener('click', () => { Auth.logout(); });
    }

    // --- Report an Error Button ---
    const reportErrorBtn = document.getElementById('reportErrorBtn');
    if (reportErrorBtn) {
        reportErrorBtn.addEventListener('click', () => {
            const sectionTitleText = currentSectionTitleEl ? currentSectionTitleEl.textContent : 'Current Page';
            alert(`Issue reporting (placeholder) for: ${sectionTitleText}`);
        });
    }

    // --- Modal Control ---
    const itemDetailModal = document.getElementById('itemDetailModal');
    const modalTitleEl = document.getElementById('modalTitle');
    const modalBodyEl = document.getElementById('modalBody');
    const modalFooterEl = document.getElementById('modalFooter');
    const closeModalBtn = document.getElementById('closeModalBtn');

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && itemDetailModal && !itemDetailModal.classList.contains('hidden')) closeModal();
    });
    if (itemDetailModal) {
        itemDetailModal.addEventListener('click', (e) => {
            if (e.target === itemDetailModal) closeModal();
        });
    }

    function openModal(title, bodyHtml, footerHtml = '') {
        if (modalTitleEl) modalTitleEl.innerHTML = escapeHTML(title); // Title can be simple text
        if (modalBodyEl) modalBodyEl.innerHTML = bodyHtml; // Body can contain HTML
        if (modalFooterEl) modalFooterEl.innerHTML = footerHtml; // Footer can contain HTML buttons
        if (itemDetailModal) {
            itemDetailModal.classList.remove('hidden');
            // Force reflow for transition
            itemDetailModal.offsetWidth;
            itemDetailModal.classList.remove('opacity-0');
            itemDetailModal.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0');

        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Ensure styles within modal are themed
    }

    function closeModal() {
        if (itemDetailModal) {
            itemDetailModal.classList.add('opacity-0');
            itemDetailModal.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                 itemDetailModal.classList.add('hidden');
                 if (modalTitleEl) modalTitleEl.textContent = '';
                 if (modalBodyEl) modalBodyEl.innerHTML = '';
                 if (modalFooterEl) modalFooterEl.innerHTML = '';
            }, 300); // Match transition duration
        }
    }

    // --- Access Logging ---
    // accessHistory is defined in data.js and should be globally available.
    // If not, uncomment and ensure proper scoping:
    // if (typeof accessHistory === 'undefined') {
    //     var accessHistory = [];
    //     console.warn('[app.js] accessHistory was undefined, initialized as empty array.')
    // }

    function logAccess(user, itemName, sectionName, itemType = "item") {
        if (!user) { console.warn("[app.js] logAccess: User name is missing."); return; }
        const timestamp = new Date();
        accessHistory.push({
            user: user,
            item: itemName,
            section: sectionName,
            type: itemType,
            timestamp: timestamp.toISOString()
        });
        console.log(`[app.js] Access logged: User: ${user}, Item: ${itemName}, Section: ${sectionName}, Type: ${itemType}, Time: ${timestamp.toLocaleString()}`);
        // Auto-refresh access tracking if home page is visible
        const currentSectionTitle = document.getElementById('currentSectionTitle')?.textContent;
        if (currentSectionTitle === 'Welcome' || currentSectionTitle === 'Home') {
            const trackingContainer = document.getElementById('accessTrackingReportContainer');
            if (trackingContainer) renderAccessTrackingReport(trackingContainer);
        }
    }

    // --- Sidebar Navigation & Content Loading ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');

    // Store the initial HTML structure for the home page dynamically.
    // This will now include a placeholder for Access Tracking.
    const initialPageContentStructure = `
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 p-8 rounded-xl shadow-2xl text-white card-animate">
            <h2 class="text-3xl font-bold mb-3" id="welcomeUserName">Welcome, User!</h2>
            <p class="text-indigo-100 dark:text-indigo-200 text-lg">Select a section from the sidebar or use the search bar to find what you need.</p>
            <p class="text-indigo-200 dark:text-indigo-300 mt-1 text-sm">InfiniBase v<span id="kbVersionDisplayHome">${kbSystemData.meta.version}</span> - Last Updated: <span id="lastKbUpdateDisplayHome">${new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString()}</span></p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col transform hover:-translate-y-1 card-animate" style="animation-delay: 0.1s;">
                <div class="flex items-center mb-4">
                    <div class="p-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md mr-4"><i class="fas fa-headset text-xl"></i></div>
                    <h3 class="font-semibold text-xl text-gray-800 dark:text-white">Support Center</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-5 flex-grow">Access high-priority ticket guides, escalation procedures, and tool documentation.</p>
                <div class="mt-auto"><a href="#" data-section-trigger="support" class="quick-link-button text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline group">Go to Support <i class="fas fa-arrow-right ml-1 text-xs opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all duration-200"></i></a></div>
            </div>
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col transform hover:-translate-y-1 card-animate" style="animation-delay: 0.2s;">
                <div class="flex items-center mb-4">
                    <div class="p-3 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-md mr-4"><i class="fas fa-file-alt text-xl"></i></div>
                    <h3 class="font-semibold text-xl text-gray-800 dark:text-white">Forms & Templates</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-5 flex-grow">Find client onboarding checklists, standard procedure documents, and other templates.</p>
                <div class="mt-auto"><a href="#" data-section-trigger="forms_templates" class="quick-link-button text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline group">View Forms <i class="fas fa-arrow-right ml-1 text-xs opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all duration-200"></i></a></div>
            </div>
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col transform hover:-translate-y-1 card-animate" style="animation-delay: 0.3s;">
                <div class="flex items-center mb-4">
                    <div class="p-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md mr-4"><i class="fas fa-tools text-xl"></i></div>
                    <h3 class="font-semibold text-xl text-gray-800 dark:text-white">Support Tools</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-5 flex-grow">Explore available tools for the Support team and their usage guides.</p>
                <div class="mt-auto"><a href="#" data-subcat-trigger="support.tools_guides" class="quick-link-button text-sm font-medium text-green-600 dark:text-green-400 hover:underline group">Explore Tools <i class="fas fa-arrow-right ml-1 text-xs opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all duration-200"></i></a></div>
            </div>
        </div>
        <div id="accessTrackingReportContainer" class="mt-8 card-animate bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg" style="animation-delay: 0.4s;">
            <!-- Access tracking will be loaded here by JS -->
        </div>
    `;


    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    function getThemeColors(themeColor = 'gray') {
        const color = typeof themeColor === 'string' ? themeColor.toLowerCase() : 'gray';
        const colorMap = {
            blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400', iconContainer: 'bg-blue-100 dark:bg-blue-800/50', icon: 'text-blue-500 dark:text-blue-400', cta: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300', border: 'border-blue-500', tagBg: 'bg-blue-100 dark:bg-blue-500/20', tagText: 'text-blue-700 dark:text-blue-300', statusBg: 'bg-blue-100 dark:bg-blue-500/20', statusText: 'text-blue-700 dark:text-blue-400', btn: 'bg-blue-500 hover:bg-blue-600' },
            teal: { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-600 dark:text-teal-400', iconContainer: 'bg-teal-100 dark:bg-teal-800/50', icon: 'text-teal-500 dark:text-teal-400', cta: 'text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300', border: 'border-teal-500', tagBg: 'bg-teal-100 dark:bg-teal-500/20', tagText: 'text-teal-700 dark:text-teal-300', statusBg: 'bg-teal-100 dark:bg-teal-500/20', statusText: 'text-teal-700 dark:text-teal-400', btn: 'bg-teal-500 hover:bg-teal-600' },
            green: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600 dark:text-green-400', iconContainer: 'bg-green-100 dark:bg-green-800/50', icon: 'text-green-500 dark:text-green-400', cta: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300', border: 'border-green-500', tagBg: 'bg-green-100 dark:bg-green-500/20', tagText: 'text-green-700 dark:text-green-300', statusBg: 'bg-green-100 dark:bg-green-500/20', statusText: 'text-green-700 dark:text-green-400', btn: 'bg-green-500 hover:bg-green-600' },
            indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600 dark:text-indigo-400', iconContainer: 'bg-indigo-100 dark:bg-indigo-800/50', icon: 'text-indigo-500 dark:text-indigo-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-indigo-500', tagBg: 'bg-indigo-100 dark:bg-indigo-500/20', tagText: 'text-indigo-700 dark:text-indigo-300', statusBg: 'bg-indigo-100 dark:bg-indigo-500/20', statusText: 'text-indigo-700 dark:text-indigo-400', btn: 'bg-indigo-500 hover:bg-indigo-600' },
            cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900', text: 'text-cyan-600 dark:text-cyan-400', iconContainer: 'bg-cyan-100 dark:bg-cyan-800/50', icon: 'text-cyan-500 dark:text-cyan-400', cta: 'text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300', border: 'border-cyan-500', tagBg: 'bg-cyan-100 dark:bg-cyan-500/20', tagText: 'text-cyan-700 dark:text-cyan-300', statusBg: 'bg-cyan-100 dark:bg-cyan-500/20', statusText: 'text-cyan-700 dark:text-cyan-400', btn: 'bg-cyan-500 hover:bg-cyan-600' },
            lime: { bg: 'bg-lime-100 dark:bg-lime-900', text: 'text-lime-600 dark:text-lime-400', iconContainer: 'bg-lime-100 dark:bg-lime-800/50', icon: 'text-lime-500 dark:text-lime-400', cta: 'text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300', border: 'border-lime-500', tagBg: 'bg-lime-100 dark:bg-lime-500/20', tagText: 'text-lime-700 dark:text-lime-300', statusBg: 'bg-lime-100 dark:bg-lime-500/20', statusText: 'text-lime-700 dark:text-lime-400', btn: 'bg-lime-500 hover:bg-lime-600' },
            yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600 dark:text-yellow-400', iconContainer: 'bg-yellow-100 dark:bg-yellow-800/50', icon: 'text-yellow-500 dark:text-yellow-400', cta: 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300', border: 'border-yellow-500', tagBg: 'bg-yellow-100 dark:bg-yellow-500/20', tagText: 'text-yellow-700 dark:text-yellow-300', statusBg: 'bg-yellow-100 dark:bg-yellow-500/20', statusText: 'text-yellow-700 dark:text-yellow-400', btn: 'bg-yellow-500 hover:bg-yellow-600' },
            pink: { bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-600 dark:text-pink-400', iconContainer: 'bg-pink-100 dark:bg-pink-800/50', icon: 'text-pink-500 dark:text-pink-400', cta: 'text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300', border: 'border-pink-500', tagBg: 'bg-pink-100 dark:bg-pink-500/20', tagText: 'text-pink-700 dark:text-pink-300', statusBg: 'bg-pink-100 dark:bg-pink-500/20', statusText: 'text-pink-700 dark:text-pink-400', btn: 'bg-pink-500 hover:bg-pink-600' },
            red: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-600 dark:text-red-400', iconContainer: 'bg-red-100 dark:bg-red-800/50', icon: 'text-red-500 dark:text-red-400', cta: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300', border: 'border-red-500', tagBg: 'bg-red-100 dark:bg-red-500/20', tagText: 'text-red-700 dark:text-red-300', statusBg: 'bg-red-100 dark:bg-red-500/20', statusText: 'text-red-700 dark:text-red-400', btn: 'bg-red-500 hover:bg-red-600' },
            sky: { bg: 'bg-sky-100 dark:bg-sky-900', text: 'text-sky-600 dark:text-sky-400', iconContainer: 'bg-sky-100 dark:bg-sky-800/50', icon: 'text-sky-500 dark:text-sky-400', cta: 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300', border: 'border-sky-500', tagBg: 'bg-sky-100 dark:bg-sky-500/20', tagText: 'text-sky-700 dark:text-sky-300', statusBg: 'bg-sky-100 dark:bg-sky-500/20', statusText: 'text-sky-700 dark:text-sky-400', btn: 'bg-sky-500 hover:bg-sky-600' },
            amber: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-600 dark:text-amber-400', iconContainer: 'bg-amber-100 dark:bg-amber-800/50', icon: 'text-amber-500 dark:text-amber-400', cta: 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300', border: 'border-amber-500', tagBg: 'bg-amber-100 dark:bg-amber-500/20', tagText: 'text-amber-700 dark:text-amber-300', statusBg: 'bg-amber-100 dark:bg-amber-500/20', statusText: 'text-amber-700 dark:text-amber-400', btn: 'bg-amber-500 hover:bg-amber-600' },
            purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-600 dark:text-purple-400', iconContainer: 'bg-purple-100 dark:bg-purple-800/50', icon: 'text-purple-500 dark:text-purple-400', cta: 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300', border: 'border-purple-500', tagBg: 'bg-purple-100 dark:bg-purple-500/20', tagText: 'text-purple-700 dark:text-purple-300', statusBg: 'bg-purple-100 dark:bg-purple-500/20', statusText: 'text-purple-700 dark:text-purple-400', btn: 'bg-purple-500 hover:bg-purple-600' },
            slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', iconContainer: 'bg-slate-100 dark:bg-slate-700/50', icon: 'text-slate-500 dark:text-slate-400', cta: 'text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300', border: 'border-slate-500', tagBg: 'bg-slate-200 dark:bg-slate-700', tagText: 'text-slate-700 dark:text-slate-300', statusBg: 'bg-slate-200 dark:bg-slate-600', statusText: 'text-slate-700 dark:text-slate-300', btn: 'bg-slate-500 hover:bg-slate-600' },
            gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', iconContainer: 'bg-gray-100 dark:bg-gray-700/50', icon: 'text-gray-500 dark:text-gray-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-gray-500', tagBg: 'bg-gray-200 dark:bg-gray-700', tagText: 'text-gray-700 dark:text-gray-300', statusBg: 'bg-gray-200 dark:bg-gray-600', statusText: 'text-gray-700 dark:text-gray-300', btn: 'bg-gray-500 hover:bg-gray-600' }
        };
        return colorMap[color] || colorMap.gray;
    }

    // --- Card Rendering Functions (Enhanced) ---
    function renderArticleCard_enhanced(article, sectionData, query = null) {
        const theme = getThemeColors(sectionData.themeColor);
        const cardIconClass = sectionData.icon || 'fas fa-file-alt';
        return `
            <div class="card bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${article.id}" data-item-type="article">
                <div class="flex items-start mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${cardIconClass} text-xl ${theme.icon}"></i>
                    </div>
                    <div class="flex-grow">
                        <h3 class="font-semibold text-base md:text-lg text-gray-800 dark:text-white leading-tight">${highlightText(article.title, query)}</h3>
                    </div>
                    <div class="flex-shrink-0 space-x-2">
                         <button onclick="showItemDetailsModal('${sectionData.id}', '${article.id}', 'article')" class="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300 p-1" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="showAddEditArticleModal('${sectionData.id}', '${article.id}')" class="text-gray-400 hover:text-green-500 dark:hover:text-green-400 p-1" title="Edit Article">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${highlightText(article.summary, query) || 'No summary.'}</p>
                ${article.tags && article.tags.length > 0 ? `<div class="mb-4 text-xs">${article.tags.map(tag => `<span class="${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div class="rating-container text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <span class="mr-1">Helpful?</span>
                        <button class="rating-btn p-1 hover:opacity-75" data-item-id="${article.id}" data-item-type="article" data-rating="up" title="Helpful"><i class="fas fa-thumbs-up text-green-500"></i></button>
                        <button class="rating-btn p-1 hover:opacity-75" data-item-id="${article.id}" data-item-type="article" data-rating="down" title="Not helpful"><i class="fas fa-thumbs-down text-red-500"></i></button>
                    </div>
                    <button onclick="showItemDetailsModal('${sectionData.id}', '${article.id}', 'article')" class="text-sm font-medium ${theme.cta} group">
                        Read More <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i>
                    </button>
                </div>
            </div>`;
    }

    function renderItemCard_enhanced(item, sectionData, query = null) { // For Forms/Templates
        const theme = getThemeColors(sectionData.themeColor);
        let itemIconClass = sectionData.icon || 'fas fa-file-alt';
        if (sectionData.id === 'forms_templates') {
            if (item.type === 'checklist') itemIconClass = 'fas fa-tasks';
            else if (item.type === 'form') itemIconClass = 'fab fa-wpforms';
            else if (item.type === 'template') itemIconClass = 'fas fa-puzzle-piece';
        }
        return `
            <div class="card bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${item.id}" data-item-type="item">
                 <div class="flex items-start mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${itemIconClass} text-xl ${theme.icon}"></i>
                    </div>
                     <div class="flex-grow">
                        <h3 class="font-semibold text-base md:text-lg text-gray-800 dark:text-white leading-tight">${highlightText(item.title, query)}</h3>
                    </div>
                    <!-- Edit button for forms/templates can be added here if needed -->
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${highlightText(item.description, query) || 'No description.'}</p>
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs ${theme.tagBg} ${theme.tagText} px-3 py-1 rounded-full uppercase font-semibold tracking-wide">${escapeHTML(item.type)}</span>
                    <a href="${escapeHTML(item.url)}" target="_blank" class="text-sm font-medium ${theme.cta} group">
                        Open <i class="fas fa-external-link-alt ml-1 text-xs opacity-75 group-hover:scale-110 transition-transform duration-200"></i>
                    </a>
                </div>
            </div>`;
    }

    function renderCaseCard_enhanced(caseItem, sectionData, query = null) {
        const theme = getThemeColors(sectionData.themeColor);
        const caseIcon = 'fas fa-briefcase';
        return `
            <div class="card bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${caseItem.id}" data-item-type="case">
                <div class="flex items-start mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${caseIcon} text-xl ${theme.icon}"></i>
                    </div>
                    <div class="flex-grow">
                        <h3 class="font-semibold text-base md:text-lg text-gray-800 dark:text-white leading-tight">${highlightText(caseItem.title, query)}</h3>
                    </div>
                    <div class="flex-shrink-0 space-x-2">
                         <button onclick="showItemDetailsModal('${sectionData.id}', '${caseItem.id}', 'case')" class="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300 p-1" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="showAddEditCaseModal('${sectionData.id}', '${caseItem.id}')" class="text-gray-400 hover:text-green-500 dark:hover:text-green-400 p-1" title="Edit Case">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 flex-grow">${highlightText(caseItem.summary, query) || 'No summary.'}</p>
                ${caseItem.resolutionSteps ? `<p class="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">Steps: ${escapeHTML(truncateText(caseItem.resolutionSteps, 80))}</p>` : ''}
                ${caseItem.tags && caseItem.tags.length > 0 ? `<div class="mb-3 text-xs">${caseItem.tags.map(tag => `<span class="${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full ${theme.statusBg} ${theme.statusText} capitalize">${highlightText(caseItem.status, query)}</span>
                    <button onclick="showItemDetailsModal('${sectionData.id}', '${caseItem.id}', 'case')" class="text-sm font-medium ${theme.cta} group">
                        Details <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i>
                    </button>
                </div>
            </div>`;
    }

    // --- Display Content for Sections (MODIFIED) ---
    function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        if (!pageContent) { console.error('[app.js] pageContent is NULL.'); return; }
        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            pageContent.innerHTML = '<p>Knowledge base data is not available.</p>';
            return;
        }

        if (sectionId === 'home' || !sectionId) { // Default to home
            pageContent.innerHTML = initialPageContentStructure;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Welcome';
             if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            const welcomeUserEl = pageContent.querySelector('#welcomeUserName');
            if (currentUser && welcomeUserEl) {
                 welcomeUserEl.textContent = `Welcome, ${currentUser.fullName || currentUser.email}!`;
            }
            // Update version/date on home page dynamically if elements exist in initialPageContentStructure
            const kbVersionHomeEl = pageContent.querySelector('#kbVersionDisplayHome');
            const lastUpdateHomeEl = pageContent.querySelector('#lastKbUpdateDisplayHome');
            if (kbSystemData.meta) {
                if(kbVersionHomeEl) kbVersionHomeEl.textContent = kbSystemData.meta.version;
                if(lastUpdateHomeEl) lastUpdateHomeEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }

            const accessTrackingContainer = pageContent.querySelector('#accessTrackingReportContainer');
            if (accessTrackingContainer) renderAccessTrackingReport(accessTrackingContainer);

            // Re-apply animations for home cards
            pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
                card.style.opacity = 0; card.style.transform = 'translateY(20px)'; card.style.animation = 'none';
                card.offsetHeight; // Trigger reflow
                card.style.animation = `fadeInUp 0.5s ease-out forwards ${(index + 1) * 0.07}s`;
            });
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center card-animate"><h2 class="text-2xl font-semibold text-red-500">Section Not Found</h2><p>The section "${escapeHTML(sectionId)}" does not exist.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Not Found';
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);
        let contentHTML = `<div class="space-y-8">`;

        // Section Header & Action Buttons
        contentHTML += `
            <div class="card-animate">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center mb-2 sm:mb-0">
                        <span class="p-2.5 rounded-lg ${theme.iconContainer} mr-3 sm:mr-4 inline-flex">
                            <i class="${sectionData.icon || 'fas fa-folder'} text-xl md:text-2xl ${theme.icon}"></i>
                        </span>
                        ${escapeHTML(sectionData.name)}
                    </h2>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-base md:text-lg mb-6">${escapeHTML(sectionData.description)}</p>
                 <div class="flex flex-wrap gap-3">
                    <button onclick="showAddEditArticleModal('${sectionData.id}')" class="px-3 py-2 text-sm ${getThemeColors('sky').btn} text-white rounded-md shadow-sm flex items-center transition-colors">
                        <i class="fas fa-plus-circle mr-2"></i> Add Article
                    </button>
                    <button onclick="showAddEditCaseModal('${sectionData.id}')" class="px-3 py-2 text-sm ${theme.btn} text-white rounded-md shadow-sm flex items-center transition-colors">
                        <i class="fas fa-plus-circle mr-2"></i> Add Case
                    </button>
                    <button onclick="showAddEditSubsectionModal('${sectionData.id}')" class="px-3 py-2 text-sm ${getThemeColors('green').btn} text-white rounded-md shadow-sm flex items-center transition-colors">
                        <i class="fas fa-folder-plus mr-2"></i> Add Subsection
                    </button>
                </div>
            </div>`;

        // Section-specific Search
        contentHTML += `
            <div class="my-6 p-4 bg-white dark:bg-gray-800/70 rounded-lg shadow-md card-animate" style="animation-delay: 0.1s;">
                <label for="sectionSearchInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search in ${escapeHTML(sectionData.name)}:
                </label>
                <div class="flex">
                    <input type="text" id="sectionSearchInput" data-section-id="${sectionData.id}"
                           class="flex-grow p-2.5 border border-gray-300 dark:border-gray-600 rounded-l-md dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="E.g., 'high priority', 'zendesk'">
                    <button id="sectionSearchBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md flex items-center transition-colors">
                        <i class="fas fa-search mr-0 sm:mr-2"></i><span class="hidden sm:inline">Search</span>
                    </button>
                </div>
                <div id="sectionSearchResults" class="mt-4 max-h-80 overflow-y-auto space-y-2"></div>
            </div>`;

        let hasContent = false;
        let animationDelayIndex = 1;

        // Articles
        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-xl md:text-2xl font-semibold mt-8 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">`;
            animationDelayIndex++;
            sectionData.articles.forEach(article => { contentHTML += renderArticleCard_enhanced(article, sectionData); });
            contentHTML += `</div>`; hasContent = true;
        }

        // Cases
        if (sectionData.cases && sectionData.cases.length > 0) {
            contentHTML += `<h3 class="text-xl md:text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">`;
            animationDelayIndex++;
            sectionData.cases.forEach(caseItem => { contentHTML += renderCaseCard_enhanced(caseItem, sectionData); });
            contentHTML += `</div>`; hasContent = true;
        }

        // Items (Forms/Templates)
        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-xl md:text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">`;
            animationDelayIndex++;
            sectionData.items.forEach(item => { contentHTML += renderItemCard_enhanced(item, sectionData); });
            contentHTML += `</div>`; hasContent = true;
        }

        // Sub-Categories
        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-xl md:text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories</h3><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">`;
            animationDelayIndex++;
            sectionData.subCategories.forEach(subCat => {
                let subCatIcon = 'fas fa-folder-open';
                if (subCat.id.includes('case')) subCatIcon = 'fas fa-briefcase';
                if (subCat.id.includes('tool')) subCatIcon = 'fas fa-tools';
                contentHTML += `
                    <div class="relative bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group border-l-4 ${theme.border} text-center flex flex-col items-center justify-center transform hover:-translate-y-1 card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;">
                        <a href="#" data-section-trigger="${sectionData.id}" data-subcat-filter="${subCat.id}" class="sub-category-link flex flex-col items-center justify-center w-full h-full">
                            <i class="${subCatIcon} text-2xl md:text-3xl mb-3 ${theme.icon} group-hover:scale-110 transition-transform"></i>
                            <h4 class="font-medium text-gray-700 dark:text-gray-200 group-hover:${theme.text}">${escapeHTML(subCat.name)}</h4>
                            ${subCat.description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${escapeHTML(truncateText(subCat.description, 50))}</p>` : ''}
                        </a>
                        <button onclick="showAddEditSubsectionModal('${sectionData.id}', '${subCat.id}')" class="absolute top-2 right-2 text-xs text-gray-400 hover:text-green-500 dark:hover:text-green-400 p-1.5 bg-white/70 dark:bg-gray-700/70 rounded-full shadow-sm" title="Edit Subsection">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>`;
            });
            contentHTML += `</div>`;
        }

        // Glossary
        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<h3 class="text-xl md:text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-book mr-3 ${theme.text}"></i> Glossary</h3><div class="space-y-4">`;
            animationDelayIndex++;
            sectionData.glossary.forEach(entry => {
                contentHTML += `
                    <div class="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-lg shadow card-animate border-l-4 ${theme.border}" style="animation-delay: ${animationDelayIndex * 0.05}s;">
                        <strong class="${theme.text}">${escapeHTML(entry.term)}:</strong>
                        <span class="text-gray-700 dark:text-gray-300">${escapeHTML(entry.definition)}</span>
                    </div>`;
            });
            contentHTML += `</div>`; hasContent = true;
        }

        if (!hasContent && !(sectionData.subCategories && sectionData.subCategories.length > 0) && !(sectionData.glossary && sectionData.glossary.length > 0)) {
            contentHTML += `<div class="p-10 text-center bg-white dark:bg-gray-800 rounded-lg shadow-md card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-info-circle text-4xl ${theme.icon} mb-4"></i><h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200">No content yet</h3><p class="text-gray-500 dark:text-gray-400">Content for "${escapeHTML(sectionData.name)}" is being prepared.</p></div>`;
        }
        contentHTML += `</div>`; // Close outer space-y-8

        pageContent.innerHTML = contentHTML;
        pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
            card.style.opacity = 0; card.style.transform = 'translateY(20px)'; card.style.animation = 'none';
            card.offsetHeight;
            const delay = card.style.animationDelay || `${index * 0.07}s`;
            card.style.animation = `fadeInUp 0.5s ease-out forwards ${delay}`;
        });

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            let bcHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">&gt;</span> <span class="${theme.text} font-medium">${escapeHTML(sectionData.name)}</span>`;
            if (subCategoryFilter) {
                const subCatData = sectionData.subCategories?.find(sc => sc.id === subCategoryFilter);
                if (subCatData) {
                     bcHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">&gt;</span> <a href="#" data-section-trigger="${sectionData.id}" class="hover:underline ${theme.text}">${escapeHTML(sectionData.name)}</a> <span class="mx-1 text-gray-400 dark:text-gray-500">&gt;</span> <span class="${theme.text} font-medium">${escapeHTML(subCatData.name)}</span>`;
                }
            }
            breadcrumbsContainer.innerHTML = bcHTML;
            breadcrumbsContainer.classList.remove('hidden');
            breadcrumbsContainer.querySelectorAll('a[data-section-trigger]').forEach(link => {
                link.addEventListener('click', (e) => { e.preventDefault(); handleSectionTrigger(e.currentTarget.dataset.sectionTrigger); });
            });
        }

        if (itemIdToFocus) {
            setTimeout(() => {
                const targetCard = pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item');
                    setTimeout(() => targetCard.classList.remove('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item'), 3500);
                }
            }, 250);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }


    // --- Modal for Item Details ---
    window.showItemDetailsModal = function(sectionId, itemId, itemType) {
        const section = kbSystemData.sections.find(s => s.id === sectionId);
        if (!section) return;
        let item;
        let modalContent = '';
        let title = 'Item Details';

        if (itemType === 'article' && section.articles) {
            item = section.articles.find(a => a.id === itemId);
            if (item) {
                title = item.title;
                const fullContent = item.details || item.summary || 'No detailed content available.';
                modalContent = `
                    <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">${highlightText(fullContent, null)}</p>
                    ${item.tags ? `<div class="mt-4"><strong>Tags:</strong> ${item.tags.map(t => `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full mr-1">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Last Updated: ${item.lastUpdated}</p>
                `;
                logAccess(userNameForLog, item.title, section.name, 'Article');
            }
        } else if (itemType === 'case' && section.cases) {
            item = section.cases.find(c => c.id === itemId);
            if (item) {
                title = item.title;
                const fullContent = item.summary || 'No summary.'; // Cases might not have separate 'details'
                const resolutionSteps = item.resolutionSteps || 'No resolution steps provided.';
                modalContent = `
                    <p class="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap leading-relaxed">${highlightText(fullContent, null)}</p>
                    <h4 class="font-semibold text-gray-700 dark:text-gray-200 mt-4 mb-1">Resolution Steps:</h4>
                    <p class="text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-3 leading-relaxed">${highlightText(resolutionSteps, null)}</p>
                    <p class="mb-1"><strong>Status:</strong> <span class="font-medium ${getThemeColors(section.themeColor).statusText}">${escapeHTML(item.status)}</span></p>
                    <p><strong>Assigned To:</strong> ${escapeHTML(item.assignedTo || 'N/A')}</p>
                    ${item.tags ? `<div class="mt-3"><strong>Tags:</strong> ${item.tags.map(t => `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full mr-1">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Last Updated: ${item.lastUpdated}</p>
                `;
                 logAccess(userNameForLog, item.title, section.name, 'Case');
            }
        }

        if (item) {
            const footer = `<button onclick="closeModal()" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition">Close</button>`;
            openModal(title, modalContent, footer);
        } else {
            openModal('Error', '<p>Could not load item details.</p>');
        }
    }

    // --- Modals for Adding/Editing Articles, Cases, Subsections ---
    window.showAddEditArticleModal = function(sectionId, articleIdToEdit = null) {
        const section = kbSystemData.sections.find(s => s.id === sectionId);
        if (!section) { alert('Section not found!'); return; }

        let currentArticle = null;
        let modalTitle = 'Add New Article';
        if (articleIdToEdit) {
            currentArticle = section.articles?.find(a => a.id === articleIdToEdit);
            if (currentArticle) modalTitle = 'Edit Article: ' + currentArticle.title;
            else { console.error("Article to edit not found"); return; }
        }

        const formId = 'articleForm';
        let bodyHtml = `
            <form id="${formId}" data-section-id="${sectionId}" ${articleIdToEdit ? `data-article-id="${articleIdToEdit}"` : ''} class="space-y-4">
                <div>
                    <label for="articleTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input type="text" id="articleTitle" name="articleTitle" required class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700" value="${currentArticle ? escapeHTML(currentArticle.title) : ''}">
                </div>
                <div>
                    <label for="articleSummary" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Summary</label>
                    <textarea id="articleSummary" name="articleSummary" rows="3" required class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700">${currentArticle ? escapeHTML(currentArticle.summary) : ''}</textarea>
                </div>
                <div>
                    <label for="articleDetails" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Details</label>
                    <textarea id="articleDetails" name="articleDetails" rows="6" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700">${currentArticle ? escapeHTML(currentArticle.details || '') : ''}</textarea>
                </div>
                <div>
                    <label for="articleTags" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
                    <input type="text" id="articleTags" name="articleTags" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700" value="${currentArticle && currentArticle.tags ? escapeHTML(currentArticle.tags.join(', ')) : ''}">
                </div>
            </form>
        `;
        const footerHtml = `
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition mr-2">Cancel</button>
            <button type="submit" form="${formId}" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition">Save Article</button>
        `;
        openModal(modalTitle, bodyHtml, footerHtml);
        const formElement = document.getElementById(formId);
        if (formElement) formElement.onsubmit = handleSaveArticle;
    }

    function handleSaveArticle(event) {
        event.preventDefault();
        const form = event.target;
        const sectionId = form.dataset.sectionId;
        const articleIdToEdit = form.dataset.articleId;
        const section = kbSystemData.sections.find(s => s.id === sectionId);
        if (!section) { alert('Error: Section not found.'); return; }
        if (!section.articles) section.articles = [];

        const articleData = {
            title: form.articleTitle.value.trim(),
            summary: form.articleSummary.value.trim(),
            details: form.articleDetails.value.trim(),
            tags: form.articleTags.value.split(',').map(t => t.trim()).filter(t => t),
            lastUpdated: new Date().toISOString().split('T')[0],
        };
        if (!articleData.title || !articleData.summary) { alert('Title and Summary are required.'); return; }

        if (articleIdToEdit) {
            const articleIndex = section.articles.findIndex(a => a.id === articleIdToEdit);
            if (articleIndex > -1) section.articles[articleIndex] = { ...section.articles[articleIndex], ...articleData };
            else { alert('Error: Article to edit not found.'); return; }
        } else {
            articleData.id = generateUniqueId('article');
            section.articles.push(articleData);
        }
        closeModal();
        displaySectionContent(sectionId, null, currentSubCategoryFilter); // Refresh view, maintaining subcategory filter if active
    }


    window.showAddEditCaseModal = function(sectionId, caseIdToEdit = null) {
        const section = kbSystemData.sections.find(s => s.id === sectionId);
        if (!section) { alert('Section not found!'); return; }

        let currentCase = null;
        let modalTitle = 'Add New Case';
        if (caseIdToEdit) {
            currentCase = section.cases?.find(c => c.id === caseIdToEdit);
            if (currentCase) modalTitle = 'Edit Case: ' + currentCase.title;
            else { console.error("Case to edit not found"); return; }
        }

        const formId = 'caseForm';
        let bodyHtml = `
            <form id="${formId}" data-section-id="${sectionId}" ${caseIdToEdit ? `data-case-id="${caseIdToEdit}"` : ''} class="space-y-4">
                <div>
                    <label for="caseTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input type="text" id="caseTitle" name="caseTitle" required class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700" value="${currentCase ? escapeHTML(currentCase.title) : ''}">
                </div>
                <div>
                    <label for="caseSummary" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Summary/Description</label>
                    <textarea id="caseSummary" name="caseSummary" rows="3" required class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700">${currentCase ? escapeHTML(currentCase.summary) : ''}</textarea>
                </div>
                <div>
                    <label for="caseSteps" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Resolution Steps</label>
                    <textarea id="caseSteps" name="caseSteps" rows="4" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700">${currentCase ? escapeHTML(currentCase.resolutionSteps || '') : ''}</textarea>
                </div>
                <div>
                    <label for="caseStatus" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select id="caseStatus" name="caseStatus" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        ${caseStatusOptions.map(opt => `<option value="${opt}" ${currentCase && currentCase.status === opt ? 'selected' : ''}>${escapeHTML(opt)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label for="caseTags" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
                    <input type="text" id="caseTags" name="caseTags" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700" value="${currentCase && currentCase.tags ? escapeHTML(currentCase.tags.join(', ')) : ''}">
                </div>
                <div>
                    <label for="caseAssignedTo" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned To</label>
                    <input type="text" id="caseAssignedTo" name="caseAssignedTo" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700" value="${currentCase ? escapeHTML(currentCase.assignedTo || '') : ''}">
                </div>
            </form>
        `;
        const footerHtml = `
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition mr-2">Cancel</button>
            <button type="submit" form="${formId}" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition">Save Case</button>
        `;
        openModal(modalTitle, bodyHtml, footerHtml);
        const formElement = document.getElementById(formId);
        if (formElement) formElement.onsubmit = handleSaveCase;
    }

    function handleSaveCase(event) {
        event.preventDefault();
        const form = event.target;
        const sectionId = form.dataset.sectionId;
        const caseIdToEdit = form.dataset.caseId;
        const section = kbSystemData.sections.find(s => s.id === sectionId);
        if (!section) { alert('Error: Section not found.'); return; }
        if (!section.cases) section.cases = [];

        const caseData = {
            title: form.caseTitle.value.trim(),
            summary: form.caseSummary.value.trim(),
            resolutionSteps: form.caseSteps.value.trim(),
            status: form.caseStatus.value,
            tags: form.caseTags.value.split(',').map(t => t.trim()).filter(t => t),
            assignedTo: form.caseAssignedTo.value.trim(),
            lastUpdated: new Date().toISOString().split('T')[0],
            type: 'case'
        };
        if (!caseData.title || !caseData.summary) { alert('Title and Summary are required.'); return; }

        if (caseIdToEdit) {
            const caseIndex = section.cases.findIndex(c => c.id === caseIdToEdit);
            if (caseIndex > -1) section.cases[caseIndex] = { ...section.cases[caseIndex], ...caseData };
            else { alert('Error: Case to edit not found.'); return; }
        } else {
            caseData.id = generateUniqueId('case');
            section.cases.push(caseData);
        }
        closeModal();
        displaySectionContent(sectionId, null, currentSubCategoryFilter);
    }

    window.showAddEditSubsectionModal = function(sectionId, subIdToEdit = null) {
        const section = kbSystemData.sections.find(s => s.id === sectionId);
        if (!section) { alert('Section not found!'); return; }

        let currentSub = null;
        let modalTitle = 'Add New Subsection';
        if (subIdToEdit) {
            currentSub = section.subCategories?.find(sc => sc.id === subIdToEdit);
            if (currentSub) modalTitle = 'Edit Subsection: ' + currentSub.name;
            else { console.error("Subsection to edit not found"); return; }
        }

        const formId = 'subsectionForm';
        let bodyHtml = `
            <form id="${formId}" data-section-id="${sectionId}" ${subIdToEdit ? `data-sub-id="${subIdToEdit}"` : ''} class="space-y-4">
                <div>
                    <label for="subName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input type="text" id="subName" name="subName" required class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700" value="${currentSub ? escapeHTML(currentSub.name) : ''}">
                </div>
                <div>
                    <label for="subDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea id="subDescription" name="subDescription" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700">${currentSub ? escapeHTML(currentSub.description || '') : ''}</textarea>
                </div>
            </form>
        `;
        const footerHtml = `
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition mr-2">Cancel</button>
            <button type="submit" form="${formId}" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition">Save Subsection</button>
        `;
        openModal(modalTitle, bodyHtml, footerHtml);
        const formElement = document.getElementById(formId);
        if (formElement) formElement.onsubmit = handleSaveSubsection;
    }

    function handleSaveSubsection(event) {
        event.preventDefault();
        const form = event.target;
        const sectionId = form.dataset.sectionId;
        const subIdToEdit = form.dataset.subId;
        const section = kbSystemData.sections.find(s => s.id === sectionId);
        if (!section) { alert('Error: Section not found.'); return; }
        if (!section.subCategories) section.subCategories = [];

        const subData = {
            name: form.subName.value.trim(),
            description: form.subDescription.value.trim()
        };
        if (!subData.name) { alert('Name is required for a subsection.'); return; }

        if (subIdToEdit) {
            const subIndex = section.subCategories.findIndex(sc => sc.id === subIdToEdit);
            if (subIndex > -1) section.subCategories[subIndex] = { ...section.subCategories[subIndex], ...subData };
            else { alert('Error: Subsection to edit not found.'); return; }
        } else {
            subData.id = generateUniqueId(subData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, ''));
            section.subCategories.push(subData);
        }
        closeModal();
        displaySectionContent(sectionId, null, currentSubCategoryFilter);
    }

    // --- Access Tracking Report ---
    function renderAccessTrackingReport(container) {
        if (!container) return;
        let reportHTML = '<h3 class="text-xl md:text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Access Tracking</h3>';
        if (accessHistory.length === 0) {
            reportHTML += '<p class="text-gray-500 dark:text-gray-400">No access recorded yet.</p>';
        } else {
            reportHTML += `
                <div class="overflow-x-auto shadow-md rounded-lg">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item/Topic</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Section</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">`;
            [...accessHistory].reverse().slice(0, 20).forEach(entry => { // Show last 20 entries
                reportHTML += `
                    <tr>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${escapeHTML(entry.user)}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${escapeHTML(entry.item)}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${escapeHTML(entry.section)}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${escapeHTML(entry.type)}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${new Date(entry.timestamp).toLocaleString()}</td>
                    </tr>`;
            });
            reportHTML += '</tbody></table></div>';
            if (accessHistory.length > 20) {
                reportHTML += '<p class="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">Showing last 20 entries.</p>';
            }
        }
        container.innerHTML = reportHTML;
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    // --- Navigation Handling ---
    let currentSubCategoryFilter = null; // Keep track of active subcategory filter

    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        if (typeof kbSystemData === 'undefined') {
            if(pageContent) pageContent.innerHTML = "<p>Error: Knowledge base data is missing.</p>";
            return;
        }
        highlightSidebarLink(sectionId);
        currentSubCategoryFilter = subCategoryFilter; // Update global subcategory filter
        displaySectionContent(sectionId, itemId, subCategoryFilter);

        // Log access if navigating to a subsection view directly
        if (subCategoryFilter && !itemId) {
            const section = kbSystemData.sections.find(s => s.id === sectionId);
            const subCat = section?.subCategories?.find(sc => sc.id === subCategoryFilter);
            if (section && subCat) {
                logAccess(userNameForLog, subCat.name, section.name, 'Subsection');
            }
        }

        let hash = sectionId;
        if (subCategoryFilter) hash += `/${subCategoryFilter}`;
        if (itemId) { // If itemID is present, it's the most specific part of the hash
             if (subCategoryFilter && !itemId.startsWith(subCategoryFilter)) {
                hash = `${sectionId}/${itemId}`;
             } else if (!subCategoryFilter) {
                hash = `${sectionId}/${itemId}`;
             }
        }
        if (window.location.hash !== `#${hash}`) {
            window.history.pushState({ sectionId, itemId, subCategoryFilter }, sectionId, `#${hash}`);
        }
        if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function parseHash() {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return { sectionId: 'home', itemId: null, subCategoryFilter: null };
        const parts = hash.split('/');
        const sectionId = parts[0];
        let itemId = null;
        let subCategoryFilter = null;

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
                    if (parts.length > 2) itemId = parts[2]; // Item within subcategory
                } else if (isArticle || isCase || isItem) {
                    itemId = potentialId;
                } else {
                    itemId = potentialId; // Fallback if not a known type or subcategory
                }
            } else {
                itemId = potentialId;
            }
        }
        return { sectionId, itemId, subCategoryFilter };
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            if (sectionId) handleSectionTrigger(sectionId, null, null);
        });
    });

    document.body.addEventListener('click', function(e) {
        const triggerLink = e.target.closest('[data-section-trigger], [data-subcat-trigger]');
        if (triggerLink) {
            e.preventDefault();
            const sectionId = triggerLink.dataset.sectionTrigger;
            const itemId = triggerLink.dataset.itemId;
            const subcatFilterFromSectionTrigger = triggerLink.dataset.subcatFilter;
            const subcatTriggerValue = triggerLink.dataset.subcatTrigger;

            if (sectionId) {
                handleSectionTrigger(sectionId, itemId, subcatFilterFromSectionTrigger);
            } else if (subcatTriggerValue) {
                if (subcatTriggerValue.includes('.')) {
                    const [sId, subId] = subcatTriggerValue.split('.');
                    handleSectionTrigger(sId, null, subId);
                     if (sId === 'support' && subId === 'tools_guides') { // Updated to tools_guides
                        setTimeout(() => {
                            const zendeskCard = Array.from(pageContent.querySelectorAll('.card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                            if (zendeskCard && zendeskCard.closest('.card')) {
                                zendeskCard.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 300);
                    }
                }
            }
            if (triggerLink.closest('#searchResultsContainer')) {
                if (searchResultsContainer) searchResultsContainer.classList.add('hidden');
                if (globalSearchInput) globalSearchInput.value = '';
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

    function renderGlobalSearchResults_enhanced(results, query) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<div class="p-3 text-sm text-gray-500 dark:text-gray-300">No results for "${escapeHTML(query)}".</div>`;
            searchResultsContainer.classList.remove('hidden');
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-gray-200 dark:divide-gray-700';
        results.slice(0, 10).forEach(result => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `javascript:void(0);`;
            a.dataset.sectionTrigger = result.sectionId;
            if (result.type !== 'section_match' && result.type !== 'glossary_term') {
                 a.dataset.itemId = result.id;
            }
            a.className = 'block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors global-search-result-link';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-semibold text-gray-800 dark:text-white';
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 100), query) : '';

            const sectionDiv = document.createElement('div');
            const theme = getThemeColors(result.themeColor || 'gray');
            sectionDiv.className = `text-xs ${theme.text} mt-1 font-medium`;
            sectionDiv.textContent = `In: ${escapeHTML(result.sectionName || 'Unknown')}`;

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

    function renderSectionSearchResults(results, query, containerElement, sectionThemeColor) {
        if (!containerElement) return;
        containerElement.innerHTML = '';
        if (results.length === 0) {
            containerElement.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">No results in this section for "${escapeHTML(query)}".</p>`;
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'space-y-2';
        const theme = getThemeColors(sectionThemeColor);

        results.slice(0, 5).forEach(result => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `javascript:void(0);`;
            a.dataset.sectionTrigger = result.sectionId;
            if (result.type !== 'section_match' && result.type !== 'glossary_term') {
                a.dataset.itemId = result.id;
            }
            a.className = `block p-3 bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md shadow-sm border-l-4 ${theme.border} transition-all quick-link-button section-search-result-link`;

            const titleDiv = document.createElement('div');
            titleDiv.className = `font-semibold ${theme.text}`;
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 80), query) : 'Click to view.';

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
        if (ul.children.length === 0) {
             containerElement.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">No relevant results in this section for "${escapeHTML(query)}".</p>`;
        } else {
            containerElement.appendChild(ul);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    // Event delegation for section-specific search, ratings, etc. in pageContent
    if (pageContent) {
        pageContent.addEventListener('click', (e) => {
            const ratingTarget = e.target.closest('.rating-btn');
            if (ratingTarget) {
                e.preventDefault();
                const ratingContainer = ratingTarget.closest('.rating-container');
                if (ratingContainer) ratingContainer.innerHTML = `<span class="text-xs text-green-500 font-medium">Feedback sent!</span>`;
                return;
            }

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
                        const sectionSpecificResults = allResults.filter(r => r.sectionId === currentSectionId || r.type === 'glossary_term');
                        renderSectionSearchResults(sectionSpecificResults, query, resultsContainerEl, sectionData.themeColor || 'gray');
                    } else if (query.length <= 1) {
                        resultsContainerEl.innerHTML = `<p class="text-sm text-gray-500 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">Enter at least 2 characters.</p>`;
                    } else {
                         resultsContainerEl.innerHTML = `<p class="text-sm text-red-500 p-3 bg-red-50 dark:bg-red-700/30 rounded-md">Search error.</p>`;
                    }
                }
                return;
            }
        });
        pageContent.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.target.id === 'sectionSearchInput') {
                e.preventDefault();
                const searchButton = pageContent.querySelector('#sectionSearchBtn');
                if (searchButton) searchButton.click();
            }
        });
    }

    // Handle URL hash on page load and changes
    window.addEventListener('popstate', (event) => {
        const { sectionId, itemId, subCategoryFilter } = parseHash();
        if (event.state) {
             handleSectionTrigger(event.state.sectionId || 'home', event.state.itemId, event.state.subCategoryFilter);
        } else {
            handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);
        }
    });

    // Initial load
    const { sectionId: initialSectionId, itemId: initialItemId, subCategoryFilter: initialSubCategoryFilter } = parseHash();
    handleSectionTrigger(initialSectionId || 'home', initialItemId, initialSubCategoryFilter);

    console.log('[app.js - MODIFIED] All initializations complete.');
});
