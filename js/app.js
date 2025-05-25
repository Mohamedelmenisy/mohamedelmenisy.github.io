// /infini-base/js/app.js
let currentUser = null;
let isInitialAuthCheckComplete = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js] DOMContentLoaded fired.');

    if (typeof window.supabaseClient === 'undefined' || !window.supabaseClient.auth) {
        console.error('[app.js] window.supabaseClient is not available. App cannot initialize properly.');
        const loadingOverlay = document.getElementById('dashboardLoadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = '<div class="text-center p-4"><p class="text-red-500 text-lg">Error: Authentication service failed to load.</p><p class="text-gray-600 dark:text-gray-400">Please check your internet connection and try refreshing the page. If the problem persists, contact support.</p></div>';
        }
        return;
    }
    const supabase = window.supabaseClient;

    console.log('[app.js] kbSystemData:', typeof kbSystemData !== 'undefined' ? 'Available' : 'undefined');
    if (typeof kbSystemData === 'undefined') {
        console.error('[app.js] CRITICAL: kbSystemData is not loaded. Most functionalities will fail.');
        const pageContent = document.getElementById('pageContent');
        if(pageContent) pageContent.innerHTML = '<div class="p-6 text-center"><h2 class="text-xl font-semibold text-red-600 dark:text-red-400">Critical Error</h2><p>Knowledge base data (kbSystemData) could not be loaded. Please contact an administrator.</p></div>';
        return;
    }

    // --- Helper Functions ---
    function escapeHTML(str) {
        if (typeof str !== 'string') return String(str || '');
        return str.replace(/[&<>"']/g, function(match) {
            return {
                '&': '&',
                '<': '<',
                '>': '>',
                '"': '"',
                "'": '''
            }[match];
        }); // THIS IS AROUND LINE 32
    }

    function highlightText(text, query) {
        if (!text) return '';
        const safeText = escapeHTML(text);
        if (!query || query.length < 1) return safeText;
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
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[app.js - Supabase] onAuthStateChange event:', event, 'session:', session ? `exists (User ID: ${session.user.id})` : 'null');

        const loadingOverlay = document.getElementById('dashboardLoadingOverlay');
        const mainPageContainer = document.querySelector('.flex.h-screen');

        if (event === 'SIGNED_OUT' || !session) {
            currentUser = null;
            isInitialAuthCheckComplete = true;
            const loginPageName = 'login.html';
            const signupPageName = 'signup.html';

            if (!window.location.pathname.endsWith(loginPageName) && !window.location.pathname.endsWith(signupPageName)) {
                console.log('[app.js - Supabase] No session or signed out, redirecting to login.html');
                if (loadingOverlay) loadingOverlay.style.display = 'flex';
                const loginPath = window.location.origin + (window.location.pathname.includes('/infini-base/') ? '/infini-base/' : '/') + loginPageName + '?reason=session_ended_app';
                window.location.replace(loginPath);
            } else {
                 if (loadingOverlay) loadingOverlay.style.display = 'none';
            }
            return;
        }

        if (session) {
            try {
                const { data: userProfile, error: profileError } = await supabase
                    .from('users')
                    .select('name, role, is_admin')
                    .eq('id', session.user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    console.error('[app.js - Supabase] Error fetching user profile from public.users:', profileError);
                    currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        fullName: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                        role: 'user'
                    };
                } else if (userProfile) {
                    currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        fullName: userProfile.name || session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                        role: userProfile.role || (userProfile.is_admin ? 'admin' : 'user')
                    };
                } else {
                    console.warn(`[app.js - Supabase] User profile NOT FOUND in public.users for ID: ${session.user.id}. Using fallbacks.`);
                    currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        fullName: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                        role: 'user'
                    };
                }
            } catch (e) {
                console.error('[app.js - Supabase] Exception during user profile fetch:', e);
                currentUser = {
                    id: session.user.id,
                    email: session.user.email,
                    fullName: session.user.email.split('@')[0],
                    role: 'user'
                };
            }

            console.log('[app.js - Supabase] Current user session active:', currentUser);
            initializeUserDependentUI();
            isInitialAuthCheckComplete = true;

            if (!document.body.dataset.initialLoadDone) {
                console.log('[app.js] Auth confirmed (event:',event,'), processing initial section load.');
                const { sectionId, itemId, subCategoryFilter } = parseHash();
                handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);
                document.body.dataset.initialLoadDone = 'true';

                if (loadingOverlay) loadingOverlay.style.display = 'none';
                if (mainPageContainer) mainPageContainer.style.visibility = 'visible';
            } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                 console.log('[app.js] Auth token refreshed or user updated. UI should be current.');
                 if (loadingOverlay && loadingOverlay.style.display !== 'none') loadingOverlay.style.display = 'none';
                 if (mainPageContainer && mainPageContainer.style.visibility !== 'visible') mainPageContainer.style.visibility = 'visible';
            }
        }
    });

    function initializeUserDependentUI() {
        const userNameDisplay = document.getElementById('userNameDisplay');
        const welcomeUserName = document.getElementById('welcomeUserName');
        const avatarImg = document.querySelector('#userProfileButton img#userAvatar');

        if (currentUser) {
            const userDisplayName = escapeHTML(currentUser.fullName) || escapeHTML(currentUser.email) || 'User';
            if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
            if (welcomeUserName) welcomeUserName.innerHTML = `Welcome, <span class="font-bold">${userDisplayName}</span>!`;
            if (avatarImg) {
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=6366F1&color=fff&size=36&font-size=0.45&rounded=true`;
                avatarImg.alt = `${userDisplayName}'s Avatar`;
            }
            console.log('[app.js - Supabase] User-dependent UI initialized for:', userDisplayName);
        } else {
            const defaultName = 'User';
            if (userNameDisplay) userNameDisplay.textContent = defaultName;
            if (welcomeUserName) welcomeUserName.innerHTML = `Welcome!`;
            if (avatarImg) {
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultName)}&background=6366F1&color=fff&size=36&font-size=0.45&rounded=true`;
                avatarImg.alt = `${defaultName}'s Avatar`;
            }
        }
    }

    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');

    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = escapeHTML(kbSystemData.meta.version);
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = escapeHTML(kbSystemData.meta.version);
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    } else {
        console.warn('[app.js] kbSystemData or kbSystemData.meta not available for version info.');
    }

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

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            console.log('[app.js - Supabase] Logout button clicked.');
            const loadingOverlay = document.getElementById('dashboardLoadingOverlay');
            if(loadingOverlay) loadingOverlay.style.display = 'flex';

            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('[app.js - Supabase] Error during sign out:', error);
                if(loadingOverlay) loadingOverlay.style.display = 'none';
                alert('Logout failed: ' + error.message);
            } else {
                console.log('[app.js - Supabase] Sign out successful. Redirect will be handled by onAuthStateChange.');
            }
        });
    }

    const reportErrorBtn = document.getElementById('reportErrorBtn');
    if (reportErrorBtn) {
        reportErrorBtn.addEventListener('click', () => {
            const sectionTitleText = document.getElementById('currentSectionTitle') ? document.getElementById('currentSectionTitle').textContent : 'Current Page';
            const pageUrl = window.location.href;
            alert(`Report an issue for: ${escapeHTML(sectionTitleText)}\nURL: ${escapeHTML(pageUrl)}\n\n(This is a placeholder. Please describe the issue to your administrator.)`);
        });
    }

    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');
    const initialPageContent = pageContent ? pageContent.innerHTML : '<p class="text-red-500 p-4">Error: Initial page content could not be captured.</p>';

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        } else {
            const homeLink = document.querySelector('.sidebar-link[data-section="home"]');
            if (homeLink && (sectionId === 'home' || !sectionId)) homeLink.classList.add('active');
            // console.warn(`[app.js] No specific sidebar link found for section: "${sectionId}"`);
        }
    }

    // --- Card Rendering Functions ---
    // Make sure these are defined or copied from your previous app.js.txt
    // Ensure they use escapeHTML for all user-generated content.
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
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${escapeHTML(article.id)}" data-item-type="article">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${cardIconClass} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(article.title)}</h3>
                    <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${escapeHTML(sectionData.id)}/${escapeHTML(article.id)}'); alert('Link copied!');" class="bookmark-link ml-auto pl-2" title="Copy link to this article">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${escapeHTML(article.summary) || 'No summary available.'}</p>
                ${article.tags && article.tags.length > 0 ? `<div class="mb-4">${article.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div class="rating-container text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <span class="mr-1">Helpful?</span>
                        <button class="rating-btn p-1 hover:opacity-75" data-item-id="${escapeHTML(article.id)}" data-item-type="article" data-rating="up" title="Helpful"><i class="fas fa-thumbs-up text-green-500"></i></button>
                        <button class="rating-btn p-1 hover:opacity-75" data-item-id="${escapeHTML(article.id)}" data-item-type="article" data-rating="down" title="Not helpful"><i class="fas fa-thumbs-down text-red-500"></i></button>
                    </div>
                    <a href="${escapeHTML(article.contentPath)}" target="_blank" class="text-sm font-medium ${theme.cta} group">
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
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${escapeHTML(item.id)}" data-item-type="item">
                 <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${cardIconClass} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(item.title)}</h3>
                    <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${escapeHTML(sectionData.id)}/${escapeHTML(item.id)}'); alert('Link copied!');" class="bookmark-link ml-auto pl-2" title="Copy link to this item">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${escapeHTML(item.description) || 'No description available.'}</p>
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs ${theme.tagBg} ${theme.tagText} px-3 py-1 rounded-full uppercase font-semibold tracking-wide">${escapeHTML(item.type)}</span>
                    <a href="${escapeHTML(item.url)}" target="_blank" class="text-sm font-medium ${theme.cta} group">
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
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${escapeHTML(caseItem.id)}" data-item-type="case">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${caseIcon} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(caseItem.title)}</h3>
                     <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${escapeHTML(sectionData.id)}/${escapeHTML(caseItem.id)}'); alert('Link copied!');" class="bookmark-link ml-auto pl-2" title="Copy link to this case">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 flex-grow">${escapeHTML(caseItem.summary) || 'No summary.'}</p>
                ${caseItem.resolutionStepsPreview ? `<p class="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">Steps: ${escapeHTML(caseItem.resolutionStepsPreview)}</p>` : ''}
                ${caseItem.tags && caseItem.tags.length > 0 ? `<div class="mb-3">${caseItem.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-sm font-medium px-3 py-1 rounded-full ${theme.statusBg} ${theme.statusText}">${escapeHTML(caseItem.status)}</span>
                    ${caseItem.contentPath ? `<a href="${escapeHTML(caseItem.contentPath)}" target="_blank" class="text-sm font-medium ${theme.cta} group">Details <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i></a>` : `<div class="w-16"></div>`}
                </div>
            </div>
        `;
    }
    // --- End of Card Rendering Functions ---


    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        // ... (Implementation from previous response, ensure it's correct)
        console.log('[app.js] handleSectionTrigger called. CurrentUser:', currentUser ? currentUser.email : 'None', 'Section:', sectionId, 'Item:', itemId, 'SubCat:', subCategoryFilter);

        if (!isInitialAuthCheckComplete) {
            console.warn('[app.js] handleSectionTrigger: Auth check not complete. Aborting section load.');
            return;
        }
        if (!currentUser) {
            console.warn('[app.js] handleSectionTrigger: No currentUser. Aborting section load (should redirect).');
            return;
        }
        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js] handleSectionTrigger: kbSystemData or kbSystemData.sections is undefined.');
            if(pageContent) pageContent.innerHTML = '<p class="p-4 text-red-500">Error: Knowledge base data is not available to display sections.</p>';
            return;
        }

        highlightSidebarLink(sectionId || 'home'); // Default to home if sectionId is falsy
        displaySectionContent(sectionId || 'home', itemId, subCategoryFilter);

        const newHashSuffix = itemId ? `${sectionId}/${itemId}` : (subCategoryFilter ? `${sectionId}/${subCategoryFilter}` : sectionId);
        const newHash = `#${newHashSuffix || 'home'}`;
        if (window.location.hash !== newHash) {
            window.history.pushState({ sectionId, itemId, subCategoryFilter }, '', newHash);
            console.log(`[app.js] URL hash updated to: ${newHash}`);
        }
    }

    function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        // ... (Full implementation from previous response, ensure it's correct and uses escapeHTML)
        console.log(`[app.js] displaySectionContent for sectionId: "${sectionId}", item: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);

        if (!pageContent) {
            console.error('[app.js] CRITICAL: pageContent element is NULL in displaySectionContent.');
            document.body.innerHTML = '<div class="w-screen h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p class="text-2xl text-red-600 p-10">Critical Error: UI cannot be rendered. Please contact support.</p></div>';
            return;
        }
         if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js] displaySectionContent: kbSystemData or sections missing.');
            pageContent.innerHTML = '<div class="p-6 text-center"><h2 class="text-xl font-semibold text-red-600">Error Loading Data</h2><p>The knowledge base data could not be loaded. Please try again later or contact support.</p></div>';
            return;
        }


        if (sectionId === 'home' || !sectionId) {
            pageContent.innerHTML = initialPageContent;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Welcome';
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="#home" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            initializeUserDependentUI();
            const homeKbVersionEl = pageContent.querySelector('#kbVersion') || document.getElementById('kbVersion');
            const homeLastKbUpdateEl = pageContent.querySelector('#lastKbUpdate') || document.getElementById('lastKbUpdate');

            if (kbSystemData.meta) {
                if (homeKbVersionEl) homeKbVersionEl.textContent = escapeHTML(kbSystemData.meta.version);
                if (homeLastKbUpdateEl) homeLastKbUpdateEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }
            pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
                card.style.animationDelay = `${(index + 1) * 0.05}s`;
                card.classList.remove('fadeInUp');
                void card.offsetWidth;
                card.classList.add('fadeInUp');
            });
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
            console.log('[app.js] Home page content displayed.');
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center card-animate"><h2 class="text-2xl font-semibold text-red-500">Section Not Found</h2><p>The section you requested ("${escapeHTML(sectionId)}") does not exist.</p> <a href="#home" data-section-trigger="home" class="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Go to Home</a></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Not Found';
            if (breadcrumbsContainer) breadcrumbsContainer.innerHTML = `<a href="#home" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> Not Found`;
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);
        let contentHTML = `<div class="space-y-10">`;
        contentHTML += `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 card-animate">
                <div class="flex items-center mb-3 sm:mb-0">
                    <span class="p-3 rounded-lg ${theme.iconContainer} mr-4 hidden sm:inline-flex items-center justify-center shadow-sm">
                        <i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i>
                    </span>
                    <div>
                        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">${escapeHTML(sectionData.name)}</h2>
                        <p class="text-gray-600 dark:text-gray-300 mt-1 text-base">${escapeHTML(sectionData.description)}</p>
                    </div>
                </div>
            </div>`;

        let hasRenderedContent = false;
        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<div class="card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories</h3><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
            sectionData.subCategories.forEach(subCat => {
                contentHTML += `
                    <a href="#${escapeHTML(sectionData.id)}/${escapeHTML(subCat.id)}" data-section-trigger="${escapeHTML(sectionData.id)}" data-subcat-filter="${escapeHTML(subCat.id)}"
                       class="sub-category-link bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center text-center transform hover:-translate-y-1 border-t-4 ${theme.border}">
                        <div class="p-3 rounded-full ${theme.iconContainer} mb-3">
                            <i class="fas fa-folder-open text-3xl ${theme.icon}"></i>
                        </div>
                        <h4 class="font-semibold text-lg text-gray-800 dark:text-white">${escapeHTML(subCat.name)}</h4>
                        ${subCat.description ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${escapeHTML(truncateText(subCat.description, 50))}</p>` : ''}
                    </a>`;
            });
            contentHTML += `</div></div>`;
            hasRenderedContent = true;
        }

        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.articles.forEach(article => contentHTML += renderArticleCard_enhanced(article, sectionData));
            contentHTML += `</div></div>`;
            hasRenderedContent = true;
        }
        if (sectionData.cases && sectionData.cases.length > 0) {
            contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.cases.forEach(caseItem => contentHTML += renderCaseCard_enhanced(caseItem, sectionData));
            contentHTML += `</div></div>`;
            hasRenderedContent = true;
        }
        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.items.forEach(item => contentHTML += renderItemCard_enhanced(item, sectionData));
            contentHTML += `</div></div>`;
            hasRenderedContent = true;
        }
        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-book mr-3 ${theme.text}"></i> Glossary</h3><div class="space-y-4">`;
            sectionData.glossary.forEach(entry => contentHTML += `<div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow border-l-4 ${theme.border}"><strong class="${theme.text} font-medium">${escapeHTML(entry.term)}:</strong> ${escapeHTML(entry.definition)}</div>`);
            contentHTML += `</div></div>`;
            hasRenderedContent = true;
        }

        if (!hasRenderedContent) {
            contentHTML += `<div class="p-10 text-center bg-white dark:bg-gray-800 rounded-lg shadow-md card-animate"><i class="fas fa-info-circle text-4xl ${theme.text} mb-4"></i><h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200">No Content Yet</h3><p class="text-gray-600 dark:text-gray-400">Content for "${escapeHTML(sectionData.name)}" is currently being prepared.</p></div>`;
        }
        contentHTML += `</div>`;
        pageContent.innerHTML = contentHTML;
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');

        pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`;
        });

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            let bcHTML = `<a href="#home" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(sectionData.name)}</span>`;
            if (subCategoryFilter && sectionData.subCategories) {
                const subCatData = sectionData.subCategories.find(sc => sc.id === subCategoryFilter);
                if (subCatData) {
                    bcHTML = `<a href="#home" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <a href="#${escapeHTML(sectionData.id)}" data-section-trigger="${escapeHTML(sectionData.id)}" class="hover:underline ${theme.cta}">${escapeHTML(sectionData.name)}</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(subCatData.name)}</span>`;
                }
            }
            breadcrumbsContainer.innerHTML = bcHTML;
            breadcrumbsContainer.classList.remove('hidden');
        }

        if (itemIdToFocus) {
            setTimeout(() => {
                const targetCard = pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'shadow-2xl', 'focused-item');
                    setTimeout(() => targetCard.classList.remove('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'shadow-2xl', 'focused-item'), 3500);
                }
            }, 200);
        }
    }


    function parseHash() {
        const hash = window.location.hash.substring(1);
        if (!hash) return { sectionId: 'home', itemId: null, subCategoryFilter: null };
        const parts = hash.split('/');
        const sectionId = parts[0] || 'home'; // Default to home if sectionId is empty after split
        let itemId = null;
        let subCategoryFilter = null;

        if (parts.length > 1 && parts[1]) { // Ensure parts[1] exists and is not empty
            const potentialSubCatId = parts[1];
            const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
            if (sectionData && sectionData.subCategories && sectionData.subCategories.some(sc => sc.id === potentialSubCatId)) {
                subCategoryFilter = potentialSubCatId;
            } else {
                itemId = parts[1];
            }
        }
        return { sectionId, itemId, subCategoryFilter };
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            handleSectionTrigger(sectionId);
        });
    });

    document.body.addEventListener('click', function(e) {
        const sectionTriggerTarget = e.target.closest('[data-section-trigger]');
        if (sectionTriggerTarget) {
            e.preventDefault();
            const sectionId = sectionTriggerTarget.dataset.sectionTrigger;
            const itemId = sectionTriggerTarget.dataset.itemId;
            const subCatFilter = sectionTriggerTarget.dataset.subcatFilter;
            handleSectionTrigger(sectionId, itemId, subCatFilter);
            if (sectionTriggerTarget.closest('#searchResultsContainer')) {
                const searchResultsContainer = document.getElementById('searchResultsContainer');
                if (searchResultsContainer) searchResultsContainer.classList.add('hidden');
            }
        }

        const homeSubcatTrigger = e.target.closest('[data-subcat-trigger]');
         if (homeSubcatTrigger && (pageContent?.querySelector('#welcomeUserName') || initialPageContent.includes('Welcome,'))) {
            e.preventDefault();
            const triggerValue = homeSubcatTrigger.dataset.subcatTrigger;
            const parts = triggerValue.split('.');
            if (parts.length === 2) {
                const [sectionId, subId] = parts;
                handleSectionTrigger(sectionId, null, subId);
                if (sectionId === 'support' && subId === 'tools') {
                    setTimeout(() => {
                        const zendeskCard = Array.from(pageContent.querySelectorAll('.card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                        if (zendeskCard?.closest('.card')) {
                            zendeskCard.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 300);
                }
            }
        }
    });

    window.addEventListener('hashchange', () => {
        if (!isInitialAuthCheckComplete || !currentUser) {
            return;
        }
        const { sectionId, itemId, subCategoryFilter } = parseHash();
        handleSectionTrigger(sectionId, itemId, subCategoryFilter);
    });

    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');

    if (globalSearchInput && searchResultsContainer) {
        // ... (Global search implementation as provided)
         let debounceTimeout;
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length < 2) {
                    searchResultsContainer.classList.add('hidden');
                    searchResultsContainer.innerHTML = '';
                    return;
                }

                const results = searchKb(query);
                console.log(`[app.js] Global search for "${query}": ${results.length} results.`);

                if (results.length === 0) {
                    searchResultsContainer.innerHTML = `<div class="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">No results found for "${escapeHTML(query)}".</div>`;
                } else {
                    let resultsHTML = '';
                    results.slice(0, 10).forEach(result => {
                        const theme = getThemeColors(result.themeColor);
                        let title = highlightText(result.title, query);
                        let summary = result.summary ? highlightText(truncateText(result.summary, 100), query) : 'No summary available.';
                        
                        let itemPath = result.sectionId;
                        if (result.id && (result.type !== 'section_match')) {
                            itemPath += `/${result.id}`;
                        }
                        let triggerAttrs = `data-section-trigger="${result.sectionId}"`;
                        if (result.id && (result.type !== 'section_match')) {
                             triggerAttrs += ` data-item-id="${result.id}"`;
                        }


                        resultsHTML += `
                            <a href="#${itemPath}" ${triggerAttrs} 
                               class="block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                                <div class="flex items-start space-x-3">
                                    <div class="p-1.5 rounded-full ${theme.iconContainer} flex-shrink-0 mt-1">
                                        <i class="${result.type === 'article' ? 'fas fa-newspaper' : result.type === 'case' ? 'fas fa-briefcase' : result.type === 'item' ? 'fas fa-file-alt' : result.type === 'glossary_term' ? 'fas fa-book' : 'fas fa-folder'} text-base ${theme.icon}"></i>
                                    </div>
                                    <div class="flex-grow overflow-hidden">
                                        <h4 class="text-sm font-semibold text-gray-800 dark:text-white truncate">${title}</h4>
                                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">${summary}</p>
                                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <span class="font-medium ${theme.text}">${escapeHTML(result.sectionName)}</span>
                                            <span class="mx-1">•</span>
                                            <span>${result.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        `;
                    });
                    searchResultsContainer.innerHTML = resultsHTML;
                }
                searchResultsContainer.classList.remove('hidden');
                applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
            }, 350);
        });
        globalSearchInput.addEventListener('focus', () => {
            if (searchResultsContainer.innerHTML.trim() !== '' && globalSearchInput.value.trim().length >= 2) {
                searchResultsContainer.classList.remove('hidden');
            }
        });
        document.addEventListener('click', (e) => {
            if (!searchResultsContainer.contains(e.target) && e.target !== globalSearchInput) {
                searchResultsContainer.classList.add('hidden');
            }
        });
    }

    document.body.addEventListener('click', (e) => {
        const ratingBtn = e.target.closest('.rating-btn');
        if (ratingBtn) {
            e.preventDefault();
            const itemId = ratingBtn.dataset.itemId;
            const itemType = ratingBtn.dataset.itemType;
            const rating = ratingBtn.dataset.rating;
            alert(`Feedback recorded: ${rating === 'up' ? 'Helpful' : 'Not helpful'} for ${itemType} "${itemId}". (Placeholder)`);
        }
    });

    console.log('[app.js] All event listeners attached. Waiting for Supabase auth state.');
});
