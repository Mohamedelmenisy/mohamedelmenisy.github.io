--- START OF MODIFIED app.js ---
import { supabase } from './supabase.js'; // Import Supabase client

let caseEditorQuill; // To hold the Quill instance for the case editor

document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js - MODIFIED] DOMContentLoaded fired.');

    // --- Supabase Table Names (Configuration) ---
    const TABLES = {
        CASES: 'cases', // Make sure this matches your Supabase table name
        VIEWS_LOG: 'views_log' // Make sure this matches your Supabase table name
    };

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
    if (typeof protectPage === 'function') {
        console.log('[app.js - MODIFIED] Calling protectPage().');
        protectPage();
    } else {
        console.warn('[app.js - MODIFIED] protectPage function not found. Checking Auth object.');
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated) {
            if (!Auth.isAuthenticated()) {
                console.log('[app.js - MODIFIED] Auth.isAuthenticated is false, calling Auth.logout().');
                Auth.logout(); // This should redirect to login
                return; // Stop further execution if not authenticated
            }
            console.log('[app.js - MODIFIED] User is authenticated via Auth object.');
        } else {
            console.error('[app.js - MODIFIED] CRITICAL: Authentication mechanism not found.');
            // Potentially redirect to login page here if no auth mechanism
            // window.location.href = '/login.html'; 
        }
    }

    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    console.log('[app.js - MODIFIED] Current user:', currentUser);

    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');

    if (currentUser) {
        const userDisplayName = currentUser.fullName || currentUser.email || 'User';
        if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
        if (welcomeUserName) welcomeUserName.textContent = `Welcome, ${userDisplayName}!`;
        
        // Avatar update moved to dashboard.html's own script block for clarity
        // or can be done here if Auth is guaranteed to be loaded.
    }

    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    } else {
        console.warn('[app.js - MODIFIED] kbSystemData or kbSystemData.meta not available for version info.');
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
    } else {
        console.warn("[app.js - MODIFIED] Logout button or Auth.logout not found.")
    }

    // --- Report an Error Button ---
    const reportErrorBtn = document.getElementById('reportErrorBtn');
    if (reportErrorBtn) {
        reportErrorBtn.addEventListener('click', () => {
            const sectionTitleText = currentSectionTitleEl ? currentSectionTitleEl.textContent : 'Current Page';
            const pageUrl = window.location.href;
            // Consider using a more robust error reporting mechanism (e.g., Sentry, or a Supabase table)
            alert(`Report an issue for: ${sectionTitleText}\nURL: ${pageUrl}\n(Error reporting placeholder - consider integration with a tracking service or Supabase table)`);
        });
    }

    // --- Case Editor Modal Functions ---
    window.openCaseEditor = function() { // Exposed to global scope for onclick
        document.getElementById('caseEditorModal').classList.remove('hidden');
        if (!caseEditorQuill) {
            caseEditorQuill = new Quill('#quillEditor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'], // 'image' might require custom handling for uploads
                        ['clean']
                    ]
                },
                placeholder: 'Describe the resolution steps or details...'
            });
        }
        // Clear previous values
        document.getElementById('caseTitle').value = '';
        document.getElementById('caseSummary').value = '';
        if(caseEditorQuill) caseEditorQuill.setText(''); // Clear editor content
        document.getElementById('caseTitle').focus();
    }

    window.closeCaseEditor = function() { // Exposed to global scope for onclick
        document.getElementById('caseEditorModal').classList.add('hidden');
    }

    window.saveCaseToSupabase = async function() { // Exposed to global scope for onclick
        if (!supabase) {
            alert('Supabase client is not initialized. Cannot save case.');
            console.error('Supabase client not initialized.');
            return;
        }

        const title = document.getElementById('caseTitle').value.trim();
        const summary = document.getElementById('caseSummary').value.trim();
        const resolution_steps = caseEditorQuill ? caseEditorQuill.root.innerHTML : '';

        if (!title || !summary) {
            alert("Please fill in at least Case Title and Summary.");
            return;
        }

        const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
        const created_by_email = user ? user.email : 'anonymous'; // Or user.id if email is not primary
        const created_by_name = user ? (user.fullName || user.email) : 'Anonymous User';


        const caseData = {
            title,
            summary,
            resolution_steps,
            status: 'New', // Default status
            created_by_email, // Store email
            created_by_name,  // Store name for display
            // Supabase automatically adds 'id' (if primary key) and 'created_at' (if default now())
            // last_updated_at: new Date().toISOString() // Or let Supabase handle this with a trigger
        };

        try {
            const { data, error } = await supabase
                .from(TABLES.CASES)
                .insert([caseData])
                .select(); // Optionally select to get the inserted data back

            if (error) {
                console.error('Error saving case to Supabase:', error);
                alert(`Error saving case: ${error.message}`);
            } else {
                alert('Case saved successfully!');
                console.log('Case saved:', data);
                closeCaseEditor();
                // OPTIONAL: Refresh current view if it's supposed to show cases,
                // or add the new case to kbSystemData locally and re-render.
                // For simplicity, we'll just close. A full refresh or dynamic update is more complex.
                // Example: if current section is 'support', reload it or add to its 'cases' array
                const currentHash = window.location.hash.replace('#','').split('/')[0];
                if (kbSystemData && kbSystemData.sections) {
                    const targetSection = kbSystemData.sections.find(s => s.id === currentHash);
                    if (targetSection && targetSection.cases && data && data.length > 0) {
                         // Map Supabase data to your local structure if needed
                        const newCaseForLocal = {
                            id: data[0].id, // Assuming Supabase returns the ID
                            title: data[0].title,
                            summary: data[0].summary,
                            status: data[0].status,
                            tags: [], // Add tags input to modal if needed
                            resolutionStepsPreview: truncateText(stripHtml(data[0].resolution_steps), 50), // Helper to strip HTML for preview
                            // contentPath: ... if you generate a detail page
                            lastUpdated: new Date().toISOString().split('T')[0],
                        };
                        targetSection.cases.unshift(newCaseForLocal); // Add to beginning
                        displaySectionContent(currentHash); // Re-render current section
                    }
                }
            }
        } catch (err) {
            console.error('Unexpected error during saveCaseToSupabase:', err);
            alert('An unexpected error occurred while saving the case.');
        }
    }
    
    // Helper to strip HTML for previews
    function stripHtml(html) {
        let tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }


    // --- User View Logging ---
    async function logUserView(itemId, itemType, sectionId = null, details = null) {
        if (!supabase) {
            console.warn("Supabase client not available for logging view.");
            return;
        }
        const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
        const user_identifier = user ? (user.email || user.id || 'unknown_user') : 'anonymous_user';

        const viewData = {
            item_id: itemId, // e.g., article_id, case_id, section_id
            item_type: itemType, // e.g., 'article', 'case', 'section', 'search_query'
            user_identifier: user_identifier,
            viewed_at: new Date().toISOString(),
            // section_id: sectionId, // Can be useful context
            // details: details // e.g., search query text
        };
        if (sectionId) viewData.section_id = sectionId;
        if (details) viewData.details_text = details;


        try {
            const { error } = await supabase.from(TABLES.VIEWS_LOG).insert([viewData]);
            if (error) {
                console.error('Error logging view to Supabase:', error);
            } else {
                // console.log('View logged:', itemId, itemType);
            }
        } catch (err) {
            console.error('Unexpected error logging view:', err);
        }
    }


    // --- Sidebar Navigation & Content Loading ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');

    console.log('[app.js - DEBUG] pageContent:', pageContent ? 'Found' : 'Not found');
    console.log('[app.js - DEBUG] sidebarLinks:', sidebarLinks.length, 'links found');

    const initialPageContent = pageContent ? pageContent.innerHTML : '<p>Error: pageContent missing on load.</p>';

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        } else {
            console.warn(`[app.js - MODIFIED] No sidebar link found for section: "${sectionId}"`);
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
        const cardIconClass = sectionData.icon || 'fas fa-file-alt'; // Default icon
        // Note: contentPath might lead to a detail page or open a modal with full content.
        // For now, it's a link.
        const detailLink = article.contentPath ? 
            `<a href="${escapeHTML(article.contentPath)}" target="_blank" class="text-sm font-medium ${theme.cta} group">Read More <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i></a>` :
            `<button onclick="viewArticleDetail('${sectionData.id}', '${article.id}')" class="text-sm font-medium ${theme.cta} group">View Details <i class="fas fa-eye ml-1 text-xs opacity-75 group-hover:scale-110 transition-transform duration-200"></i></button>`;


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
                    ${detailLink}
                </div>
            </div>
        `;
    }
     window.viewArticleDetail = function(sectionId, articleId) {
        // This is a placeholder. You'd implement a modal or a detail view display here.
        // For now, it will just log and alert.
        console.log(`Request to view article: ${sectionId}/${articleId}`);
        alert(`Placeholder: View details for article ${articleId} in section ${sectionId}. Implement modal or detail page.`);
        logUserView(articleId, 'article_detail_view', sectionId);
    }


    function renderItemCard_enhanced(item, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        const cardIconClass = sectionData.icon || 'fas fa-file-alt'; // Default icon
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
                    <a href="${escapeHTML(item.url)}" target="_blank" class="text-sm font-medium ${theme.cta} group">
                        Open <i class="fas fa-external-link-alt ml-1 text-xs opacity-75 group-hover:scale-110 transition-transform duration-200"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function renderCaseCard_enhanced(caseItem, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        const caseIcon = 'fas fa-briefcase'; // Specific icon for cases
        
        // Adapt based on how case details are viewed (e.g., modal or separate page)
        const detailLink = caseItem.contentPath ? 
            `<a href="${escapeHTML(caseItem.contentPath)}" target="_blank" class="text-sm font-medium ${theme.cta} group">Details <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i></a>` :
            (caseItem.id.startsWith('case') && caseItem.resolutionStepsPreview) ? // Local case from data.js
            `<button onclick="viewCaseDetail('${sectionData.id}', '${caseItem.id}')" class="text-sm font-medium ${theme.cta} group">View Details <i class="fas fa-eye ml-1 text-xs opacity-75 group-hover:scale-110 transition-transform duration-200"></i></button>` :
            (caseItem.id && !caseItem.id.startsWith('case') && caseItem.resolution_steps) ? // Case from Supabase (assuming ID is numeric or UUID)
            `<button onclick="viewSupabaseCaseDetail('${caseItem.id}')" class="text-sm font-medium ${theme.cta} group">View Details <i class="fas fa-eye ml-1 text-xs opacity-75 group-hover:scale-110 transition-transform duration-200"></i></button>` :
            `<div class="w-16"></div>`; // Placeholder if no detail action

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
                ${caseItem.resolutionStepsPreview || (caseItem.resolution_steps && truncateText(stripHtml(caseItem.resolution_steps), 70)) ? `<p class="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">Steps: ${escapeHTML(caseItem.resolutionStepsPreview || truncateText(stripHtml(caseItem.resolution_steps), 70))}</p>` : ''}
                ${caseItem.tags && caseItem.tags.length > 0 ? `<div class="mb-3">${caseItem.tags.map(tag => `<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-sm font-medium px-3 py-1 rounded-full ${theme.statusBg} ${theme.statusText}">${escapeHTML(caseItem.status)}</span>
                    ${detailLink}
                </div>
            </div>
        `;
    }

    window.viewCaseDetail = function(sectionId, caseId) {
        // Placeholder for local cases from data.js
        console.log(`Request to view case: ${sectionId}/${caseId}`);
        const section = kbSystemData.sections.find(s => s.id === sectionId);
        const caseItem = section?.cases?.find(c => c.id === caseId);
        if (caseItem) {
            alert(`Local Case: ${caseItem.title}\nSummary: ${caseItem.summary}\nStatus: ${caseItem.status}\nPreview: ${caseItem.resolutionStepsPreview || 'N/A'}`);
        } else {
            alert(`Case ${caseId} not found in section ${sectionId}.`);
        }
        logUserView(caseId, 'case_detail_view_local', sectionId);
    }

    window.viewSupabaseCaseDetail = async function(caseId) {
        // Placeholder for cases from Supabase (e.g., newly added ones)
        console.log(`Request to view Supabase case ID: ${caseId}`);
        if (!supabase) return alert("Supabase not initialized.");
        try {
            const {data, error} = await supabase.from(TABLES.CASES).select('*').eq('id', caseId).single();
            if (error) throw error;
            if (data) {
                 alert(`Supabase Case: ${data.title}\nSummary: ${data.summary}\nStatus: ${data.status}\nResolution: ${stripHtml(data.resolution_steps).substring(0,200)}...`);
            } else {
                alert(`Case with ID ${caseId} not found in Supabase.`);
            }
        } catch(err) {
            console.error("Error fetching case from Supabase:", err);
            alert("Error fetching case details.");
        }
        logUserView(caseId, 'case_detail_view_supabase');
    }


    function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        console.log(`[app.js - MODIFIED] displaySectionContent CALLED for sectionId: "${sectionId}", item: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);
        if (!pageContent) {
            console.error('[app.js - MODIFIED] pageContent is NULL.');
            return;
        }
        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js - MODIFIED] kbSystemData is UNDEFINED.');
            pageContent.innerHTML = '<p class="text-red-500 p-4">Error: Knowledge base data is missing or not loaded correctly. Check console.</p>';
            return;
        }
        
        logUserView(sectionId, itemIdToFocus ? 'item_focus_in_section' : (subCategoryFilter ? 'subcategory_view' : 'section_view'), sectionId, itemIdToFocus || subCategoryFilter);


        if (sectionId === 'home') {
            pageContent.innerHTML = initialPageContent; // Restore original home content
             // Re-apply animation delays for home page specific cards
            const homeCards = pageContent.querySelectorAll('.grid > .card-animate');
            homeCards.forEach((card, index) => {
                card.style.animationDelay = `${(index + 1) * 0.1}s`;
            });
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Welcome';
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            const welcomeUserEl = document.getElementById('welcomeUserName'); // Re-fetch as it was replaced
            if (currentUser && welcomeUserEl) welcomeUserEl.textContent = `Welcome, ${currentUser.fullName || currentUser.email}!`;
            
            const kbVersionEl = document.getElementById('kbVersion'); // Re-fetch
            const lastKbUpdateEl = document.getElementById('lastKbUpdate'); // Re-fetch
            if (kbSystemData.meta) {
                if (kbVersionEl) kbVersionEl.textContent = kbSystemData.meta.version;
                if (lastKbUpdateEl) lastKbUpdateEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Re-apply theme related styles
            console.log('[app.js - MODIFIED] Home page loaded.');
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center"><h2 class="text-xl font-semibold">Section not found</h2><p>"${escapeHTML(sectionId)}" does not exist.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Not Found';
            console.warn(`[app.js - MODIFIED] Section "${sectionId}" not found in kbSystemData.`);
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);

        let contentHTML = `<div class="space-y-10">`;
        contentHTML += `<div class="flex justify-between items-center"><h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center"><span class="p-2.5 rounded-lg ${theme.iconContainer} mr-4 hidden sm:inline-flex"><i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i></span>${escapeHTML(sectionData.name)}</h2></div>`;
        contentHTML += `<p class="text-gray-600 dark:text-gray-300 mt-1 mb-6 text-lg">${escapeHTML(sectionData.description)}</p>`;

        // Section-specific search
        contentHTML += `<div class="my-6 p-4 bg-white dark:bg-gray-800/70 rounded-lg shadow-md card-animate" style="animation-delay: 0s;"><label for="sectionSearchInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ask about ${escapeHTML(sectionData.name)}:</label><div class="flex"><input type="text" id="sectionSearchInput" data-section-id="${sectionData.id}" class="flex-grow p-2.5 border rounded-l-md dark:bg-gray-700 dark:border-gray-600" placeholder="Type your question..."><button id="sectionSearchBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md flex items-center"><i class="fas fa-search mr-2"></i>Ask</button></div><div id="sectionSearchResults" class="mt-4 max-h-96 overflow-y-auto space-y-2"></div></div>`;
        
        let hasContent = false;
        let filteredArticles = sectionData.articles || [];
        let filteredCases = sectionData.cases || [];
        let filteredItems = sectionData.items || [];

        if (subCategoryFilter) {
            // This is a simple filter. For more complex scenarios, tags or specific properties might be better.
            // Assuming subCategoryFilter matches a tag or a specific property on items.
            // For this example, let's assume subCategories in data.js might have associated tags.
            // For a real sub-category filter, you'd likely have a 'category' or 'subCategory' property on each article/case/item.
            console.log(`[app.js - MODIFIED] Filtering by subCategory: ${subCategoryFilter}`);
            const subCatData = sectionData.subCategories?.find(sc => sc.id === subCategoryFilter);
            if (subCatData) { // If subCategory exists
                 // Example: if subCatData.id is 'tools', filter articles/items tagged with 'tools' or having type 'tool'
                 // This logic needs to be adapted based on how your data is structured for subcategories.
                 // For now, this is a placeholder for actual filtering logic.
                filteredArticles = filteredArticles.filter(a => a.tags?.includes(subCategoryFilter) || a.subCategory === subCategoryFilter);
                filteredCases = filteredCases.filter(c => c.tags?.includes(subCategoryFilter) || c.subCategory === subCategoryFilter);
                filteredItems = filteredItems.filter(i => i.type === subCategoryFilter || i.tags?.includes(subCategoryFilter) || i.subCategory === subCategoryFilter);
            }
        }


        if (filteredArticles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles ${subCategoryFilter ? `(${escapeHTML(sectionData.subCategories.find(sc=>sc.id===subCategoryFilter)?.name || subCategoryFilter)})` : ''}</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            filteredArticles.forEach(article => contentHTML += renderArticleCard_enhanced(article, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (filteredCases.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases ${subCategoryFilter ? `(${escapeHTML(sectionData.subCategories.find(sc=>sc.id===subCategoryFilter)?.name || subCategoryFilter)})` : ''}</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            filteredCases.forEach(caseItem => contentHTML += renderCaseCard_enhanced(caseItem, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (filteredItems.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> ${escapeHTML(sectionData.name)} Items ${subCategoryFilter ? `(${escapeHTML(sectionData.subCategories.find(sc=>sc.id===subCategoryFilter)?.name || subCategoryFilter)})` : ''}</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            filteredItems.forEach(item => contentHTML += renderItemCard_enhanced(item, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }
        
        // Only show sub-categories if NOT currently filtering by one
        if (!subCategoryFilter && sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories</h3><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
            sectionData.subCategories.forEach(subCat => contentHTML += `<a href="#" data-section-trigger="${sectionData.id}" data-subcat-filter="${subCat.id}" class="sub-category-link bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-lg card-animate group border-l-4 ${theme.border} text-center"><i class="fas fa-folder-open text-3xl mb-3 ${theme.icon}"></i><h4 class="font-medium">${escapeHTML(subCat.name)}</h4></a>`);
            contentHTML += `</div>`;
            // hasContent = true; // Subcategories themselves are navigation, not direct content for "empty" check
        }
        
        if (sectionData.glossary && sectionData.glossary.length > 0 && !subCategoryFilter) { // Don't show glossary if sub-category is active
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-book mr-3 ${theme.text}"></i> Glossary</h3><div class="space-y-4">`;
            sectionData.glossary.forEach(entry => contentHTML += `<div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow card-animate border-l-4 ${theme.border}"><strong class="${theme.text}">${escapeHTML(entry.term)}:</strong> ${escapeHTML(entry.definition)}</div>`);
            contentHTML += `</div>`;
            hasContent = true;
        }

        if (!hasContent) { // If after filtering, no direct content is shown
            let emptyMessage = `No content yet for "${escapeHTML(sectionData.name)}"`;
            if (subCategoryFilter) {
                 const subCatName = sectionData.subCategories?.find(sc => sc.id === subCategoryFilter)?.name || subCategoryFilter;
                 emptyMessage = `No specific content found for sub-category "${escapeHTML(subCatName)}" in "${escapeHTML(sectionData.name)}".`;
            }
            contentHTML += `<div class="p-10 text-center card-animate"><i class="fas fa-info-circle text-4xl text-gray-400 dark:text-gray-500 mb-4"></i><h3 class="text-xl font-semibold">${emptyMessage}</h3><p>Content is being prepared or this sub-category might be empty.</p></div>`;
        }
        contentHTML += `</div>`;

        pageContent.innerHTML = contentHTML;
        console.log(`[app.js - MODIFIED] Successfully set innerHTML for section "${sectionId}".`);

        pageContent.querySelectorAll('.card-animate').forEach((card, index) => card.style.animationDelay = `${index * 0.07}s`);

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            let bcHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> `;
            if (subCategoryFilter && sectionData.subCategories?.find(sc => sc.id === subCategoryFilter)) {
                 bcHTML += `<a href="#" data-section-trigger="${sectionData.id}" class="hover:underline ${theme.text}">${escapeHTML(sectionData.name)}</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(sectionData.subCategories.find(sc => sc.id === subCategoryFilter).name)}</span>`;
            } else {
                bcHTML += `<span class="${theme.text} font-medium">${escapeHTML(sectionData.name)}</span>`;
            }
            breadcrumbsContainer.innerHTML = bcHTML;
            breadcrumbsContainer.classList.remove('hidden');
        }

        if (itemIdToFocus) {
            setTimeout(() => {
                const targetCard = pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item');
                    setTimeout(() => targetCard.classList.remove('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400', 'focused-item'), 3500);
                    logUserView(itemIdToFocus, 'item_direct_focus', sectionId); // Specific log for focused item
                } else {
                    console.warn(`[app.js - MODIFIED] Item "${itemIdToFocus}" not found for section "${sectionId}" to focus.`);
                }
            }, 200);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        console.log('[app.js - MODIFIED] handleSectionTrigger called with:', { sectionId, itemId, subCategoryFilter });
        if (typeof kbSystemData === 'undefined') {
            console.error('[app.js - MODIFIED] kbSystemData undefined in handleSectionTrigger!');
            return;
        }
        highlightSidebarLink(sectionId); // Highlight before display to avoid visual lag
        displaySectionContent(sectionId, itemId, subCategoryFilter);
        
        // Update URL hash
        let hash = sectionId;
        if (subCategoryFilter) hash += `/${subCategoryFilter}`; // Prioritize subCategory in URL if present
        if (itemId) hash += `/${itemId}`; // Item ID can be appended

        // Avoid double slashes if subCategoryFilter is null but itemId is present
        if (!subCategoryFilter && itemId) hash = `${sectionId}/${itemId}`;


        window.history.replaceState(null, '', `#${hash}`);
        console.log(`[app.js - MODIFIED] Updated URL hash to: #${hash}`);
    }

    // Parse URL hash - extended to handle section/subcategory/item
    function parseHash() {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return { sectionId: 'home' };
        const parts = hash.split('/');
        const sectionId = parts[0];
        let itemId = null;
        let subCategoryFilter = null;

        // Logic: #section/item OR #section/subcategory OR #section/subcategory/item
        if (parts.length === 2) {
            // Could be item or subcategory. Check if parts[1] is a known subcategory ID for this section.
            const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
            if (sectionData && sectionData.subCategories && sectionData.subCategories.some(sc => sc.id === parts[1])) {
                subCategoryFilter = parts[1];
            } else {
                itemId = parts[1]; // Assume it's an item ID
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
                handleSectionTrigger(sectionId); // Clicking main section link clears subcat/item focus
            } else {
                console.error('[app.js - MODIFIED] No data-section attribute found on sidebar link:', this);
            }
        });
    });

    // Body click listener for dynamic links (data-section-trigger, data-subcat-trigger)
    document.body.addEventListener('click', function(e) {
        const sectionTriggerTarget = e.target.closest('[data-section-trigger]');
        if (sectionTriggerTarget) {
            e.preventDefault();
            const sectionId = sectionTriggerTarget.dataset.sectionTrigger;
            const itemId = sectionTriggerTarget.dataset.itemId; // For search results or direct item links
            const subCatFilter = sectionTriggerTarget.dataset.subcatFilter; // For sub-category links

            if (sectionId) {
                handleSectionTrigger(sectionId, itemId, subCatFilter);
                if (sectionTriggerTarget.closest('#searchResultsContainer, #sectionSearchResults')) {
                    if (searchResultsContainer) searchResultsContainer.classList.add('hidden');
                    if (globalSearchInput) globalSearchInput.value = '';
                    const sectionSearchRes = document.getElementById('sectionSearchResults');
                    if (sectionSearchRes) sectionSearchRes.innerHTML = '';
                }
            }
            return; // Processed, exit
        }

        const homeSubcatTrigger = e.target.closest('[data-subcat-trigger]');
        if (homeSubcatTrigger && pageContent.querySelector('#welcomeUserName')) { // Only for home page context
            e.preventDefault();
            const triggerValue = homeSubcatTrigger.dataset.subcatTrigger; // e.g., "support.tools"
            if (triggerValue && triggerValue.includes('.')) {
                const [sectionId, subId] = triggerValue.split('.');
                handleSectionTrigger(sectionId, null, subId); // Navigate to section with subcategory filter
            }
            return; // Processed, exit
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
                    if (query.length > 2) logUserView(query, 'global_search_query', null, query);
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
        console.warn('[app.js - MODIFIED] Global search elements missing.');
    }

    function renderGlobalSearchResults_enhanced(results, query) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<div class="p-3 text-sm text-gray-500 dark:text-gray-400">No results for "${escapeHTML(query)}".</div>`;
            searchResultsContainer.classList.remove('hidden');
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-gray-200 dark:divide-gray-700';
        results.slice(0, 10).forEach(result => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `javascript:void(0);`; // JS will handle navigation via event delegation
            a.dataset.sectionTrigger = result.sectionId;
            
            // Determine if it's a direct item link or a section/glossary link
            if (result.type === 'article' || result.type === 'case' || result.type === 'item') {
                a.dataset.itemId = result.id;
            } else if (result.type === 'glossary_term') {
                // For glossary, we might want to scroll to the section, not a specific item ID
                // Or, if glossary terms have unique IDs within sectionData.glossary, they could be used.
                // For now, just link to the section.
            }
            // section_match type already just uses sectionId

            a.className = 'block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors global-search-result-link';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-semibold text-gray-800 dark:text-gray-200';
            titleDiv.innerHTML = highlightText(result.title, query);
            
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 100), query) : (result.type === 'section_match' ? 'Go to section' : '');
            
            const sectionDiv = document.createElement('div');
            const theme = getThemeColors(result.themeColor || 'gray');
            sectionDiv.className = `text-xs ${theme.text} mt-1 font-medium`;
            sectionDiv.textContent = `In: ${escapeHTML(result.sectionName || 'Unknown Section')}`;
            
            a.appendChild(titleDiv);
            if (result.summary || result.type === 'section_match') a.appendChild(summaryDiv);
            a.appendChild(sectionDiv);
            li.appendChild(a);
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
        searchResultsContainer.classList.remove('hidden');
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Re-apply for marks
    }

    function renderSectionSearchResults(results, query, container, sectionId) {
        if (!container) return;
        container.innerHTML = '';
        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        const themeColor = sectionData?.themeColor || 'gray';

        if (results.length === 0) {
            container.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">No results found for "${escapeHTML(query)}" in this section.</p>`;
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'space-y-2';
        const theme = getThemeColors(themeColor);
        results.slice(0, 5).forEach(result => { // Show top 5 results within section
            // Filter results to only show those belonging to the current section
            if (result.sectionId !== sectionId) return;

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `javascript:void(0);`;
            a.dataset.sectionTrigger = result.sectionId;
            // Similar logic as global search for item ID
            if (result.type === 'article' || result.type === 'case' || result.type === 'item') {
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
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Re-apply for marks
    }


    if (pageContent) {
        pageContent.addEventListener('click', (e) => {
            const ratingTarget = e.target.closest('.rating-btn');
            if (ratingTarget) {
                e.preventDefault();
                const ratingContainer = ratingTarget.closest('.rating-container');
                if (ratingContainer) {
                    const itemId = ratingTarget.dataset.itemId;
                    const itemType = ratingTarget.dataset.itemType;
                    const rating = ratingTarget.dataset.rating;
                    ratingContainer.innerHTML = `<span class="text-xs text-green-500 dark:text-green-400">Thanks for your feedback!</span>`;
                    logUserView(itemId, `${itemType}_rating_${rating}`, ratingTarget.closest('[data-item-id]')?.closest('.card-animate')?.closest('[data-section-id]')?.dataset.sectionId || null);
                }
                return;
            }
            const sectionSearchBtn = e.target.closest('#sectionSearchBtn');
            if (sectionSearchBtn) {
                e.preventDefault();
                const input = pageContent.querySelector('#sectionSearchInput');
                const currentSectionId = input?.dataset.sectionId;
                const query = input?.value.trim();
                if (query && query.length > 1 && typeof searchKb === 'function' && currentSectionId) {
                    const results = searchKb(query); // Get all results
                    const resultsContainerEl = pageContent.querySelector('#sectionSearchResults');
                    if (resultsContainerEl) {
                        renderSectionSearchResults(results, query, resultsContainerEl, currentSectionId);
                        if (query.length > 2) logUserView(query, 'section_search_query', currentSectionId, query);
                    }
                } else if (input) {
                    const resultsContainerEl = pageContent.querySelector('#sectionSearchResults');
                    if (resultsContainerEl) resultsContainerEl.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md">Please enter a query with at least 2 characters.</p>`;
                }
                return;
            }
        });
         // Handle Enter key for section search
        pageContent.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.target.id === 'sectionSearchInput') {
                e.preventDefault();
                const sectionSearchBtn = pageContent.querySelector('#sectionSearchBtn');
                if (sectionSearchBtn) sectionSearchBtn.click();
            }
        });
    } else {
        console.error('[app.js - MODIFIED] pageContent element not found on initialization.');
    }

    // Handle URL hash on page load and hash change
    window.addEventListener('hashchange', () => {
        const { sectionId, itemId, subCategoryFilter } = parseHash();
        console.log('[app.js - MODIFIED] Hash changed:', { sectionId, itemId, subCategoryFilter });
        handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);
    });

    // Initial load with hash support
    const { sectionId, itemId, subCategoryFilter } = parseHash();
    console.log('[app.js - MODIFIED] Initial hash load:', { sectionId, itemId, subCategoryFilter });
    handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);

    console.log('[app.js - MODIFIED] All initializations complete.');
});
--- END OF MODIFIED app.js ---
