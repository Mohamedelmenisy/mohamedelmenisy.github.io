// /infini-base/js/app.js
let currentUser = null;
let isInitialAuthCheckComplete = false; // Flag to manage initial load

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
        // Display error on page if kbSystemData is missing
        const pageContent = document.getElementById('pageContent');
        if(pageContent) pageContent.innerHTML = '<div class="p-6 text-center"><h2 class="text-xl font-semibold text-red-600 dark:text-red-400">Critical Error</h2><p>Knowledge base data (kbSystemData) could not be loaded. Please contact an administrator.</p></div>';
        return;
    }


    // --- Helper Functions ---
    function escapeHTML(str) {
        if (typeof str !== 'string') return String(str || ''); // Ensure string, handle null/undefined
        return str.replace(/[&<>"']/g, function(match) {
            return { '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' }[match];
        });
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
            const currentPathFile = window.location.pathname.split('/').pop();
            const loginPageName = 'login.html'; // Assuming login.html is at /infini-base/login.html or similar
            const signupPageName = 'signup.html';

            // Check if current page is NOT login or signup
            if (!window.location.pathname.endsWith(loginPageName) && !window.location.pathname.endsWith(signupPageName)) {
                console.log('[app.js - Supabase] No session or signed out, redirecting to login.html');
                if (loadingOverlay) loadingOverlay.style.display = 'flex';
                // Construct the correct path to login.html relative to the domain root
                const loginPath = window.location.origin + (window.location.pathname.includes('/infini-base/') ? '/infini-base/' : '/') + loginPageName + '?reason=session_ended_app';
                window.location.replace(loginPath);
            } else {
                 if (loadingOverlay) loadingOverlay.style.display = 'none'; // On login/signup, hide overlay
            }
            return;
        }

        if (session) {
            try {
                // Fetch from public.users table
                const { data: userProfile, error: profileError } = await supabase
                    .from('users') // This is public.users
                    .select('name, role, is_admin') // 'name' is your full name column
                    .eq('id', session.user.id) // Match auth.users.id with public.users.id
                    .single();

                if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows, not necessarily a hard error
                    console.error('[app.js - Supabase] Error fetching user profile from public.users:', profileError);
                    currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        fullName: session.user.user_metadata?.full_name || session.user.email.split('@')[0], // Fallback to metadata or email
                        role: 'user' // Default role
                    };
                } else if (userProfile) {
                    currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        fullName: userProfile.name || session.user.user_metadata?.full_name || session.user.email.split('@')[0], // Use 'name' from public.users
                        role: userProfile.role || (userProfile.is_admin ? 'admin' : 'user') // Use 'role', fallback to 'is_admin'
                    };
                } else {
                    // User exists in auth.users but not in public.users. This is a data integrity issue.
                    // Signup process should ensure a public.users row is created.
                    console.warn(`[app.js - Supabase] User profile NOT FOUND in public.users for ID: ${session.user.id}. Using fallbacks.`);
                    currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        fullName: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                        role: 'user' // Default role
                    };
                    // Optionally, attempt to create the public.users entry here if it's missing,
                    // though ideally signup/login should handle this.
                }
            } catch (e) {
                console.error('[app.js - Supabase] Exception during user profile fetch:', e);
                currentUser = { // Fallback user object
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
                 // Ensure UI is visible if it was hidden
                 if (loadingOverlay && loadingOverlay.style.display !== 'none') loadingOverlay.style.display = 'none';
                 if (mainPageContainer && mainPageContainer.style.visibility !== 'visible') mainPageContainer.style.visibility = 'visible';
            }
        }
    });

    function initializeUserDependentUI() {
        const userNameDisplay = document.getElementById('userNameDisplay');
        const welcomeUserName = document.getElementById('welcomeUserName');
        const avatarImg = document.querySelector('#userProfileButton img#userAvatar'); // More specific selector

        if (currentUser) {
            const userDisplayName = escapeHTML(currentUser.fullName) || escapeHTML(currentUser.email) || 'User';
            if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
            if (welcomeUserName) welcomeUserName.innerHTML = `Welcome, <span class="font-bold">${userDisplayName}</span>!`; // Use innerHTML for potential styling
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
             console.log('[app.js] User-dependent UI initialized for GUEST (should be redirecting).');
        }
    }

    // KB Version and Update Info
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

    // Theme Switcher
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
                mark.style.backgroundColor = '#78350f'; // Darker orange
                mark.style.color = '#f3f4f6'; // Light gray
            } else {
                mark.style.backgroundColor = '#fde047'; // Yellow
                mark.style.color = '#1f2937'; // Dark gray
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
    loadTheme(); // Apply theme on initial load

    // Logout Button
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
                // onAuthStateChange handles redirection
            }
        });
    }

    // Report Error Button
    const reportErrorBtn = document.getElementById('reportErrorBtn');
    if (reportErrorBtn) {
        reportErrorBtn.addEventListener('click', () => {
            const sectionTitleText = document.getElementById('currentSectionTitle') ? document.getElementById('currentSectionTitle').textContent : 'Current Page';
            const pageUrl = window.location.href;
            // Replace with a more sophisticated error reporting mechanism (e.g., mailto, form, API call)
            alert(`Report an issue for: ${escapeHTML(sectionTitleText)}\nURL: ${escapeHTML(pageUrl)}\n\n(This is a placeholder. Please describe the issue to your administrator.)`);
        });
    }

    // Sidebar and Content Elements
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');

    console.log('[app.js] pageContent element:', pageContent ? 'Found' : 'NOT FOUND');
    console.log('[app.js] sidebarLinks found:', sidebarLinks.length);

    const initialPageContent = pageContent ? pageContent.innerHTML : '<p class="text-red-500 p-4">Error: Initial page content could not be captured because pageContent element was missing on load.</p>';

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        } else {
            // If no specific section matches, try to keep 'home' active or none.
            const homeLink = document.querySelector('.sidebar-link[data-section="home"]');
            if (homeLink && sectionId === 'home') homeLink.classList.add('active');
            console.warn(`[app.js] No sidebar link found or explicitly matched for section: "${sectionId}"`);
        }
    }
    // --- Card Rendering Functions (getThemeColors, renderArticleCard_enhanced, etc.) ---
    // These remain the same as in your app.js.txt. Make sure they use escapeHTML appropriately.
    function getThemeColors(themeColor = 'gray') { /* ... as provided ... */ }
    function renderArticleCard_enhanced(article, sectionData) { /* ... as provided, ensure escapeHTML is used ... */ }
    function renderItemCard_enhanced(item, sectionData) { /* ... as provided, ensure escapeHTML is used ... */ }
    function renderCaseCard_enhanced(caseItem, sectionData) { /* ... as provided, ensure escapeHTML is used ... */ }


    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        console.log('[app.js] handleSectionTrigger called. CurrentUser:', currentUser ? currentUser.email : 'None', 'Section:', sectionId, 'Item:', itemId, 'SubCat:', subCategoryFilter);

        if (!isInitialAuthCheckComplete) {
            console.warn('[app.js] handleSectionTrigger: Auth check not complete. Aborting section load.');
            return;
        }
        if (!currentUser) {
            console.warn('[app.js] handleSectionTrigger: No currentUser. Aborting section load (should redirect).');
            // Redirect should have happened via onAuthStateChange
            return;
        }
        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js] handleSectionTrigger: kbSystemData or kbSystemData.sections is undefined.');
            if(pageContent) pageContent.innerHTML = '<p class="p-4 text-red-500">Error: Knowledge base data is not available to display sections.</p>';
            return;
        }

        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId, itemId, subCategoryFilter);

        // Update URL hash without adding to history for normal navigation,
        // but allow direct hash changes to create history.
        const newHash = itemId ? `${sectionId}/${itemId}` : (subCategoryFilter ? `${sectionId}/${subCategoryFilter}` : sectionId);
        if (window.location.hash !== `#${newHash}`) {
            // Consider using replaceState for internal navigation to keep browser history cleaner
            window.history.pushState({ sectionId, itemId, subCategoryFilter }, '', `#${newHash}`);
            console.log(`[app.js] URL hash updated to: #${newHash}`);
        }
    }

    function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
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


        if (sectionId === 'home' || !sectionId) { // Default to home if sectionId is falsy
            pageContent.innerHTML = initialPageContent; // Restore original home content
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Welcome';
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            initializeUserDependentUI(); // Re-initialize user-specific parts of home
            const homeKbVersionEl = pageContent.querySelector('#kbVersion') || document.getElementById('kbVersion');
            const homeLastKbUpdateEl = pageContent.querySelector('#lastKbUpdate') || document.getElementById('lastKbUpdate');

            if (kbSystemData.meta) {
                if (homeKbVersionEl) homeKbVersionEl.textContent = escapeHTML(kbSystemData.meta.version);
                if (homeLastKbUpdateEl) homeLastKbUpdateEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }
            // Re-apply card animations for home page if any
            pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
                card.style.animationDelay = `${(index + 1) * 0.05}s`; // Faster delay
                card.classList.remove('fadeInUp'); // Remove class to allow re-trigger if needed
                void card.offsetWidth; // Trigger reflow
                card.classList.add('fadeInUp'); // Re-add class
            });
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Re-apply mark colors
            console.log('[app.js] Home page content displayed.');
            if (itemIdToFocus) console.warn(`[app.js] itemIdToFocus (${itemIdToFocus}) provided for home page, but not typically used here.`);
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center card-animate"><h2 class="text-2xl font-semibold text-red-500">Section Not Found</h2><p>The section you requested ("${escapeHTML(sectionId)}") does not exist or could not be loaded.</p> <a href="#" data-section-trigger="home" class="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Go to Home</a></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Not Found';
            if (breadcrumbsContainer) breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1">></span> Not Found`;
            console.warn(`[app.js] Section "${sectionId}" not found in kbSystemData.`);
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);
        let contentHTML = `<div class="space-y-10">`; // Outer container

        // Section Header
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

        // Section Search (Optional - consider if needed per section vs global)
        // contentHTML += `<div class="my-6 p-4 bg-white dark:bg-gray-800/70 rounded-lg shadow-md card-animate"><label for="sectionSearchInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search in ${escapeHTML(sectionData.name)}:</label><div class="flex"><input type="text" id="sectionSearchInput" data-section-id="${sectionData.id}" class="flex-grow p-2.5 border border-gray-300 dark:border-gray-600 rounded-l-md dark:bg-gray-700 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Type your question..."><button id="sectionSearchBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md flex items-center"><i class="fas fa-search mr-2"></i>Ask</button></div><div id="sectionSearchResults" class="mt-4 max-h-96 overflow-y-auto space-y-2"></div></div>`;

        let hasRenderedContent = false;

        // Sub-Categories First (if any)
        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<div class="card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories</h3><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
            sectionData.subCategories.forEach(subCat => {
                contentHTML += `
                    <a href="#${sectionData.id}/${subCat.id}" data-section-trigger="${sectionData.id}" data-subcat-filter="${subCat.id}" 
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


        // Articles
        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.articles.forEach(article => contentHTML += renderArticleCard_enhanced(article, sectionData));
            contentHTML += `</div></div>`;
            hasRenderedContent = true;
        }

        // Cases
        if (sectionData.cases && sectionData.cases.length > 0) {
            contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.cases.forEach(caseItem => contentHTML += renderCaseCard_enhanced(caseItem, sectionData));
            contentHTML += `</div></div>`;
            hasRenderedContent = true;
        }

        // Items (e.g., Forms/Templates)
        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.items.forEach(item => contentHTML += renderItemCard_enhanced(item, sectionData));
            contentHTML += `</div></div>`;
            hasRenderedContent = true;
        }

        // Glossary
        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-book mr-3 ${theme.text}"></i> Glossary</h3><div class="space-y-4">`;
            sectionData.glossary.forEach(entry => contentHTML += `<div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow border-l-4 ${theme.border}"><strong class="${theme.text} font-medium">${escapeHTML(entry.term)}:</strong> ${escapeHTML(entry.definition)}</div>`);
            contentHTML += `</div></div>`;
            hasRenderedContent = true;
        }

        if (!hasRenderedContent) {
            contentHTML += `<div class="p-10 text-center bg-white dark:bg-gray-800 rounded-lg shadow-md card-animate"><i class="fas fa-info-circle text-4xl ${theme.text} mb-4"></i><h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200">No Content Yet</h3><p class="text-gray-600 dark:text-gray-400">Content for "${escapeHTML(sectionData.name)}" is currently being prepared. Please check back later.</p></div>`;
        }

        contentHTML += `</div>`; // Close outer space-y-10 container
        pageContent.innerHTML = contentHTML;
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Re-apply mark colors for search highlights

        pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`; // Staggered animation
        });

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            let bcHTML = `<a href="#home" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(sectionData.name)}</span>`;
            // Add subCategory to breadcrumbs if applicable
            if (subCategoryFilter && sectionData.subCategories) {
                const subCatData = sectionData.subCategories.find(sc => sc.id === subCategoryFilter);
                if (subCatData) {
                    bcHTML = `<a href="#home" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <a href="#${sectionData.id}" data-section-trigger="${sectionData.id}" class="hover:underline ${theme.cta}">${escapeHTML(sectionData.name)}</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(subCatData.name)}</span>`;
                }
            }
            breadcrumbsContainer.innerHTML = bcHTML;
            breadcrumbsContainer.classList.remove('hidden');
        }

        // Scroll to focused item
        if (itemIdToFocus) {
            setTimeout(() => {
                const targetCard = pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'shadow-2xl', 'focused-item');
                    setTimeout(() => targetCard.classList.remove('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'shadow-2xl', 'focused-item'), 3500);
                } else {
                    console.warn(`[app.js] Item "${itemIdToFocus}" not found in section "${sectionId}" for scroll focus.`);
                }
            }, 200); // Delay to allow content rendering
        }
        console.log(`[app.js] displaySectionContent completed for "${sectionId}".`);
    }


    function parseHash() {
        const hash = window.location.hash.substring(1); // Remove #
        if (!hash) return { sectionId: 'home', itemId: null, subCategoryFilter: null };

        const parts = hash.split('/');
        const sectionId = parts[0];
        let itemId = null;
        let subCategoryFilter = null;

        // Heuristic: if the second part looks like a subCategory ID (often text-based)
        // and the section actually has subcategories, treat it as such.
        // Otherwise, assume it's an itemId.
        // This needs robust data in kbSystemData.subCategories to check against.
        if (parts.length > 1) {
            const potentialSubCatId = parts[1];
            const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
            if (sectionData && sectionData.subCategories && sectionData.subCategories.some(sc => sc.id === potentialSubCatId)) {
                subCategoryFilter = potentialSubCatId;
            } else {
                itemId = parts[1]; // Default to itemId if not a clear subCategory
            }
        }
        return { sectionId, itemId, subCategoryFilter };
    }

    // Event Listeners for navigation
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            console.log(`[app.js] Sidebar link clicked for section: "${sectionId}"`);
            handleSectionTrigger(sectionId); // itemId and subCategoryFilter will be null, loading the main section page
        });
    });

    document.body.addEventListener('click', function(e) {
        // For section triggers (e.g., breadcrumbs, cards linking to sections/items)
        const sectionTriggerTarget = e.target.closest('[data-section-trigger]');
        if (sectionTriggerTarget) {
            e.preventDefault();
            const sectionId = sectionTriggerTarget.dataset.sectionTrigger;
            const itemId = sectionTriggerTarget.dataset.itemId; // Might be undefined
            const subCatFilter = sectionTriggerTarget.dataset.subcatFilter; // Might be undefined

            console.log(`[app.js] Click on data-section-trigger: section="${sectionId}", item="${itemId}", subCat="${subCatFilter}"`);
            handleSectionTrigger(sectionId, itemId, subCatFilter);

            // If clicked from global search results, hide them
            if (sectionTriggerTarget.closest('#searchResultsContainer')) {
                const searchResultsContainer = document.getElementById('searchResultsContainer');
                const globalSearchInput = document.getElementById('globalSearchInput');
                if (searchResultsContainer) searchResultsContainer.classList.add('hidden');
                // if (globalSearchInput) globalSearchInput.value = ''; // Optional: clear search on click
            }
        }

        // For home page quick links that might use data-subcat-trigger
        const homeSubcatTrigger = e.target.closest('[data-subcat-trigger]');
        if (homeSubcatTrigger && (document.getElementById('welcomeUserName') || pageContent?.innerHTML.includes('Welcome,'))) { // Check if on home
            e.preventDefault();
            const triggerValue = homeSubcatTrigger.dataset.subcatTrigger; // e.g., "support.tools"
            const parts = triggerValue.split('.');
            if (parts.length === 2) {
                const [sectionId, subId] = parts;
                console.log(`[app.js] Home page subcategory quick link: section="${sectionId}", subId="${subId}"`);
                handleSectionTrigger(sectionId, null, subId);
                 // Special scroll for Zendesk example (if needed, make more generic)
                if (sectionId === 'support' && subId === 'tools') {
                    setTimeout(() => {
                        const zendeskCard = Array.from(pageContent.querySelectorAll('.card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                        if (zendeskCard?.closest('.card')) {
                            zendeskCard.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 300);
                }
            } else {
                 console.warn(`[app.js] Invalid data-subcat-trigger format: "${triggerValue}"`);
            }
        }
    });

    window.addEventListener('hashchange', () => {
        console.log('[app.js] Hash changed event fired. New hash:', window.location.hash);
        if (!isInitialAuthCheckComplete || !currentUser) {
            console.warn('[app.js] Hash changed, but auth not ready or no user. Awaiting auth state.');
            return; // Let onAuthStateChange handle the initial load
        }
        const { sectionId, itemId, subCategoryFilter } = parseHash();
        handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);
    });


    // --- Global Search ---
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');

    if (globalSearchInput && searchResultsContainer) {
        let debounceTimeout;
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length < 2) { // Min query length
                    searchResultsContainer.classList.add('hidden');
                    searchResultsContainer.innerHTML = '';
                    return;
                }

                const results = searchKb(query); // searchKb is from data.js
                console.log(`[app.js] Global search for "${query}": ${results.length} results.`);

                if (results.length === 0) {
                    searchResultsContainer.innerHTML = `<div class="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">No results found for "${escapeHTML(query)}".</div>`;
                } else {
                    let resultsHTML = '';
                    results.slice(0, 10).forEach(result => { // Limit to 10 results for performance
                        const theme = getThemeColors(result.themeColor);
                        let title = highlightText(result.title, query);
                        let summary = result.summary ? highlightText(truncateText(result.summary, 100), query) : 'No summary available.';
                        
                        let triggerAttrs = `data-section-trigger="${result.sectionId}"`;
                        if (result.type === 'article' || result.type === 'case' || result.type === 'item') {
                            triggerAttrs += ` data-item-id="${result.id}"`;
                        } else if (result.type === 'glossary_term') {
                            // For glossary, an itemId might not be directly focusable in the same way,
                            // but we can still link to the section.
                            // itemId could be constructed, e.g., `glossary_${result.term_id_or_title}`
                        }
                        // section_match links to the section itself.

                        resultsHTML += `
                            <a href="#${result.sectionId}${result.id && (result.type !== 'section_match') ? '/' + result.id : ''}" ${triggerAttrs} 
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
                applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Re-apply mark colors
            }, 350); // Debounce time
        });

        globalSearchInput.addEventListener('focus', () => {
            if (searchResultsContainer.innerHTML.trim() !== '' && globalSearchInput.value.trim().length >= 2) {
                searchResultsContainer.classList.remove('hidden');
            }
        });

        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchResultsContainer.contains(e.target) && e.target !== globalSearchInput) {
                searchResultsContainer.classList.add('hidden');
            }
        });
    }

    // Placeholder for Rating
    document.body.addEventListener('click', (e) => {
        const ratingBtn = e.target.closest('.rating-btn');
        if (ratingBtn) {
            e.preventDefault(); // Prevent default if it's an <a> or button in a form
            const itemId = ratingBtn.dataset.itemId;
            const itemType = ratingBtn.dataset.itemType;
            const rating = ratingBtn.dataset.rating;
            console.log(`[app.js] Rating: ItemID=${itemId}, Type=${itemType}, Rating=${rating}`);
            alert(`Feedback recorded: ${rating === 'up' ? 'Helpful' : 'Not helpful'} for ${itemType} "${itemId}". (This is a placeholder)`);
            // Here you would typically send this data to your backend/Supabase table
        }
    });

    console.log('[app.js] All event listeners attached. Waiting for Supabase auth state.');
});
