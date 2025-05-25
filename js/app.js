import { supabase } from './supabase.js'; // Assuming supabase.js is in the same directory

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[App.js] DOMContentLoaded fired.');

    let currentUser = null; // Will be populated by Supabase Auth

    // --- Authentication Check ---
    async function checkAuthenticationAndInitialize() {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('[App.js] Error getting session:', sessionError);
            window.location.replace('login.html'); // Redirect if session error
            return;
        }

        if (session && session.user) {
            console.log('[App.js] User session found. User ID:', session.user.id);
            const authUser = session.user;
            // Fetch profile from public.users table
            try {
                const { data: userProfile, error: profileError } = await supabase
                    .from('users') // Your public users table
                    .select('full_name, role')
                    .eq('id', authUser.id) // Match by Supabase Auth User ID
                    .single();

                if (profileError && profileError.code !== 'PGRST116') { // PGRST116: "single" row not found
                    console.error('[App.js] Error fetching user profile from public.users:', profileError);
                    // User exists in auth.users but not in public.users (should not happen with proper signup)
                    // Fallback or redirect
                    currentUser = {
                        id: authUser.id,
                        email: authUser.email,
                        fullName: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
                        role: 'viewer' // Default to viewer if profile fetch fails
                    };
                    console.warn('[App.js] User profile not found in public.users, using defaults.');
                } else if (userProfile) {
                    currentUser = {
                        id: authUser.id,
                        email: authUser.email,
                        fullName: userProfile.full_name || authUser.user_metadata?.full_name || authUser.email.split('@')[0],
                        role: userProfile.role || 'viewer'
                    };
                    console.log('[App.js] Current user with profile:', currentUser);
                } else {
                     // User in auth.users but no corresponding entry in public.users
                    console.warn(`[App.js] No profile found in 'users' table for auth user ID: ${authUser.id}. Defaulting role.`);
                    currentUser = {
                        id: authUser.id,
                        email: authUser.email,
                        fullName: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
                        role: 'viewer'
                    };
                }
            } catch (e) {
                console.error('[App.js] Exception fetching user profile:', e);
                currentUser = { // Fallback
                    id: authUser.id,
                    email: authUser.email,
                    fullName: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
                    role: 'viewer'
                };
            }
            // Initialize the rest of the app
            await initializeAppUI();
        } else {
            console.log('[App.js] No active session. Redirecting to login.');
            window.location.replace('login.html');
        }
    }

    // --- Initialize App UI and Event Listeners (only after auth is confirmed) ---
    async function initializeAppUI() {
        if (!currentUser) {
            console.error("[App.js] Cannot initialize UI without a current user.");
            window.location.replace('login.html'); // Should be redundant but as a safeguard
            return;
        }

        console.log('[App.js] Initializing UI for user:', currentUser.email, 'Role:', currentUser.role);
        console.log('[App.js] kbSystemData loaded:', typeof kbSystemData !== 'undefined');


        // --- Update User Display ---
        const userNameDisplay = document.getElementById('userNameDisplay');
        const welcomeUserName = document.getElementById('welcomeUserName');
        const avatarImg = document.querySelector('#userProfileButton img');

        if (currentUser) {
            const userDisplayName = currentUser.fullName || currentUser.email;
            if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
            if (welcomeUserName) welcomeUserName.textContent = `Welcome, ${userDisplayName}!`;
            if (avatarImg) {
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=6366F1&color=fff&size=36&font-size=0.45&rounded=true`;
                avatarImg.alt = `${userDisplayName} Avatar`;
            }
        }

        // --- KB Meta Info ---
        const kbVersionSpan = document.getElementById('kbVersion');
        const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
        const footerKbVersionSpan = document.getElementById('footerKbVersion');
        if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
            if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
            if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
            if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
        } else {
            console.warn('[App.js] kbSystemData or kbSystemData.meta not available for version info.');
        }

        // --- Helper Functions (escapeHTML, highlightText, truncateText, getThemeColors) ---
        // These functions are assumed to be defined as in your previous app.js
        // For brevity, I'm not repeating them here but they should be present.
        // MAKE SURE THE FOLLOWING FUNCTIONS ARE COPIED FROM YOUR PREVIOUS app.js:
        // - escapeHTML
        // - highlightText
        // - truncateText
        // - getThemeColors

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

        function getThemeColors(themeColor = 'gray') {
            const color = typeof themeColor === 'string' ? themeColor.toLowerCase() : 'gray';
            const colorMap = { /* ... Paste your full colorMap object here ... */ 
                blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400', iconContainer: 'bg-blue-100 dark:bg-blue-800/50', icon: 'text-blue-500 dark:text-blue-400', cta: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300', border: 'border-blue-500', tagBg: 'bg-blue-100 dark:bg-blue-500/20', tagText: 'text-blue-700 dark:text-blue-300', statusBg: 'bg-blue-100 dark:bg-blue-500/20', statusText: 'text-blue-700 dark:text-blue-400' },
                teal: { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-600 dark:text-teal-400', iconContainer: 'bg-teal-100 dark:bg-teal-800/50', icon: 'text-teal-500 dark:text-teal-400', cta: 'text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300', border: 'border-teal-500', tagBg: 'bg-teal-100 dark:bg-teal-500/20', tagText: 'text-teal-700 dark:text-teal-300', statusBg: 'bg-teal-100 dark:bg-teal-500/20', statusText: 'text-teal-700 dark:text-teal-400' },
                green: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600 dark:text-green-400', iconContainer: 'bg-green-100 dark:bg-green-800/50', icon: 'text-green-500 dark:text-green-400', cta: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300', border: 'border-green-500', tagBg: 'bg-green-100 dark:bg-green-500/20', tagText: 'text-green-700 dark:text-green-300', statusBg: 'bg-green-100 dark:bg-green-500/20', statusText: 'text-green-700 dark:text-green-400' },
                indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600 dark:text-indigo-400', iconContainer: 'bg-indigo-100 dark:bg-indigo-800/50', icon: 'text-indigo-500 dark:text-indigo-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-indigo-500', tagBg: 'bg-indigo-100 dark:bg-indigo-500/20', tagText: 'text-indigo-700 dark:text-indigo-300', statusBg: 'bg-indigo-100 dark:bg-indigo-500/20', statusText: 'text-indigo-700 dark:text-indigo-400' },
                // ... Add all other colors from your original getThemeColors function
                gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', iconContainer: 'bg-gray-100 dark:bg-gray-700/50', icon: 'text-gray-500 dark:text-gray-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-gray-500', tagBg: 'bg-gray-200 dark:bg-gray-700', tagText: 'text-gray-700 dark:text-gray-300', statusBg: 'bg-gray-200 dark:bg-gray-600', statusText: 'text-gray-700 dark:text-gray-300' }
            };
            return colorMap[color] || colorMap.gray;
        }


        // --- Toast Notification ---
        const toastNotification = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');
        function showToast(message, type = 'success') { /* ... Paste your showToast function here ... */
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


        // --- Modal Handling (openModal, closeModal) ---
        const genericModal = document.getElementById('genericModal');
        const modalTitleEl = document.getElementById('modalTitle');
        const modalContentEl = document.getElementById('modalContent');
        const modalActionsEl = document.getElementById('modalActions');
        const closeModalBtn = document.getElementById('closeModalBtn');
        let activeQuillEditor = null;
        function openModal(title, contentHTML, actionsHTML = '') { /* ... Paste your openModal function here ... */
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
        function closeModal() { /* ... Paste your closeModal function here ... */
            if (activeQuillEditor) activeQuillEditor = null; 
            if (genericModal) genericModal.classList.add('hidden');
            if(modalContentEl) modalContentEl.innerHTML = '';
            if(modalActionsEl) modalActionsEl.innerHTML = '';
        }
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && genericModal && !genericModal.classList.contains('hidden')) {
                closeModal();
            }
        });
        if (genericModal) {
            genericModal.addEventListener('click', (event) => {
                if (event.target === genericModal) closeModal();
            });
        }

        // --- Theme Switcher (applyTheme, loadTheme) ---
        const themeSwitcher = document.getElementById('themeSwitcher');
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');
        const htmlElement = document.documentElement;
        function applyTheme(theme) { /* ... Paste your applyTheme function here (ensure it handles mark background/color) ... */
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
                    mark.style.backgroundColor = '#78350f'; mark.style.color = '#f3f4f6';
                } else {
                    mark.style.backgroundColor = '#fde047'; mark.style.color = '#1f2937';
                }
            });
        }
        function loadTheme() { /* ... Paste your loadTheme function here ... */
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
        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error("Error logging out:", error);
                    showToast("Error logging out. Please try again.", "error");
                } else {
                    console.log("User logged out. Redirecting to login.");
                    currentUser = null; // Clear current user
                    window.location.replace('login.html');
                }
            });
        }

        // --- Report an Error Button ---
        const reportErrorBtn = document.getElementById('reportErrorBtn');
        const currentSectionTitleEl_Report = document.getElementById('currentSectionTitle'); // Use a different var name to avoid conflict
        if (reportErrorBtn) {
            reportErrorBtn.addEventListener('click', () => {
                const sectionTitleText = currentSectionTitleEl_Report ? currentSectionTitleEl_Report.textContent : 'Current Page';
                showToast(`Reporting issue for: ${sectionTitleText} (Placeholder)`, 'info');
            });
        }


        // --- Sidebar Navigation & Content Loading ---
        // ALL THE RENDERING FUNCTIONS (renderArticleCard_enhanced, renderItemCard_enhanced, renderCaseCard_enhanced)
        // displaySectionContent, showItemDetailsModal, renderAccessTrackingReport,
        // openCaseModal, openSubsectionModal, handleSectionTrigger, parseHash,
        // renderGlobalSearchResults_enhanced, renderSectionSearchResults
        // AND THEIR EVENT LISTENERS (sidebarLinks, body click, pageContent click)
        // SHOULD BE PASTED HERE FROM YOUR PREVIOUS, WORKING app.js version that included these.
        // Make sure they are adapted to use the new `currentUser` object (especially for role checks).

        // For brevity, I will outline the structure and key points to check.
        // YOU NEED TO PASTE THE FULL IMPLEMENTATIONS OF THESE FUNCTIONS.

        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const currentSectionTitleEl = document.getElementById('currentSectionTitle');
        const breadcrumbsContainer = document.getElementById('breadcrumbs');
        const pageContent = document.getElementById('pageContent');
        const accessTrackingReportContainer = document.getElementById('accessTrackingReportContainer');
        const initialPageContent = pageContent ? pageContent.innerHTML : '<p>Error: pageContent missing.</p>';

        function highlightSidebarLink(sectionId) { /* ... Paste ... */
            sidebarLinks.forEach(l => l.classList.remove('active'));
            const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
            if (activeLink) activeLink.classList.add('active');
        }

        // --- Card Rendering Functions (renderArticleCard_enhanced, etc.) ---
        // Ensure these are exactly as in your previous file.
        function renderArticleCard_enhanced(article, sectionData) { /* ... Paste ... */
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
        function renderItemCard_enhanced(item, sectionData) { /* ... Paste ... */
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
        function renderCaseCard_enhanced(caseItem, sectionData, isSupabaseCase = false) { /* ... Paste ... */
            const theme = getThemeColors(sectionData.themeColor);
            const caseIcon = 'fas fa-briefcase';
            const itemId = isSupabaseCase ? caseItem.id : caseItem.id; 
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


        async function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) { /* ... Paste your full displaySectionContent function, ensure role checks use the new currentUser ... */
            console.log(`[App.js] displaySectionContent for sectionId: "${sectionId}", item: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);
            if (!pageContent) { console.error('[App.js] pageContent is NULL.'); return; }
            if (accessTrackingReportContainer) accessTrackingReportContainer.classList.add('hidden');

            if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
                console.error('[App.js] kbSystemData is UNDEFINED.');
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
                await renderAccessTrackingReport();
                applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
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

            // Articles (from kbSystemData)
            if (sectionData.articles && sectionData.articles.length > 0) {
                contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
                sectionData.articles.forEach(article => contentHTML += renderArticleCard_enhanced(article, sectionData));
                contentHTML += `</div>`;
                hasContent = true;
            }

            // Cases (from Supabase)
            try {
                const { data: cases, error: casesError } = await supabase.from('cases').select('*').eq('section_id', sectionId).order('created_at', { ascending: false });
                if (casesError) throw casesError;
                if (cases && cases.length > 0) {
                    contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
                    cases.forEach(caseItem => contentHTML += renderCaseCard_enhanced(caseItem, sectionData, true));
                    contentHTML += `</div>`;
                    hasContent = true;
                }
            } catch (error) { console.error(`Error fetching cases for ${sectionId}:`, error); contentHTML += `<p class="text-red-500">Error loading cases.</p>`; }

            // Items (from kbSystemData)
            if (sectionData.items && sectionData.items.length > 0) {
                contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
                sectionData.items.forEach(item => contentHTML += renderItemCard_enhanced(item, sectionData));
                contentHTML += `</div>`;
                hasContent = true;
            }
            
            // SubCategories (from Supabase)
            try {
                const { data: subCategories, error: subCatError } = await supabase.from('sub_categories').select('*').eq('section_id', sectionId).order('name', { ascending: true });
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
            } catch (error) { console.error(`Error fetching subcategories for ${sectionId}:`, error); contentHTML += `<p class="text-red-500">Error loading sub-categories.</p>`; }

            // Glossary (from kbSystemData)
            if (sectionData.glossary && sectionData.glossary.length > 0) { /* ... Paste ... */ }
            
            if (!hasContent) { contentHTML += `<div class="p-10 text-center card-animate"><i class="fas fa-info-circle text-4xl text-gray-400 dark:text-gray-500 mb-4"></i><h3 class="text-xl font-semibold">No content yet</h3><p>Content for "${escapeHTML(sectionData.name)}" is being prepared.</p></div>`; }
            contentHTML += `</div>`;
            pageContent.innerHTML = contentHTML;
            pageContent.querySelectorAll('.card-animate').forEach((card, index) => card.style.animationDelay = `${index * 0.07}s`);

            if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
            // Breadcrumbs logic (ensure it handles subCategoryFilter and links correctly)
            // ... paste breadcrumbs logic here ...
            if (breadcrumbsContainer) {
                let bcHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(sectionData.name)}</span>`;
                if (subCategoryFilter) {
                    const subCatInfo = await supabase.from('sub_categories').select('name').eq('id', subCategoryFilter).single();
                    if (subCatInfo.data) bcHTML += ` <span class="mx-1">></span> <span class="${theme.text}">${escapeHTML(subCatInfo.data.name)}</span>`;
                }
                breadcrumbsContainer.innerHTML = bcHTML;
                breadcrumbsContainer.classList.remove('hidden');
                const homeBreadcrumbLink = breadcrumbsContainer.querySelector('[data-section-trigger="home"]');
                if (homeBreadcrumbLink) homeBreadcrumbLink.addEventListener('click', (e) => { e.preventDefault(); handleSectionTrigger('home'); });
            }


            if (itemIdToFocus) { /* ... Paste itemIdToFocus logic ... */ }
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');

            // Re-attach event listeners for dynamically added buttons
            const addCaseBtnInSection = document.getElementById('addCaseBtnInSection');
            if (addCaseBtnInSection) addCaseBtnInSection.addEventListener('click', () => openCaseModal(addCaseBtnInSection.dataset.sectionId));
            const addSubsectionBtnInSection = document.getElementById('addSubsectionBtnInSection');
            if (addSubsectionBtnInSection) addSubsectionBtnInSection.addEventListener('click', () => openSubsectionModal(addSubsectionBtnInSection.dataset.sectionId));
        }

        // --- Item Details, Access Tracking, Add/Edit Modals & Logic ---
        // PASTE ALL THESE FUNCTIONS:
        // - showItemDetailsModal
        // - renderAccessTrackingReport
        // - openCaseModal
        // - openSubsectionModal
        // Ensure they use the new `currentUser` and Supabase for data.
        async function showItemDetailsModal(itemId, itemType, sectionId) { /* ... Paste and ensure Supabase logging ... */ }
        async function renderAccessTrackingReport() { /* ... Paste and ensure Supabase fetching ... */ }
        async function openCaseModal(sectionId, caseIdToEdit = null) { /* ... Paste and ensure Supabase save/update ... */ }
        async function openSubsectionModal(sectionId, subsectionIdToEdit = null) { /* ... Paste and ensure Supabase save/update ... */ }


        function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) { /* ... Paste (should largely remain the same) ... */
            if (typeof kbSystemData === 'undefined') { console.error('[App.js] kbSystemData undefined in handleSectionTrigger!'); return; }
            highlightSidebarLink(sectionId);
            displaySectionContent(sectionId, itemId, subCategoryFilter); // This is async
            const hash = itemId ? `${sectionId}/${itemId}` : subCategoryFilter ? `${sectionId}/${subCategoryFilter}` : sectionId;
            window.history.replaceState(null, '', `#${hash}`);
        }

        function parseHash() { /* ... Paste (should largely remain the same) ... */
            const hash = window.location.hash.replace('#', '');
            if (!hash) return { sectionId: 'home' };
            const parts = hash.split('/');
            const sectionId = parts[0];
            let itemId = null;
            let subCategoryFilter = null;
            if (parts.length === 2) itemId = parts[1]; 
            if (parts.length === 3) { subCategoryFilter = parts[1]; itemId = parts[2]; }
            return { sectionId, itemId, subCategoryFilter };
        }

        // --- Global Search & Section Search ---
        // - renderGlobalSearchResults_enhanced
        // - renderSectionSearchResults
        // The searchKb function is in data.js and might need future updates to search Supabase data.
        const globalSearchInput = document.getElementById('globalSearchInput');
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        let searchDebounceTimer;
        if (globalSearchInput && searchResultsContainer) { /* ... Paste global search event listeners ... */ }
        function renderGlobalSearchResults_enhanced(results, query) { /* ... Paste ... */ }
        function renderSectionSearchResults(results, query, container, themeColor) { /* ... Paste ... */ }

        // --- Event Listeners (Sidebar, Body Click, Page Content Click) ---
        sidebarLinks.forEach(link => { /* ... Paste ... */ });
        document.body.addEventListener('click', async function(e) { /* ... Paste and ensure async actions like showItemDetailsModal are awaited ... */ });
        if (pageContent) { pageContent.addEventListener('click', async (e) => { /* ... Paste and ensure searchKb works or is adapted ... */ }); }


        // --- Initial Load / Hash Handling ---
        window.addEventListener('hashchange', () => {
            const { sectionId: newSectionId, itemId: newItemId, subCategoryFilter: newSubCategoryFilter } = parseHash();
            handleSectionTrigger(newSectionId || 'home', newItemId, newSubCategoryFilter);
        });

        const { sectionId: initialSectionId, itemId: initialItemId, subCategoryFilter: initialSubCategoryFilter } = parseHash();
        console.log('[App.js] Initial hash for UI init:', { initialSectionId, initialItemId, initialSubCategoryFilter });
        if (initialSectionId) {
            handleSectionTrigger(initialSectionId || 'home', initialItemId, initialSubCategoryFilter);
        } else {
            handleSectionTrigger('home');
        }

        console.log('[App.js] UI Initialized.');
    } // End of initializeAppUI

    // --- Start Authentication Check ---
    await checkAuthenticationAndInitialize();

    // Listener for auth state changes (e.g., token refreshed, signed out from another tab)
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('[App.js] Auth state changed:', event, session);
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            currentUser = null;
            window.location.replace('login.html');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session && session.user) {
                if (!currentUser || currentUser.id !== session.user.id) {
                    // User changed or first sign-in after initial load, re-initialize
                    console.log('[App.js] User session changed or established, re-checking auth.');
                    checkAuthenticationAndInitialize(); // Re-run the check and UI init
                }
            } else {
                // Session is null but event is not SIGNED_OUT, could be an error state
                 currentUser = null;
                 window.location.replace('login.html');
            }
        }
    });

});
