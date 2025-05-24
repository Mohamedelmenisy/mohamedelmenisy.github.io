document.addEventListener('DOMContentLoaded', async () => {
    console.log('[app.js] DOMContentLoaded fired at', new Date().toISOString());

    // بيانات افتراضية لو فشل تحميل kbSystemData
    const fallbackKbSystemData = {
        meta: { version: "0.1.0-fallback", lastGlobalUpdate: "2025-05-24T20:35:00Z" },
        sections: [{ id: "home", name: "Home", description: "Default section" }]
    };

    // الانتظار حتى يتم تحميل kbSystemData
    async function waitForKbSystemData(maxAttempts = 5, delay = 500) {
        console.log('[app.js] Waiting for kbSystemData...');
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (typeof kbSystemData !== 'undefined' && kbSystemData.sections && kbSystemData.meta) {
                console.log('[app.js] kbSystemData is available:', kbSystemData);
                return kbSystemData;
            }
            console.log(`[app.js] Attempt ${attempt}/${maxAttempts} - kbSystemData not available yet.`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        console.warn('[app.js] kbSystemData not available after max attempts. Using fallback.');
        return fallbackKbSystemData;
    }

    window.kbSystemData = await waitForKbSystemData();

    // التحقق من الصفحة وحمايتها
    if (typeof protectPage === 'function') {
        console.log('[app.js] Calling protectPage().');
        protectPage();
    } else if (typeof Auth !== 'undefined' && Auth.isAuthenticated) {
        if (!Auth.isAuthenticated()) {
            console.log('[app.js] Auth.isAuthenticated is false, calling Auth.logout().');
            Auth.logout();
            return;
        }
        console.log('[app.js] User is authenticated via Auth object.');
    } else {
        console.error('[app.js] CRITICAL: Authentication mechanism not found.');
    }

    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    console.log('[app.js] Current user:', currentUser);

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

    if (kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    } else {
        console.warn('[app.js] kbSystemData.meta not available for version info.');
    }

    // باقي الكود زي ما هو مع تعديلات بسيطة للتأكد من الدوال
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
    if (logoutButton && typeof Auth !== 'undefined' && Auth.logout) {
        logoutButton.addEventListener('click', () => Auth.logout());
    }

    const reportErrorBtn = document.getElementById('reportErrorBtn');
    if (reportErrorBtn) {
        reportErrorBtn.addEventListener('click', () => {
            const sectionTitleText = currentSectionTitleEl ? currentSectionTitleEl.textContent : 'Current Page';
            alert(`Report an issue for: ${sectionTitleText}\nURL: ${window.location.href}\n(Placeholder)`);
        });
    }

    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');

    console.log('[app.js] pageContent:', pageContent ? 'Found' : 'Not found');
    console.log('[app.js] sidebarLinks:', sidebarLinks.length, 'links found');

    const initialPageContent = pageContent ? pageContent.innerHTML : '<p>Error: pageContent missing on load.</p>';

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    function getThemeColors(themeColor = 'gray') {
        const colorMap = {
            blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400', iconContainer: 'bg-blue-100 dark:bg-blue-800/50', icon: 'text-blue-500 dark:text-blue-400', cta: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300', border: 'border-blue-500' },
            teal: { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-600 dark:text-teal-400', iconContainer: 'bg-teal-100 dark:bg-teal-800/50', icon: 'text-teal-500 dark:text-teal-400', cta: 'text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300', border: 'border-teal-500' },
            green: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600 dark:text-green-400', iconContainer: 'bg-green-100 dark:bg-green-800/50', icon: 'text-green-500 dark:text-green-400', cta: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300', border: 'border-green-500' },
            indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600 dark:text-indigo-400', iconContainer: 'bg-indigo-100 dark:bg-indigo-800/50', icon: 'text-indigo-500 dark:text-indigo-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-indigo-500' },
            cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900', text: 'text-cyan-600 dark:text-cyan-400', iconContainer: 'bg-cyan-100 dark:bg-cyan-800/50', icon: 'text-cyan-500 dark:text-cyan-400', cta: 'text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300', border: 'border-cyan-500' },
            lime: { bg: 'bg-lime-100 dark:bg-lime-900', text: 'text-lime-600 dark:text-lime-400', iconContainer: 'bg-lime-100 dark:bg-lime-800/50', icon: 'text-lime-500 dark:text-lime-400', cta: 'text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300', border: 'border-lime-500' },
            yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600 dark:text-yellow-400', iconContainer: 'bg-yellow-100 dark:bg-yellow-800/50', icon: 'text-yellow-500 dark:text-yellow-400', cta: 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300', border: 'border-yellow-500' },
            pink: { bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-600 dark:text-pink-400', iconContainer: 'bg-pink-100 dark:bg-pink-800/50', icon: 'text-pink-500 dark:text-pink-400', cta: 'text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300', border: 'border-pink-500' },
            red: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-600 dark:text-red-400', iconContainer: 'bg-red-100 dark:bg-red-800/50', icon: 'text-red-500 dark:text-red-400', cta: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300', border: 'border-red-500' },
            sky: { bg: 'bg-sky-100 dark:bg-sky-900', text: 'text-sky-600 dark:text-sky-400', iconContainer: 'bg-sky-100 dark:bg-sky-800/50', icon: 'text-sky-500 dark:text-sky-400', cta: 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300', border: 'border-sky-500' },
            amber: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-600 dark:text-amber-400', iconContainer: 'bg-amber-100 dark:bg-amber-800/50', icon: 'text-amber-500 dark:text-amber-400', cta: 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300', border: 'border-amber-500' },
            purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-600 dark:text-purple-400', iconContainer: 'bg-purple-100 dark:bg-purple-800/50', icon: 'text-purple-500 dark:text-purple-400', cta: 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300', border: 'border-purple-500' },
            slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', iconContainer: 'bg-slate-100 dark:bg-slate-700/50', icon: 'text-slate-500 dark:text-slate-400', cta: 'text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300', border: 'border-slate-500' },
            gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', iconContainer: 'bg-gray-100 dark:bg-gray-700/50', icon: 'text-gray-500 dark:text-gray-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-gray-500' }
        };
        return colorMap[themeColor.toLowerCase()] || colorMap.gray;
    }

    function renderArticleCard_enhanced(article, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${article.id}" data-item-type="article">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${sectionData.icon || 'fas fa-file-alt'} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(article.title)}</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${escapeHTML(article.summary) || 'No summary available.'}</p>
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div class="rating-container text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <span class="mr-1">Helpful?</span>
                        <button class="rating-btn p-1" data-item-id="${article.id}" data-item-type="article" data-rating="up"><i class="fas fa-thumbs-up text-green-500"></i></button>
                        <button class="rating-btn p-1" data-item-id="${article.id}" data-item-type="article" data-rating="down"><i class="fas fa-thumbs-down text-red-500"></i></button>
                    </div>
                    <a href="${article.contentPath}" class="text-sm font-medium ${theme.cta}">Read More</a>
                </div>
            </div>`;
    }

    function renderItemCard_enhanced(item, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${item.id}" data-item-type="item">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="${sectionData.icon || 'fas fa-file-alt'} text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(item.title)}</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${escapeHTML(item.description) || 'No description available.'}</p>
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs ${theme.tagBg} ${theme.tagText} px-3 py-1 rounded-full">${escapeHTML(item.type)}</span>
                    <a href="${item.url}" class="text-sm font-medium ${theme.cta}">Open</a>
                </div>
            </div>`;
    }

    function renderCaseCard_enhanced(caseItem, sectionData) {
        const theme = getThemeColors(sectionData.themeColor);
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${caseItem.id}" data-item-type="case">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                         <i class="fas fa-briefcase text-xl ${theme.icon}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(caseItem.title)}</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 flex-grow">${escapeHTML(caseItem.summary) || 'No summary.'}</p>
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-sm font-medium px-3 py-1 rounded-full ${theme.statusBg} ${theme.statusText}">${escapeHTML(caseItem.status)}</span>
                    <a href="${caseItem.contentPath}" class="text-sm font-medium ${theme.cta}">Details</a>
                </div>
            </div>`;
    }

    function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        console.log(`[app.js] displaySectionContent for sectionId: "${sectionId}", item: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);
        if (!pageContent) {
            console.error('[app.js] CRITICAL: pageContent is NULL.');
            pageContent.innerHTML = '<div class="w-screen h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p class="text-2xl text-red-600 p-10">خطأ حرج: لا يمكن عرض الواجهة.</p></div>';
            return;
        }

        if (sectionId === 'home' || !sectionId) {
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
            pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
                card.style.animationDelay = `${(index + 1) * 0.1}s`;
            });
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center card-animate"><h2 class="text-2xl font-semibold text-red-500">القسم غير موجود</h2><p>القسم الذي طلبته ("${escapeHTML(sectionId)}") غير موجود.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'غير موجود';
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);
        let contentHTML = `<div class="space-y-10"><div class="flex items-center mb-6"><span class="p-3 rounded-lg ${theme.iconContainer} mr-4 hidden sm:inline-flex"><i class="${sectionData.icon || 'fas fa-folder'} text-2xl ${theme.icon}"></i></span><h2 class="text-3xl font-bold text-gray-800 dark:text-white">${escapeHTML(sectionData.name)}</h2></div><p class="text-gray-600 dark:text-gray-300 mt-1 text-base">${escapeHTML(sectionData.description)}</p>`;

        let hasContent = false;
        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.articles.forEach(article => contentHTML += renderArticleCard_enhanced(article, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (sectionData.cases && sectionData.cases.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Active Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.cases.forEach(caseItem => contentHTML += renderCaseCard_enhanced(caseItem, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (sectionData.items && sectionData.items.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> Items</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.items.forEach(item => contentHTML += renderItemCard_enhanced(item, sectionData));
            contentHTML += `</div>`;
            hasContent = true;
        }
        if (!hasContent) {
            contentHTML += `<div class="p-10 text-center card-animate"><i class="fas fa-info-circle text-4xl ${theme.text} mb-4"></i><h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200">No content yet</h3><p class="text-gray-600 dark:text-gray-400">Content for "${escapeHTML(sectionData.name)}" is being prepared.</p></div>`;
        }
        contentHTML += `</div>`;

        pageContent.innerHTML = contentHTML;
        pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.07}s`;
        });

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text}">${escapeHTML(sectionData.name)}</span>`;
            breadcrumbsContainer.classList.remove('hidden');
        }

        if (itemIdToFocus) {
            setTimeout(() => {
                const targetCard = pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.classList.add('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400');
                    setTimeout(() => targetCard.classList.remove('ring-4', 'ring-offset-2', 'ring-indigo-500', 'dark:ring-indigo-400'), 3500);
                }
            }, 200);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        console.log('[app.js] handleSectionTrigger called with:', { sectionId, itemId, subCategoryFilter });
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId, itemId, subCategoryFilter);
        const hash = itemId ? `${sectionId}/${itemId}` : subCategoryFilter ? `${sectionId}/${subCategoryFilter}` : sectionId;
        window.history.replaceState(null, '', `#${hash}`);
    }

    function parseHash() {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return { sectionId: 'home' };
        const [sectionId, itemId, subCategoryFilter] = hash.split('/');
        return { sectionId, itemId, subCategoryFilter };
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            if (sectionId) handleSectionTrigger(sectionId);
        });
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-section-trigger]');
        if (target) {
            e.preventDefault();
            const sectionId = target.dataset.sectionTrigger;
            const itemId = target.dataset.itemId;
            const subCatFilter = target.dataset.subcatFilter;
            if (sectionId) handleSectionTrigger(sectionId, itemId, subCatFilter);
        }
    });

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
            if (!globalSearchInput.contains(event.target) && !searchResultsContainer.contains(event.target)) {
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
            if (result.type !== 'section_match' && result.type !== 'glossary_term') a.dataset.itemId = result.id;
            a.className = 'block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
            a.innerHTML = `<div class="font-semibold">${highlightText(result.title, query)}</div><div class="text-xs text-gray-500 mt-0.5">${result.summary ? highlightText(truncateText(result.summary, 100), query) : ''}</div><div class="text-xs text-gray-600 dark:text-gray-400 mt-1">In: ${escapeHTML(result.sectionName)}</div>`;
            li.appendChild(a);
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
        searchResultsContainer.classList.remove('hidden');
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    window.addEventListener('hashchange', () => {
        const { sectionId, itemId, subCategoryFilter } = parseHash();
        handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);
    });

    const { sectionId, itemId, subCategoryFilter } = parseHash();
    handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);

    console.log('[app.js] All initializations complete.');
});
