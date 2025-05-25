// js/app.js
import { supabase } from './supabase.js';

// --- Global Variables & Constants ---
const USER_DATA_KEY = 'infiniBaseUserData';
let currentUser = null;
let activeCaseQuillEditor = null; // محرر Quill للحالات
let currentSectionForCase = null; // لتخزين القسم الحالي عند إضافة/تعديل كيس

// --- DOM Elements (يتم تهيئتها بعد DOMContentLoaded) ---
let userNameDisplay, welcomeUserName, kbVersionSpan, lastKbUpdateSpan, footerKbVersionSpan,
    pageContent, currentSectionTitleEl, breadcrumbsContainer, sidebarLinks,
    accessTrackingReportContainer, globalSearchInput, searchResultsContainer,
    themeSwitcher, themeIcon, themeText, htmlElement, logoutButton, reportErrorBtn,
    genericModal, modalTitleEl, modalContentEl, modalActionsEl, closeModalBtnGeneric,
    caseEditorModal, caseEditorTitle, caseTitleInput, caseSummaryInput,
    caseStatusSelect, caseTagsInput, caseQuillEditorDiv, saveCaseButton,
    caseEditorCaseIdInput, caseEditorSectionIdInput;


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

function showToast(message, type = 'success') {
    const toastNotification = document.getElementById('toastNotification'); // أعدنا تعريفه هنا لضمان وجوده
    const toastMessage = document.getElementById('toastMessage');
    if (!toastNotification || !toastMessage) {
        console.warn("Toast elements not found, logging to console:", message, type);
        alert(`${type.toUpperCase()}: ${message}`);
        return;
    }
    toastMessage.textContent = message;
    toastNotification.classList.remove('hidden', 'bg-green-500', 'bg-red-500', 'bg-blue-500');
    if (type === 'success') {
        toastNotification.classList.add('bg-green-500');
    } else if (type === 'error') {
        toastNotification.classList.add('bg-red-500');
    } else {
        toastNotification.classList.add('bg-blue-500');
    }
    toastNotification.classList.remove('hidden');
    setTimeout(() => {
        toastNotification.classList.add('hidden');
    }, 3000);
}

function getThemeColors(themeColor = 'gray') {
    const color = typeof themeColor === 'string' ? themeColor.toLowerCase() : 'gray';
    const colorMap = {
        blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400', iconContainer: 'bg-blue-100 dark:bg-blue-800/50', icon: 'text-blue-500 dark:text-blue-400', cta: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300', border: 'border-blue-500', tagBg: 'bg-blue-100 dark:bg-blue-500/20', tagText: 'text-blue-700 dark:text-blue-300', statusBg: 'bg-blue-100 dark:bg-blue-500/20', statusText: 'text-blue-700 dark:text-blue-400' },
        teal: { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-600 dark:text-teal-400', iconContainer: 'bg-teal-100 dark:bg-teal-800/50', icon: 'text-teal-500 dark:text-teal-400', cta: 'text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300', border: 'border-teal-500', tagBg: 'bg-teal-100 dark:bg-teal-500/20', tagText: 'text-teal-700 dark:text-teal-300', statusBg: 'bg-teal-100 dark:bg-teal-500/20', statusText: 'text-teal-700 dark:text-teal-400' },
        green: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-600 dark:text-green-400', iconContainer: 'bg-green-100 dark:bg-green-800/50', icon: 'text-green-500 dark:text-green-400', cta: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300', border: 'border-green-500', tagBg: 'bg-green-100 dark:bg-green-500/20', tagText: 'text-green-700 dark:text-green-300', statusBg: 'bg-green-100 dark:bg-green-500/20', statusText: 'text-green-700 dark:text-green-400' },
        indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600 dark:text-indigo-400', iconContainer: 'bg-indigo-100 dark:bg-indigo-800/50', icon: 'text-indigo-500 dark:text-indigo-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-indigo-500', tagBg: 'bg-indigo-100 dark:bg-indigo-500/20', tagText: 'text-indigo-700 dark:text-indigo-300', statusBg: 'bg-indigo-100 dark:bg-indigo-500/20', statusText: 'text-indigo-700 dark:text-indigo-400' },
        // ... أكمل باقي الألوان من الكود السابق ...
        gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', iconContainer: 'bg-gray-100 dark:bg-gray-700/50', icon: 'text-gray-500 dark:text-gray-400', cta: 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300', border: 'border-gray-500', tagBg: 'bg-gray-200 dark:bg-gray-700', tagText: 'text-gray-700 dark:text-gray-300', statusBg: 'bg-gray-200 dark:bg-gray-600', statusText: 'text-gray-700 dark:text-gray-300' }
    };
    return colorMap[color] || colorMap.gray;
}

// --- Modal Functions ---
function openGenericModal(title, contentHTML, actionsHTML = '') {
    if (!genericModal || !modalTitleEl || !modalContentEl || !modalActionsEl) {
        console.error('Generic Modal elements not found');
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

function closeGenericModal() {
    if (genericModal) genericModal.classList.add('hidden');
    if (modalContentEl) modalContentEl.innerHTML = '';
    if (modalActionsEl) modalActionsEl.innerHTML = '';
}

// --- Theme Functions ---
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
            mark.style.backgroundColor = '#78350f'; mark.style.color = '#f3f4f6';
        } else {
            mark.style.backgroundColor = '#fde047'; mark.style.color = '#1f2937';
        }
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
}

// --- Card Renderers ---
function renderArticleCard_enhanced(article, sectionData) {
    // (انسخ الكود من الرد السابق)
    const theme = getThemeColors(sectionData.themeColor);
    const cardIconClass = sectionData.icon || 'fas fa-file-alt';
    return `
        <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${article.id}" data-item-type="article" data-section-id="${sectionData.id}">
            <div class="flex items-center mb-3">
                <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                     <i class="${cardIconClass} text-xl ${theme.icon}"></i>
                </div>
                <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(article.title)}</h3>
                <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + '/infini-base/dashboard.html#' + '${sectionData.id}/${article.id}'); showToast('Link copied!', 'info');" class="bookmark-link ml-auto pl-2" title="Copy link to this article">
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
    // (انسخ الكود من الرد السابق)
    const theme = getThemeColors(sectionData.themeColor);
    const cardIconClass = sectionData.icon || 'fas fa-file-alt';
    return `
        <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${item.id}" data-item-type="item" data-section-id="${sectionData.id}">
             <div class="flex items-center mb-3">
                <div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0">
                     <i class="${cardIconClass} text-xl ${theme.icon}"></i>
                </div>
                <h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight">${escapeHTML(item.title)}</h3>
                <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + '/infini-base/dashboard.html#' + '${sectionData.id}/${item.id}'); showToast('Link copied!', 'info');" class="bookmark-link ml-auto pl-2" title="Copy link to this item">
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
function renderCaseCard_enhanced(caseItem, sectionData) {
    // (انسخ الكود من الرد السابق، مع التأكد أنه يعتمد على isSupabaseCase إذا لزم الأمر)
    const theme = getThemeColors(sectionData.themeColor);
    const caseIcon = 'fas fa-briefcase';
    const itemId = caseItem.id;

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
                 <a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + '/infini-base/dashboard.html#' + '${sectionData.id}/${itemId}'); showToast('Link copied!', 'info');" class="bookmark-link ml-auto pl-2" title="Copy link to this case">
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


// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    // ... (تهيئة المتغيرات العالمية لعناصر DOM هنا كما في الرد السابق)
    userNameDisplay = document.getElementById('userNameDisplay');
    welcomeUserName = document.getElementById('welcomeUserName');
    kbVersionSpan = document.getElementById('kbVersion');
    lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    footerKbVersionSpan = document.getElementById('footerKbVersion');
    pageContent = document.getElementById('pageContent');
    currentSectionTitleEl = document.getElementById('currentSectionTitle');
    breadcrumbsContainer = document.getElementById('breadcrumbs');
    sidebarLinks = document.querySelectorAll('.sidebar-link');
    accessTrackingReportContainer = document.getElementById('accessTrackingReportContainer');
    globalSearchInput = document.getElementById('globalSearchInput');
    searchResultsContainer = document.getElementById('searchResultsContainer');
    themeSwitcher = document.getElementById('themeSwitcher');
    themeIcon = document.getElementById('themeIcon');
    themeText = document.getElementById('themeText');
    htmlElement = document.documentElement;
    logoutButton = document.getElementById('logoutButton');
    reportErrorBtn = document.getElementById('reportErrorBtn');
    genericModal = document.getElementById('genericModal');
    modalTitleEl = document.getElementById('modalTitle');
    modalContentEl = document.getElementById('modalContent');
    modalActionsEl = document.getElementById('modalActions');
    closeModalBtnGeneric = document.getElementById('closeModalBtn'); // تأكد من أن هذا هو ID زر الإغلاق في المودال العام
    caseEditorModal = document.getElementById('caseEditorModal');
    caseEditorTitle = document.getElementById('caseEditorTitle');
    caseTitleInput = document.getElementById('caseTitleInput');
    caseSummaryInput = document.getElementById('caseSummaryInput');
    caseStatusSelect = document.getElementById('caseStatusSelect');
    caseTagsInput = document.getElementById('caseTagsInput');
    caseQuillEditorDiv = document.getElementById('caseQuillEditor');
    saveCaseButton = document.getElementById('saveCaseButton');
    caseEditorCaseIdInput = document.getElementById('caseEditorCaseId');
    caseEditorSectionIdInput = document.getElementById('caseEditorSectionId');


    // ... (الكود الذي يبدأ من `console.log('[app.js] DOMContentLoaded fired.');` حتى نهاية الملف من الرد السابق،
    // مع التأكد من تضمين جميع الدوال التي تم نسخها أعلاه (displaySectionContent, showItemDetailsModal, الخ)
    // ودوال Case Editor)

    // [كل الكود من الرد السابق لـ app.js يجب أن يكون هنا، مع استبدال/تحديث الدوال كما هو موضح أعلاه]
    // تأكد من نسخ ولصق محتوى app.js السابق بالكامل هنا، مع الانتباه إلى أن الدوال المساعدة
    // ودوال العرض أصبحت الآن خارج دالة DOMContentLoaded الرئيسية ولكنها ضمن نفس نطاق الملف.

    // --- Initial Page Load from Hash ---
    const { sectionId: initialSectionId, itemId: initialItemId, subCategoryFilter: initialSubCategoryFilter } = parseHash(); // تأكد من وجود دالة parseHash
    console.log('[app.js] Initial hash load:', { initialSectionId, initialItemId, initialSubCategoryFilter });
    if (handleSectionTrigger) { // تأكد من وجود دالة handleSectionTrigger
        handleSectionTrigger(initialSectionId || 'home', initialItemId, initialSubCategoryFilter);
    } else {
        console.error("handleSectionTrigger is not defined!");
    }

    console.log('[app.js] All initializations and event listeners are set up.');
});

// *** تأكد من نسخ ولصق جميع الدوال الأخرى المتبقية من `app.js` السابق هنا ***
// مثل: displaySectionContent, showItemDetailsModal, renderAccessTrackingReport,
// openSubsectionModal (إذا كنت ستستخدمها), handleSectionTrigger, parseHash,
// وجميع event listeners.
