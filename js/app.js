// js/app.js
import { supabase } from './supabase.js';

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
                console.log('[app.js - FIX] Auth.isAuthenticated is false, calling Auth.logout().');
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

    // Fetch user role from Supabase
    async function getUserRole(email) {
        if (!email) return 'viewer';
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('email', email)
                .single();
            if (error) {
                console.error('[app.js] Error fetching user role:', error);
                return 'viewer';
            }
            return data?.role || 'viewer';
        } catch (e) {
            console.error('[app.js] Exception fetching user role:', e);
            return 'viewer';
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
            alert(`Report an issue for: ${sectionTitleText}\nURL: ${pageUrl}\n(Placeholder)`);
        });
    }

    // --- Sidebar Navigation & Content Loading ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');

    // Debug: Check if critical elements exist
    console.log('[app.js - DEBUG] pageContent:', pageContent ? 'Found' : 'Not found');
    console.log('[app.js - DEBUG] sidebarLinks:', sidebarLinks.length, 'links found');

    const initialPageContent = pageContent ? pageContent.innerHTML : '<p>Error: pageContent missing on load.</p>';

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

    function renderArticleCard_enhanced(article, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
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
                ${article.tags && article.tags.length > 0 ? `<div class="mb-4">${article.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div class="rating-container text-xs text-gray-500 dark:text-gray-400 flex items-center">
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

    function renderItemCard_enhanced(item, sectionData) {
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

    function renderCaseCard_enhanced(caseItem, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        const caseIcon = 'fas fa-briefcase';
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
                ${caseItem.tags && caseItem.tags.length > 0 ? `<div class="mb-3">${caseItem.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                <div class="mt-auto flex between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-sm font-medium px-3 py-1 rounded-full ${theme.statusBg} ${theme.statusText}">${escapeHTML(caseItem.status)}</span>
                    ${caseItem.contentPath ? `<a href="${caseItem.contentPath}" target="_blank" class="text-sm font-medium ${theme.cta} group">Details <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i></a>` : `<div class="w-16"></div>`}
                </div>
            </div>
        `;
    }

    // Function to create the Add Case pop-up
    function createAddCasePopup(sectionId, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        const popup = document.createElement('div');
        popup.id = 'addCasePopup';
        popup.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50';
        popup.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add New Case</h2>
                <form id="addCaseForm">
                    <div class="mb-4">
                        <label for="caseTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                        <input type="text" id="caseTitle" class="mt-1 p-2 w-full border rounded-md dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary" required>
                    </div>
                    <div class="mb-4">
                        <label for="caseSummary" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Summary</label>
                        <textarea id="caseSummary" class="mt-1 p-2 w-full border rounded-md dark:bg-gray-700 focus:ring-2 focus:ring-brand-primary" rows="4"></textarea>
                    </div>
                    <div class="mb-4">
                        <label for="caseContent" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                        <div id="caseContentEditor" class="bg-white dark:bg-gray-700 border rounded-md"></div>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" id="cancelCaseBtn" class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" id="saveCaseBtn" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(popup);

        // Initialize Quill editor
        const quill = new Quill('#caseContentEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    ['image', 'link', 'video'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                ]
            }
        });

        // Handle form submission
        const form = document.getElementById('addCaseForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('caseTitle').value.trim();
            const summary = document.getElementById('caseSummary').value.trim();
            const content = quill.root.innerHTML;

            if (!title) {
                alert('Title is required.');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('cases')
                    .insert([{
                        section_id: sectionId,
                        title,
                        summary,
                        content,
                        status: 'New',
                        created_by: currentUser.email
                    }]);
                if (error) {
                    console.error('[app.js] Error saving case to Supabase:', error);
                    alert('Failed to save case. Please try again.');
                    return;
                }
                console.log('[app.js] Case saved successfully:', data);
                alert('Case added successfully!');
                popup.remove();
                // Refresh the section to show the new case
                refreshCases(sectionId);
            } catch (e) {
                console.error('[app.js] Exception saving case:', e);
                alert('An error occurred. Please try again.');
            }
        });

        // Handle Cancel button
        document.getElementById('cancelCaseBtn').addEventListener('click', () => {
            popup.remove();
        });

        // Close pop-up when clicking outside
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        });
    }

    // Function to fetch cases from Supabase and update kbSystemData
    async function refreshCases(sectionId) {
        try {
            const { data, error } = await supabase
                .from('cases')
                .select('*')
                .eq('section_id', sectionId);
            if (error) {
                console.error('[app.js] Error fetching cases from Supabase:', error);
                return;
            }
            const section = kbSystemData.sections.find(s => s.id === sectionId);
            if (section) {
                section.cases = data.map(caseItem => ({
                    id: caseItem.id,
                    title: caseItem.title,
                    tags: caseItem.tags || [],
                    summary: caseItem.summary,
                    status: caseItem.status,
                    assigned_to: caseItem.assigned_to,
                    contentPath: caseItem.content ? `articles/${sectionId}/cases/${caseItem.id}.html` : null,
                    resolutionStepsPreview: caseItem.content ? truncateText(caseItem.content.replace(/<[^>]+>/g, ''), 50) : null,
                    type: 'case',
                    lastUpdated: caseItem.updated_at
                }));
                console.log(`[app.js] Refreshed cases for section ${sectionId}:`, section.cases);
                displaySectionContent(sectionId);
            }
        } catch (e) {
            console.error('[app.js] Exception refreshing cases:', e);
        }
    }

    async function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        console.log(`[app.js - FIX] displaySectionContent CALLED for sectionId: "${sectionId}", item: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);
        if (!pageContent) {
            console.error('[app.js - FIX] pageContent is NULL.');
            pageContent.innerHTML = '<p>Error: pageContent element not found.</p>';
            return;
        }
        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js - FIX] kbSystemData is UNDEFINED.');
            pageContent.innerHTML = '<p>Error: Data missing.</p>';
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
            if (currentUser && welcomeUserEl) welcomeUserEl.textContent = `Welcome, ${currentUser.fullName || currentUser.email}!`;
            const kbVersionEl = document.getElementById('kbVersion');
            const lastKbUpdateEl = document.getElementById('lastKbUpdate');
            if (kbSystemData.meta) {
                if (kbVersionEl) kbVersionEl.textContent = kbSystemData.meta.version;
                if (lastKbUpdateEl) lastKbUpdateEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }
            const initialCards = pageContent.querySelectorAll('.grid > .card-animate');
            initialCards.forEach((card, index) => card.style.animationDelay = `${(index + 1) * 0.1}s`);
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
            console.log('[app.js - FIX] Home page loaded.');
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center"><h2 class="text-xl font-semibold">Section not found</h2><p>"${escapeHTML(sectionId)}" does not exist.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Not Found';
            console.warn(`[app.js - FIX] Section "${sectionId}" not found in kbSystemData.`);
            return;
        }

        // Fetch cases from Supabase to ensure latest data
        await refreshCases(sectionId);

        const theme = getThemeColors(sectionData.themeColor);

        let contentHTML = `<div class="space-y-10">`;
        contentHTML += `<div class="flex justify-between items-center"><h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center"><span class="p-2.5 rounded-lg ${theme.iconContainer} mr-4 hidden sm:inline-flex"><i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i></span>${escapeHTML(sectionData.name)}</h2></div>`;
        contentHTML += `<p class="text-gray-600 dark:text-gray-300 mt-1 mb-6 text-lg">${escapeHTML(sectionData.description)}</p>`;

        contentHTML += `<div class="my-6 p-4 bg-white dark:bg-gray-800/70 rounded-lg shadow-md card-animate"><label for="sectionSearchInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ask about ${escapeHTML(sectionData.name)}:</label><div class="flex"><input type="text" id="sectionSearchInput" data-section-id="${sectionData.id}" class="flex-grow p-2.5 border rounded-l-md dark:bg-gray-700" placeholder="Type your question..."><button id="sectionSearchBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md flex items-center"><i class="fas fa-search mr-2"></i>Ask</button></div><div id="sectionSearchResults" class="mt-4 max-h-96 overflow-y-auto space-y-2"></div></div>`;

        let hasContent = false;
        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.articles.forEach(article => contentHTML += renderArticleCard_enhanced(article, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (sectionData.cases && sectionData.cases.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3>`;
            // Add "Add Case" button for admins and super_admins
            const userRole = await getUserRole(currentUser?.email);
            if (['admin', 'super_admin'].includes(userRole)) {
                contentHTML += `<div class="mb-4"><button id="addCaseBtn" data-section-id="${sectionData.id}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"><i class="fas fa-plus mr-2"></i>Add Case</button></div>`;
            }
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.cases.forEach(caseItem => contentHTML += renderCaseCard_enhanced(caseItem, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.items.forEach(item => contentHTML += renderItemCard_enhanced(item, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories</h3><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
            sectionData.subCategories.forEach(subCat => contentHTML += `<a href="#" data-section-trigger="${sectionData.id}" data-subcat-filter="${subCat.id}" class="sub-category-link bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-lg card-animate group border-l-4 ${theme.border} text-center"><i class="fas fa-folder-open text-3xl mb-3 ${theme.icon}"></i><h4 class="font-medium">${escapeHTML(subCat.name)}</h4></a>`);
            contentHTML += `</div>`;
        }
        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-book mr-3 ${theme.text}"></i> Glossary</h3><div class="space-y-4">`;
            sectionData.glossary.forEach(entry => contentHTML += `<div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow card-animate border-l-4 ${theme.border}"><strong class="${theme.text}">${escapeHTML(entry.term)}:</strong> ${escapeHTML(entry.definition)}</div>`);
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (!hasContent && !(sectionData.subCategories && sectionData.subCategories.length > 0)) {
            contentHTML += `<div class="p-10 text-center card-animate"><i class="fas fa-info-circle text-4xl mb-4"></i><h3 class="text-xl font-semibold">No content yet</h3><p>Content for "${escapeHTML(sectionData.name)}" is being prepared.</p></div>`;
        }
        contentHTML += `</div>`;

        pageContent.innerHTML = contentHTML;
        console.log(`[app.js - FIX] Successfully set innerHTML for section "${sectionId}".`);

        pageContent.querySelectorAll('.card-animate').forEach((card, index) => card.style.animationDelay = `${index * 0.07}s`);

        // Add event listener for Add Case button
        const addCaseBtn = pageContent.querySelector('#addCaseBtn');
        if (addCaseBtn) {
            addCaseBtn.addEventListener('click', () => {
                createAddCasePopup(sectionId, sectionData);
            });
        }

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            let bcHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(sectionData.name)}</span>`;
            if (subCategoryFilter && sectionData.subCategories?.find(sc => sc.id === subCategoryFilter)) {
                bcHTML += ` <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(sectionData.subCategories.find(sc => sc.id === subCategoryFilter).name)}</span>`;
            }
            breadcrumbsContainer.innerHTML = bcHTML;
            breadcrumbsContainer.classList.remove('hidden');
            const homeBreadcrumbLink = breadcrumbsContainer.querySelector('[data-section-trigger="home"]');
            if (homeBreadcrumbLink) {
                homeBreadcrumbLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleSectionTrigger('home');
                });
            }
        }
        if (itemIdToFocus) {
            setTimeout(() => {
                const targetCard = pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item');
                    setTimeout(() => targetCard.classList.remove('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item'), 3500);
                } else {
                    console.warn(`[app.js - FIX] Item "${itemIdToFocus}" not found for section "${sectionId}".`);
                }
            }, 200);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        console.log('[app.js - DEBUG] handleSectionTrigger called with:', { sectionId, itemId, subCategoryFilter });
        if (typeof kbSystemData === 'undefined') {
            console.error('[app.js - FIX] kbSystemData undefined in handleSectionTrigger!');
            return;
        }
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId, itemId, subCategoryFilter);
        // Update URL hash
        const hash = itemId ? `${sectionId}/${itemId}` : subCategoryFilter ? `${sectionId}/${subCategoryFilter}` : sectionId;
        window.history.replaceState(null, '', `#${hash}`);
        console.log(`[app.js - FIX] Updated URL hash to: #${hash}`);
    }

    // Parse URL hash
    function parseHash() {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return { sectionId: 'home' };
        const [sectionId, itemId, subCategoryFilter] = hash.split('/');
        return { sectionId, itemId, subCategoryFilter };
    }

    // Sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            console.log(`[app.js - FIX] Sidebar link click, data-section: "${sectionId}"`);
            if (sectionId) {
                handleSectionTrigger(sectionId);
            } else {
                console.error('[app.js - FIX] No data-section attribute found on sidebar link:', this);
            }
        });
    });

    // Body click listener for dynamic links
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('[data-section-trigger]');
        if (target) {
            e.preventDefault();
            const sectionId = target.dataset.sectionTrigger;
            const itemId = target.dataset.itemId;
            const subCatFilter = target.dataset.subcatFilter;
            console.log(`[app.js - FIX] Body click, data-section-trigger: "${sectionId}", item: "${itemId}", subCat: "${subCatFilter}"`);
            if (sectionId) {
                handleSectionTrigger(sectionId, itemId, subCatFilter);
                if (target.closest('#searchResultsContainer')) {
                    if (searchResultsContainer) searchResultsContainer.classList.add('hidden');
                    if (globalSearchInput) globalSearchInput.value = '';
                }
            } else {
                console.error('[app.js - FIX] No data-section-trigger attribute found:', target);
            }
        }

        const homeSubcatTrigger = e.target.closest('[data-subcat-trigger]');
        if (homeSubcatTrigger && pageContent.querySelector('#welcomeUserName')) {
            e.preventDefault();
            const triggerValue = homeSubcatTrigger.dataset.subcatTrigger;
            if (triggerValue && triggerValue.includes('.')) {
                const [sectionId, subId] = triggerValue.split('.');
                console.log(`[app.js - FIX] Home subcat trigger: section="${sectionId}", subId="${subId}"`);
                handleSectionTrigger(sectionId, null, subId);
                if (sectionId === 'support' && subId === 'tools') {
                    setTimeout(() => {
                        const zendeskCard = Array.from(pageContent.querySelectorAll('.card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                        if (zendeskCard?.closest('.card')) {
                            zendeskCard.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'center' });
                            console.log('[app.js - FIX] Scrolled to Zendesk card.');
                        } else {
                            console.warn('[app.js - FIX] Zendesk card not found.');
                        }
                    }, 300);
                }
            } else {
                console.error('[app.js - FIX] Invalid data-subcat-trigger value:', triggerValue);
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
    } else {
        console.warn('[app.js - FIX] Global search elements missing:', { globalSearchInput, searchResultsContainer });
    }

    function renderGlobalSearchResults_enhanced(results, query) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<div class="p-3 text-sm text-gray-500">No results for "${escapeHTML(query)}".</div>`;
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
            if (result.type !== 'section_match' && result.type !== 'glossary_term') a.dataset.itemId = result.id;
            a.className = 'block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors global-search-result-link';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-semibold';
            titleDiv.innerHTML = highlightText(result.title, query);
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 mt-0.5';
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

    function renderSectionSearchResults(results, query, container, themeColor) {
        if (!container) return;
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
            a.href = `javascript:void(0);`;
            a.dataset.sectionTrigger = result.sectionId;
            if (result.type !== 'section_match' && result.type !== 'glossary_term') a.dataset.itemId = result.id;
            a.className = `block p-3 bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md shadow-sm border-l-4 ${theme.border} transition-all quick-link-button`;

            const titleDiv = document.createElement('div');
            titleDiv.className = `font-semibold ${theme.text}`;
            titleDiv.innerHTML = highlightText(result.title, query);
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 80), query) : 'Click to view.';
            const typeBadge = document.createElement('span');
            typeBadge.className = `text-xs ${theme.tagBg} ${theme.tagText} px-2 py-0.5 rounded-full mr-2 font-medium`;
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
        container.appendChild(ul);
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    if (pageContent) {
        pageContent.addEventListener('click', (e) => {
            const ratingTarget = e.target.closest('.rating-btn');
            if (ratingTarget) {
                e.preventDefault();
                const ratingContainer = ratingTarget.closest('.rating-container');
                if (ratingContainer) ratingContainer.innerHTML = `<span class="text-xs text-green-500">Thanks!</span>`;
                return;
            }
            const sectionSearchBtn = e.target.closest('#sectionSearchBtn');
            if (sectionSearchBtn) {
                e.preventDefault();
                const input = pageContent.querySelector('#sectionSearchInput');
                const currentSectionId = input?.dataset.sectionId;
                const query = input?.value.trim();
                if (query && query.length > 1 && typeof searchKb === 'function' && currentSectionId) {
                    const results = searchKb(query);
                    const sectionData = kbSystemData.sections.find(s => s.id === currentSectionId);
                    const resultsContainerEl = pageContent.querySelector('#sectionSearchResults');
                    if (resultsContainerEl) renderSectionSearchResults(results, query, resultsContainerEl, sectionData?.themeColor || 'gray');
                } else if (input) {
                    const resultsContainerEl = pageContent.querySelector('#sectionSearchResults');
                    if (resultsContainerEl) resultsContainerEl.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">Please enter a query with at least 2 characters.</p>`;
                }
                return;
            }
        });
    } else {
        console.error('[app.js - FIX] pageContent element not found on initialization.');
    }

    // Handle URL hash on page load and hash change
    window.addEventListener('hashchange', () => {
        const { sectionId, itemId, subCategoryFilter } = parseHash();
        console.log('[app.js - FIX] Hash changed:', { sectionId, itemId, subCategoryFilter });
        handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);
    });

    // Initial load with hash support
    const { sectionId, itemId, subCategoryFilter } = parseHash();
    console.log('[app.js - FIX] Initial hash load:', { sectionId, itemId, subCategoryFilter });
    handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);

    console.log('[app.js - FIX] All initializations complete.');
});
