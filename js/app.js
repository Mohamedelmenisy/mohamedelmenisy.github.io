import { supabase } from './supabase.js'; // Import Supabase client

// انتظر تحميل الـ DOM بالكامل
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js - DEBUG] DOMContentLoaded fired.');

    // --- العناصر الأساسية ---
    const pageContent = document.getElementById('pageContent');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const mainContent = document.querySelector('main');

    // فحص وجود العناصر الأساسية
    console.log('[app.js - CHECK] pageContent:', pageContent ? 'Found' : 'Not found');
    console.log('[app.js - CHECK] sidebarLinks:', sidebarLinks.length, 'links found');
    console.log('[app.js - CHECK] kbSystemData:', typeof kbSystemData !== 'undefined' ? 'Available' : 'Not available yet');

    if (!pageContent) {
        console.error('[app.js - CRITICAL] pageContent element (#pageContent) not found in DOM. Navigation will fail.');
        document.body.innerHTML += '<div class="p-6 text-center text-red-500">Error: Page content container (#pageContent) not found. Please check the HTML structure.</div>';
        return;
    }

    if (sidebarLinks.length === 0) {
        console.error('[app.js - CRITICAL] No sidebar links (.sidebar-link) found in DOM. Navigation will fail.');
        document.body.innerHTML += '<div class="p-6 text-center text-red-500">Error: Sidebar links (.sidebar-link) not found. Please check the HTML structure.</div>';
        return;
    }

    // --- Helper Functions ---
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
                Auth.logout();
                return;
            }
            console.log('[app.js - FIX] User is authenticated via Auth object.');
        } else {
            console.error('[app.js - FIX] CRITICAL: Authentication mechanism not found.');
        }
    }

    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    console.log('[app.js - FIX] Current user:', currentUser);

    // --- Supabase View Tracking Function ---
    async function trackUserView(sectionId, itemId, itemType) {
        if (!currentUser || !currentUser.email) {
            console.warn('[app.js - trackUserView] User or user email not found. Skipping view tracking.');
            return;
        }
        if (!supabase) {
            console.error('[app.js - trackUserView] Supabase client not available. Skipping view tracking.');
            return;
        }

        console.log(`[app.js - trackUserView] Tracking view for: User: ${currentUser.email}, Section: ${sectionId}, Item: ${itemId}, Type: ${itemType}`);

        try {
            const { data, error } = await supabase
                .from('views_log')
                .insert({
                    user_email: currentUser.email,
                    section_id: sectionId,
                    item_id: itemId,
                    item_type: itemType,
                    viewed_at: new Date().toISOString()
                });

            if (error) {
                console.error('[app.js - trackUserView] Error logging view to Supabase:', error.message);
            } else {
                console.log('[app.js - trackUserView] View logged successfully:', data);
            }
        } catch (e) {
            console.error('[app.js - trackUserView] Exception while logging view:', e);
        }
    }

    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');

    if (currentUser) {
        const userDisplayName = currentUser.fullName || currentUser.email || 'User';
        if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
        if (welcomeUserName) welcomeUserName.textContent = `Welcome, ${userDisplayName}!`;
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
        const isDark = htmlElement.classList.contains('dark');
        document.querySelectorAll('#searchResultsContainer mark, #sectionSearchResults mark').forEach(mark => {
            if (isDark) {
                mark.style.backgroundColor = '#78350f';
                mark.style.color = '#f3f4f6';
            } else {
                mark.style.backgroundColor = '#fde047';
                mark.style.color = '#1f2937';
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
    loadTheme();

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
            alert(`Issue reporting triggered for: ${sectionTitleText}\nURL: ${pageUrl}\n(This is a placeholder. Implement actual reporting.)`);
        });
    }

    // --- Sidebar Navigation & Content Loading ---
    const initialPageContent = pageContent.innerHTML || '<p>Error: Initial page content could not be loaded.</p>';

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            console.log(`[app.js - DEBUG] Highlighted sidebar link for section: "${sectionId}"`);
        } else {
            console.warn(`[app.js - DEBUG] No sidebar link found for section: "${sectionId}"`);
        }
    }

    function getThemeColors(themeColor = 'gray') {
        const color = typeof themeColor === 'string' ? themeColor.toLowerCase() : 'gray';
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
        const cardIconClass = sectionData.icon || 'fas fa-file-alt';
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${article.id}" data-item-type="article">
                <div class="flex items-start mb-3">
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
                    <a href="${escapeHTML(article.contentPath)}" target="_blank" 
                       class="text-sm font-medium ${theme.cta} group"
                       data-track-view="true"
                       data-track-section-id="${escapeHTML(sectionData.id)}"
                       data-track-item-id="${escapeHTML(article.id)}"
                       data-track-item-type="article">
                        Read More <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function renderItemCard_enhanced(item, sectionData, query = null) {
        const theme = getThemeColors(sectionData.themeColor);
        let itemIconClass = sectionData.icon || 'fas fa-file-alt';
        if (sectionData.id === 'forms_templates') {
            if (item.type === 'checklist') itemIconClass = 'fas fa-tasks';
            else if (item.type === 'form') itemIconClass = 'fab fa-wpforms';
            else if (item.type === 'template') itemIconClass = 'fas fa-puzzle-piece';
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
        const caseIcon = 'fas fa-briefcase';
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
                    ${caseItem.contentPath ? 
                        `<a href="${escapeHTML(caseItem.contentPath)}" target="_blank" 
                           class="text-sm font-medium ${theme.cta} group"
                           data-track-view="true"
                           data-track-section-id="${escapeHTML(sectionData.id)}"
                           data-track-item-id="${escapeHTML(caseItem.id)}"
                           data-track-item-type="case">
                            Details <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i>
                        </a>` 
                        : `<div class="w-16"></div>`}
                </div>
            </div>
        `;
    }

    function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        console.log(`[app.js - DEBUG] displaySectionContent CALLED for sectionId: "${sectionId}", item: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);

        if (!pageContent) {
            console.error('[app.js - CRITICAL] pageContent is NULL. Cannot display section.');
            document.body.innerHTML += '<div class="p-6 text-center text-red-500">Error: Page content container (#pageContent) not found during content display.</div>';
            return;
        }

        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js - CRITICAL] kbSystemData is UNDEFINED. Cannot display section.');
            pageContent.innerHTML = '<div class="p-6 text-center"><h2 class="text-xl font-semibold text-red-500 dark:text-red-400">Error</h2><p>Knowledge base data is not available. Please try again later or check if kbSystemData is loading correctly.</p></div>';
            return;
        }

        if (sectionId === 'home') {
            pageContent.innerHTML = initialPageContent;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Welcome';
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
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
            const initialCards = pageContent.querySelectorAll('.grid > .card-animate');
            initialCards.forEach((card, index) => {
                card.style.opacity = 0;
                card.style.transform = 'translateY(20px)';
                card.style.animation = 'none';
                card.offsetHeight;
                card.style.animation = `fadeInUp 0.5s ease-out forwards ${(index + 1) * 0.1}s`;
            });
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
            console.log('[app.js - DEBUG] Home page loaded.');
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
            console.warn(`[app.js - DEBUG] Section "${sectionId}" not found in kbSystemData.`);
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);

        let contentHTML = `<div class="space-y-10">`;

        contentHTML += `
            <div class="card-animate">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                    <h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center mb-2 sm:mb-0">
                        <span class="p-2.5 rounded-lg ${theme.iconContainer} mr-3 sm:mr-4 inline-flex">
                            <i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i>
                        </span>
                        ${escapeHTML(sectionData.name)}
                    </h2>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-lg">${escapeHTML(sectionData.description)}</p>
            </div>`;

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
        let animationDelayIndex = 1;

        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-8 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            animationDelayIndex++;
            sectionData.articles.forEach(article => {
                contentHTML += renderArticleCard_enhanced(article, sectionData);
            });
            contentHTML += `</div>`;
            hasContent = true;
        }

        if (sectionData.cases && sectionData.cases.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            animationDelayIndex++;
            sectionData.cases.forEach(caseItem => {
                contentHTML += renderCaseCard_enhanced(caseItem, sectionData);
            });
            contentHTML += `</div>`;
            hasContent = true;
        }

        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            animationDelayIndex++;
            sectionData.items.forEach(item => {
                contentHTML += renderItemCard_enhanced(item, sectionData);
            });
            contentHTML += `</div>`;
            hasContent = true;
        }

        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center card-animate" style="animation-delay: ${animationDelayIndex * 0.05}s;"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories</h3><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
            animationDelayIndex++;
            sectionData.subCategories.forEach(subCat => {
                let subCatIcon = 'fas fa-folder-open';
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
        }

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

        contentHTML += `</div>`;

        pageContent.innerHTML = contentHTML;
        console.log(`[app.js - DEBUG] Successfully set innerHTML for section "${sectionId}".`);

        pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
            card.style.opacity = 0;
            card.style.transform = 'translateY(20px)';
            card.style.animation = 'none';
            card.offsetHeight;
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

            breadcrumbsContainer.querySelectorAll('a[data-section-trigger]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetSectionId = e.currentTarget.dataset.sectionTrigger;
                    console.log('[app.js - DEBUG] Breadcrumb link clicked:', targetSectionId);
                    handleSectionTrigger(targetSectionId);
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
                    console.warn(`[app.js - DEBUG] Item "${itemIdToFocus}" not found in section "${sectionId}" DOM for focusing.`);
                }
            }, 250);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        console.log('[app.js - DEBUG] handleSectionTrigger called with:', { sectionId, itemId, subCategoryFilter });

        // تحديث الهاش أولاً
        let hash = sectionId;
        if (itemId) {
            hash = `${sectionId}/${itemId}`;
        } else if (subCategoryFilter) {
            hash = `${sectionId}/${subCategoryFilter}`;
        }
        try {
            window.history.pushState({ sectionId, itemId, subCategoryFilter }, '', `#${hash}`);
            console.log(`[app.js - DEBUG] URL hash updated to: #${hash}`);
        } catch (e) {
            console.error('[app.js - CRITICAL] Failed to update URL hash:', e);
            document.body.innerHTML += '<div class="p-6 text-center text-red-500">Error: Failed to update URL hash. Check browser compatibility or security restrictions.</div>';
        }

        // إضاءة الرابط في الشريط الجانبي
        highlightSidebarLink(sectionId);

        // تحميل المحتوى
        displaySectionContent(sectionId, itemId, subCategoryFilter);

        // التمرير لأعلى
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function parseHash() {
        const hash = window.location.hash.replace('#', '');
        console.log('[app.js - DEBUG] Parsing hash:', hash);
        if (!hash) return { sectionId: 'home', itemId: null, subCategoryFilter: null };

        const parts = hash.split('/');
        const sectionId = parts[0] || 'home';
        let itemId = null;
        let subCategoryFilter = null;

        if (parts.length > 1) {
            const potentialId = parts[1];
            const sectionData = kbSystemData?.sections?.find(s => s.id === sectionId);
            if (sectionData) {
                const isSubCategory = sectionData.subCategories?.some(sc => sc.id === potentialId);
                const isArticle = sectionData.articles?.some(a => a.id === potentialId);
                const isCase = sectionData.cases?.some(c => c.id === potentialId);
                const isItem = sectionData.items?.some(i => i.id === potentialId);

                console.log('[app.js - DEBUG] parseHash checks:', { isSubCategory, isArticle, isCase, isItem });

                if (isSubCategory) {
                    subCategoryFilter = potentialId;
                    if (parts.length > 2) {
                        itemId = parts[2];
                    }
                } else if (isArticle || isCase || isItem) {
                    itemId = potentialId;
                } else {
                    console.warn(`[app.js] Hash part "${potentialId}" in section "${sectionId}" is not a known subCategory, article, case, or item. Treating as itemId.`);
                    itemId = potentialId;
                }
            } else {
                console.warn(`[app.js] Section "${sectionId}" not found in kbSystemData during hash parsing. Treating "${potentialId}" as itemId.`);
                itemId = potentialId;
            }
        }
        return { sectionId, itemId, subCategoryFilter };
    }

    // دالة للانتظار حتى تتوفر kbSystemData
    function waitForKbSystemData(callback) {
        const maxAttempts = 50; // حوالي 5 ثواني (50 * 100ms)
        let attempts = 0;

        function check() {
            attempts++;
            if (typeof kbSystemData !== 'undefined' && kbSystemData.sections) {
                console.log('[app.js - DEBUG] kbSystemData is now available after', attempts, 'attempts.');
                callback();
            } else if (attempts >= maxAttempts) {
                console.error('[app.js - CRITICAL] kbSystemData failed to load after', maxAttempts, 'attempts. Navigation will not work.');
                document.body.innerHTML += '<div class="p-6 text-center text-red-500">Error: Knowledge base data (kbSystemData) failed to load. Please check how kbSystemData is being loaded.</div>';
            } else {
                console.warn('[app.js - DEBUG] kbSystemData not yet loaded, attempt', attempts, 'of', maxAttempts);
                setTimeout(check, 100);
            }
        }

        check();
    }

    // دالة لإضافة مستمعات الأحداث
    function initializeEventListeners() {
        console.log('[app.js - DEBUG] Initializing event listeners...');

        // مستمع أحداث ديناميكي على document
        document.addEventListener('click', function(e) {
            const triggerLink = e.target.closest('[data-section-trigger], [data-subcat-trigger]');
            if (triggerLink) {
                e.preventDefault();
                const sectionId = triggerLink.dataset.sectionTrigger;
                const itemId = triggerLink.dataset.itemId;
                const subcatFilterFromSectionTrigger = triggerLink.dataset.subcatFilter;
                const subcatTriggerValue = triggerLink.dataset.subcatTrigger;

                console.log('[app.js - DEBUG] Dynamic link clicked:', { sectionId, itemId, subcatFilterFromSectionTrigger, subcatTriggerValue });

                if (sectionId) {
                    handleSectionTrigger(sectionId, itemId, subcatFilterFromSectionTrigger);
                } else if (subcatTriggerValue) {
                    if (subcatTriggerValue.includes('.')) {
                        const [sId, subId] = subcatTriggerValue.split('.');
                        handleSectionTrigger(sId, null, subId);
                        if (sId === 'support' && subId === 'tools') {
                            setTimeout(() => {
                                const zendeskCard = Array.from(pageContent.querySelectorAll('.card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                                if (zendeskCard && zendeskCard.closest('.card')) {
                                    zendeskCard.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    console.log('[app.js - DEBUG] Scrolled to Zendesk card from home quick link.');
                                } else {
                                    console.warn('[app.js - DEBUG] Zendesk card not found after navigating to Support Tools.');
                                }
                            }, 300);
                        }
                    } else {
                        console.error('[app.js - DEBUG] Invalid data-subcat-trigger value (must contain "."):', subcatTriggerValue);
                    }
                }

                if (triggerLink.closest('#searchResultsContainer')) {
                    const searchResultsContainer = document.getElementById('searchResultsContainer');
                    const globalSearchInput = document.getElementById('globalSearchInput');
                    if (searchResultsContainer) searchResultsContainer.classList.add('hidden');
                    if (globalSearchInput) globalSearchInput.value = '';
                }
            }
        }, true); // استخدام capture phase لضمان التقاط الأحداث

        // مستمع أحداث popstate
        window.addEventListener('popstate', (event) => {
            const { sectionId, itemId, subCategoryFilter } = parseHash();
            console.log('[app.js - DEBUG] popstate event (hash changed via browser back/forward):', { sectionId, itemId, subCategoryFilter });
            handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);
        });

        // مستمع أحداث hashchange كإجراء احتياطي
        window.addEventListener('hashchange', () => {
            console.log('[app.js - DEBUG] hashchange event fired:', window.location.hash);
            const { sectionId, itemId, subCategoryFilter } = parseHash();
            handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);
        });

        console.log('[app.js - DEBUG] Event listeners initialized successfully.');
    }

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
    } else {
        console.warn('[app.js - DEBUG] Global search input or results container missing.');
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
            sectionDiv.textContent = `In: ${escapeHTML(result.sectionName || 'Unknown Section')}`;

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
        if (!containerElement) {
            console.error("[app.js] Section search results container not found.");
            return;
        }
        containerElement.innerHTML = '';
        if (results.length === 0) {
            containerElement.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">No results found within this section for "${escapeHTML(query)}".</p>`;
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
        if (ul.children.length === 0) {
            containerElement.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">No relevant results found in this section for "${escapeHTML(query)}".</p>`;
        } else {
            containerElement.appendChild(ul);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    // مستمعات الأحداث لـ pageContent (للبحث داخل القسم وتتبع المشاهدات)
    if (pageContent) {
        pageContent.addEventListener('click', (e) => {
            const ratingTarget = e.target.closest('.rating-btn');
            if (ratingTarget) {
                e.preventDefault();
                const ratingContainer = ratingTarget.closest('.rating-container');
                if (ratingContainer) {
                    ratingContainer.innerHTML = `<span class="text-xs text-green-500 dark:text-green-400 font-medium">Thanks for your feedback!</span>`;
                }
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
                        resultsContainerEl.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">Please enter at least 2 characters to search.</p>`;
                    } else {
                        resultsContainerEl.innerHTML = `<p class="text-sm text-red-500 dark:text-red-400 p-3 bg-red-50 dark:bg-red-700/30 rounded-md">Could not perform search. Data missing.</p>`;
                    }
                } else {
                    console.error("[app.js] Section search input or results container not found in pageContent.");
                }
                return;
            }

            const trackableViewLink = e.target.closest('a[data-track-view="true"]');
            if (trackableViewLink) {
                const sectionId = trackableViewLink.dataset.trackSectionId;
                const itemId = trackableViewLink.dataset.trackItemId;
                const itemType = trackableViewLink.dataset.trackItemType;

                if (sectionId && itemId && itemType) {
                    console.log('[app.js - DEBUG] Trackable link clicked, calling trackUserView:', { sectionId, itemId, itemType });
                    trackUserView(sectionId, itemId, itemType);
                } else {
                    console.warn('[app.js] Missing tracking data attributes on link:', trackableViewLink);
                }
            }
        });

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
        console.error('[app.js - CRITICAL] pageContent element not found on DOMContentLoaded. Dynamic event listeners will not be attached.');
    }

    // التحميل الابتدائي للصفحة
    const { sectionId: initialSectionId, itemId: initialItemId, subCategoryFilter: initialSubCategoryFilter } = parseHash();
    console.log('[app.js - DEBUG] Initial page load hash parsing:', { initialSectionId, initialItemId, initialSubCategoryFilter });

    // انتظر تحميل kbSystemData ثم نفذ التهيئة
    waitForKbSystemData(() => {
        initializeEventListeners();
        handleSectionTrigger(initialSectionId || 'home', initialItemId, initialSubCategoryFilter);
    });

    console.log('[app.js - DEBUG] All initializations complete.');
});
