```javascript
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js - FIX] DOMContentLoaded fired.');

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

    // --- Initialize TinyMCE ---
    if (document.getElementById('caseEditor')) {
        tinymce.init({
            selector: '#caseEditor',
            plugins: 'image link table lists code',
            toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | image link table | bullist numlist',
            image_uploadtab: true,
            file_picker_types: 'image',
            file_picker_callback: function (cb, value, meta) {
                let input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.onchange = function () {
                    let file = this.files[0];
                    let reader = new FileReader();
                    reader.onload = function () {
                        let id = 'blobid' + (new Date()).getTime();
                        let blobCache = tinymce.activeEditor.editorUpload.blobCache;
                        let base64 = reader.result.split(',')[1];
                        let blobInfo = blobCache.create(id, file, base64);
                        blobCache.add(blobInfo);
                        cb(blobInfo.blobUri(), { title: file.name });
                    };
                    reader.readAsDataURL(file);
                };
                input.click();
            },
            setup: function (editor) {
                editor.on('init', function () {
                    applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
                });
            }
        });
    }

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
            orange: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-600 dark:text-orange-400', iconContainer: 'bg-orange-100 dark:bg-orange-800/50', icon: 'text-orange-500 dark:text-orange-400', cta: 'text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300', border: 'border-orange-500', tagBg: 'bg-orange-100 dark:bg-orange-500/20', tagText: 'text-orange-700 dark:text-orange-300', statusBg: 'bg-orange-100 dark:bg-orange-500/20', statusText: 'text-orange-700 dark:text-orange-400' },
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
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-sm font-medium px-3 py-1 rounded-full ${theme.statusBg} ${theme.statusText}">${escapeHTML(caseItem.status)}</span>
                    <div class="flex items-center space-x-2">
                        <button class="edit-case-btn text-indigo-600 hover:text-indigo-700" data-section-id="${sectionData.id}" data-case-id="${caseItem.id}">Edit</button>
                        <button class="delete-case-btn text-red-600 hover:text-red-700" data-section-id="${sectionData.id}" data-case-id="${caseItem.id}">Delete</button>
                        ${caseItem.contentPath ? `<a href="${caseItem.contentPath}" target="_blank" class="text-sm font-medium ${theme.cta} group">Details <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1 transition-transform duration-200"></i></a>` : `<div class="w-16"></div>`}
                    </div>
                </div>
            </div>
        `;
    }

    function renderSubsectionCard(subsection, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        const subsectionIcon = 'fas fa-folder-open';
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${subsection.id}" data-item-type="subsection">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                        <i class="${subsectionIcon} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(subsection.name)}</h3>
                    <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${subsection.id}'); alert('Link copied!');" class="bookmark-link ml-auto pl-2" title="Copy link to this subsection">
                        <i class="fas fa-link text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"></i>
                    </a>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${escapeHTML(subsection.description) || 'No description.'}</p>
                ${subsection.files && subsection.files.length > 0 ? `
                    <div class="mb-4">
                        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Files</h4>
                        ${subsection.files.map(file => `<a href="${file.url}" target="_blank" class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(file.name)}</a>`).join('')}
                    </div>` : ''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs ${theme.tagBg} ${theme.tagText} px-3 py-1 rounded-full uppercase font-semibold tracking-wide">Subsection</span>
                    <div class="flex items-center space-x-2">
                        <button class="edit-subsection-btn text-indigo-600 hover:text-indigo-700" data-section-id="${sectionData.id}" data-subsection-id="${subsection.id}">Edit</button>
                        <button class="delete-subsection-btn text-red-600 hover:text-red-700" data-section-id="${sectionData.id}" data-subsection-id="${subsection.id}">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }

    function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null, editMode = false) {
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

        if (sectionId === 'case_management') {
            displayCaseManagement();
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center"><h2 class="text-xl font-semibold">Section not found</h2><p>"${escapeHTML(sectionId)}" does not exist.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Not Found';
            console.warn(`[app.js - FIX] Section "${sectionId}" not found in kbSystemData.`);
            return;
        }

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
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
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
        if (sectionData.subsections && sectionData.subsections.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-folder-open mr-3 ${theme.text}"></i> Subsections</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.subsections.forEach(subsection => contentHTML += renderSubsectionCard(subsection, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> Sub-Categories</h3><div class="flex flex-wrap gap-4">`;
            sectionData.subCategories.forEach(subCat => {
                contentHTML += `
                    <a href="#" data-subcat-trigger="${sectionData.id}.${subCat.id}" class="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all ${theme.cta}">
                        ${escapeHTML(subCat.name)}
                    </a>`;
            });
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-book mr-3 ${theme.text}"></i> Glossary</h3><div class="space-y-4">`;
            sectionData.glossary.forEach(term => {
                contentHTML += `
                    <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow card-animate">
                        <h4 class="font-semibold text-gray-800 dark:text-white">${escapeHTML(term.term)}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${escapeHTML(term.definition)}</p>
                    </div>`;
            });
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (!hasContent) {
            contentHTML += `<div class="p-6 text-center"><p class="text-gray-500 dark:text-gray-400">No content available for this section yet.</p></div>`;
        }
        contentHTML += `</div>`;

        pageContent.innerHTML = contentHTML;
        highlightSidebarLink(sectionId);
        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1">></span> <span>${escapeHTML(sectionData.name)}</span>`;
            breadcrumbsContainer.classList.remove('hidden');
        }

        const allCards = pageContent.querySelectorAll('.card-animate');
        allCards.forEach((card, index) => {
            card.style.animationDelay = `${(index % 10 + 1) * 0.05}s`;
        });

        if (itemIdToFocus) {
            const targetItem = pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);
            if (targetItem) {
                targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetItem.classList.add('animate-pulse');
                setTimeout(() => targetItem.classList.remove('animate-pulse'), 2000);
            }
        }

        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    function displayCaseManagement() {
        document.getElementById('caseManagement').classList.remove('hidden');
        document.getElementById('subsectionManagement').classList.add('hidden');
        pageContent.querySelectorAll('div:not(#caseManagement)').forEach(el => el.classList.add('hidden'));

        const caseList = document.getElementById('caseList');
        let casesHTML = '';
        kbSystemData.sections.forEach(section => {
            if (section.cases && section.cases.length > 0) {
                section.cases.forEach(caseItem => {
                    casesHTML += renderCaseCard_enhanced(caseItem, section);
                });
            }
        });
        caseList.innerHTML = casesHTML || '<p class="text-gray-500 dark:text-gray-400">No cases available.</p>';

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Case Management';
        if (breadcrumbsContainer) {
            breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1">></span> <span>Case Management</span>`;
            breadcrumbsContainer.classList.remove('hidden');
        }

        const caseSectionSelect = document.getElementById('caseSection');
        if (caseSectionSelect) {
            caseSectionSelect.innerHTML = kbSystemData.sections
                .filter(section => section.id !== 'case_management')
                .map(section => `<option value="${section.id}">${escapeHTML(section.name)}</option>`)
                .join('');
        }
    }

    function displaySubsectionManagement() {
        document.getElementById('subsectionManagement').classList.remove('hidden');
        document.getElementById('caseManagement').classList.add('hidden');
        pageContent.querySelectorAll('div:not(#subsectionManagement)').forEach(el => el.classList.add('hidden'));

        const subsectionList = document.getElementById('subsectionList');
        let subsectionsHTML = '';
        kbSystemData.sections.forEach(section => {
            if (section.subsections && section.subsections.length > 0) {
                section.subsections.forEach(subsection => {
                    subsectionsHTML += renderSubsectionCard(subsection, section);
                });
            }
        });
        subsectionList.innerHTML = subsectionsHTML || '<p class="text-gray-500 dark:text-gray-400">No subsections available.</p>';

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Subsection Management';
        if (breadcrumbsContainer) {
            breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1">></span> <span>Subsection Management</span>`;
            breadcrumbsContainer.classList.remove('hidden');
        }

        const subsectionSectionSelect = document.getElementById('subsectionSection');
        if (subsectionSectionSelect) {
            subsectionSectionSelect.innerHTML = kbSystemData.sections
                .filter(section => section.id !== 'case_management')
                .map(section => `<option value="${section.id}">${escapeHTML(section.name)}</option>`)
                .join('');
        }
    }

    function showCaseEditor(sectionId = null, caseId = null) {
        const editorContainer = document.getElementById('caseEditorContainer');
        const editorTitle = document.getElementById('caseEditorTitle');
        const caseSectionSelect = document.getElementById('caseSection');
        const caseTitleInput = document.getElementById('caseTitle');
        const caseTagsInput = document.getElementById('caseTags');

        editorContainer.classList.remove('hidden');
        editorTitle.textContent = caseId ? 'Edit Case' : 'Create Case';

        if (caseId && sectionId) {
            const section = kbSystemData.sections.find(s => s.id === sectionId);
            const caseItem = section?.cases?.find(c => c.id === caseId);
            if (caseItem) {
                caseSectionSelect.value = sectionId;
                caseTitleInput.value = caseItem.title;
                caseTagsInput.value = caseItem.tags ? caseItem.tags.join(', ') : '';
                tinymce.get('caseEditor').setContent(caseItem.content || '');
            }
        } else {
            caseSectionSelect.value = sectionId || '';
            caseTitleInput.value = '';
            caseTagsInput.value = '';
            tinymce.get('caseEditor').setContent('');
        }

        caseSectionSelect.disabled = !!caseId;
    }

    function hideCaseEditor() {
        document.getElementById('caseEditorContainer').classList.add('hidden');
    }

    function showSubsectionEditor(sectionId = null, subsectionId = null) {
        const editorContainer = document.getElementById('subsectionEditorContainer');
        const editorTitle = document.getElementById('subsectionEditorTitle');
        const subsectionSectionSelect = document.getElementById('subsectionSection');
        const subsectionNameInput = document.getElementById('subsectionName');
        const subsectionDescriptionInput = document.getElementById('subsectionDescription');
        const subsectionFilesInput = document.getElementById('subsectionFiles');

        editorContainer.classList.remove('hidden');
        editorTitle.textContent = subsectionId ? 'Edit Subsection' : 'Create Subsection';

        if (subsectionId && sectionId) {
            const section = kbSystemData.sections.find(s => s.id === sectionId);
            const subsection = section?.subsections?.find(s => s.id === subsectionId);
            if (subsection) {
                subsectionSectionSelect.value = sectionId;
                subsectionNameInput.value = subsection.name;
                subsectionDescriptionInput.value = subsection.description || '';
                subsectionFilesInput.value = ''; // Files cannot be pre-filled
            }
        } else {
            subsectionSectionSelect.value = sectionId || '';
            subsectionNameInput.value = '';
            subsectionDescriptionInput.value = '';
            subsectionFilesInput.value = '';
        }

        subsectionSectionSelect.disabled = !!subsectionId;
    }

    function hideSubsectionEditor() {
        document.getElementById('subsectionEditorContainer').classList.add('hidden');
    }

    document.getElementById('createCaseBtn')?.addEventListener('click', () => {
        showCaseEditor();
    });

    document.getElementById('cancelCaseBtn')?.addEventListener('click', () => {
        hideCaseEditor();
    });

    document.getElementById('caseForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const sectionId = document.getElementById('caseSection').value;
        const caseTitle = document.getElementById('caseTitle').value;
        const caseTags = document.getElementById('caseTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const caseContent = tinymce.get('caseEditor').getContent();
        const caseData = {
            title: caseTitle,
            tags: caseTags,
            summary: truncateText(caseContent.replace(/<[^>]+>/g, ''), 100),
            content: caseContent,
            status: 'Open',
            assignedTo: currentUser?.email || 'Unassigned'
        };

        const editingCaseId = document.querySelector('.edit-case-btn[data-case-id][data-section-id="' + sectionId + '"]')?.dataset.caseId;
        if (editingCaseId) {
            updateCase(sectionId, editingCaseId, caseData);
            alert('Case updated successfully!');
        } else {
            addCase(sectionId, caseData);
            alert('Case created successfully!');
        }
        hideCaseEditor();
        displayCaseManagement();
    });

    document.getElementById('createSubsectionBtn')?.addEventListener('click', () => {
        showSubsectionEditor();
    });

    document.getElementById('cancelSubsectionBtn')?.addEventListener('click', () => {
        hideSubsectionEditor();
    });

    document.getElementById('subsectionForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const sectionId = document.getElementById('subsectionSection').value;
        const subsectionName = document.getElementById('subsectionName').value;
        const subsectionDescription = document.getElementById('subsectionDescription').value;
        const subsectionFiles = document.getElementById('subsectionFiles').files;

        const files = Array.from(subsectionFiles).map(file => ({
            name: file.name,
            url: URL.createObjectURL(file) // Placeholder URL for local files
        }));

        const subsectionData = {
            name: subsectionName,
            description: subsectionDescription,
            files: files
        };

        const editingSubsectionId = document.querySelector('.edit-subsection-btn[data-subsection-id][data-section-id="' + sectionId + '"]')?.dataset.subsectionId;
        if (editingSubsectionId) {
            updateSubsection(sectionId, editingSubsectionId, subsectionData);
            alert('Subsection updated successfully!');
        } else {
            addSubsection(sectionId, subsectionData);
            alert('Subsection created successfully!');
        }
        hideSubsectionEditor();
        displaySubsectionManagement();
    });

    document.addEventListener('click', (e) => {
        const editCaseBtn = e.target.closest('.edit-case-btn');
        const deleteCaseBtn = e.target.closest('.delete-case-btn');
        const editSubsectionBtn = e.target.closest('.edit-subsection-btn');
        const deleteSubsectionBtn = e.target.closest('.delete-subsection-btn');

        if (editCaseBtn) {
            const sectionId = editCaseBtn.dataset.sectionId;
            const caseId = editCaseBtn.dataset.caseId;
            displayCaseManagement();
            showCaseEditor(sectionId, caseId);
        }

        if (deleteCaseBtn) {
            const sectionId = deleteCaseBtn.dataset.sectionId;
            const caseId = deleteCaseBtn.dataset.caseId;
            if (confirm('Are you sure you want to delete this case?')) {
                deleteCase(sectionId, caseId);
                alert('Case deleted successfully!');
                displayCaseManagement();
            }
        }

        if (editSubsectionBtn) {
            const sectionId = editSubsectionBtn.dataset.sectionId;
            const subsectionId = editSubsectionBtn.dataset.subsectionId;
            displaySubsectionManagement();
            showSubsectionEditor(sectionId, subsectionId);
        }

        if (deleteSubsectionBtn) {
            const sectionId = deleteSubsectionBtn.dataset.sectionId;
            const subsectionId = deleteSubsectionBtn.dataset.subsectionId;
            if (confirm('Are you sure you want to delete this subsection?')) {
                deleteSubsection(sectionId, subsectionId);
                alert('Subsection deleted successfully!');
                displaySubsectionManagement();
            }
        }
    });

    // --- Search Functionality ---
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');

    function displaySearchResults(results, query) {
        if (!searchResultsContainer) return;
        if (results.length === 0) {
            searchResultsContainer.innerHTML = '<div class="p-4 text-gray-500 dark:text-gray-400">No results found.</div>';
            searchResultsContainer.classList.remove('hidden');
            return;
        }

        let resultsHTML = '';
        results.forEach(result => {
            const theme = getThemeColors(result.themeColor);
            let iconClass = 'fas fa-file-alt';
            let itemType = result.type;
            if (result.type === 'case') iconClass = 'fas fa-briefcase';
            else if (result.type === 'item') iconClass = 'fas fa-archive';
            else if (result.type === 'subsection') iconClass = 'fas fa-folder-open';
            else if (result.type === 'section_match') iconClass = 'fas fa-folder';
            else if (result.type === 'glossary_term') iconClass = 'fas fa-book';

            resultsHTML += `
                <div class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-start search-result-item" data-section-id="${result.sectionId}" data-item-id="${result.id}" data-item-type="${result.type}">
                    <div class="p-2 rounded-full ${theme.iconContainer} mr-3 flex-shrink-0">
                        <i class="${iconClass} ${theme.icon}"></i>
                    </div>
                    <div class="flex-grow">
                        <h4 class="text-sm font-semibold text-gray-800 dark:text-white">${highlightText(result.title, query)}</h4>
                        <p class="text-xs text-gray-600 dark:text-gray-400">${highlightText(truncateText(result.summary || result.description, 100), query)}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1"><span class="font-medium ${theme.text}">${escapeHTML(result.sectionName)}</span> > ${itemType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                    </div>
                </div>`;
        });
        searchResultsContainer.innerHTML = resultsHTML;
        searchResultsContainer.classList.remove('hidden');

        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    if (globalSearchInput && searchResultsContainer) {
        globalSearchInput.addEventListener('input', () => {
            const query = globalSearchInput.value.trim();
            if (query.length < 2) {
                searchResultsContainer.classList.add('hidden');
                return;
            }
            const results = searchKb(query);
            displaySearchResults(results, query);
        });

        globalSearchInput.addEventListener('blur', () => {
            setTimeout(() => searchResultsContainer.classList.add('hidden'), 200);
        });

        globalSearchInput.addEventListener('focus', () => {
            if (globalSearchInput.value.trim().length >= 2) {
                displaySearchResults(searchKb(globalSearchInput.value.trim()), globalSearchInput.value.trim());
            }
        });
    }

    document.addEventListener('click', (e) => {
        const searchResultItem = e.target.closest('.search-result-item');
        if (searchResultItem) {
            const sectionId = searchResultItem.dataset.sectionId;
            const itemId = searchResultItem.dataset.itemId;
            const itemType = searchResultItem.dataset.itemType;

            if (itemType === 'section_match') {
                displaySectionContent(sectionId);
            } else {
                displaySectionContent(sectionId, itemId);
            }
            searchResultsContainer.classList.add('hidden');
            globalSearchInput.value = '';
        }
    });

    // --- Section Search ---
    document.addEventListener('click', (e) => {
        if (e.target.closest('#sectionSearchBtn')) {
            const sectionSearchInput = document.getElementById('sectionSearchInput');
            const sectionId = sectionSearchInput.dataset.sectionId;
            const query = sectionSearchInput.value.trim();
            const sectionSearchResults = document.getElementById('sectionSearchResults');

            if (!query || query.length < 2) {
                sectionSearchResults.innerHTML = '<p class="text-gray-500 dark:text-gray-400">Please enter a query with at least 2 characters.</p>';
                return;
            }

            const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
            if (!sectionData) return;

            const results = [];
            if (sectionData.articles) {
                sectionData.articles.forEach(article => {
                    if (article.title.toLowerCase().includes(query.toLowerCase()) ||
                        (article.tags && article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) ||
                        (article.summary && article.summary.toLowerCase().includes(query.toLowerCase()))) {
                        results.push({ ...article, sectionName: sectionData.name, sectionId: sectionData.id, type: 'article', themeColor: sectionData.themeColor });
                    }
                });
            }
            if (sectionData.cases) {
                sectionData.cases.forEach(caseItem => {
                    if (caseItem.title.toLowerCase().includes(query.toLowerCase()) ||
                        (caseItem.tags && caseItem.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) ||
                        (caseItem.summary && caseItem.summary.toLowerCase().includes(query.toLowerCase()))) {
                        results.push({ ...caseItem, sectionName: sectionData.name, sectionId: sectionData.id, type: 'case', themeColor: sectionData.themeColor });
                    }
                });
            }
            if (sectionData.items) {
                sectionData.items.forEach(item => {
                    if (item.title.toLowerCase().includes(query.toLowerCase()) ||
                        (item.description && item.description.toLowerCase().includes(query.toLowerCase()))) {
                        results.push({ ...item, sectionName: sectionData.name, sectionId: sectionData.id, type: 'item', themeColor: sectionData.themeColor });
                    }
                });
            }
            if (sectionData.subsections) {
                sectionData.subsections.forEach(subsection => {
                    if (subsection.name.toLowerCase().includes(query.toLowerCase()) ||
                        (subsection.description && subsection.description.toLowerCase().includes(query.toLowerCase()))) {
                        results.push({ ...subsection, sectionName: sectionData.name, sectionId: sectionData.id, type: 'subsection', themeColor: sectionData.themeColor });
                    }
                });
            }
            if (sectionData.glossary) {
                sectionData.glossary.forEach(term => {
                    if (term.term.toLowerCase().includes(query.toLowerCase()) || term.definition.toLowerCase().includes(query.toLowerCase())) {
                        results.push({ id: `glossary_${term.term}`, title: term.term, summary: term.definition, sectionName: sectionData.name, sectionId: sectionData.id, type: 'glossary_term', themeColor: sectionData.themeColor });
                    }
                });
            }

            if (results.length === 0) {
                sectionSearchResults.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No results found in this section.</p>';
                return;
            }

            let resultsHTML = '';
            results.forEach(result => {
                const theme = getThemeColors(result.themeColor);
                let iconClass = 'fas fa-file-alt';
                if (result.type === 'case') iconClass = 'fas fa-briefcase';
                else if (result.type === 'item') iconClass = 'fas fa-archive';
                else if (result.type === 'subsection') iconClass = 'fas fa-folder-open';
                else if (result.type === 'glossary_term') iconClass = 'fas fa-book';

                resultsHTML += `
                    <div class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-start section-search-result-item" data-section-id="${result.sectionId}" data-item-id="${result.id}" data-item-type="${result.type}">
                        <div class="p-2 rounded-full ${theme.iconContainer} mr-3 flex-shrink-0">
                            <i class="${iconClass} ${theme.icon}"></i>
                        </div>
                        <div class="flex-grow">
                            <h4 class="text-sm font-semibold text-gray-800 dark:text-white">${highlightText(result.title, query)}</h4>
                            <p class="text-xs text-gray-600 dark:text-gray-400">${highlightText(truncateText(result.summary || result.description, 100), query)}</p>
                        </div>
                    </div>`;
            });
            sectionSearchResults.innerHTML = resultsHTML;

            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
        }

        const sectionSearchResultItem = e.target.closest('.section-search-result-item');
        if (sectionSearchResultItem) {
            const sectionId = sectionSearchResultItem.dataset.sectionId;
            const itemId = sectionSearchResultItem.dataset.itemId;
            displaySectionContent(sectionId, itemId);
            document.getElementById('sectionSearchResults').innerHTML = '';
            document.getElementById('sectionSearchInput').value = '';
        }
    });

    // --- Sidebar Triggers ---
    document.addEventListener('click', (e) => {
        const sectionTrigger = e.target.closest('[data-section-trigger]');
        const subCatTrigger = e.target.closest('[data-subcat-trigger]');

        if (sectionTrigger) {
            e.preventDefault();
            const sectionId = sectionTrigger.dataset.sectionTrigger;
            console.log(`[app.js - FIX] Section trigger clicked: "${sectionId}"`);
            displaySectionContent(sectionId);
        }

        if (subCatTrigger) {
            e.preventDefault();
            const [sectionId, subCategoryId] = subCatTrigger.dataset.subcatTrigger.split('.');
            console.log(`[app.js - FIX] Subcategory trigger clicked: "${sectionId}.${subCategoryId}"`);
            displaySectionContent(sectionId, null, subCategoryId);
        }
    });

    // --- Rating Buttons ---
    document.addEventListener('click', (e) => {
        const ratingBtn = e.target.closest('.rating-btn');
        if (ratingBtn) {
            const itemId = ratingBtn.dataset.itemId;
            const itemType = ratingBtn.dataset.itemType;
            const rating = ratingBtn.dataset.rating;
            console.log(`[app.js] Rating recorded: ${rating} for ${itemType} ID ${itemId}`);
            alert(`Thank you for your feedback! (${rating === 'up' ? 'Helpful' : 'Not helpful'} for ${itemType} ID ${itemId})`);
        }
    });

    // --- Initial Load ---
    const urlHash = window.location.hash;
    if (urlHash) {
        const [sectionId, itemId] = urlHash.slice(1).split('/');
        if (sectionId) {
            console.log(`[app.js - FIX] Initial load with hash: section="${sectionId}", item="${itemId || ''}"`);
            displaySectionContent(sectionId, itemId);
        }
    } else {
        displaySectionContent('home');
    }

    console.log('[app.js - FIX] Initialization complete.');
});
```
