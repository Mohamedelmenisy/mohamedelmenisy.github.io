let currentUser = null;
let isInitialAuthCheckComplete = false;
let currentSectionTitleEl = document.getElementById('currentSectionTitle');
let breadcrumbsContainer = document.getElementById('breadcrumbsContainer');
const htmlElement = document.documentElement;

// بيانات افتراضية في حالة فشل تحميل kbSystemData
const fallbackKbSystemData = {
    meta: {
        version: "1.0.0-fallback",
        lastGlobalUpdate: "2025-05-24T20:30:00Z"
    },
    sections: [
        {
            id: "dashboard",
            name: "الداشبورد",
            icon: "fas fa-tachometer-alt",
            themeColor: "blue",
            description: "نظرة عامة على أداء النظام وأهم المعلومات.",
            articles: [
                {
                    id: "dash001",
                    title: "نظرة عامة على الإحصائيات",
                    tags: ["dashboard", "stats", "overview"],
                    lastUpdated: "2025-05-24",
                    contentPath: "articles/dashboard/dash001.html",
                    summary: "نظرة عامة على الإحصائيات الأساسية للنظام."
                }
            ]
        }
    ]
};

// دالة للانتظار حتى يتم تحميل kbSystemData
async function waitForKbSystemData(maxAttempts = 5, delay = 500) {
    console.log('[app.js] Waiting for kbSystemData to be available...');
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (typeof kbSystemData !== 'undefined' && kbSystemData.sections && kbSystemData.meta) {
            console.log('[app.js] kbSystemData is available:', kbSystemData);
            return kbSystemData;
        }
        console.log(`[app.js] Attempt ${attempt}/${maxAttempts} - kbSystemData not available yet. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.warn('[app.js] kbSystemData not available after max attempts. Using fallback data.');
    return fallbackKbSystemData;
}

// دالة التهيئة الأساسية
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[app.js] DOMContentLoaded fired at', new Date().toISOString());

    // الانتظار حتى يتم تحميل kbSystemData
    window.kbSystemData = await waitForKbSystemData();

    // التحقق من Supabase
    if (typeof window.supabaseClient === 'undefined' || !window.supabaseClient.auth) {
        console.error('[app.js] window.supabaseClient is not available. App cannot initialize properly.');
        const loadingOverlay = document.getElementById('dashboardLoadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div class="text-center p-4">
                    <p class="text-red-500 text-lg">خطأ: فشل تحميل خدمة المصادقة.</p>
                    <p class="text-gray-600 dark:text-gray-400">برجاء التأكد من الاتصال بالإنترنت وإعادة تحميل الصفحة.</p>
                    <button id="retryAuthBtn" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">إعادة المحاولة</button>
                </div>`;
            document.getElementById('retryAuthBtn').addEventListener('click', () => location.reload());
        }
        return;
    }
    const supabase = window.supabaseClient;

    // استمرار التهيئة
    initializeApp();
});

async function initializeApp() {
    const supabase = window.supabaseClient;
    const loadingOverlay = document.getElementById('dashboardLoadingOverlay');
    const pageContent = document.getElementById('pageContent');

    if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
        console.error('[app.js] CRITICAL: Global `kbSystemData.sections` is not loaded. Using fallback.');
        window.kbSystemData = fallbackKbSystemData;
    }

    // إدارة المصادقة
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[app.js - Supabase] onAuthStateChange event:', event, 'session:', session ? `exists (User ID: ${session.user.id})` : 'null');
        const mainPageContainer = document.querySelector('.flex.h-screen');

        if (event === 'SIGNED_OUT' || !session) {
            currentUser = null;
            isInitialAuthCheckComplete = true;
            const loginPageName = 'login.html';
            const signupPageName = 'signup.html';
            const currentPath = window.location.pathname;
            const isOnLoginPage = currentPath.endsWith(loginPageName) || currentPath.endsWith('/' + loginPageName);
            const isOnSignupPage = currentPath.endsWith(signupPageName) || currentPath.endsWith('/' + signupPageName);

            if (!isOnLoginPage && !isOnSignupPage) {
                console.log('[app.js - Supabase] No session or signed out, redirecting to login.html');
                if (loadingOverlay) loadingOverlay.style.display = 'flex';
                let basePath = window.location.origin;
                if (currentPath.includes('/infini-base/')) {
                    basePath += '/infini-base/';
                } else {
                    basePath += '/';
                }
                const loginPath = basePath + loginPageName + '?reason=session_ended_app';
                window.location.replace(loginPath);
            } else {
                console.log('[app.js - Supabase] Already on an auth page.');
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                if (mainPageContainer) mainPageContainer.style.visibility = 'visible';
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
                    console.error('[app.js - Supabase] Error fetching user profile:', profileError);
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
                    console.warn(`[app.js - Supabase] User profile NOT FOUND for ID: ${session.user.id}. Using fallbacks.`);
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

            if (loadingOverlay) loadingOverlay.style.display = 'none';
            if (mainPageContainer) mainPageContainer.style.visibility = 'visible';

            if (!document.body.dataset.initialLoadDone) {
                console.log('[app.js] Auth confirmed, processing initial section load.');
                const { sectionId, itemId, subCategoryFilter } = parseHash();
                handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter);
                document.body.dataset.initialLoadDone = 'true';
            } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                console.log('[app.js] Auth token refreshed or user updated.');
            }
        }
    });

    // تهيئة واجهة المستخدم
    initializeUserDependentUI();
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');

    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = escapeHTML(kbSystemData.meta.version);
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = escapeHTML(kbSystemData.meta.version);
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    } else {
        console.warn('[app.js] kbSystemData.meta not available for version info. Using fallback.');
        if (kbVersionSpan) kbVersionSpan.textContent = 'N/A';
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = 'N/A';
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = 'N/A';
    }

    // إعداد الثيم
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

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
        document.querySelectorAll('#searchResultsContainer mark, #sectionSearchResults mark, #pageContent mark').forEach(mark => {
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
}

// دالة عرض المحتوى
function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
    console.log(`[app.js] displaySectionContent for sectionId: "${sectionId}", item: "${itemIdToFocus}", subCat: "${subCategoryFilter}"`);
    
    const pageContent = document.getElementById('pageContent');
    if (!pageContent) {
        console.error('[app.js] CRITICAL: pageContent element is NULL.');
        document.body.innerHTML = '<div class="w-screen h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p class="text-2xl text-red-600 p-10">خطأ حرج: لا يمكن عرض الواجهة. برجاء التواصل مع الدعم.</p></div>';
        return;
    }

    if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
        console.error('[app.js] displaySectionContent: Global `kbSystemData.sections` missing. Using fallback.');
        window.kbSystemData = fallbackKbSystemData;
    }

    if (sectionId === 'home' || !sectionId) {
        const initialPageContent = pageContent.innerHTML || '<p class="text-gray-600 dark:text-gray-400 p-4">مرحبًا! لا يوجد محتوى متاح حاليًا.</p>';
        pageContent.innerHTML = initialPageContent;
        if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'مرحبًا';
        if (breadcrumbsContainer) {
            breadcrumbsContainer.innerHTML = `<a href="#home" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">الرئيسية</a>`;
            breadcrumbsContainer.classList.remove('hidden');
        }
        initializeUserDependentUI();

        const homeKbVersionEl = pageContent.querySelector('#kbVersion') || document.getElementById('kbVersion');
        const homeLastKbUpdateEl = pageContent.querySelector('#lastkbUpdate') || document.getElementById('lastkbUpdate');

        if (kbSystemData.meta) {
            if (homeKbVersionEl) homeKbVersionEl.textContent = escapeHTML(kbSystemData.meta.version);
            if (homeLastKbUpdateEl) homeLastKbUpdateEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
        } else {
            if (homeKbVersionEl) homeKbVersionEl.textContent = 'غير متاح';
            if (homeLastKbUpdateEl) homeLastKbUpdateEl.textContent = 'غير متاح';
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
        pageContent.innerHTML = `<div class="p-6 text-center card-animate"><h2 class="text-2xl font-semibold text-red-500">القسم غير موجود</h2><p>القسم الذي طلبته ("${escapeHTML(sectionId)}") غير موجود.</p> <a href="#home" data-section-trigger="home" class="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">الذهاب إلى الرئيسية</a></div>`;
        if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'غير موجود';
        if (breadcrumbsContainer) breadcrumbsContainer.innerHTML = `<a href="#home" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">الرئيسية</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> غير موجود`;
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
        contentHTML += `<div class="card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-sitemap mr-3 ${theme.text}"></i> الأقسام الفرعية</h3><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">`;
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
        contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> المقالات</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
        sectionData.articles.forEach(article => contentHTML += renderArticleCard_enhanced(article, sectionData));
        contentHTML += `</div></div>`;
        hasRenderedContent = true;
    }
    if (sectionData.cases && sectionData.cases.length > 0) {
        contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> الحالات النشطة</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
        sectionData.cases.forEach(caseItem => contentHTML += renderCaseCard_enhanced(caseItem, sectionData));
        contentHTML += `</div></div>`;
        hasRenderedContent = true;
    }
    if (sectionData.items && sectionData.items.length > 0) {
        contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-archive mr-3 ${theme.text}"></i> عناصر ${escapeHTML(sectionData.name)}</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
        sectionData.items.forEach(item => contentHTML += renderItemCard_enhanced(item, sectionData));
        contentHTML += `</div></div>`;
        hasRenderedContent = true;
    }
    if (sectionData.glossary && sectionData.glossary.length > 0) {
        contentHTML += `<div class="mt-10 card-animate"><h3 class="text-2xl font-semibold mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} flex items-center"><i class="fas fa-book mr-3 ${theme.text}"></i> المصطلحات</h3><div class="space-y-4">`;
        sectionData.glossary.forEach(entry => contentHTML += `<div class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow border-l-4 ${theme.border}"><strong class="${theme.text} font-medium">${escapeHTML(entry.term)}:</strong> ${escapeHTML(entry.definition)}</div>`);
        contentHTML += `</div></div>`;
        hasRenderedContent = true;
    }

    if (!hasRenderedContent) {
        contentHTML += `<div class="p-10 text-center bg-white dark:bg-gray-800 rounded-lg shadow-md card-animate"><i class="fas fa-info-circle text-4xl ${theme.text} mb-4"></i><h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200">لا يوجد محتوى بعد</h3><p class="text-gray-600 dark:text-gray-400">المحتوى لـ "${escapeHTML(sectionData.name)}" قيد التحضير حاليًا.</p></div>`;
    }
    contentHTML += `</div>`;
    pageContent.innerHTML = contentHTML;
    applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');

    pageContent.querySelectorAll('.card-animate').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.05}s`;
        card.classList.remove('fadeInUp');
        void card.offsetWidth;
        card.classList.add('fadeInUp');
    });

    if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
    if (breadcrumbsContainer) {
        let bcHTML = `<a href="#home" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">الرئيسية</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(sectionData.name)}</span>`;
        if (subCategoryFilter && sectionData.subCategories) {
            const subCatData = sectionData.subCategories.find(sc => sc.id === subCategoryFilter);
            if (subCatData) {
                bcHTML = `<a href="#home" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">الرئيسية</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <a href="#${escapeHTML(sectionData.id)}" data-section-trigger="${escapeHTML(sectionData.id)}" class="hover:underline ${theme.cta}">${escapeHTML(sectionData.name)}</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(subCatData.name)}</span>`;
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
            } else {
                console.warn(`[app.js] Could not find item to focus with ID: ${itemIdToFocus} in section ${sectionId}`);
            }
        }, 200);
    }
}

// باقي الدوال المساعدة
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, match => ({
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '''
    }[match]));
}

function highlightText(text, query) {
    if (!query || typeof query !== 'string' || !text) return text;
    const regex = new RegExp(`(${escapeHTML(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function truncateText(text, maxLength) {
    if (typeof text !== 'string') return text;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function getThemeColors(themeColor = 'blue') {
    const themes = {
        blue: { border: 'border-blue-500', text: 'text-blue-600 dark:text-blue-400', cta: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300', icon: 'text-blue-500 dark:text-blue-400', iconContainer: 'bg-blue-100 dark:bg-blue-900' },
        green: { border: 'border-green-500', text: 'text-green-600 dark:text-green-400', cta: 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300', icon: 'text-green-500 dark:text-green-400', iconContainer: 'bg-green-100 dark:bg-green-900' },
        red: { border: 'border-red-500', text: 'text-red-600 dark:text-red-400', cta: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300', icon: 'text-red-500 dark:text-red-400', iconContainer: 'bg-red-100 dark:bg-red-900' },
        purple: { border: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400', cta: 'text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300', icon: 'text-purple-500 dark:text-purple-400', iconContainer: 'bg-purple-100 dark:bg-purple-900' },
        orange: { border: 'border-orange-500', text: 'text-orange-600 dark:text-orange-400', cta: 'text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300', icon: 'text-orange-500 dark:text-orange-400', iconContainer: 'bg-orange-100 dark:bg-orange-900' }
    };
    return themes[themeColor] || themes.blue;
}

function parseHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return { sectionId: 'home', itemId: null, subCategoryFilter: null };
    const parts = hash.split('/');
    return {
        sectionId: parts[0] || 'home',
        itemId: parts[1] && !parts[1].startsWith('subcat-') ? parts[1] : null,
        subCategoryFilter: parts[1] && parts[1].startsWith('subcat-') ? parts[1].replace('subcat-', '') : (parts[2] && parts[2].startsWith('subcat-') ? parts[2].replace('subcat-', '') : null)
    };
}

function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
    displaySectionContent(sectionId, itemId, subCategoryFilter);
}

function initializeUserDependentUI() {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userIconEl = document.getElementById('userIcon');
    const adminMenu = document.getElementById('adminMenu');

    if (currentUser) {
        if (userNameEl) userNameEl.textContent = escapeHTML(currentUser.fullName);
        if (userRoleEl) userRoleEl.textContent = escapeHTML(currentUser.role);
        if (userIconEl) userIconEl.textContent = escapeHTML(currentUser.fullName.charAt(0).toUpperCase());
        if (adminMenu) adminMenu.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    } else {
        if (userNameEl) userNameEl.textContent = 'جاري التحميل...';
        if (userRoleEl) userRoleEl.textContent = '';
        if (userIconEl) userIconEl.textContent = '?';
        if (adminMenu) adminMenu.style.display = 'none';
    }
}

function renderArticleCard_enhanced(article, sectionData) {
    const theme = getThemeColors(sectionData.themeColor);
    return `
        <div data-item-id="${escapeHTML(article.id)}" data-item-type="article" class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border-l-4 ${theme.border} transform hover:-translate-y-1">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">${escapeHTML(article.title)}</h3>
                <span class="text-xs text-gray-500 dark:text-gray-400">${escapeHTML(article.lastUpdated)}</span>
            </div>
            <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">${escapeHTML(article.summary)}</p>
            <div class="flex flex-wrap gap-2 mb-4">
                ${article.tags ? article.tags.map(tag => `<span class="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">${escapeHTML(tag)}</span>`).join('') : ''}
            </div>
            <div class="flex items-center justify-between">
                <a href="#${escapeHTML(sectionData.id)}/${escapeHTML(article.id)}" data-section-trigger="${escapeHTML(sectionData.id)}" data-item-id="${escapeHTML(article.id)}" class="text-sm ${theme.cta}">اقرأ المزيد</a>
                <div class="flex space-x-2">
                    <button class="helpfulBtn text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 transition-colors duration-200" data-item-id="${escapeHTML(article.id)}" data-item-type="article">
                        <i class="fas fa-thumbs-up"></i>
                    </button>
                    <button class="notHelpfulBtn text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200" data-item-id="${escapeHTML(article.id)}" data-item-type="article">
                        <i class="fas fa-thumbs-down"></i>
                    </button>
                </div>
            </div>
        </div>`;
}

function renderCaseCard_enhanced(caseItem, sectionData) {
    const theme = getThemeColors(sectionData.themeColor);
    return `
        <div data-item-id="${escapeHTML(caseItem.id)}" data-item-type="case" class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border-l-4 ${theme.border} transform hover:-translate-y-1">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">${escapeHTML(caseItem.title)}</h3>
                <span class="text-xs px-2 py-1 rounded-full ${caseItem.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}">${escapeHTML(caseItem.status)}</span>
            </div>
            <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">${escapeHTML(caseItem.summary)}</p>
            <div class="flex items-center justify-between">
                <a href="#${escapeHTML(sectionData.id)}/${escapeHTML(caseItem.id)}" data-section-trigger="${escapeHTML(sectionData.id)}" data-item-id="${escapeHTML(caseItem.id)}" class="text-sm ${theme.cta}">عرض التفاصيل</a>
                <span class="text-xs text-gray-500 dark:text-gray-400">${escapeHTML(caseItem.lastUpdated)}</span>
            </div>
        </div>`;
}

function renderItemCard_enhanced(item, sectionData) {
    const theme = getThemeColors(sectionData.themeColor);
    return `
        <div data-item-id="${escapeHTML(item.id)}" data-item-type="item" class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border-l-4 ${theme.border} transform hover:-translate-y-1">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">${escapeHTML(item.name)}</h3>
                <span class="text-xs text-gray-500 dark:text-gray-400">${escapeHTML(item.lastUpdated)}</span>
            </div>
            <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">${escapeHTML(item.description)}</p>
            <div class="flex items-center justify-between">
                <a href="#${escapeHTML(sectionData.id)}/${escapeHTML(item.id)}" data-section-trigger="${escapeHTML(sectionData.id)}" data-item-id="${escapeHTML(item.id)}" class="text-sm ${theme.cta}">عرض التفاصيل</a>
            </div>
        </div>`;
}

// إدارة البحث
const searchInput = document.getElementById('globalSearchInput');
const searchResultsContainer = document.getElementById('searchResultsContainer');
let searchTimeout;

if (searchInput) {
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = searchInput.value.trim();
            if (query.length < 2) {
                searchResultsContainer.innerHTML = '';
                searchResultsContainer.classList.add('hidden');
                return;
            }
            const results = searchKb(query);
            displaySearchResults(results, query);
        }, 300);
    });
}

function searchKb(query) {
    if (!query || typeof query !== 'string') return [];
    const results = [];
    kbSystemData.sections.forEach(section => {
        if (section.articles) {
            section.articles.forEach(article => {
                if (article.title.toLowerCase().includes(query.toLowerCase()) || (article.summary && article.summary.toLowerCase().includes(query.toLowerCase()))) {
                    results.push({ type: 'article', sectionId: section.id, sectionName: section.name, item: article });
                }
            });
        }
        if (section.cases) {
            section.cases.forEach(caseItem => {
                if (caseItem.title.toLowerCase().includes(query.toLowerCase()) || (caseItem.summary && caseItem.summary.toLowerCase().includes(query.toLowerCase()))) {
                    results.push({ type: 'case', sectionId: section.id, sectionName: section.name, item: caseItem });
                }
            });
        }
        if (section.items) {
            section.items.forEach(item => {
                if (item.name.toLowerCase().includes(query.toLowerCase()) || (item.description && item.description.toLowerCase().includes(query.toLowerCase()))) {
                    results.push({ type: 'item', sectionId: section.id, sectionName: section.name, item: item });
                }
            });
        }
        if (section.glossary) {
            section.glossary.forEach(entry => {
                if (entry.term.toLowerCase().includes(query.toLowerCase()) || entry.definition.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ type: 'glossary', sectionId: section.id, sectionName: section.name, item: { id: entry.term, term: entry.term, definition: entry.definition } });
                }
            });
        }
    });
    return results.slice(0, 10);
}

function displaySearchResults(results, query) {
    if (!results || results.length === 0) {
        searchResultsContainer.innerHTML = '<div class="p-4 text-center text-gray-600 dark:text-gray-400">لا توجد نتائج مطابقة.</div>';
        searchResultsContainer.classList.remove('hidden');
        return;
    }

    let resultsHTML = '<div class="divide-y divide-gray-200 dark:divide-gray-700">';
    results.forEach(result => {
        const theme = getThemeColors(kbSystemData.sections.find(s => s.id === result.sectionId)?.themeColor);
        resultsHTML += `
            <div class="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <a href="#${escapeHTML(result.sectionId)}/${escapeHTML(result.item.id)}" data-section-trigger="${escapeHTML(result.sectionId)}" data-item-id="${escapeHTML(result.item.id)}" class="block">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-sm font-medium text-gray-800 dark:text-white">${highlightText(escapeHTML(result.item.title || result.item.name || result.item.term), query)}</h4>
                            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${highlightText(escapeHTML(result.item.summary || result.item.description || result.item.definition || ''), query)}</p>
                        </div>
                        <span class="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">${escapeHTML(result.sectionName)}</span>
                    </div>
                </a>
            </div>`;
    });
    resultsHTML += '</div>';
    searchResultsContainer.innerHTML = resultsHTML;
    searchResultsContainer.classList.remove('hidden');
    applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
}

// إدارة أحداث التقييم
document.addEventListener('click', async (event) => {
    const helpfulBtn = event.target.closest('.helpfulBtn');
    const notHelpfulBtn = event.target.closest('.notHelpfulBtn');

    if (helpfulBtn) {
        const itemId = helpfulBtn.dataset.itemId;
        const itemType = helpfulBtn.dataset.itemType;
        alert(`[Placeholder] Marked ${itemType} (ID: ${itemId}) as helpful. Backend call TBD.`);
    }

    if (notHelpfulBtn) {
        const itemId = notHelpfulBtn.dataset.itemId;
        const itemType = notHelpfulBtn.dataset.itemType;
        alert(`[Placeholder] Marked ${itemType} (ID: ${itemId}) as not helpful. Backend call TBD.`);
    }
});

// إدارة تغيير الهاش
window.addEventListener('hashchange', () => {
    if (!isInitialAuthCheckComplete) {
        console.log('[app.js] Hash changed before initial auth check completed. Deferring.');
        return;
    }
    const { sectionId, itemId, subCategoryFilter } = parseHash();
    handleSectionTrigger(sectionId, itemId, subCategoryFilter);
});
