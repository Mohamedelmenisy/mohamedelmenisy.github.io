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
            // window.location.href = 'login.html';
            // return;
        }
    }

    let currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    
    if (currentUser) {
        try {
            console.log('[app.js - FIX] Fetching user role for:', currentUser.email);
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('role')
                .eq('email', currentUser.email)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116: "single" row not found
                console.error('[app.js - FIX] Error fetching user profile:', profileError);
                currentUser.role = 'viewer'; // Default on error
            } else if (userProfile) {
                currentUser.role = userProfile.role;
                console.log('[app.js - FIX] User role set to:', currentUser.role);
            } else {
                currentUser.role = 'viewer'; // Default if no profile found
                console.warn('[app.js - FIX] No user profile found in Supabase for role, defaulting to viewer.');
            }
        } catch (e) {
            console.error('[app.js - FIX] Exception fetching user role:', e);
            currentUser.role = 'viewer';
        }
    } else {
        // If currentUser is null after Auth checks, it means user is not authenticated
        // and protectPage or Auth.logout should have redirected.
        // If we reach here and currentUser is null, something is wrong with auth flow.
        console.error('[app.js - FIX] CRITICAL: currentUser is null after authentication checks. Auth flow issue.');
        // It's possible protectPage() or Auth.logout() initiated a redirect but script execution continued.
        // Depending on browser behavior, a return here might be redundant but safe.
        return;
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
        if (!toastNotification || !toastMessage) return;
        toastMessage.textContent = message;
        toastNotification.classList.remove('hidden', 'bg-green-500', 'bg-red-500', 'bg-blue-500');
        if (type === 'success') {
            toastNotification.classList.add('bg-green-500');
        } else if (type === 'error') {
            toastNotification.classList.add('bg-red-500');
        } else {
            toastNotification.classList.add('bg-blue-500'); // Info
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
    let activeQuillEditor = null; // To store the Quill instance for the active modal

    function openModal(title, contentHTML, actionsHTML = '') {
        if (!genericModal || !modalTitleEl || !modalContentEl || !modalActionsEl) {
            console.error('Modal elements not found');
            return;
        }
        modalTitleEl.textContent = title;
        modalContentEl.innerHTML = contentHTML;
        if (actionsHTML) {
            modalActionsEl.innerHTML = actionsHTML;
            modalActionsEl.classList.remove('hidden');
        } else {
            modalActionsEl.innerHTML = '';
            modalActionsEl.classList.add('hidden');
        }
        genericModal.classList.remove('hidden');
        // Trap focus within modal - basic implementation
        // Consider a more robust library for accessibility if needed
        const focusableElements = genericModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length) focusableElements[0].focus();
    }

    function closeModal() {
        if (activeQuillEditor) {
            // If you need to do any cleanup specific to Quill, do it here
            // For example, if Quill was dynamically created and needs to be destroyed
            // However, if the #quillEditor div is part of modalContentEl's innerHTML,
            // it will be removed when modalContentEl is cleared.
            activeQuillEditor = null; 
        }
        if (genericModal) genericModal.classList.add('hidden');
        modalContentEl.innerHTML = ''; // Clear content to avoid issues with Quill re-initialization
        modalActionsEl.innerHTML = '';
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    // Close modal on escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !genericModal.classList.contains('hidden')) {
            closeModal();
        }
    });
     // Close modal if clicked outside content
    if (genericModal) {
        genericModal.addEventListener('click', (event) => {
            if (event.target === genericModal) { // Check if the click is on the backdrop itself
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
            // Replace alert with a more sophisticated reporting mechanism if desired
            showToast(`Reporting issue for: ${sectionTitleText} (Placeholder)`, 'info');
            // Example: You could open a mailto link or a dedicated feedback modal
            // window.location.href = `mailto:support@example.com?subject=Issue Report: ${sectionTitleText}&body=Page URL: ${pageUrl}%0A%0ADescribe the issue:`;
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

    const initialPageContent = pageContent ? pageContent.innerHTML : '<p>Error: pageContent missing on load.</p>'; // Keep the static welcome content for home

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
        // MODIFIED: Read More link to trigger modal
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
        // MODIFIED: Open link to trigger modal
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
        // MODIFIED: Details link to trigger modal. Use caseItem.id (which should be UUID from Supabase if isSupabaseCase is true)
        const itemId = isSupabaseCase ? caseItem.id : caseItem.id; // caseItem.id is already the Supabase ID if fetched from there

        let actions = '';
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin')) {
            actions += `<button data-action="edit-case" data-case-id="${itemId}" data-section-id="${sectionData.id}" class="text-xs text-blue-500 hover:underline mr-2"><i class="fas fa-edit"></i> Edit</button>`;
            // Add delete button if needed later
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
                ${caseItem.resolutionStepsPreview ? `<p class="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">Steps: ${escapeHTML(caseItem.resolutionStepsPreview)}</p>` : ''}
                ${caseItem.tags && caseItem.tags.length > 0 ? `<div class="mb-3">${caseItem.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
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
            if (pageContent) pageContent.innerHTML = '<p>Error: pageContent element not found.</p>';
            return;
        }
         if (accessTrackingReportContainer) accessTrackingReportContainer.classList.add('hidden'); // Hide access tracking by default

        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js - FIX] kbSystemData is UNDEFINED.');
            pageContent.innerHTML = '<p>Error: Data missing.</p>';
            return;
        }

        if (sectionId === 'home') {
            pageContent.innerHTML = initialPageContent; // Restore original home content
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Welcome';
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            const welcomeUserEl = document.getElementById('welcomeUserName'); // Re-fetch after innerHTML change
            if (currentUser && welcomeUserEl) welcomeUserEl.textContent = `Welcome, ${currentUser.fullName || currentUser.email}!`;
            
            const kbVersionEl = document.getElementById('kbVersion'); // Re-fetch
            const lastKbUpdateEl = document.getElementById('lastKbUpdate'); // Re-fetch
            if (kbSystemData.meta) {
                if (kbVersionEl) kbVersionEl.textContent = kbSystemData.meta.version;
                if (lastKbUpdateEl) lastKbUpdateEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }

            const initialCards = pageContent.querySelectorAll('.grid > .card-animate');
            initialCards.forEach((card, index) => card.style.animationDelay = `${(index + 1) * 0.1}s`);
            
            await renderAccessTrackingReport(); // Display access tracking on home page

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

        // Section-specific actions (Add Case, Add Subsection)
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

        // Fetch and render cases from Supabase
        try {
            const { data: cases, error: casesError } = await supabase
                .from('cases')
                .select('*')
                .eq('section_id', sectionId)
                .order('created_at', { ascending: false });

            if (casesError) throw casesError;

            if (cases && cases.length > 0) {
                contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
                cases.forEach(caseItem => contentHTML += renderCaseCard_enhanced(caseItem, sectionData, true)); // Pass true for Supabase case
                contentHTML += `</div>`;
                hasContent = true;
            }
        } catch (error) {
            console.error(`[app.js - FIX] Error fetching cases for section ${sectionId}:`, error);
            contentHTML += `<p class="text-red-500">Error loading cases. Check console.</p>`;
        }
        
        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.items.forEach(item => contentHTML += renderItemCard_enhanced(item, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }

        // Fetch and render subcategories from Supabase
        try {
            const { data: subCategories, error: subCatError } = await supabase
                .from('sub_categories')
                .select('*')
                .eq('section_id', sectionId)
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
                hasContent = true; // Even if other content is missing, subcategories count
            }
        } catch (error) {
            console.error(`[app.js - FIX] Error fetching subcategories for section ${sectionId}:`, error);
            contentHTML += `<p class="text-red-500">Error loading sub-categories. Check console.</p>`;
        }

        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-book mr-3 ${theme.text}"></i> Glossary</h3><div class="space-y-4">`;
            sectionData.glossary.forEach(entry => contentHTML += `<div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow card-animate border-l-4 ${theme.border}"><strong class="${theme.text}">${escapeHTML(entry.term)}:</strong> ${escapeHTML(entry.definition)}</div>`);
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (!hasContent) { // Check if any content was actually rendered
            contentHTML += `<div class="p-10 text-center card-animate"><i class="fas fa-info-circle text-4xl text-gray-400 dark:text-gray-500 mb-4"></i><h3 class="text-xl font-semibold">No content yet</h3><p>Content for "${escapeHTML(sectionData.name)}" is being prepared, or no items match the current filter.</p></div>`;
        }
        contentHTML += `</div>`;

        pageContent.innerHTML = contentHTML;

        pageContent.querySelectorAll('.card-animate').forEach((card, index) => card.style.animationDelay = `${index * 0.07}s`);

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            let bcHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(sectionData.name)}</span>`;
            // If subCategoryFilter is active, try to find its name (assuming subCategories were fetched from Supabase)
            if (subCategoryFilter) {
                const subCategories = await supabase.from('sub_categories').select('name').eq('id', subCategoryFilter).eq('section_id', sectionId).single();
                if (subCategories.data) {
                     bcHTML += ` <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(subCategories.data.name)}</span>`;
                }
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
        
        // Add event listeners for new buttons
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
        if (!currentUser) return; // Should not happen if page is protected
        let title = 'Details';
        let contentHTML = '<p>Loading details...</p>';
        let itemData;

        try {
            const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
            if (!sectionData) throw new Error('Section data not found');

            if (itemType === 'article') {
                itemData = sectionData.articles.find(a => a.id === itemId);
                if (!itemData) throw new Error('Article not found');
                title = itemData.title;
                contentHTML = `<div class="modal-content-view">
                                 <h4 class="text-lg font-semibold mb-2">${escapeHTML(itemData.title)}</h4>
                                 <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Last Updated: ${new Date(itemData.lastUpdated).toLocaleDateString()}</p>
                                 ${itemData.tags && itemData.tags.length > 0 ? `<div class="mb-3">${itemData.tags.map(tag => `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full mr-1 mb-1 inline-block">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                                 <p class="mb-4">${escapeHTML(itemData.summary)}</p>`;
                // Attempt to fetch full content if contentPath is a relative HTML file path
                if (itemData.contentPath && itemData.contentPath.endsWith('.html')) {
                    try {
                        const response = await fetch(itemData.contentPath);
                        if (response.ok) {
                            const articleHtmlContent = await response.text();
                            // Basic sanitization placeholder - for production, use a robust library like DOMPurify
                            const sanitizedArticleHtml = articleHtmlContent; // TODO: Sanitize this HTML
                            contentHTML += `<hr class="my-4 dark:border-gray-600"><div class="prose dark:prose-invert max-w-none">${sanitizedArticleHtml}</div>`;
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
                const { data: caseDetail, error } = await supabase.from('cases').select('*').eq('id', itemId).single();
                if (error || !caseDetail) throw error || new Error('Case not found in Supabase');
                itemData = caseDetail;
                title = itemData.title;
                contentHTML = `<div class="modal-content-view">
                                <h4 class="text-lg font-semibold mb-2">${escapeHTML(itemData.title)}</h4>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Status: <span class="font-semibold ${getThemeColors(sectionData.themeColor).statusText} px-2 py-0.5 rounded-full ${getThemeColors(sectionData.themeColor).statusBg}">${escapeHTML(itemData.status)}</span></p>
                                ${itemData.assigned_to ? `<p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigned to: ${escapeHTML(itemData.assigned_to)}</p>` : ''}
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Last Updated: ${new Date(itemData.updated_at).toLocaleString()}</p>
                                ${itemData.tags && itemData.tags.length > 0 ? `<div class="mb-3">${itemData.tags.map(tag => `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full mr-1 mb-1 inline-block">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                                ${itemData.summary ? `<p class="mb-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">${escapeHTML(itemData.summary)}</p>` : ''}
                                <hr class="my-4 dark:border-gray-600">
                                <h5 class="font-semibold mb-2 text-gray-700 dark:text-gray-300">Details/Content:</h5>
                                <div class="prose dark:prose-invert max-w-none p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900/30">${itemData.content || '<p>No detailed content provided.</p>'}</div>
                             </div>`; // Assuming itemData.content is HTML
            }
            openModal(title, contentHTML);

            // Log view to Supabase
            const { error: logError } = await supabase.from('views_log').insert({
                user_email: currentUser.email,
                section_id: sectionId,
                item_id: itemId,
                item_type: itemType,
            });
            if (logError) console.error('Error logging view:', logError);

        } catch (error) {
            console.error('Error showing item details:', error);
            openModal('Error', `<p>Could not load details: ${error.message}</p>`);
        }
    }

    // --- Access Tracking Report ---
    async function renderAccessTrackingReport() {
        if (!accessTrackingReportContainer) return;
        if (!currentUser) {
             accessTrackingReportContainer.innerHTML = '<p class="text-sm text-gray-500">Login to see access tracking.</p>';
             accessTrackingReportContainer.classList.remove('hidden');
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
                .limit(20); // Limit for performance

            if (error) throw error;

            if (!logs || logs.length === 0) {
                accessTrackingReportContainer.innerHTML = '<div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg card-animate"><h3 class="text-xl font-semibold mb-3">Access Tracking</h3><p>No access activity recorded yet.</p></div>';
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
                let itemName = log.item_id; // Default to ID
                // Try to find item name from kbSystemData or Supabase for context
                const sectionInfo = kbSystemData.sections.find(s => s.id === log.section_id);
                let sectionName = sectionInfo ? sectionInfo.name : log.section_id;

                if (log.item_type === 'article' && sectionInfo && sectionInfo.articles) {
                    const article = sectionInfo.articles.find(a => a.id === log.item_id);
                    if (article) itemName = article.title;
                } else if (log.item_type === 'item' && sectionInfo && sectionInfo.items) {
                    const item = sectionInfo.items.find(i => i.id === log.item_id);
                    if (item) itemName = item.title;
                } else if (log.item_type === 'case') {
                     // For cases, we could fetch title from Supabase, but to avoid N+1 queries here,
                     // we'll rely on ID or consider joining in the initial query if performance allows.
                     // For now, showing ID or a placeholder.
                     itemName = `Case ID: ${log.item_id.substring(0,8)}...`; // Show partial UUID
                } else if (log.item_type === 'section_match' || !log.item_id) { // If it's a section view
                    itemName = sectionName; // Item name is the section name itself
                }


                reportHTML += `<tr>
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${escapeHTML(log.user_email)}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${escapeHTML(log.item_type.replace('_', ' '))}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300" title="${log.item_id} in ${sectionName}">${truncateText(escapeHTML(itemName), 40)}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${new Date(log.viewed_at).toLocaleString()}</td>
                               </tr>`;
            }
            reportHTML += `</tbody></table></div></div>`;
            accessTrackingReportContainer.innerHTML = reportHTML;
            accessTrackingReportContainer.querySelector('.card-animate')?.style.setProperty('animation-delay', '0.4s');


        } catch (error) {
            console.error('Error rendering access tracking report:', error);
            accessTrackingReportContainer.innerHTML = '<div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"><h3 class="text-xl font-semibold mb-3">Access Tracking</h3><p class="text-red-500">Could not load access report.</p></div>';
        }
    }

    // --- Add/Edit Case Modal & Logic ---
    async function openCaseModal(sectionId, caseIdToEdit = null) {
        if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
            showToast('Access denied.', 'error');
            return;
        }

        const modalTitle = caseIdToEdit ? 'Edit Case' : 'Add New Case';
        let caseData = { title: '', summary: '', content: '', status: 'New', tags: [] }; // Default for new case

        if (caseIdToEdit) {
            const { data, error } = await supabase.from('cases').select('*').eq('id', caseIdToEdit).single();
            if (error || !data) {
                showToast('Failed to load case data for editing.', 'error');
                console.error("Error loading case for edit:", error);
                return;
            }
            caseData = data;
        }
        
        const caseStatuses = ['New', 'Pending Investigation', 'Active', 'Escalated to Tier 2', 'Awaiting Customer', 'Resolved', 'Closed'];
        let statusOptionsHTML = caseStatuses.map(s => `<option value="${s}" ${caseData.status === s ? 'selected' : ''}>${s}</option>`).join('');

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
            <button id="cancelCaseBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
            <button id="saveCaseBtn" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">${caseIdToEdit ? 'Update' : 'Save'} Case</button>
        `;
        openModal(modalTitle, contentHTML, actionsHTML);

        // Initialize Quill
        activeQuillEditor = new Quill('#quillEditor', {
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'blockquote', 'code-block'],
                    [{ 'align': [] }],
                    ['clean']
                ]
            },
            theme: 'snow',
            placeholder: 'Enter detailed content, steps, logs etc...'
        });
        if (caseData.content) {
            activeQuillEditor.root.innerHTML = caseData.content; // Set existing content
        }
        
        document.getElementById('cancelCaseBtn').addEventListener('click', closeModal);
        document.getElementById('saveCaseBtn').addEventListener('click', async () => {
            const title = document.getElementById('caseTitle').value.trim();
            const summary = document.getElementById('caseSummary').value.trim();
            const status = document.getElementById('caseStatus').value;
            const content = activeQuillEditor.root.innerHTML;
            const tagsString = document.getElementById('caseTags').value.trim();
            const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];


            if (!title || !summary) {
                showToast('Title and Summary are required.', 'error');
                return;
            }

            const casePayload = {
                section_id: sectionId,
                title,
                summary,
                content,
                status,
                tags,
                created_by: caseIdToEdit ? caseData.created_by : currentUser.email, // Preserve original creator on edit
                updated_at: new Date().toISOString() // Always update this
            };

            let response, error, actionType;

            if (caseIdToEdit) {
                actionType = 'update_case';
                ({ data: response, error } = await supabase.from('cases').update(casePayload).eq('id', caseIdToEdit).select());
            } else {
                actionType = 'create_case';
                casePayload.created_at = new Date().toISOString(); // Set created_at only for new cases
                ({ data: response, error } = await supabase.from('cases').insert(casePayload).select());
            }

            if (error) {
                showToast(`Error saving case: ${error.message}`, 'error');
                console.error("Error saving case:", error);
            } else {
                showToast(`Case successfully ${caseIdToEdit ? 'updated' : 'added'}!`, 'success');
                closeModal();
                // Log activity
                const itemId = response && response.length > 0 ? response[0].id : (caseIdToEdit || null);
                if (itemId) {
                    await supabase.from('activity_log').insert({
                        user_email: currentUser.email,
                        action: actionType,
                        item_id: itemId,
                        item_type: 'case',
                        details: { title: title, section: sectionId, status: status }
                    });
                }
                // Refresh current section view to show the new/updated case
                handleSectionTrigger(sectionId, itemId); 
            }
        });
    }
    
    // --- Add/Edit Subsection Modal & Logic ---
    async function openSubsectionModal(sectionId, subsectionIdToEdit = null) {
        if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
            showToast('Access denied.', 'error');
            return;
        }
        const modalTitle = subsectionIdToEdit ? 'Edit Subsection' : 'Add New Subsection';
        let subsectionData = { name: '', description: '' };

        if (subsectionIdToEdit) {
            const { data, error } = await supabase.from('sub_categories').select('*').eq('id', subsectionIdToEdit).single();
            if (error || !data) {
                showToast('Failed to load subsection data.', 'error');
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
                    <textarea id="subsectionDescription" name="subsectionDescription" rows="3" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm p-2">${escapeHTML(subsectionData.description)}</textarea>
                </div>
            </form>
        `;
        const actionsHTML = `
            <button id="cancelSubsectionBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
            <button id="saveSubsectionBtn" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">${subsectionIdToEdit ? 'Update' : 'Save'} Subsection</button>
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
                section_id: sectionId,
                name,
                description,
                created_by: subsectionIdToEdit ? subsectionData.created_by : currentUser.email,
                updated_at: new Date().toISOString()
            };

            let response, error, actionType;
            if (subsectionIdToEdit) {
                actionType = 'update_subsection';
                ({ data: response, error } = await supabase.from('sub_categories').update(subsectionPayload).eq('id', subsectionIdToEdit).select());
            } else {
                actionType = 'create_subsection';
                subsectionPayload.created_at = new Date().toISOString();
                ({ data: response, error } = await supabase.from('sub_categories').insert(subsectionPayload).select());
            }

            if (error) {
                showToast(`Error saving subsection: ${error.message}`, 'error');
            } else {
                showToast(`Subsection successfully ${subsectionIdToEdit ? 'updated' : 'added'}!`, 'success');
                closeModal();
                const itemId = response && response.length > 0 ? response[0].id : (subsectionIdToEdit || null);
                 if (itemId) {
                    await supabase.from('activity_log').insert({
                        user_email: currentUser.email,
                        action: actionType,
                        item_id: itemId,
                        item_type: 'subsection',
                        details: { name: name, section: sectionId }
                    });
                }
                handleSectionTrigger(sectionId, null, itemId); // Refresh current section, potentially focusing subcat list
            }
        });
    }

    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        if (typeof kbSystemData === 'undefined') {
            console.error('[app.js - FIX] kbSystemData undefined in handleSectionTrigger!');
            return;
        }
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId, itemId, subCategoryFilter); // This is now async
        const hash = itemId ? `${sectionId}/${itemId}` : subCategoryFilter ? `${sectionId}/${subCategoryFilter}` : sectionId;
        window.history.replaceState(null, '', `#${hash}`);
    }

    // Parse URL hash
    function parseHash() {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return { sectionId: 'home' };
        const parts = hash.split('/');
        const sectionId = parts[0];
        // Determine if the second part is an itemId or a subCategoryFilter
        // This can be ambiguous. Assuming itemIds might be UUIDs or specific format like 'sup001'
        // and subCategoryFilters might be simpler strings or also UUIDs if they come from DB.
        // For now, if there are three parts, assume section/subcat/item. If two, section/item_or_subcat.
        let itemId = null;
        let subCategoryFilter = null;

        if (parts.length === 2) {
            // Could be an item ID or a subcategory ID. Heuristic: check if it matches known item patterns or if subcats exist for this section.
            // This part is tricky without more context on ID formats.
            // Let's assume for now the second part is itemId if it's not explicitly a subcategory.
            // displaySectionContent will handle focusing or filtering.
            // For now, let's pass it as itemId, and if displaySectionContent determines it's a subCategory, it can adjust.
            // Or, a better approach: if a subCategory with this ID exists for the section, it's a subCategoryFilter.
            // This check needs to happen within displaySectionContent or handleSectionTrigger before calling displaySectionContent
            itemId = parts[1]; 
            // Let's refine: if parts[1] matches a subcategory ID for sectionId, it's a subCategoryFilter
            // This requires checking against fetched subcategories if routing directly to one
            // For simplicity on initial load, we might just pass it and let displaySectionContent figure it out
            // OR handleSectionTrigger could do an async check here before calling displaySectionContent
        } else if (parts.length > 2) { // e.g. section/subcat/item
            subCategoryFilter = parts[1];
            itemId = parts[2];
        }
         // A simple initial assignment; displaySectionContent can refine how it uses parts[1]
        if (parts.length === 2) {
             // If parts[1] looks like a subcategory ID (e.g., 'tools', 'cases') rather than a typical item ID (e.g., 'sup001', UUID)
             // This heuristic is weak. A better way is to check against actual subcategory IDs for that section.
             // For now, let's assume if it's not a UUID-like string or common item prefix, it might be subCategory.
             // The current logic in handleSectionTrigger passes it as itemId and lets displaySectionContent handle subCategoryFilter if itemIdToFocus is not found.
             // Let's stick to the original simpler parsing:
             itemId = parts[1]; // This was the original logic. SubCategoryFilter was the third part.
             // If the intent is section/subCategoryFilter, then:
             // subCategoryFilter = parts[1]; itemId = null;
             // Given the existing structure, let's assume parts[1] is itemId OR subCategoryFilter,
             // and parts[2] is an itemId if parts[1] was a subCategoryFilter.
             // Let's try this:
             if (parts.length === 2) itemId = parts[1]; // Could be item or subcategory
             if (parts.length === 3) { subCategoryFilter = parts[1]; itemId = parts[2]; }
        }

        return { sectionId, itemId, subCategoryFilter };
    }

    // Sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            if (sectionId) {
                handleSectionTrigger(sectionId);
            }
        });
    });

    // Body click listener for dynamic links
    document.body.addEventListener('click', async function(e) {
        const actionTarget = e.target.closest('[data-action]');
        if (actionTarget) {
            e.preventDefault();
            const action = actionTarget.dataset.action;
            const itemId = actionTarget.dataset.itemId;
            const itemType = actionTarget.dataset.itemType;
            const sectionId = actionTarget.dataset.sectionId;
            const caseId = actionTarget.dataset.caseId; // For edit case
            const subsectionId = actionTarget.dataset.subsectionId; // For edit subsection

            if (action === 'view-details') {
                if (itemId && itemType && sectionId) {
                    await showItemDetailsModal(itemId, itemType, sectionId);
                }
            } else if (action === 'edit-case' && caseId && sectionId) {
                await openCaseModal(sectionId, caseId);
            } else if (action === 'edit-subsection' && subsectionId && sectionId) {
                await openSubsectionModal(sectionId, subsectionId);
            }
            // ... other actions
            return; // Prevent falling through to section-trigger logic if an action was handled
        }


        const sectionTriggerTarget = e.target.closest('[data-section-trigger]');
        if (sectionTriggerTarget) {
            e.preventDefault();
            const sectionId = sectionTriggerTarget.dataset.sectionTrigger;
            const itemId = sectionTriggerTarget.dataset.itemId; // Can be item ID or subcategory ID
            const subCatFilter = sectionTriggerTarget.dataset.subcatFilter; // Explicit subcategory filter

            if (sectionId) {
                // If subCatFilter is explicitly set, use it.
                // Otherwise, itemId might be an actual item or a subcategory to filter by.
                // displaySectionContent needs to be smart about this.
                handleSectionTrigger(sectionId, itemId, subCatFilter);
                if (sectionTriggerTarget.closest('#searchResultsContainer')) {
                    if (searchResultsContainer) searchResultsContainer.classList.add('hidden');
                    if (globalSearchInput) globalSearchInput.value = '';
                }
            }
            return;
        }

        const homeSubcatTrigger = e.target.closest('[data-subcat-trigger]');
        if (homeSubcatTrigger && pageContent.querySelector('#welcomeUserName')) { // Check if on home page
            e.preventDefault();
            const triggerValue = homeSubcatTrigger.dataset.subcatTrigger;
            if (triggerValue && triggerValue.includes('.')) {
                const [sectionId, subId] = triggerValue.split('.');
                handleSectionTrigger(sectionId, null, subId); // Explicitly pass subId as subCategoryFilter
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
                    // searchKb needs to be aware of Supabase data or combine results
                    // For now, it uses kbSystemData. This needs enhancement for dynamic data.
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
            a.href = `javascript:void(0);`; // Will be handled by body click listener
            a.dataset.sectionTrigger = result.sectionId;
            if (result.type !== 'section_match' && result.type !== 'glossary_term') a.dataset.itemId = result.id;
            // If result.type is 'sub_category', then itemId should be the subcategory ID for filtering.
            // This logic needs to be consistent with how handleSectionTrigger interprets itemId vs subCatFilter.
            // If searchKb returns subcategories, their 'id' would be subcategory ID.
            // a.dataset.itemId = result.id; // this is fine, handleSectionTrigger will figure it out

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
            // Similar to global search, result.id would be subcategory ID if it's a subcategory search result
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
        pageContent.addEventListener('click', async (e) => { // Make async for searchKb if it becomes async
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
                    // searchKb function would need to be updated to search Supabase data as well for dynamic content
                    // For now, it searches kbSystemData.
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
    if (initialSectionId) { // Ensure there's a section ID to load
        handleSectionTrigger(initialSectionId || 'home', initialItemId, initialSubCategoryFilter);
    } else {
        handleSectionTrigger('home'); // Default to home if hash is empty or invalid
    }


    console.log('[app.js - FIX] All initializations complete.');
});
