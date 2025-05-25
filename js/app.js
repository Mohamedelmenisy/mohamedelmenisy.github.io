import { supabase } from './supabase.js'; // Ensure supabase.js is in the same directory or adjust path

document.addEventListener('DOMContentLoaded', async () => {
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
        protectPage(); // This might redirect if not authenticated
    } else {
        console.warn('[app.js - FIX] protectPage function not found. Checking Auth object.');
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated) {
            if (!Auth.isAuthenticated()) {
                console.log('[app.js - FIX] Auth.isAuthenticated is false, calling Auth.logout().');
                Auth.logout(); // This will redirect
                return; // Stop further execution if redirected
            }
            console.log('[app.js - FIX] User is authenticated via Auth object.');
        } else {
            console.error('[app.js - FIX] CRITICAL: Authentication mechanism not found.');
            // Potentially redirect to login or show error message
            // window.location.href = 'login.html'; // Example redirect
            // return;
        }
    }

    let currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;

    if (currentUser && supabase) { // Ensure supabase is available
        try {
            console.log('[app.js - FIX] Fetching user role for:', currentUser.email);
            const { data: userProfile, error: profileError } = await supabase
                .from('users') // Assuming 'users' table has 'email' and 'role'
                .select('role')
                .eq('email', currentUser.email)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116: "single" row not found, not necessarily an error here
                console.error('[app.js - FIX] Error fetching user profile:', profileError);
                currentUser.role = 'viewer'; // Default role on error
            } else if (userProfile) {
                currentUser.role = userProfile.role;
                console.log('[app.js - FIX] User role set to:', currentUser.role);
            } else {
                currentUser.role = 'viewer'; // Default role if no profile found
                console.warn('[app.js - FIX] No user profile found in Supabase for role, defaulting to viewer.');
            }
        } catch (e) {
            console.error('[app.js - FIX] Exception fetching user role:', e);
            currentUser.role = 'viewer'; // Default role on exception
        }
    } else if (!currentUser) {
        console.error('[app.js - FIX] CRITICAL: currentUser is null after authentication checks. Auth flow issue.');
        // protectPage or Auth.logout should have redirected.
        // If script execution continues, it's a problem.
        return; // Stop execution if user is not authenticated and somehow script continues
    }


    console.log('[app.js - FIX] Current user with role:', currentUser);


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

    // --- Toast Notification ---
    const toastNotification = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');

    function showToast(message, type = 'success') {
        if (!toastNotification || !toastMessage) {
            console.warn("Toast elements not found, logging to console:", message, type);
            alert(`${type.toUpperCase()}: ${message}`); // Fallback alert
            return;
        }
        toastMessage.textContent = message;
        toastNotification.classList.remove('hidden', 'bg-green-500', 'bg-red-500', 'bg-blue-500');
        if (type === 'success') {
            toastNotification.classList.add('bg-green-500');
        } else if (type === 'error') {
            toastNotification.classList.add('bg-red-500');
        } else { // 'info' or other
            toastNotification.classList.add('bg-blue-500');
        }
        toastNotification.classList.remove('hidden');
        setTimeout(() => {
            toastNotification.classList.add('hidden');
        }, 3000);
    }


    // --- Modal Handling ---
    const genericModal = document.getElementById('genericModal');
    const modalTitleEl = document.getElementById('modalTitle');
    const modalContentEl = document.getElementById('modalContent');
    const modalActionsEl = document.getElementById('modalActions');
    const closeModalBtn = document.getElementById('closeModalBtn');
    let activeQuillEditor = null;

    function openModal(title, contentHTML, actionsHTML = '') {
        if (!genericModal || !modalTitleEl || !modalContentEl || !modalActionsEl) {
            console.error('Modal elements not found');
            return;
        }
        modalTitleEl.textContent = title;
        modalContentEl.innerHTML = contentHTML; // Injects HTML, ensure it's safe or sanitized
        if (actionsHTML) {
            modalActionsEl.innerHTML = actionsHTML;
            modalActionsEl.classList.remove('hidden');
        } else {
            modalActionsEl.innerHTML = '';
            modalActionsEl.classList.add('hidden');
        }
        genericModal.classList.remove('hidden');
        const focusableElements = genericModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length) focusableElements[0].focus();
    }

    function closeModal() {
        if (activeQuillEditor) {
            // Quill instance cleanup is usually handled by its own destroy method if needed,
            // but if the editor div is simply removed from DOM, that's often enough.
            activeQuillEditor = null;
        }
        if (genericModal) genericModal.classList.add('hidden');
        if (modalContentEl) modalContentEl.innerHTML = ''; // Clear content
        if (modalActionsEl) modalActionsEl.innerHTML = '';
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && genericModal && !genericModal.classList.contains('hidden')) {
            closeModal();
        }
    });
    if (genericModal) {
        genericModal.addEventListener('click', (event) => {
            if (event.target === genericModal) {
                closeModal();
            }
        });
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
        document.querySelectorAll('#searchResultsContainer mark, #sectionSearchResults mark, .modal-content-view mark').forEach(mark => {
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
            showToast(`Reporting issue for: ${sectionTitleText} (Placeholder)`, 'info');
        });
    }

    // --- Sidebar Navigation & Content Loading ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');
    const accessTrackingReportContainer = document.getElementById('accessTrackingReportContainer');


    console.log('[app.js - DEBUG] pageContent:', pageContent ? 'Found' : 'Not found');
    console.log('[app.js - DEBUG] sidebarLinks:', sidebarLinks.length, 'links found');

    const initialPageContent = pageContent ? pageContent.innerHTML : '<p>Error: pageContent missing on load.</p>';

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
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
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${article.id}" data-item-type="article" data-section-id="${sectionData.id}">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${cardIconClass} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(article.title)}</h3>
                    <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${article.id}'); showToast('Link copied!', 'info');" class="bookmark-link ml-auto pl-2" title="Copy link to this article">
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
                    <a href="javascript:void(0);" data-action="view-details" data-item-id="${article.id}" data-item-type="article" data-section-id="${sectionData.id}" class="text-sm font-medium ${theme.cta} group">
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
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${item.id}" data-item-type="item" data-section-id="${sectionData.id}">
                 <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${cardIconClass} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(item.title)}</h3>
                    <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${item.id}'); showToast('Link copied!', 'info');" class="bookmark-link ml-auto pl-2" title="Copy link to this item">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${escapeHTML(item.description) || 'No description available.'}</p>
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs ${theme.tagBg} ${theme.tagText} px-3 py-1 rounded-full uppercase font-semibold tracking-wide">${escapeHTML(item.type)}</span>
                    <a href="javascript:void(0);" data-action="view-details" data-item-id="${item.id}" data-item-type="item" data-section-id="${sectionData.id}" class="text-sm font-medium ${theme.cta} group">
                        Open <i class="fas fa-external-link-alt ml-1 text-xs opacity-75 group-hover:scale-110 transition-transform duration-200"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function renderCaseCard_enhanced(caseItem, sectionData, isSupabaseCase = false) {
        const theme = getThemeColors(sectionData.themeColor);
        const caseIcon = 'fas fa-briefcase';
        const itemId = caseItem.id; // Supabase uses 'id' (UUID typically)

        let actions = '';
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin')) {
            actions += `<button data-action="edit-case" data-case-id="${itemId}" data-section-id="${sectionData.id}" class="text-xs text-blue-500 hover:underline mr-2"><i class="fas fa-edit"></i> Edit</button>`;
        }

        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${itemId}" data-item-type="case" data-section-id="${sectionData.id}">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${caseIcon} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(caseItem.title)}</h3>
                     <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${itemId}'); showToast('Link copied!', 'info');" class="bookmark-link ml-auto pl-2" title="Copy link to this case">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 flex-grow">${escapeHTML(caseItem.summary) || 'No summary.'}</p>
                ${caseItem.resolutionStepsPreview ? `<p class="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">Preview: ${escapeHTML(truncateText(caseItem.resolutionStepsPreview, 100))}</p>` : ''}
                ${caseItem.tags && Array.isArray(caseItem.tags) && caseItem.tags.length > 0 ? `<div class="mb-3">${caseItem.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-sm font-medium px-3 py-1 rounded-full ${theme.statusBg} ${theme.statusText}">${escapeHTML(caseItem.status)}</span>
                    <div>
                        ${actions}
                        <a href="javascript:void(0);" data-action="view-details" data-item-id="${itemId}" data-item-type="case" data-section-id="${sectionData.id}" class="text-sm font-medium ${theme.cta} group">
                            Details <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    async function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        console.log(`[app.js - FIX] displaySectionContent CALLED for sectionId: "${sectionId}", item: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);
        if (!pageContent) {
            console.error('[app.js - FIX] pageContent is NULL.');
            if (document.getElementById('pageContent')) document.getElementById('pageContent').innerHTML = '<p>Error: pageContent element not found.</p>';
            return;
        }
         if (accessTrackingReportContainer) accessTrackingReportContainer.classList.add('hidden');

        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js - FIX] kbSystemData (static data) is UNDEFINED.');
            pageContent.innerHTML = '<p>Error: Core data missing.</p>';
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

            if (currentUser && supabase) await renderAccessTrackingReport(); // Only if user and supabase are available

            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
            console.log('[app.js - FIX] Home page loaded.');
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center"><h2 class="text-xl font-semibold">Section not found</h2><p>"${escapeHTML(sectionId)}" does not exist.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Not Found';
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);
        let contentHTML = `<div class="space-y-10">`;
        contentHTML += `<div class="flex justify-between items-center"><h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center"><span class="p-2.5 rounded-lg ${theme.iconContainer} mr-4 hidden sm:inline-flex"><i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i></span>${escapeHTML(sectionData.name)}</h2></div>`;
        contentHTML += `<p class="text-gray-600 dark:text-gray-300 mt-1 mb-6 text-lg">${escapeHTML(sectionData.description)}</p>`;

        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin')) {
            contentHTML += `<div class="mb-6 flex space-x-3">
                <button id="addCaseBtnInSection" data-section-id="${sectionData.id}" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center">
                    <i class="fas fa-plus-circle mr-2"></i> Add New Case
                </button>
                <button id="addSubsectionBtnInSection" data-section-id="${sectionData.id}" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center">
                    <i class="fas fa-sitemap mr-2"></i> Add New Subsection
                </button>
            </div>`;
        }

        contentHTML += `<div class="my-6 p-4 bg-white dark:bg-gray-800/70 rounded-lg shadow-md card-animate"><label for="sectionSearchInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ask about ${escapeHTML(sectionData.name)}:</label><div class="flex"><input type="text" id="sectionSearchInput" data-section-id="${sectionData.id}" class="flex-grow p-2.5 border rounded-l-md dark:bg-gray-700" placeholder="Type your question..."><button id="sectionSearchBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md flex items-center"><i class="fas fa-search mr-2"></i>Ask</button></div><div id="sectionSearchResults" class="mt-4 max-h-96 overflow-y-auto space-y-2"></div></div>`;

        let hasContent = false;
        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.articles.forEach(article => contentHTML += renderArticleCard_enhanced(article, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }

        if (supabase) { // Fetch cases from Supabase
            try {
                const { data: cases, error: casesError } = await supabase
                    .from('cases')
                    .select('*') // Select all columns
                    .eq('section_id', sectionId) // Ensure your 'cases' table has a 'section_id' column
                    .order('created_at', { ascending: false });

                if (casesError) throw casesError;

                if (cases && cases.length > 0) {
                    contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
                    cases.forEach(caseItem => {
                        // Add a preview for resolution steps if the full content is long
                        if (caseItem.content && typeof caseItem.content === 'string') {
                             // Basic preview, assuming content is HTML. For plain text, adjust accordingly.
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = caseItem.content;
                            caseItem.resolutionStepsPreview = truncateText(tempDiv.textContent || tempDiv.innerText || "", 150);
                        }
                        contentHTML += renderCaseCard_enhanced(caseItem, sectionData, true);
                    });
                    contentHTML += `</div>`;
                    hasContent = true;
                }
            } catch (error) {
                console.error(`[app.js - FIX] Error fetching cases for section ${sectionId}:`, error);
                contentHTML += `<p class="text-red-500">Error loading cases. Check console.</p>`;
            }
        } else if (sectionData.cases && sectionData.cases.length > 0) { // Fallback to static cases if Supabase not available
             contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases (Static)</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.cases.forEach(caseItem => contentHTML += renderCaseCard_enhanced(caseItem, sectionData, false)); // isSupabaseCase = false
            contentHTML += `</div>`;
            hasContent = true;
        }


        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.items.forEach(item => contentHTML += renderItemCard_enhanced(item, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }

        if (supabase) { // Fetch subcategories from Supabase
            try {
                const { data: subCategories, error: subCatError } = await supabase
                    .from('sub_categories') // Ensure your table is named 'sub_categories'
                    .select('*')
                    .eq('section_id', sectionId) // And has 'section_id'
                    .order('name', { ascending: true });

                if (subCatError) throw subCatError;

                if (subCategories && subCategories.length > 0) {
                    contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories</h3><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
                    subCategories.forEach(subCat => {
                        let subCatActions = '';
                        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin')) {
                            subCatActions = `<div class="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                               <button data-action="edit-subsection" data-subsection-id="${subCat.id}" data-section-id="${sectionData.id}" class="text-xs text-blue-500 hover:underline p-1"><i class="fas fa-edit"></i></button>
                                             </div>`;
                        }
                        contentHTML += `<div class="relative sub-category-link bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-lg card-animate group border-l-4 ${theme.border} text-center">
                                            ${subCatActions}
                                            <a href="#" data-section-trigger="${sectionData.id}" data-subcat-filter="${subCat.id}" >
                                                <i class="fas fa-folder-open text-3xl mb-3 ${theme.icon}"></i>
                                                <h4 class="font-medium">${escapeHTML(subCat.name)}</h4>
                                                ${subCat.description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${escapeHTML(subCat.description)}</p>` : ''}
                                            </a>
                                        </div>`;
                    });
                    contentHTML += `</div>`;
                    hasContent = true;
                }
            } catch (error) {
                console.error(`[app.js - FIX] Error fetching subcategories for section ${sectionId}:`, error);
                contentHTML += `<p class="text-red-500">Error loading sub-categories. Check console.</p>`;
            }
        } else if (sectionData.subCategories && sectionData.subCategories.length > 0) { // Fallback to static
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories (Static)</h3><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
            sectionData.subCategories.forEach(subCat => {
                contentHTML += `<div class="relative sub-category-link bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-lg card-animate group border-l-4 ${theme.border} text-center">
                                    <a href="#" data-section-trigger="${sectionData.id}" data-subcat-filter="${subCat.id}" >
                                        <i class="fas fa-folder-open text-3xl mb-3 ${theme.icon}"></i>
                                        <h4 class="font-medium">${escapeHTML(subCat.name)}</h4>
                                        ${subCat.description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${escapeHTML(subCat.description)}</p>` : ''}
                                    </a>
                                </div>`;
            });
            contentHTML += `</div>`;
            hasContent = true;
        }


        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-book mr-3 ${theme.text}"></i> Glossary</h3><div class="space-y-4">`;
            sectionData.glossary.forEach(entry => contentHTML += `<div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow card-animate border-l-4 ${theme.border}"><strong class="${theme.text}">${escapeHTML(entry.term)}:</strong> ${escapeHTML(entry.definition)}</div>`);
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (!hasContent) {
            contentHTML += `<div class="p-10 text-center card-animate"><i class="fas fa-info-circle text-4xl text-gray-400 dark:text-gray-500 mb-4"></i><h3 class="text-xl font-semibold">No content yet</h3><p>Content for "${escapeHTML(sectionData.name)}" is being prepared, or no items match the current filter.</p></div>`;
        }
        contentHTML += `</div>`;

        pageContent.innerHTML = contentHTML;
        pageContent.querySelectorAll('.card-animate').forEach((card, index) => card.style.animationDelay = `${index * 0.07}s`);

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            let bcHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(sectionData.name)}</span>`;
            if (subCategoryFilter && supabase) {
                try {
                    const { data: subCatInfo, error: subCatInfoError } = await supabase
                        .from('sub_categories')
                        .select('name')
                        .eq('id', subCategoryFilter)
                        .eq('section_id', sectionId) // Important: ensure subcategory belongs to current section
                        .single();
                    if (subCatInfoError && subCatInfoError.code !== 'PGRST116') throw subCatInfoError;
                    if (subCatInfo) {
                        bcHTML += ` <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(subCatInfo.name)}</span>`;
                    }
                } catch (err) {
                    console.warn("Could not fetch subcategory name for breadcrumbs:", err);
                }
            } else if (subCategoryFilter && sectionData.subCategories) { // Fallback for static subcategories
                 const subCat = sectionData.subCategories.find(sc => sc.id === subCategoryFilter);
                 if(subCat) bcHTML += ` <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(subCat.name)}</span>`;
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
                }
            }, 200);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');

        // Add event listeners for new buttons after content is rendered
        const addCaseBtnInSection = document.getElementById('addCaseBtnInSection');
        if (addCaseBtnInSection) {
            addCaseBtnInSection.addEventListener('click', () => openCaseModal(addCaseBtnInSection.dataset.sectionId));
        }
        const addSubsectionBtnInSection = document.getElementById('addSubsectionBtnInSection');
        if (addSubsectionBtnInSection) {
            addSubsectionBtnInSection.addEventListener('click', () => openSubsectionModal(addSubsectionBtnInSection.dataset.sectionId));
        }
    }

    // --- View Details Modal ---
    async function showItemDetailsModal(itemId, itemType, sectionId) {
        if (!currentUser || (!supabase && itemType === 'case') ) { // Check if Supabase needed and available
            showToast("Cannot load details at this time.", "error");
            return;
        }
        let title = 'Details';
        let contentHTML = '<p class="text-center py-4">Loading details...</p>';
        let itemData;

        try {
            const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
            if (!sectionData) throw new Error('Section data not found for modal');

            if (itemType === 'article') {
                itemData = sectionData.articles.find(a => a.id === itemId);
                if (!itemData) throw new Error('Article not found');
                title = itemData.title;
                contentHTML = `<div class="modal-content-view">
                                 <h4 class="text-lg font-semibold mb-2">${escapeHTML(itemData.title)}</h4>
                                 <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Last Updated: ${new Date(itemData.lastUpdated).toLocaleDateString()}</p>
                                 ${itemData.tags && itemData.tags.length > 0 ? `<div class="mb-3">${itemData.tags.map(tag => `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full mr-1 mb-1 inline-block">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                                 <p class="mb-4">${escapeHTML(itemData.summary)}</p>`;
                // Using itemData.details directly if contentPath is not used for HTML files
                if(itemData.details){
                     contentHTML += `<hr class="my-4 dark:border-gray-600"><div class="prose dark:prose-invert max-w-none">${itemData.details.replace(/\n/g, '<br>')}</div>`; // Basic formatting for newlines
                } else if (itemData.contentPath && itemData.contentPath.endsWith('.html')) { // Fallback if you still use contentPath for some
                    try {
                        const response = await fetch(itemData.contentPath);
                        if (response.ok) {
                            const articleHtmlContent = await response.text();
                            contentHTML += `<hr class="my-4 dark:border-gray-600"><div class="prose dark:prose-invert max-w-none">${articleHtmlContent}</div>`;
                        } else {
                             contentHTML += `<p class="text-sm text-gray-500">Full content could not be loaded (path: ${escapeHTML(itemData.contentPath)}).</p>`;
                        }
                    } catch (fetchError) {
                        console.warn(`Error fetching article content from ${itemData.contentPath}:`, fetchError);
                        contentHTML += `<p class="text-sm text-gray-500">Full content could not be loaded.</p>`;
                    }
                }
                contentHTML += `</div>`;
            } else if (itemType === 'item') {
                itemData = sectionData.items.find(i => i.id === itemId);
                if (!itemData) throw new Error('Item not found');
                title = itemData.title;
                contentHTML = `<div class="modal-content-view">
                                 <h4 class="text-lg font-semibold mb-2">${escapeHTML(itemData.title)}</h4>
                                 <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Type: <span class="font-medium">${escapeHTML(itemData.type)}</span></p>
                                 <p class="mb-4">${escapeHTML(itemData.description)}</p>
                                 <a href="${itemData.url}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">Open Item/File <i class="fas fa-external-link-alt ml-1"></i></a>
                               </div>`;
            } else if (itemType === 'case') {
                if (!supabase) throw new Error("Supabase client not available for fetching case details.");
                const { data: caseDetail, error } = await supabase.from('cases').select('*').eq('id', itemId).single();
                if (error) throw error;
                if (!caseDetail) throw new Error('Case not found in Supabase');
                itemData = caseDetail;
                title = itemData.title;
                contentHTML = `<div class="modal-content-view">
                                <h4 class="text-lg font-semibold mb-2">${escapeHTML(itemData.title)}</h4>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Status: <span class="font-semibold ${getThemeColors(sectionData.themeColor).statusText} px-2 py-0.5 rounded-full ${getThemeColors(sectionData.themeColor).statusBg}">${escapeHTML(itemData.status)}</span></p>
                                ${itemData.assigned_to ? `<p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigned to: ${escapeHTML(itemData.assigned_to)}</p>` : ''}
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Last Updated: ${new Date(itemData.updated_at).toLocaleString()}</p>
                                ${itemData.tags && Array.isArray(itemData.tags) && itemData.tags.length > 0 ? `<div class="mb-3">${itemData.tags.map(tag => `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full mr-1 mb-1 inline-block">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                                ${itemData.summary ? `<div class="mb-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"><h5 class="font-semibold text-sm mb-1">Summary:</h5>${escapeHTML(itemData.summary)}</div>` : ''}
                                <hr class="my-4 dark:border-gray-600">
                                <h5 class="font-semibold mb-2 text-gray-700 dark:text-gray-300">Details/Content:</h5>
                                <div class="prose dark:prose-invert max-w-none p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900/30">${itemData.content || '<p>No detailed content provided.</p>'}</div>
                             </div>`;
            }
            openModal(title, contentHTML);
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Re-apply theme for modal content marks

            if (supabase && currentUser) {
                const { error: logError } = await supabase.from('views_log').insert({
                    user_email: currentUser.email,
                    section_id: sectionId,
                    item_id: itemId,
                    item_type: itemType,
                });
                if (logError) console.error('Error logging view:', logError);
            }

        } catch (error) {
            console.error('Error showing item details:', error);
            openModal('Error', `<p>Could not load details: ${error.message}</p>`);
        }
    }


    // --- Access Tracking Report ---
    async function renderAccessTrackingReport() {
        if (!accessTrackingReportContainer || !supabase || !currentUser) {
            if (accessTrackingReportContainer) {
                accessTrackingReportContainer.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-300">Access tracking unavailable.</p>';
                accessTrackingReportContainer.classList.remove('hidden');
            }
            return;
        }

        accessTrackingReportContainer.innerHTML = '<p class="text-center py-4">Loading access report...</p>';
        accessTrackingReportContainer.classList.remove('hidden');

        try {
            const { data: logs, error } = await supabase
                .from('views_log')
                .select(`
                    user_email,
                    section_id,
                    item_id,
                    item_type,
                    viewed_at
                `)
                .order('viewed_at', { ascending: false })
                .limit(10); // Keep limit reasonable

            if (error) throw error;

            if (!logs || logs.length === 0) {
                accessTrackingReportContainer.innerHTML = '<div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg card-animate"><h3 class="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Access Tracking</h3><p class="text-gray-600 dark:text-gray-300">No access activity recorded yet.</p></div>';
                return;
            }

            let reportHTML = `<div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg card-animate">
                                <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Access Activity</h3>
                                <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead class="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item Type</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item/Section</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Viewed At</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">`;

            for (const log of logs) {
                let itemName = log.item_id || 'N/A';
                const sectionInfo = kbSystemData.sections.find(s => s.id === log.section_id);
                let sectionName = sectionInfo ? sectionInfo.name : (log.section_id || 'Unknown Section');

                if (log.item_type === 'article' && sectionInfo && sectionInfo.articles) {
                    const article = sectionInfo.articles.find(a => a.id === log.item_id);
                    if (article) itemName = article.title;
                } else if (log.item_type === 'item' && sectionInfo && sectionInfo.items) {
                    const item = sectionInfo.items.find(i => i.id === log.item_id);
                    if (item) itemName = item.title;
                } else if (log.item_type === 'case' && log.item_id) {
                     // For cases, we could fetch title from Supabase, but to avoid N+1 here,
                     // we'll show ID. If titles are crucial, join in the initial query or batch fetch.
                     itemName = `Case: ${log.item_id.substring(0,8)}...`;
                } else if (log.item_type === 'section_match' || !log.item_id) {
                    itemName = sectionName;
                }


                reportHTML += `<tr>
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${escapeHTML(log.user_email)}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${escapeHTML(log.item_type.replace(/_/g, ' '))}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300" title="${log.item_id || 'N/A'} in ${sectionName}">${truncateText(escapeHTML(itemName), 40)}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${new Date(log.viewed_at).toLocaleString()}</td>
                               </tr>`;
            }
            reportHTML += `</tbody></table></div></div>`;
            accessTrackingReportContainer.innerHTML = reportHTML;
            const animatedCard = accessTrackingReportContainer.querySelector('.card-animate');
            if(animatedCard) animatedCard.style.setProperty('animation-delay', '0.4s');

        } catch (error) {
            console.error('Error rendering access tracking report:', error);
            accessTrackingReportContainer.innerHTML = '<div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"><h3 class="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Access Tracking</h3><p class="text-red-500">Could not load access report.</p></div>';
        }
    }


    // --- Add/Edit Case Modal & Logic (Supabase Integrated) ---
    async function openCaseModal(sectionId, caseIdToEdit = null) {
        if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role) || !supabase) {
            showToast('Access denied or Supabase not available.', 'error');
            return;
        }

        const modalTitle = caseIdToEdit ? 'Edit Case' : 'Add New Case';
        let caseData = { title: '', summary: '', content: '', status: (typeof caseStatusOptions !== 'undefined' && caseStatusOptions.length > 0 ? caseStatusOptions[0] : 'New'), tags: [] };

        if (caseIdToEdit) {
            const { data, error } = await supabase.from('cases').select('*').eq('id', caseIdToEdit).single();
            if (error || !data) {
                showToast('Failed to load case data for editing.', 'error');
                console.error("Error loading case for edit:", error);
                return;
            }
            caseData = data;
            // Ensure tags is an array for proper join
            if (caseData.tags && !Array.isArray(caseData.tags)) {
                caseData.tags = typeof caseData.tags === 'string' ? caseData.tags.split(',').map(t => t.trim()) : [];
            } else if (!caseData.tags) {
                caseData.tags = [];
            }
        }

        // Use caseStatusOptions from data.js if available
        const statusesToUse = (typeof caseStatusOptions !== 'undefined' && caseStatusOptions.length > 0)
            ? caseStatusOptions
            : ['New', 'Pending Investigation', 'Active', 'Resolved', 'Closed']; // Fallback statuses

        let statusOptionsHTML = statusesToUse.map(s => `<option value="${s}" ${caseData.status === s ? 'selected' : ''}>${s}</option>`).join('');


        const contentHTML = `
            <form id="caseForm" class="space-y-4">
                <div>
                    <label for="caseTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input type="text" id="caseTitle" name="caseTitle" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" value="${escapeHTML(caseData.title)}" required>
                </div>
                <div>
                    <label for="caseSummary" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Summary</label>
                    <textarea id="caseSummary" name="caseSummary" rows="3" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" required>${escapeHTML(caseData.summary)}</textarea>
                </div>
                <div>
                    <label for="caseStatus" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select id="caseStatus" name="caseStatus" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5">
                        ${statusOptionsHTML}
                    </select>
                </div>
                <div>
                    <label for="caseTags" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
                    <input type="text" id="caseTags" name="caseTags" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" value="${caseData.tags ? escapeHTML(caseData.tags.join(', ')) : ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Content/Resolution Steps</label>
                    <div id="quillEditorContainer" class="mt-1 rounded-md shadow-sm">
                         <div id="quillEditor"></div> <!-- Quill will attach here -->
                    </div>
                </div>
            </form>
        `;
        const actionsHTML = `
            <button id="cancelCaseBtn" type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
            <button id="saveCaseBtn" type="button" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">${caseIdToEdit ? 'Update' : 'Save'} Case</button>
        `;
        openModal(modalTitle, contentHTML, actionsHTML);

        // Initialize Quill
        activeQuillEditor = new Quill('#quillEditor', {
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'blockquote', 'code-block'], [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    ['clean']
                ]
            },
            theme: 'snow',
            placeholder: 'Enter detailed content, steps, logs etc. Use HTML or rich text formatting.'
        });
        if (caseData.content) {
            activeQuillEditor.root.innerHTML = caseData.content; // Set existing HTML content
        }

        document.getElementById('cancelCaseBtn').addEventListener('click', closeModal);
        document.getElementById('saveCaseBtn').addEventListener('click', async () => {
            const title = document.getElementById('caseTitle').value.trim();
            const summary = document.getElementById('caseSummary').value.trim();
            const status = document.getElementById('caseStatus').value;
            const content = activeQuillEditor.root.innerHTML; // Get HTML content from Quill
            const tagsString = document.getElementById('caseTags').value.trim();
            const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];


            if (!title || !summary) {
                showToast('Title and Summary are required.', 'error');
                return;
            }

            const casePayload = {
                section_id: sectionId, // Make sure your 'cases' table has this column
                title,
                summary,
                content, // Store HTML content
                status,
                tags, // Supabase typically stores arrays as JSONB or text[]
                // assigned_to: caseData.assigned_to || null, // Preserve or set assignment
                created_by: caseIdToEdit ? caseData.created_by : currentUser.email,
                updated_at: new Date().toISOString()
            };

            let responseData, dbError, actionType;

            try {
                if (caseIdToEdit) {
                    actionType = 'update_case';
                    const { data, error } = await supabase.from('cases').update(casePayload).eq('id', caseIdToEdit).select().single();
                    responseData = data;
                    dbError = error;
                } else {
                    actionType = 'create_case';
                    casePayload.created_at = new Date().toISOString(); // Set created_at only for new cases
                    const { data, error } = await supabase.from('cases').insert(casePayload).select().single();
                    responseData = data;
                    dbError = error;
                }

                if (dbError) throw dbError;

                showToast(`Case successfully ${caseIdToEdit ? 'updated' : 'added'}!`, 'success');
                closeModal();

                const itemId = responseData ? responseData.id : (caseIdToEdit || null);
                if (itemId && currentUser) {
                    await supabase.from('activity_log').insert({ // Assuming 'activity_log' table exists
                        user_email: currentUser.email,
                        action: actionType,
                        item_id: itemId,
                        item_type: 'case',
                        details: { title: title, section: sectionId, status: status }
                    });
                }
                handleSectionTrigger(sectionId, itemId); // Refresh section, focus on the case
            } catch (err) {
                showToast(`Error saving case: ${err.message}`, 'error');
                console.error("Error saving case:", err);
            }
        });
    }

    // --- Add/Edit Subsection Modal & Logic (Supabase Integrated) ---
    async function openSubsectionModal(sectionId, subsectionIdToEdit = null) {
        if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role) || !supabase) {
            showToast('Access denied or Supabase not available.', 'error');
            return;
        }
        const modalTitle = subsectionIdToEdit ? 'Edit Subsection' : 'Add New Subsection';
        let subsectionData = { name: '', description: '' };

        if (subsectionIdToEdit) {
            const { data, error } = await supabase.from('sub_categories').select('*').eq('id', subsectionIdToEdit).single();
            if (error || !data) {
                showToast('Failed to load subsection data.', 'error');
                console.error("Error loading subsection for edit:", error);
                return;
            }
            subsectionData = data;
        }

        const contentHTML = `
            <form id="subsectionForm" class="space-y-4">
                <div>
                    <label for="subsectionName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input type="text" id="subsectionName" name="subsectionName" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm p-2" value="${escapeHTML(subsectionData.name)}" required>
                </div>
                <div>
                    <label for="subsectionDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                    <textarea id="subsectionDescription" name="subsectionDescription" rows="3" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm p-2">${escapeHTML(subsectionData.description || '')}</textarea>
                </div>
            </form>
        `;
        const actionsHTML = `
            <button id="cancelSubsectionBtn" type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
            <button id="saveSubsectionBtn" type="button" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">${subsectionIdToEdit ? 'Update' : 'Save'} Subsection</button>
        `;
        openModal(modalTitle, contentHTML, actionsHTML);

        document.getElementById('cancelSubsectionBtn').addEventListener('click', closeModal);
        document.getElementById('saveSubsectionBtn').addEventListener('click', async () => {
            const name = document.getElementById('subsectionName').value.trim();
            const description = document.getElementById('subsectionDescription').value.trim();

            if (!name) {
                showToast('Subsection Name is required.', 'error');
                return;
            }
            const subsectionPayload = {
                section_id: sectionId, // Ensure your 'sub_categories' table has this
                name,
                description,
                created_by: subsectionIdToEdit ? subsectionData.created_by : currentUser.email,
                updated_at: new Date().toISOString()
            };

            let responseData, dbError, actionType;
            try {
                if (subsectionIdToEdit) {
                    actionType = 'update_subsection';
                    const { data, error } = await supabase.from('sub_categories').update(subsectionPayload).eq('id', subsectionIdToEdit).select().single();
                    responseData = data;
                    dbError = error;
                } else {
                    actionType = 'create_subsection';
                    subsectionPayload.created_at = new Date().toISOString();
                    const { data, error } = await supabase.from('sub_categories').insert(subsectionPayload).select().single();
                    responseData = data;
                    dbError = error;
                }

                if (dbError) throw dbError;

                showToast(`Subsection successfully ${subsectionIdToEdit ? 'updated' : 'added'}!`, 'success');
                closeModal();

                const itemId = responseData ? responseData.id : (subsectionIdToEdit || null);
                 if (itemId && currentUser) {
                    await supabase.from('activity_log').insert({
                        user_email: currentUser.email,
                        action: actionType,
                        item_id: itemId, // This is the subsection's ID
                        item_type: 'subsection',
                        details: { name: name, section: sectionId }
                    });
                }
                // Refresh current section, potentially highlighting the new/updated subcategory list
                handleSectionTrigger(sectionId, null, itemId);
            } catch (err) {
                showToast(`Error saving subsection: ${err.message}`, 'error');
                console.error("Error saving subsection:", err);
            }
        });
    }


    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        if (typeof kbSystemData === 'undefined') {
            console.error('[app.js - FIX] kbSystemData (static) undefined in handleSectionTrigger!');
            // Potentially show an error to the user or try to fetch primary sections if those are also dynamic
            return;
        }
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId, itemId, subCategoryFilter); // This is async
        
        let hash = sectionId || 'home';
        if (subCategoryFilter) {
            hash += `/${subCategoryFilter}`;
            if (itemId) { // If an item is also specified within a subcategory
                hash += `/${itemId}`;
            }
        } else if (itemId) {
            hash += `/${itemId}`;
        }
        window.history.replaceState(null, '', `#${hash}`);
    }

    function parseHash() {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return { sectionId: 'home', itemId: null, subCategoryFilter: null };

        const parts = hash.split('/');
        const sectionId = parts[0] || 'home';
        let itemId = null;
        let subCategoryFilter = null;

        // Logic to differentiate between #section/item and #section/subcategory and #section/subcategory/item
        if (parts.length === 2) {
            // Could be an item ID or a subcategory ID.
            // We need a way to distinguish. For now, assume it could be an item OR a subcategory.
            // displaySectionContent will need to handle this ambiguity, or we rely on specific data attributes from links.
            // Let's assume parts[1] is itemId if no subCategoryFilter is explicitly set by other means.
            // If it's a subcategory, links should ideally set data-subcat-filter.
            // A common pattern: if parts[1] is found in sub_categories for sectionId, it's a subCat. Otherwise, an item.
            // This check would be better inside displaySectionContent or if handleSectionTrigger becomes async and checks.
            // For now, we'll pass it and let displaySectionContent determine.
            // Let's assume the second part is an item ID unless a subCategoryFilter has already been determined (e.g. from a specific link).
            itemId = parts[1]; // Could also be a subcategory ID if the link structure implies it.
                               // For direct URL parsing, it's ambiguous without checking DB or kbSystemData.subCategories.
        } else if (parts.length === 3) {
            // Assumed structure: #sectionId/subCategoryId/itemId
            subCategoryFilter = parts[1];
            itemId = parts[2];
        }
        // This parsing is basic. A more robust solution might involve checking parts[1] against known subcategory IDs for the given sectionId.
        // For instance, if kbSystemData.sections[sectionId].subCategories.find(sc => sc.id === parts[1]), then it's a subcategory.
        // However, subCategories might now come from Supabase, so this check becomes async.

        return { sectionId, itemId, subCategoryFilter };
    }


    // Sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            if (sectionId) {
                handleSectionTrigger(sectionId, null, null); // Default to section view without specific item or subcat
            }
        });
    });

    // Body click listener for dynamic links
    document.body.addEventListener('click', async function(e) {
        const actionTarget = e.target.closest('[data-action]');
        if (actionTarget) {
            e.preventDefault(); // Prevent default for all actions handled here
            const action = actionTarget.dataset.action;
            const itemId = actionTarget.dataset.itemId;
            const itemType = actionTarget.dataset.itemType;
            const sectionId = actionTarget.dataset.sectionId;
            const caseId = actionTarget.dataset.caseId;
            const subsectionId = actionTarget.dataset.subsectionId;

            if (action === 'view-details' && itemId && itemType && sectionId) {
                await showItemDetailsModal(itemId, itemType, sectionId);
            } else if (action === 'edit-case' && caseId && sectionId) {
                await openCaseModal(sectionId, caseId);
            } else if (action === 'edit-subsection' && subsectionId && sectionId) {
                await openSubsectionModal(sectionId, subsectionId);
            }
            return; // Action handled, no further processing for this click
        }


        const sectionTriggerTarget = e.target.closest('[data-section-trigger]');
        if (sectionTriggerTarget) {
            e.preventDefault();
            const sectionId = sectionTriggerTarget.dataset.sectionTrigger;
            // itemId from data-item-id could be an actual item's ID or a subcategory's ID if the link is for a subcategory.
            const itemIdFromLink = sectionTriggerTarget.dataset.itemId;
            const subCatFilterFromLink = sectionTriggerTarget.dataset.subcatFilter; // Explicit subcategory filter

            if (sectionId) {
                // If subCatFilter is explicitly set, use it. itemIdFromLink would be for an item within that subcategory.
                // If only itemIdFromLink is set, it might be an item OR a subcategory.
                // The handleSectionTrigger will receive these; displaySectionContent needs to be smart.
                handleSectionTrigger(sectionId, itemIdFromLink, subCatFilterFromLink);

                if (globalSearchInput && searchResultsContainer && sectionTriggerTarget.closest('#searchResultsContainer, #sectionSearchResults')) {
                    searchResultsContainer.classList.add('hidden');
                    if(pageContent.querySelector('#sectionSearchResults')) pageContent.querySelector('#sectionSearchResults').innerHTML = '';
                    globalSearchInput.value = '';
                }
            }
            return; // Section trigger handled
        }

        // This was for home page specific quick links.
        // data-subcat-trigger="support.tools" implies sectionId=support, subCategoryFilter=tools
        // This can be handled by the general data-section-trigger and data-subcat-filter logic above
        // if those links are updated to use data-section-trigger="support" data-subcat-filter="tools_guides" (matching ID in sub_categories)
        const homeSubcatTrigger = e.target.closest('[data-subcat-trigger]'); // Example: data-subcat-trigger="support.tools_guides"
        if (homeSubcatTrigger) { // Ensure this doesn't conflict with the more general data-section-trigger
            // Check if we are on the home page, or if this is a specific type of link
            // that should always behave this way.
            // The current HTML for home quick links uses data-section-trigger and data-subcat-filter, so this specific block might be redundant
            // or needs to be carefully scoped.
            // For now, let's assume the data-section-trigger logic above is preferred.
            // If you have links ONLY with data-subcat-trigger like `support.tools_guides`, this would be needed:
            /*
            e.preventDefault();
            const triggerValue = homeSubcatTrigger.dataset.subcatTrigger;
            if (triggerValue && triggerValue.includes('.')) {
                const [parsedSectionId, parsedSubId] = triggerValue.split('.');
                handleSectionTrigger(parsedSectionId, null, parsedSubId);
            }
            return;
            */
        }
    });

    // Global Search (searchKb needs update for Supabase data)
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    let searchDebounceTimer;

    if (globalSearchInput && searchResultsContainer) {
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length > 1 && typeof searchKb === 'function') {
                    // IMPORTANT: searchKb currently only searches kbSystemData.
                    // For full Supabase integration, searchKb needs to be async and query Supabase tables
                    // or you implement a server-side search endpoint.
                    // For now, results will be from static data only.
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

            // If search result is a subcategory from kbSystemData, its ID for filtering
            if (result.type === 'sub_category_match_static') { // Assuming searchKb can identify static subcategories
                a.dataset.subcatFilter = result.id;
            } else if (result.type !== 'section_match' && result.type !== 'glossary_term') {
                 a.dataset.itemId = result.id;
            }


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
            sectionDiv.textContent = `In: ${escapeHTML(result.sectionName || 'Unknown')}`; // sectionName comes from searchKb result
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
        results.slice(0, 5).forEach(result => { // Display top 5 results in section search
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `javascript:void(0);`;
            a.dataset.sectionTrigger = result.sectionId;

            if (result.type === 'sub_category_match_static') {
                a.dataset.subcatFilter = result.id;
            } else if (result.type !== 'section_match' && result.type !== 'glossary_term') {
                a.dataset.itemId = result.id;
            }

            a.className = `block p-3 bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md shadow-sm border-l-4 ${theme.border} transition-all quick-link-button`;

            const titleDiv = document.createElement('div');
            titleDiv.className = `font-semibold ${theme.text}`;
            titleDiv.innerHTML = highlightText(result.title, query);
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 80), query) : 'Click to view.';
            const typeBadge = document.createElement('span');
            typeBadge.className = `text-xs ${theme.tagBg} ${theme.tagText} px-2 py-0.5 rounded-full mr-2 font-medium`;
            typeBadge.textContent = result.type.replace(/_/g, ' ').replace('match static', '').trim(); // Clean up type name
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
        pageContent.addEventListener('click', async (e) => {
            const ratingTarget = e.target.closest('.rating-btn');
            if (ratingTarget) {
                e.preventDefault();
                const ratingContainer = ratingTarget.closest('.rating-container');
                if (ratingContainer) ratingContainer.innerHTML = `<span class="text-xs text-green-500">Thanks for your feedback!</span>`;
                // Here you could log the rating to Supabase if desired
                // const itemId = ratingTarget.dataset.itemId;
                // const itemType = ratingTarget.dataset.itemType;
                // const rating = ratingTarget.dataset.rating;
                // Log rating logic...
                return;
            }
            const sectionSearchBtn = e.target.closest('#sectionSearchBtn');
            if (sectionSearchBtn) {
                e.preventDefault();
                const input = pageContent.querySelector('#sectionSearchInput');
                const currentSectionId = input?.dataset.sectionId;
                const query = input?.value.trim();
                if (query && query.length > 1 && typeof searchKb === 'function' && currentSectionId) {
                    // As mentioned, searchKb needs update for Supabase dynamic data.
                    const results = searchKb(query); // This searches static kbSystemData
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
    }

    // Handle URL hash on page load and hash change
    window.addEventListener('hashchange', () => {
        const { sectionId: newSectionId, itemId: newItemId, subCategoryFilter: newSubCategoryFilter } = parseHash();
        console.log('[app.js - FIX] Hash changed:', { newSectionId, newItemId, newSubCategoryFilter });
        handleSectionTrigger(newSectionId || 'home', newItemId, newSubCategoryFilter);
    });

    // Initial load with hash support
    const { sectionId: initialSectionId, itemId: initialItemId, subCategoryFilter: initialSubCategoryFilter } = parseHash();
    console.log('[app.js - FIX] Initial hash load:', { initialSectionId, initialItemId, initialSubCategoryFilter });
    handleSectionTrigger(initialSectionId || 'home', initialItemId, initialSubCategoryFilter);


    console.log('[app.js - FIX] All initializations complete.');
});
