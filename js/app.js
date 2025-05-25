// js/app.js (يجب أن يتم تحميله كـ type="module")
import { supabaseClient as supabase } from './supabase.js'; // استورد العميل المعاد تسميته

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[app.js] DOMContentLoaded fired.');

    // --- التحقق الأساسي من Supabase ---
    if (!supabase) {
        console.error("[app.js] CRITICAL: Supabase client is not available. Ensure supabase.js is loaded correctly and initializes supabaseClient.");
        // يمكنك عرض رسالة خطأ للمستخدم هنا في واجهة المستخدم
        const pageContentEl = document.getElementById('pageContent');
        if (pageContentEl) {
            pageContentEl.innerHTML = `<div class="p-8 text-center text-red-500">
                                        <h2 class="text-2xl font-bold">Application Error</h2>
                                        <p>Could not connect to the backend services. Please try again later or contact support.</p>
                                        <p class="text-sm mt-2">(Supabase client failed to initialize)</p>
                                     </div>`;
        }
        // أوقف التنفيذ إذا لم يكن Supabase متاحًا
        return;
    }
    console.log('[app.js] Supabase client loaded successfully.');


    // Debug: Check if kbSystemData is loaded
    console.log('[app.js - DEBUG] kbSystemData:', typeof kbSystemData !== 'undefined' ? kbSystemData : 'undefined');

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
    // هذا الجزء يعتمد على auth.js
    let authAvailable = typeof Auth !== 'undefined' &&
                        typeof Auth.isAuthenticated === 'function' &&
                        typeof Auth.getCurrentUser === 'function' &&
                        typeof Auth.logout === 'function';

    if (typeof protectPage === 'function') {
        console.log('[app.js] Calling protectPage().');
        protectPage();
    } else if (authAvailable) {
        if (!Auth.isAuthenticated()) {
            console.log('[app.js] Auth.isAuthenticated is false, calling Auth.logout().');
            Auth.logout(); // This should redirect
            return; // Stop further execution if redirected
        }
        console.log('[app.js] User is authenticated via Auth object.');
    } else {
        console.error('[app.js] CRITICAL: Authentication mechanism (Auth object or protectPage) not found. Check auth.js.');
        const pageContentEl = document.getElementById('pageContent');
        if (pageContentEl) {
            pageContentEl.innerHTML = `<div class="p-8 text-center text-red-500">
                                        <h2 class="text-2xl font-bold">Authentication Error</h2>
                                        <p>User authentication system is not available. Please contact support.</p>
                                     </div>`;
        }
        return; // Stop execution if auth system is missing
    }

    let currentUser = authAvailable ? Auth.getCurrentUser() : null;

    if (!currentUser) {
        console.error('[app.js] CRITICAL: currentUser is null even after authentication checks. Auth flow issue or auth.js failed.');
        // Auth.logout() or protectPage() should have redirected.
        // If we are here, something is very wrong with the auth flow.
        return;
    }

    // Fetch user role from Supabase
    try {
        console.log('[app.js] Fetching user role for:', currentUser.email);
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('email', currentUser.email)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('[app.js] Error fetching user profile from Supabase:', profileError);
            currentUser.role = 'viewer'; // Default role on error
        } else if (userProfile) {
            currentUser.role = userProfile.role;
            console.log('[app.js] User role set from Supabase to:', currentUser.role);
        } else {
            currentUser.role = 'viewer'; // Default role if no profile found
            console.warn('[app.js] No user profile found in Supabase for role, defaulting to viewer.');
        }
    } catch (e) {
        console.error('[app.js] Exception fetching user role from Supabase:', e);
        currentUser.role = 'viewer'; // Default role on exception
    }

    console.log('[app.js] Current user with role:', currentUser);


    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');

    const userDisplayName = currentUser.fullName || currentUser.email || 'User';
    if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
    if (welcomeUserName) welcomeUserName.textContent = `Welcome, ${userDisplayName}!`;


    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    } else {
        console.warn('[app.js] kbSystemData or kbSystemData.meta not available for version info.');
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
        modalContentEl.innerHTML = contentHTML;
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
            activeQuillEditor = null;
        }
        if (genericModal) genericModal.classList.add('hidden');
        if (modalContentEl) modalContentEl.innerHTML = '';
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
    if (logoutButton && authAvailable) {
        logoutButton.addEventListener('click', () => {
            Auth.logout();
        });
    }

    // --- Report an Error Button ---
    const reportErrorBtn = document.getElementById('reportErrorBtn');
    if (reportErrorBtn) {
        reportErrorBtn.addEventListener('click', () => {
            const sectionTitleText = currentSectionTitleEl ? currentSectionTitleEl.textContent : 'Current Page';
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
        const colorMap = { // (نفس كود colorMap من قبل)
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

    // --- دوال العرض (renderArticleCard_enhanced, renderItemCard_enhanced, renderCaseCard_enhanced) ---
    // (نفس الكود الذي قدمته سابقًا لهذه الدوال، مع التأكد من استخدام escapeHTML)
    // ... (الكود موجود في الرد السابق، أعد استخدامه هنا)
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

    function renderCaseCard_enhanced(caseItem, sectionData, isSupabaseCase = false) { // isSupabaseCase لتحديد مصدر الكيس
        const theme = getThemeColors(sectionData.themeColor);
        const caseIcon = 'fas fa-briefcase';
        const itemId = caseItem.id; // ID يأتي من Supabase أو من kbSystemData.cases

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


    // --- displaySectionContent, showItemDetailsModal, renderAccessTrackingReport ---
    // --- openCaseModal, openSubsectionModal ---
    // (نفس الكود الذي قدمته سابقًا لهذه الدوال، مع التأكد من استخدام supabase للبيانات الديناميكية)
    // ... (الكود موجود في الرد السابق، أعد استخدامه هنا مع التعديلات الطفيفة المذكورة في التعليقات)
    async function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        console.log(`[app.js] Displaying section: "${sectionId}", item: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);
        if (!pageContent) {
            console.error('[app.js] pageContent element is NULL.');
            return;
        }
         if (accessTrackingReportContainer) accessTrackingReportContainer.classList.add('hidden');

        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js] kbSystemData (static data for sections) is UNDEFINED.');
            pageContent.innerHTML = '<p class="text-center text-red-500">Error: Core application data (sections) missing.</p>';
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
             const userDisplayNameForHome = currentUser.fullName || currentUser.email || 'User';
            if (welcomeUserEl) welcomeUserEl.textContent = `Welcome, ${userDisplayNameForHome}!`;

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
            console.log('[app.js] Home page loaded.');
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center"><h2 class="text-xl font-semibold">Section not found</h2><p>"${escapeHTML(sectionId)}" does not exist in kbSystemData.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Not Found';
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);
        let contentHTML = `<div class="space-y-10">`;
        contentHTML += `<div class="flex justify-between items-center"><h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center"><span class="p-2.5 rounded-lg ${theme.iconContainer} mr-4 hidden sm:inline-flex"><i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i></span>${escapeHTML(sectionData.name)}</h2></div>`;
        contentHTML += `<p class="text-gray-600 dark:text-gray-300 mt-1 mb-6 text-lg">${escapeHTML(sectionData.description)}</p>`;

        if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
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
        // Articles from kbSystemData
        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.articles.forEach(article => contentHTML += renderArticleCard_enhanced(article, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }

        // Cases from Supabase
        try {
            const { data: cases, error: casesError } = await supabase
                .from('cases')
                .select('*')
                .eq('section_id', sectionId)
                .order('created_at', { ascending: false });

            if (casesError) throw casesError;

            if (cases && cases.length > 0) {
                contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
                cases.forEach(caseItem => {
                     if (caseItem.content && typeof caseItem.content === 'string') {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = caseItem.content; // Assumes content is HTML
                        caseItem.resolutionStepsPreview = truncateText(tempDiv.textContent || tempDiv.innerText || "", 150);
                    }
                    contentHTML += renderCaseCard_enhanced(caseItem, sectionData, true);
                });
                contentHTML += `</div>`;
                hasContent = true;
            }
        } catch (error) {
            console.error(`[app.js] Error fetching cases for section ${sectionId}:`, error);
            contentHTML += `<p class="text-red-500">Error loading cases from database. Check console.</p>`;
        }

        // Items from kbSystemData
        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.items.forEach(item => contentHTML += renderItemCard_enhanced(item, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }

        // Sub-Categories from Supabase
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
                     if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
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
            console.error(`[app.js] Error fetching subcategories for section ${sectionId}:`, error);
            contentHTML += `<p class="text-red-500">Error loading sub-categories from database. Check console.</p>`;
        }

        // Glossary from kbSystemData
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
            if (subCategoryFilter) {
                 try {
                    const { data: subCatInfo, error: subCatInfoError } = await supabase
                        .from('sub_categories')
                        .select('name')
                        .eq('id', subCategoryFilter)
                        .eq('section_id', sectionId)
                        .single();
                    if (subCatInfoError && subCatInfoError.code !== 'PGRST116') throw subCatInfoError; // Ignore if not found, but log other errors
                    if (subCatInfo) {
                        bcHTML += ` <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(subCatInfo.name)}</span>`;
                    } else if (sectionData.subCategories) { // Fallback to static data if Supabase didn't find it (e.g., if ID was from static link)
                        const staticSubCat = sectionData.subCategories.find(sc => sc.id === subCategoryFilter);
                        if (staticSubCat) bcHTML += ` <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(staticSubCat.name)}</span>`;
                    }
                } catch (err) {
                    console.warn("[app.js] Could not fetch subcategory name for breadcrumbs:", err);
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
            }, 200); // Delay to allow content rendering
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

    async function showItemDetailsModal(itemId, itemType, sectionId) {
        // (نفس الكود من الرد السابق)
        // ...
        if (!currentUser) {
            showToast("Authentication required to view details.", "error");
            return;
        }
        let title = 'Details';
        let contentHTML = '<p class="text-center py-4">Loading details...</p>';
        let itemData;

        try {
            const sectionData = kbSystemData.sections.find(s => s.id === sectionId); // kbSystemData for section theme/name
            if (!sectionData) throw new Error('Section data (static part) not found for modal');

            if (itemType === 'article') {
                itemData = sectionData.articles.find(a => a.id === itemId);
                if (!itemData) throw new Error('Article not found in kbSystemData');
                title = itemData.title;
                contentHTML = `<div class="modal-content-view">
                                 <h4 class="text-lg font-semibold mb-2">${escapeHTML(itemData.title)}</h4>
                                 <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Last Updated: ${new Date(itemData.lastUpdated).toLocaleDateString()}</p>
                                 ${itemData.tags && itemData.tags.length > 0 ? `<div class="mb-3">${itemData.tags.map(tag => `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full mr-1 mb-1 inline-block">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                                 <p class="mb-4">${escapeHTML(itemData.summary)}</p>`;
                if(itemData.details){ // Assuming 'details' field in kbSystemData.articles contains the main content
                     contentHTML += `<hr class="my-4 dark:border-gray-600"><div class="prose dark:prose-invert max-w-none">${itemData.details.replace(/\n/g, '<br>')}</div>`;
                }
                contentHTML += `</div>`;
            } else if (itemType === 'item') {
                itemData = sectionData.items.find(i => i.id === itemId);
                if (!itemData) throw new Error('Item not found in kbSystemData');
                title = itemData.title;
                contentHTML = `<div class="modal-content-view">
                                 <h4 class="text-lg font-semibold mb-2">${escapeHTML(itemData.title)}</h4>
                                 <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Type: <span class="font-medium">${escapeHTML(itemData.type)}</span></p>
                                 <p class="mb-4">${escapeHTML(itemData.description)}</p>
                                 <a href="${itemData.url}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">Open Item/File <i class="fas fa-external-link-alt ml-1"></i></a>
                               </div>`;
            } else if (itemType === 'case') {
                const { data: caseDetail, error } = await supabase.from('cases').select('*').eq('id', itemId).single();
                if (error) throw error;
                if (!caseDetail) throw new Error('Case not found in Supabase');
                itemData = caseDetail; // itemData is now the case from Supabase
                title = itemData.title;
                const caseTheme = getThemeColors(sectionData.themeColor); // Use section's theme for consistency

                contentHTML = `<div class="modal-content-view">
                                <h4 class="text-lg font-semibold mb-2">${escapeHTML(itemData.title)}</h4>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Status: <span class="font-semibold ${caseTheme.statusText} px-2 py-0.5 rounded-full ${caseTheme.statusBg}">${escapeHTML(itemData.status)}</span></p>
                                ${itemData.assigned_to ? `<p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Assigned to: ${escapeHTML(itemData.assigned_to)}</p>` : ''}
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Last Updated: ${new Date(itemData.updated_at).toLocaleString()}</p>
                                ${itemData.tags && Array.isArray(itemData.tags) && itemData.tags.length > 0 ? `<div class="mb-3">${itemData.tags.map(tag => `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full mr-1 mb-1 inline-block">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                                ${itemData.summary ? `<div class="mb-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"><h5 class="font-semibold text-sm mb-1">Summary:</h5>${escapeHTML(itemData.summary)}</div>` : ''}
                                <hr class="my-4 dark:border-gray-600">
                                <h5 class="font-semibold mb-2 text-gray-700 dark:text-gray-300">Details/Content:</h5>
                                <div class="prose dark:prose-invert max-w-none p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900/30">${itemData.content || '<p>No detailed content provided.</p>'}</div>
                             </div>`;
            } else {
                throw new Error(`Unknown itemType for modal: ${itemType}`);
            }

            openModal(title, contentHTML);
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');

            // Log view to Supabase
            const { error: logError } = await supabase.from('views_log').insert({
                user_email: currentUser.email,
                section_id: sectionId,
                item_id: itemId,
                item_type: itemType,
                // viewed_at is handled by default value in Supabase
            });
            if (logError) console.error('Error logging view:', logError);

        } catch (error) {
            console.error('Error showing item details:', error);
            openModal('Error', `<p>Could not load details: ${error.message}</p>`);
        }
    }

    async function renderAccessTrackingReport() {
        // (نفس الكود من الرد السابق)
        // ...
         if (!accessTrackingReportContainer) return;
        if (!currentUser) { // currentUser should be available here due to earlier checks
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
                .limit(10);

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
                let itemName = log.item_id || 'N/A'; // Default to ID or N/A
                const sectionInfo = kbSystemData.sections.find(s => s.id === log.section_id); // From static data
                let sectionName = sectionInfo ? sectionInfo.name : (log.section_id || 'Unknown Section');

                if (log.item_type === 'article' && sectionInfo && sectionInfo.articles) {
                    const article = sectionInfo.articles.find(a => a.id === log.item_id);
                    if (article) itemName = article.title;
                } else if (log.item_type === 'item' && sectionInfo && sectionInfo.items) {
                    const item = sectionInfo.items.find(i => i.id === log.item_id);
                    if (item) itemName = item.title;
                } else if (log.item_type === 'case' && log.item_id) {
                     itemName = `Case: ${log.item_id.substring(0,8)}...`; // Show partial UUID for cases
                } else if (log.item_type === 'section_match' || !log.item_id) { // If it's a section view or item_id is null
                    itemName = sectionName; // Item name is the section name itself
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
            accessTrackingReportContainer.innerHTML = '<div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"><h3 class="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Access Tracking</h3><p class="text-red-500">Could not load access report. Check console.</p></div>';
        }
    }
    async function openCaseModal(sectionId, caseIdToEdit = null) {
        // (نفس الكود من الرد السابق)
        // ...
         if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
            showToast('Access denied.', 'error');
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
            if (caseData.tags && !Array.isArray(caseData.tags)) {
                caseData.tags = typeof caseData.tags === 'string' ? caseData.tags.split(',').map(t => t.trim()) : [];
            } else if (!caseData.tags) {
                caseData.tags = [];
            }
        }

        const statusesToUse = (typeof caseStatusOptions !== 'undefined' && caseStatusOptions.length > 0)
            ? caseStatusOptions
            : ['New', 'Pending Investigation', 'Active', 'Resolved', 'Closed'];

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
                         <div id="quillEditor"></div>
                    </div>
                </div>
            </form>
        `;
        const actionsHTML = `
            <button id="cancelCaseBtn" type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
            <button id="saveCaseBtn" type="button" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">${caseIdToEdit ? 'Update' : 'Save'} Case</button>
        `;
        openModal(modalTitle, contentHTML, actionsHTML);

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
            activeQuillEditor.root.innerHTML = caseData.content;
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
                    casePayload.created_at = new Date().toISOString();
                    const { data, error } = await supabase.from('cases').insert(casePayload).select().single();
                    responseData = data;
                    dbError = error;
                }

                if (dbError) throw dbError;

                showToast(`Case successfully ${caseIdToEdit ? 'updated' : 'added'}!`, 'success');
                closeModal();

                const itemId = responseData ? responseData.id : (caseIdToEdit || null);
                if (itemId) { // Log only if there's an item ID
                    await supabase.from('activity_log').insert({
                        user_email: currentUser.email,
                        action: actionType,
                        item_id: itemId,
                        item_type: 'case',
                        details: { title: title, section: sectionId, status: status }
                    });
                }
                handleSectionTrigger(sectionId, itemId);
            } catch (err) {
                showToast(`Error saving case: ${err.message}`, 'error');
                console.error("Error saving case:", err);
            }
        });
    }
    async function openSubsectionModal(sectionId, subsectionIdToEdit = null) {
        // (نفس الكود من الرد السابق)
        // ...
         if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
            showToast('Access denied.', 'error');
            return;
        }
        const modalTitle = subsectionIdToEdit ? 'Edit Subsection' : 'Add New Subsection';
        let subsectionData = { name: '', description: '' };

        if (subsectionIdToEdit) {
            const { data, error } = await supabase.from('sub_categories').select('*').eq('id', subsectionIdToEdit).single();
            if (error || !data) {
                showToast('Failed to load subsection data for editing.', 'error');
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
                section_id: sectionId,
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
                 if (itemId) { // Log only if there's an item ID
                    await supabase.from('activity_log').insert({
                        user_email: currentUser.email,
                        action: actionType,
                        item_id: itemId,
                        item_type: 'subsection',
                        details: { name: name, section: sectionId }
                    });
                }
                handleSectionTrigger(sectionId, null, itemId); // Refresh section, focus on subcat list or the subcat
            } catch (err) {
                showToast(`Error saving subsection: ${err.message}`, 'error');
                console.error("Error saving subsection:", err);
            }
        });
    }

    // --- handleSectionTrigger, parseHash ---
    // (نفس الكود من الرد السابق لهذه الدوال)
    // ...
    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        if (typeof kbSystemData === 'undefined') {
            console.error('[app.js] kbSystemData (static sections definition) is undefined. Cannot trigger section.');
            return;
        }
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId, itemId, subCategoryFilter); // This is async

        let hash = sectionId || 'home';
        if (subCategoryFilter) {
            hash += `/${subCategoryFilter}`;
            if (itemId) {
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

        if (parts.length === 2) {
            // Could be an item ID or a subcategory ID. Heuristic: if it matches a static subcategory ID, treat as such.
            // This needs improvement if subcategories are purely dynamic.
            const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
            if (sectionData && sectionData.subCategories && sectionData.subCategories.some(sc => sc.id === parts[1])) {
                subCategoryFilter = parts[1];
            } else {
                itemId = parts[1];
            }
        } else if (parts.length === 3) {
            subCategoryFilter = parts[1];
            itemId = parts[2];
        }
        return { sectionId, itemId, subCategoryFilter };
    }


    // Sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            if (sectionId) {
                handleSectionTrigger(sectionId, null, null);
            }
        });
    });

    // Body click listener for dynamic links
    document.body.addEventListener('click', async function(e) {
        // (نفس الكود من الرد السابق)
        // ...
        const actionTarget = e.target.closest('[data-action]');
        if (actionTarget) {
            e.preventDefault();
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
            return;
        }

        const sectionTriggerTarget = e.target.closest('[data-section-trigger]');
        if (sectionTriggerTarget) {
            e.preventDefault();
            const sectionId = sectionTriggerTarget.dataset.sectionTrigger;
            const itemId = sectionTriggerTarget.dataset.itemId;
            const subCatFilter = sectionTriggerTarget.dataset.subcatFilter;

            if (sectionId) {
                handleSectionTrigger(sectionId, itemId, subCatFilter);
                if (globalSearchInput && searchResultsContainer && sectionTriggerTarget.closest('#searchResultsContainer, #sectionSearchResults')) {
                    searchResultsContainer.classList.add('hidden');
                    if(pageContent.querySelector('#sectionSearchResults')) pageContent.querySelector('#sectionSearchResults').innerHTML = '';
                    globalSearchInput.value = '';
                }
            }
            return;
        }
    });

    // --- Global Search & Section Search ---
    // (نفس الكود من الرد السابق، مع التنويه أن searchKb تحتاج تحديث للبحث في Supabase)
    // ...
     const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    let searchDebounceTimer;

    if (globalSearchInput && searchResultsContainer) {
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length > 1 && typeof searchKb === 'function') {
                    // searchKb currently only searches kbSystemData.
                    // For Supabase data, searchKb needs to be async and query Supabase,
                    // or you'd use a dedicated search endpoint.
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

    function renderGlobalSearchResults_enhanced(results, query) { // Searches kbSystemData
        // (نفس الكود من الرد السابق)
        // ...
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<div class="p-3 text-sm text-gray-500">No results for "${escapeHTML(query)}" in static data.</div>`;
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

            if (result.type === 'sub_category_match_static') {
                a.dataset.subcatFilter = result.id; // ID of the subcategory
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

    function renderSectionSearchResults(results, query, container, themeColor) { // Searches kbSystemData
        // (نفس الكود من الرد السابق)
        // ...
         if (!container) return;
        container.innerHTML = '';
        if (results.length === 0) {
            container.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">No results found for "${escapeHTML(query)}" in this section's static data.</p>`;
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
            typeBadge.textContent = result.type.replace(/_/g, ' ').replace('match static', '').trim();
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
        pageContent.addEventListener('click', async (e) => { // Async for searchKb if it becomes async
            // (نفس الكود من الرد السابق)
            // ...
            const ratingTarget = e.target.closest('.rating-btn');
            if (ratingTarget) {
                e.preventDefault();
                const ratingContainer = ratingTarget.closest('.rating-container');
                if (ratingContainer) ratingContainer.innerHTML = `<span class="text-xs text-green-500">Thanks for your feedback!</span>`;
                return;
            }
            const sectionSearchBtn = e.target.closest('#sectionSearchBtn');
            if (sectionSearchBtn) {
                e.preventDefault();
                const input = pageContent.querySelector('#sectionSearchInput');
                const currentSectionId = input?.dataset.sectionId;
                const query = input?.value.trim();
                if (query && query.length > 1 && typeof searchKb === 'function' && currentSectionId) {
                    const results = searchKb(query); // Still uses static searchKb
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
        console.log('[app.js] Hash changed:', { newSectionId, newItemId, newSubCategoryFilter });
        handleSectionTrigger(newSectionId || 'home', newItemId, newSubCategoryFilter);
    });

    // Initial load with hash support
    const { sectionId: initialSectionId, itemId: initialItemId, subCategoryFilter: initialSubCategoryFilter } = parseHash();
    console.log('[app.js] Initial hash load:', { initialSectionId, initialItemId, initialSubCategoryFilter });
    handleSectionTrigger(initialSectionId || 'home', initialItemId, initialSubCategoryFilter);


    console.log('[app.js] All initializations complete.');
});
