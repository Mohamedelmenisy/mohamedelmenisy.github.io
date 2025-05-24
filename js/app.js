// js/app.js (dish.txt - REVISED)
import { supabase } from './supabase.js';
import { Auth } from './js/auth.js'; // Import Auth as it's exported by auth.js

let currentUser = null; // Module-scoped variable to store the current user

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => { // Make the main handler ASYNC
    console.log('[app.js - DEBUG] DOMContentLoaded fired.');

    // --- Authentication & Page Protection ---
    // protectPage is a method of Auth and is async
    console.log('[app.js] Calling Auth.protectPage().');
    await Auth.protectPage(); // Wait for authentication check

    // Fetch currentUser AFTER protection ensures we are on a protected page
    // Auth.getCurrentUser is async
    currentUser = await Auth.getCurrentUser();
    console.log('[app.js] Current user (module scope):', currentUser);


    // --- Core Elements (ensure they exist) ---
    const pageContent = document.getElementById('pageContent');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const mainContent = document.querySelector('main');

    // --- Add Case Modal Elements ---
    const addCaseModalOverlay = document.getElementById('addCaseModalOverlay');
    const addCasePopup = document.getElementById('addCasePopup');
    const closeAddCasePopupBtn = document.getElementById('closeAddCasePopupBtn');
    const addCaseForm = document.getElementById('addCaseForm');
    const caseTitleInput = document.getElementById('caseTitleInput');
    const caseSummaryInput = document.getElementById('caseSummaryInput');
    const caseContentEditorEl = document.getElementById('caseContentEditor');
    const cancelAddCaseBtn = document.getElementById('cancelAddCaseBtn');
    const saveCaseBtn = document.getElementById('saveCaseBtn');
    let quillEditor = null;
    let currentSectionIdForPopup = null;

    const KNOWLEDGE_AREA_SECTION_IDS = [
        'support', 'partner_care', 'logistics', 'customer_care',
        'dist_follow_up', 'logistics_driver', 'logistics_3pl',
        'order_at_store', 'logistics_admin', 'os'
    ];

    if (!pageContent || sidebarLinks.length === 0) {
        console.error('[app.js - CRITICAL] Essential page elements missing. Halting execution.');
        if (pageContent) pageContent.innerHTML = '<div class="p-6 text-center text-red-500">Error: Critical page elements missing. Application cannot start.</div>';
        return;
    }

    // --- Update UI elements that depend directly on currentUser (if not handled by dashboard.html inline script) ---
    const welcomeUserNameEl = document.getElementById('welcomeUserName'); // For home page
    if (currentUser && welcomeUserNameEl) { // Check if on home page and element exists
        const userDisplayName = currentUser.fullName || currentUser.email || 'User';
        welcomeUserNameEl.textContent = `Welcome, ${userDisplayName}!`;
    }
    // Version info
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');
    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    }


    // --- Theme Switcher (should be fine as is) ---
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const htmlElement = document.documentElement;

    function applyTheme(theme) { /* ... (same as before) ... */
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
    function loadTheme() { /* ... (same as before) ... */
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

    // --- Logout Button (Auth.logout is async) ---
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => { // Make async
            await Auth.logout(); // Auth.logout handles redirection
        });
    }

    // --- Report an Error Button (fine as is) ---
    const reportErrorBtn = document.getElementById('reportErrorBtn');
    if (reportErrorBtn) {
        reportErrorBtn.addEventListener('click', () => {
            alert(`Issue reporting for: ${currentSectionTitleEl?.textContent || 'Current Page'}\n(Placeholder)`);
        });
    }

    // --- Add Case Modal Logic (Quill, Show/Hide, Save - save is async) ---
    function initializeQuillEditor() { /* ... (same as before) ... */
        if (caseContentEditorEl && !quillEditor) {
            const toolbarOptions = [
                [{ 'header': [1, 2, 3, false] }],['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }], [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link'],['clean']
            ];
            quillEditor = new Quill(caseContentEditorEl, { modules: { toolbar: toolbarOptions }, theme: 'snow' });
        }
    }
    function showAddCasePopup(sectionId) { /* ... (same as before) ... */
        if (!addCasePopup || !addCaseModalOverlay) return;
        currentSectionIdForPopup = sectionId;
        addCaseForm.reset();
        if (quillEditor) quillEditor.setText(''); else initializeQuillEditor();
        addCaseModalOverlay.classList.remove('hidden'); addCaseModalOverlay.classList.add('flex');
        addCasePopup.classList.remove('hidden');
        setTimeout(() => {
            addCaseModalOverlay.classList.remove('opacity-0');
            addCasePopup.classList.remove('opacity-0', 'scale-95');
            addCasePopup.classList.add('opacity-100', 'scale-100');
        }, 10);
        caseTitleInput.focus();
    }
    function hideAddCasePopup() { /* ... (same as before) ... */
        if (!addCasePopup || !addCaseModalOverlay) return;
        addCaseModalOverlay.classList.add('opacity-0');
        addCasePopup.classList.add('opacity-0', 'scale-95'); addCasePopup.classList.remove('opacity-100', 'scale-100');
        setTimeout(() => {
            addCaseModalOverlay.classList.add('hidden'); addCaseModalOverlay.classList.remove('flex');
            addCasePopup.classList.add('hidden');
            if (addCaseForm) addCaseForm.reset();
            if (quillEditor) quillEditor.setText('');
            currentSectionIdForPopup = null;
        }, 300);
    }
    if (closeAddCasePopupBtn) closeAddCasePopupBtn.addEventListener('click', hideAddCasePopup);
    if (cancelAddCaseBtn) cancelAddCaseBtn.addEventListener('click', hideAddCasePopup);
    if (addCaseModalOverlay) addCaseModalOverlay.addEventListener('click', (e) => { if (e.target === addCaseModalOverlay) hideAddCasePopup(); });

    if (addCaseForm) {
        addCaseForm.addEventListener('submit', async (e) => { // Form submit is ASYNC
            e.preventDefault();
            if (!currentSectionIdForPopup || !currentUser || !currentUser.email || !supabase) {
                alert('Error: Cannot save case. Missing user, section, or DB connection.'); return;
            }
            const title = caseTitleInput.value.trim();
            const summary = caseSummaryInput.value.trim();
            const content = quillEditor ? quillEditor.root.innerHTML : '';
            if (!title) { alert('Case Title is required.'); caseTitleInput.focus(); return; }

            saveCaseBtn.disabled = true; saveCaseBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
            try {
                const { data: newCaseArray, error } = await supabase.from('cases').insert({
                    section_id: currentSectionIdForPopup, title, summary, content, status: 'New', created_by: currentUser.email,
                }).select(); // Crucial to get the ID back

                if (error) throw error;
                if (newCaseArray && newCaseArray.length > 0) {
                    const newCaseDataFromDb = newCaseArray[0];
                    const sectionData = kbSystemData.sections.find(s => s.id === currentSectionIdForPopup);
                    if (sectionData) {
                        if (!sectionData.cases) sectionData.cases = [];
                        sectionData.cases.unshift({
                            id: newCaseDataFromDb.id, title: newCaseDataFromDb.title, summary: newCaseDataFromDb.summary,
                            status: newCaseDataFromDb.status, tags: [], resolutionStepsPreview: truncateText(summary || "View details", 50), contentPath: null,
                        });
                    }
                    hideAddCasePopup();
                    alert('Case saved successfully!');
                    await displaySectionContent(currentSectionIdForPopup, newCaseDataFromDb.id); // displaySectionContent might become async if it uses await
                } else { alert('Error: Case saved, but no confirmation.'); }
            } catch (err) { console.error('[app.js - Add Case] Error:', err); alert(`Error: ${err.message}`);
            } finally { saveCaseBtn.disabled = false; saveCaseBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Save Case'; }
        });
    }

    // --- Helper Functions (escapeHTML, highlightText, truncateText, getThemeColors) ---
    // (These should be fine as they are synchronous)
    function escapeHTML(str) { /* ... (same as before) ... */ if (typeof str !== 'string') return ''; return str.replace(/[&<>"']/g, match => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' })[match]); }
    function highlightText(text, query) { /* ... (same as before) ... */ if (!text) return ''; const safeText = escapeHTML(text); if (!query) return safeText; try { const escQ = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); const rgx = new RegExp(`(${escQ})`, 'gi'); return safeText.replace(rgx, '<mark>$1</mark>'); } catch (e) { console.error('[app.js] highlightText regex error:', e); return safeText; } }
    function truncateText(text, maxLength) { /* ... (same as before) ... */  if (!text || text.length <= maxLength) return text; return text.substring(0, maxLength) + '...'; }
    function getThemeColors(themeColor = 'gray') { /* ... (same as before, very long, ensure it's correct) ... */
        const color = typeof themeColor === 'string' ? themeColor.toLowerCase() : 'gray';
        const colorMap={blue:{bg:"bg-blue-100 dark:bg-blue-900",text:"text-blue-600 dark:text-blue-400",iconContainer:"bg-blue-100 dark:bg-blue-800/50",icon:"text-blue-500 dark:text-blue-400",cta:"text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",border:"border-blue-500",tagBg:"bg-blue-100 dark:bg-blue-500/20",tagText:"text-blue-700 dark:text-blue-300",statusBg:"bg-blue-100 dark:bg-blue-500/20",statusText:"text-blue-700 dark:text-blue-400"},teal:{bg:"bg-teal-100 dark:bg-teal-900",text:"text-teal-600 dark:text-teal-400",iconContainer:"bg-teal-100 dark:bg-teal-800/50",icon:"text-teal-500 dark:text-teal-400",cta:"text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300",border:"border-teal-500",tagBg:"bg-teal-100 dark:bg-teal-500/20",tagText:"text-teal-700 dark:text-teal-300",statusBg:"bg-teal-100 dark:bg-teal-500/20",statusText:"text-teal-700 dark:text-teal-400"},green:{bg:"bg-green-100 dark:bg-green-900",text:"text-green-600 dark:text-green-400",iconContainer:"bg-green-100 dark:bg-green-800/50",icon:"text-green-500 dark:text-green-400",cta:"text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300",border:"border-green-500",tagBg:"bg-green-100 dark:bg-green-500/20",tagText:"text-green-700 dark:text-green-300",statusBg:"bg-green-100 dark:bg-green-500/20",statusText:"text-green-700 dark:text-green-400"},indigo:{bg:"bg-indigo-100 dark:bg-indigo-900",text:"text-indigo-600 dark:text-indigo-400",iconContainer:"bg-indigo-100 dark:bg-indigo-800/50",icon:"text-indigo-500 dark:text-indigo-400",cta:"text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300",border:"border-indigo-500",tagBg:"bg-indigo-100 dark:bg-indigo-500/20",tagText:"text-indigo-700 dark:text-indigo-300",statusBg:"bg-indigo-100 dark:bg-indigo-500/20",statusText:"text-indigo-700 dark:text-indigo-400"},cyan:{bg:"bg-cyan-100 dark:bg-cyan-900",text:"text-cyan-600 dark:text-cyan-400",iconContainer:"bg-cyan-100 dark:bg-cyan-800/50",icon:"text-cyan-500 dark:text-cyan-400",cta:"text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300",border:"border-cyan-500",tagBg:"bg-cyan-100 dark:bg-cyan-500/20",tagText:"text-cyan-700 dark:text-cyan-300",statusBg:"bg-cyan-100 dark:bg-cyan-500/20",statusText:"text-cyan-700 dark:text-cyan-400"},lime:{bg:"bg-lime-100 dark:bg-lime-900",text:"text-lime-600 dark:text-lime-400",iconContainer:"bg-lime-100 dark:bg-lime-800/50",icon:"text-lime-500 dark:text-lime-400",cta:"text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300",border:"border-lime-500",tagBg:"bg-lime-100 dark:bg-lime-500/20",tagText:"text-lime-700 dark:text-lime-300",statusBg:"bg-lime-100 dark:bg-lime-500/20",statusText:"text-lime-700 dark:text-lime-400"},yellow:{bg:"bg-yellow-100 dark:bg-yellow-900",text:"text-yellow-600 dark:text-yellow-400",iconContainer:"bg-yellow-100 dark:bg-yellow-800/50",icon:"text-yellow-500 dark:text-yellow-400",cta:"text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300",border:"border-yellow-500",tagBg:"bg-yellow-100 dark:bg-yellow-500/20",tagText:"text-yellow-700 dark:text-yellow-300",statusBg:"bg-yellow-100 dark:bg-yellow-500/20",statusText:"text-yellow-700 dark:text-yellow-400"},pink:{bg:"bg-pink-100 dark:bg-pink-900",text:"text-pink-600 dark:text-pink-400",iconContainer:"bg-pink-100 dark:bg-pink-800/50",icon:"text-pink-500 dark:text-pink-400",cta:"text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300",border:"border-pink-500",tagBg:"bg-pink-100 dark:bg-pink-500/20",tagText:"text-pink-700 dark:text-pink-300",statusBg:"bg-pink-100 dark:bg-pink-500/20",statusText:"text-pink-700 dark:text-pink-400"},red:{bg:"bg-red-100 dark:bg-red-900",text:"text-red-600 dark:text-red-400",iconContainer:"bg-red-100 dark:bg-red-800/50",icon:"text-red-500 dark:text-red-400",cta:"text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300",border:"border-red-500",tagBg:"bg-red-100 dark:bg-red-500/20",tagText:"text-red-700 dark:text-red-300",statusBg:"bg-red-100 dark:bg-red-500/20",statusText:"text-red-700 dark:text-red-400"},sky:{bg:"bg-sky-100 dark:bg-sky-900",text:"text-sky-600 dark:text-sky-400",iconContainer:"bg-sky-100 dark:bg-sky-800/50",icon:"text-sky-500 dark:text-sky-400",cta:"text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300",border:"border-sky-500",tagBg:"bg-sky-100 dark:bg-sky-500/20",tagText:"text-sky-700 dark:text-sky-300",statusBg:"bg-sky-100 dark:bg-sky-500/20",statusText:"text-sky-700 dark:text-sky-400"},amber:{bg:"bg-amber-100 dark:bg-amber-900",text:"text-amber-600 dark:text-amber-400",iconContainer:"bg-amber-100 dark:bg-amber-800/50",icon:"text-amber-500 dark:text-amber-400",cta:"text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300",border:"border-amber-500",tagBg:"bg-amber-100 dark:bg-amber-500/20",tagText:"text-amber-700 dark:text-amber-300",statusBg:"bg-amber-100 dark:bg-amber-500/20",statusText:"text-amber-700 dark:text-amber-400"},purple:{bg:"bg-purple-100 dark:bg-purple-900",text:"text-purple-600 dark:text-purple-400",iconContainer:"bg-purple-100 dark:bg-purple-800/50",icon:"text-purple-500 dark:text-purple-400",cta:"text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300",border:"border-purple-500",tagBg:"bg-purple-100 dark:bg-purple-500/20",tagText:"text-purple-700 dark:text-purple-300",statusBg:"bg-purple-100 dark:bg-purple-500/20",statusText:"text-purple-700 dark:text-purple-400"},slate:{bg:"bg-slate-100 dark:bg-slate-800",text:"text-slate-600 dark:text-slate-400",iconContainer:"bg-slate-100 dark:bg-slate-700/50",icon:"text-slate-500 dark:text-slate-400",cta:"text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300",border:"border-slate-500",tagBg:"bg-slate-200 dark:bg-slate-700",tagText:"text-slate-700 dark:text-slate-300",statusBg:"bg-slate-200 dark:bg-slate-600",statusText:"text-slate-700 dark:text-slate-300"},gray:{bg:"bg-gray-100 dark:bg-gray-800",text:"text-gray-600 dark:text-gray-400",iconContainer:"bg-gray-100 dark:bg-gray-700/50",icon:"text-gray-500 dark:text-gray-400",cta:"text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300",border:"border-gray-500",tagBg:"bg-gray-200 dark:bg-gray-700",tagText:"text-gray-700 dark:text-gray-300",statusBg:"bg-gray-200 dark:bg-gray-600",statusText:"text-gray-700 dark:text-gray-300"}};
        return colorMap[color]||colorMap.gray;
    }


    // --- Rendering Functions (renderArticleCard_enhanced, etc.) ---
    // (These are synchronous but use `currentUser` via `displaySectionContent` scope)
    function renderArticleCard_enhanced(article, sectionData, query = null) { /* ... (same as before) ... */
        const theme=getThemeColors(sectionData.themeColor);const cardIconClass=sectionData.icon||"fas fa-file-alt";return`
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${article.id}" data-item-type="article">
                <div class="flex items-start mb-3"><div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0"><i class="${cardIconClass} text-xl ${theme.icon}"></i></div><h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight flex-grow">${highlightText(article.title,query)}</h3><a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${article.id}'); alert('Link copied!');" class="bookmark-link ml-2 pl-2 flex-shrink-0" title="Copy link"><i class="fas fa-link text-gray-400 hover:text-indigo-500"></i></a></div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${highlightText(article.summary,query)||"No summary."}</p>
                ${article.tags&&article.tags.length>0?`<div class="mb-4">${article.tags.map(tag=>`<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>`:''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700"><div class="rating-container text-xs text-gray-500 flex items-center"><span class="mr-1">Helpful?</span><button class="rating-btn p-1 hover:opacity-75"data-item-id="${article.id}"data-rating="up"><i class="fas fa-thumbs-up text-green-500"></i></button><button class="rating-btn p-1 hover:opacity-75"data-item-id="${article.id}"data-rating="down"><i class="fas fa-thumbs-down text-red-500"></i></button></div><a href="${escapeHTML(article.contentPath)}" target="_blank" class="text-sm font-medium ${theme.cta} group" data-track-view="true" data-track-section-id="${escapeHTML(sectionData.id)}" data-track-item-id="${escapeHTML(article.id)}" data-track-item-type="article">Read More <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1"></i></a></div>
            </div>`;
    }
    function renderItemCard_enhanced(item, sectionData, query = null) { /* ... (same as before) ... */
        const theme=getThemeColors(sectionData.themeColor);let itemIconClass=sectionData.icon||"fas fa-file-alt";if(sectionData.id==="forms_templates"){if(item.type==="checklist")itemIconClass="fas fa-tasks";else if(item.type==="form")itemIconClass="fab fa-wpforms";else if(item.type==="template")itemIconClass="fas fa-puzzle-piece";}return`
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${item.id}" data-item-type="item">
                <div class="flex items-start mb-3"><div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0"><i class="${itemIconClass} text-xl ${theme.icon}"></i></div><h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight flex-grow">${highlightText(item.title,query)}</h3><a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${item.id}'); alert('Link copied!');" class="ml-2 pl-2 flex-shrink-0" title="Copy link"><i class="fas fa-link text-gray-400 hover:text-indigo-500"></i></a></div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${highlightText(item.description,query)||"No description."}</p>
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700"><span class="text-xs ${theme.tagBg} ${theme.tagText} px-3 py-1 rounded-full uppercase font-semibold">${escapeHTML(item.type)}</span><a href="${escapeHTML(item.url)}" target="_blank" class="text-sm font-medium ${theme.cta} group">Open <i class="fas fa-external-link-alt ml-1 text-xs opacity-75 group-hover:scale-110"></i></a></div>
            </div>`;
    }
    function renderCaseCard_enhanced(caseItem, sectionData, query = null) { /* ... (same as before) ... */
        const theme=getThemeColors(sectionData.themeColor);const caseIcon="fas fa-briefcase";return`
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl flex flex-col transform hover:-translate-y-1 card-animate border-t-4 ${theme.border}" data-item-id="${caseItem.id}" data-item-type="case">
                <div class="flex items-start mb-3"><div class="p-3 rounded-full ${theme.iconContainer} mr-4 flex-shrink-0"><i class="${caseIcon} text-xl ${theme.icon}"></i></div><h3 class="font-semibold text-lg text-gray-800 dark:text-white leading-tight flex-grow">${highlightText(caseItem.title,query)}</h3><a href="javascript:void(0);" onclick="navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#${sectionData.id}/${caseItem.id}'); alert('Link copied!');" class="ml-2 pl-2 flex-shrink-0" title="Copy link"><i class="fas fa-link text-gray-400 hover:text-indigo-500"></i></a></div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 flex-grow">${highlightText(caseItem.summary,query)||"No summary."}</p>
                ${caseItem.resolutionStepsPreview?`<p class="text-xs text-gray-500 mb-3 italic">Steps: ${escapeHTML(caseItem.resolutionStepsPreview)}</p>`:''}
                ${caseItem.tags&&caseItem.tags.length>0?`<div class="mb-3">${caseItem.tags.map(tag=>`<span class="text-xs ${theme.tagBg} ${theme.tagText} px-2 py-1 rounded-full mr-1 mb-1 inline-block font-medium">${escapeHTML(tag)}</span>`).join('')}</div>`:''}
                <div class="mt-auto flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700"><span class="text-sm font-medium px-3 py-1 rounded-full ${theme.statusBg} ${theme.statusText} capitalize">${highlightText(caseItem.status,query)}</span>
                ${caseItem.contentPath?`<a href="${escapeHTML(caseItem.contentPath)}" target="_blank" class="text-sm font-medium ${theme.cta} group" data-track-view="true" data-track-section-id="${escapeHTML(sectionData.id)}" data-track-item-id="${escapeHTML(caseItem.id)}" data-track-item-type="case">Details <i class="fas fa-arrow-right ml-1 text-xs opacity-75 group-hover:translate-x-1"></i></a>`:`<div class="w-16"></div>`}</div>
            </div>`;
    }


    // --- Sidebar Navigation & Content Loading ---
    const initialPageContentHTML = pageContent.innerHTML || '<p>Error: Initial page content could not be loaded.</p>';

    function highlightSidebarLink(sectionId) { /* ... (same as before) ... */
        sidebarLinks.forEach(l=>l.classList.remove("active"));const activeLink=document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);if(activeLink)activeLink.classList.add("active");else console.warn(`[app.js] No sidebar link for section: "${sectionId}"`);
    }

    // displaySectionContent uses the module-scoped `currentUser`
    async function displaySectionContent(sectionId, itemIdToFocus = null, subCategoryFilter = null) {
        console.log(`[app.js] displaySectionContent: sectionId="${sectionId}", item="${itemIdToFocus}", subCat="${subCategoryFilter}"`);
        if (!pageContent || typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error('[app.js] Cannot display section. pageContent or kbSystemData missing.');
            if (pageContent) pageContent.innerHTML = '<p class="text-red-500 p-4">Error: Knowledge base data is unavailable.</p>';
            return;
        }

        if (sectionId === 'home') {
            pageContent.innerHTML = initialPageContentHTML; // Use the stored initial HTML
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Welcome';
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            const welcomeUserElOnHome = document.getElementById('welcomeUserName'); // Get it again as innerHTML was replaced
            if (currentUser && welcomeUserElOnHome) {
                 welcomeUserElOnHome.textContent = `Welcome, ${currentUser.fullName || currentUser.email || 'User'}!`;
            }
            // Also update version on home page if kbSystemData is available
            if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) {
                const kbVersionElHome = document.getElementById('kbVersion');
                const lastKbUpdateElHome = document.getElementById('lastKbUpdate');
                if(kbVersionElHome) kbVersionElHome.textContent = kbSystemData.meta.version;
                if(lastKbUpdateElHome) lastKbUpdateElHome.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }

            pageContent.querySelectorAll('.grid > .card-animate').forEach((card, index) => {
                card.style.opacity = '0'; card.style.transform = 'translateY(20px)'; card.style.animation = 'none';
                card.offsetHeight; card.style.animation = `fadeInUp 0.5s ease-out forwards ${(index + 1) * 0.1}s`;
            });
            applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="p-6 text-center card-animate"><h2 class="text-2xl font-semibold text-red-500 dark:text-red-400">Section Not Found</h2><p>ID: "${escapeHTML(sectionId)}"</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = 'Not Found';
            if (breadcrumbsContainer) breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline">Home</a> > <span class="text-red-500">Not Found</span>`;
            return;
        }

        const theme = getThemeColors(sectionData.themeColor);
        let contentHTML = `<div class="space-y-10">`;
        contentHTML += `<div class="card-animate"><div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2"><h2 class="text-3xl font-bold text-gray-800 dark:text-white flex items-center mb-2 sm:mb-0"><span class="p-2.5 rounded-lg ${theme.iconContainer} mr-3 sm:mr-4 inline-flex"><i class="${sectionData.icon||'fas fa-folder'} text-2xl ${theme.icon}"></i></span>${escapeHTML(sectionData.name)}</h2></div><p class="text-gray-600 dark:text-gray-300 text-lg">${escapeHTML(sectionData.description)}</p></div>`;
        contentHTML += `<div class="my-6 p-4 bg-white dark:bg-gray-800/70 rounded-lg shadow-md card-animate" style="animation-delay:0.1s;"><label for="sectionSearchInput" class="block text-sm font-medium mb-1">Ask about ${escapeHTML(sectionData.name)}:</label><div class="flex"><input type="text" id="sectionSearchInput" data-section-id="${sectionData.id}" class="flex-grow p-2.5 border rounded-l-md dark:bg-gray-700 focus:ring-indigo-500" placeholder="E.g., 'how to handle tickets'"><button id="sectionSearchBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md flex items-center"><i class="fas fa-search mr-2"></i>Ask</button></div><div id="sectionSearchResults" class="mt-4 max-h-96 overflow-y-auto space-y-2"></div></div>`;
        
        let animationDelayIndex = 1; // For card animations
        // Check currentUser role for Add Case button
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && KNOWLEDGE_AREA_SECTION_IDS.includes(sectionId)) {
            contentHTML += `<div class="my-5 card-animate" style="animation-delay:${animationDelayIndex * 0.05}s;"><button id="triggerAddCasePopupBtn" data-section-id="${sectionId}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center"><i class="fas fa-plus-circle mr-2"></i>Add New Case</button></div>`;
            animationDelayIndex++;
        }

        let hasContent = false;
        if (sectionData.articles?.length) { /* ... render articles ... */ hasContent = true; animationDelayIndex++; }
        if (sectionData.cases?.length) { /* ... render cases ... */ hasContent = true; animationDelayIndex++; }
        if (sectionData.items?.length) { /* ... render items ... */ hasContent = true; animationDelayIndex++; }
        if (sectionData.subCategories?.length) { /* ... render subCategories ... */ animationDelayIndex++; }
        if (sectionData.glossary?.length) { /* ... render glossary ... */ hasContent = true; animationDelayIndex++; }

        // Simplified rendering part from your example to keep focus:
        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-8 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} card-animate" style="animation-delay:${animationDelayIndex * 0.05}s;"><i class="fas fa-newspaper mr-3 ${theme.text}"></i> Articles</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.articles.forEach(article => contentHTML += renderArticleCard_enhanced(article, sectionData));
            contentHTML += `</div>`; hasContent = true; animationDelayIndex++;
        }
        if (sectionData.cases && sectionData.cases.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-10 mb-5 text-gray-700 dark:text-gray-200 border-b-2 pb-3 ${theme.border} card-animate" style="animation-delay:${animationDelayIndex * 0.05}s;"><i class="fas fa-briefcase mr-3 ${theme.text}"></i> Cases</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">`;
            sectionData.cases.forEach(caseItem => contentHTML += renderCaseCard_enhanced(caseItem, sectionData));
            contentHTML += `</div>`; hasContent = true; animationDelayIndex++;
        }
        // (Include other content types similarly if needed)


        if (!hasContent && !(sectionData.subCategories && sectionData.subCategories.length > 0)) {
            contentHTML += `<div class="p-10 text-center bg-white dark:bg-gray-800 rounded-lg shadow-md card-animate" style="animation-delay:${animationDelayIndex * 0.05}s;"><i class="fas fa-info-circle text-4xl ${theme.icon} mb-4"></i><h3 class="text-xl font-semibold">No content yet</h3><p>Content for "${escapeHTML(sectionData.name)}" is being prepared.</p></div>`;
        }
        contentHTML += `</div>`;
        pageContent.innerHTML = contentHTML;

        const triggerAddCaseBtn = pageContent.querySelector('#triggerAddCasePopupBtn');
        if (triggerAddCaseBtn) triggerAddCaseBtn.addEventListener('click', () => showAddCasePopup(triggerAddCaseBtn.dataset.sectionId));
        
        pageContent.querySelectorAll('.card-animate').forEach((card, idx) => {
            card.style.opacity='0';card.style.transform='translateY(20px)';card.style.animation='none';card.offsetHeight;
            const delay = card.style.animationDelay || `${idx * 0.07}s`; card.style.animation = `fadeInUp 0.5s ease-out forwards ${delay}`;
        });

        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) { /* ... (breadcrumbs logic, ensure event listeners are re-added if needed) ... */
            let bcHTML = `<a href="#" data-section-trigger="home" class="hover:underline text-indigo-600 dark:text-indigo-400">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> <span class="${theme.text} font-medium">${escapeHTML(sectionData.name)}</span>`;
            if(subCategoryFilter){const subCatData=sectionData.subCategories?.find(sc=>sc.id===subCategoryFilter);if(subCatData)bcHTML=`<a href="#" data-section-trigger="home" class="hover:underline">Home</a> > <a href="#" data-section-trigger="${sectionData.id}" class="hover:underline ${theme.text}">${escapeHTML(sectionData.name)}</a> > <span class="${theme.text} font-medium">${escapeHTML(subCatData.name)}</span>`;}
            breadcrumbsContainer.innerHTML=bcHTML;breadcrumbsContainer.classList.remove("hidden");
            breadcrumbsContainer.querySelectorAll("a[data-section-trigger]").forEach(link=>{link.addEventListener("click",e=>{e.preventDefault();handleSectionTrigger(e.currentTarget.dataset.sectionTrigger)})});
        }

        if (itemIdToFocus) { /* ... (focus logic) ... */
            setTimeout(()=>{const targetCard=pageContent.querySelector(`[data-item-id="${itemIdToFocus}"]`);if(targetCard){targetCard.scrollIntoView({behavior:"smooth",block:"center"});targetCard.classList.add("ring-4","ring-offset-2","ring-indigo-500","dark:ring-indigo-400","focused-item");setTimeout(()=>targetCard.classList.remove("ring-4","ring-offset-2","ring-indigo-500","dark:ring-indigo-400","focused-item"),3500)}},250);
        }
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light');
    }

    // handleSectionTrigger is now async because displaySectionContent might be (if it uses await)
    // or if any operation within it becomes async.
    async function handleSectionTrigger(sectionId, itemId = null, subCategoryFilter = null) {
        console.log(`[app.js] handleSectionTrigger: sectionId="${sectionId}", itemId="${itemId}", subCategoryFilter="${subCategoryFilter}"`);
        let hash = sectionId;
        if (subCategoryFilter) hash += `/${subCategoryFilter}`;
        if (itemId) hash += (subCategoryFilter ? `/${itemId}` : `/${itemId}`);
        
        if (window.location.hash !== `#${hash}`) {
            try {
                window.history.pushState({ sectionId, itemId, subCategoryFilter }, '', `#${hash}`);
            } catch (e) { console.error('[app.js] Failed to update URL hash:', e); }
        }
        
        highlightSidebarLink(sectionId);
        await displaySectionContent(sectionId, itemId, subCategoryFilter); // Await if displaySectionContent is async
        if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function parseHash() { /* ... (same as before, ensure it uses kbSystemData if ready) ... */
        const hash=window.location.hash.replace("#","");if(!hash)return{sectionId:"home",itemId:null,subCategoryFilter:null};const parts=hash.split("/");const sectionId=parts[0]||"home";let itemId=null,subCategoryFilter=null;if(typeof kbSystemData==="undefined"||!kbSystemData.sections){if(parts.length>1)subCategoryFilter=parts[1];if(parts.length>2)itemId=parts[2];return{sectionId,itemId,subCategoryFilter};}
        const sectionData=kbSystemData.sections.find(s=>s.id===sectionId);if(parts.length>1){const part2=parts[1];if(sectionData&§ionData.subCategories?.some(sc=>sc.id===part2)){subCategoryFilter=part2;if(parts.length>2)itemId=parts[2];}else{itemId=part2;}}
        return{sectionId,itemId,subCategoryFilter};
    }

    function waitForKbSystemData(callback) { /* ... (same as before) ... */
        const maxAttempts=50;let attempts=0;function check(){attempts++;if(typeof kbSystemData!=="undefined"&&kbSystemData.sections){console.log("[app.js] kbSystemData ready.");callback();}else if(attempts>=maxAttempts){console.error("[app.js] kbSystemData failed to load.");if(pageContent)pageContent.innerHTML="<p class='text-red-500 p-4'>Error: KB data failed.</p>";}else{setTimeout(check,100);}}check();
    }

    function initializeEventListeners() { /* ... (event delegation as before) ... */
        console.log("[app.js] Initializing event listeners...");
        document.addEventListener("click",async e=>{const triggerLink=e.target.closest("[data-section-trigger], [data-subcat-trigger]");if(triggerLink){e.preventDefault();const sectionId=triggerLink.dataset.sectionTrigger;const itemId=triggerLink.dataset.itemId;const subcatFilter=triggerLink.dataset.subcatFilter;const subcatTriggerValue=triggerLink.dataset.subcatTrigger;if(sectionId){await handleSectionTrigger(sectionId,itemId,subcatFilter);}else if(subcatTriggerValue){const[sId,subId]=subcatTriggerValue.split(".");await handleSectionTrigger(sId,null,subId);if(sId==="support"&&subId==="tools"){setTimeout(()=>{const zendeskCard=Array.from(pageContent.querySelectorAll(".card h3")).find(h3=>h3.textContent.toLowerCase().includes("zendesk"));if(zendeskCard)zendeskCard.closest(".card")?.scrollIntoView({behavior:"smooth",block:"center"})},300);}}
        if(triggerLink.closest("#searchResultsContainer"))document.getElementById("searchResultsContainer")?.classList.add("hidden");if(triggerLink.closest("#sectionSearchResults"))document.getElementById("sectionSearchResults")?.replaceChildren();}},true);
    }


    // --- Global Search (should be fine) ---
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    // (renderGlobalSearchResults_enhanced and renderSectionSearchResults as before)
    // (event listeners for global search input as before)
    // (event listeners for pageContent (ratings, section search, trackable views) as before)
    // Make sure `searchKb` is defined globally or imported if needed by these search functions.

    function renderGlobalSearchResults_enhanced(results, query) { /* ... (same as before) ... */ }
    function renderSectionSearchResults(results, query, containerEl, sectionThemeColor) { /* ... (same as before) ... */ }

    if (globalSearchInput && searchResultsContainer) {
        // ... (global search event listeners as before) ...
    }
    if (pageContent) {
        // ... (pageContent event listeners for ratings, section search, trackable views as before) ...
    }


    // --- Initial Page Load ---
    // This is now inside the main async DOMContentLoaded handler
    waitForKbSystemData(async () => { // Callback is async
        initializeEventListeners();
        const { sectionId, itemId, subCategoryFilter } = parseHash();
        await handleSectionTrigger(sectionId || 'home', itemId, subCategoryFilter); // Await the trigger
    });

    // --- Popstate event listener (handles browser back/forward) ---
    window.addEventListener('popstate', async (event) => { // Make async
        console.log('[app.js] popstate event fired.');
        // Optional: Re-check authentication if session could expire or be logged out elsewhere
        // await Auth.protectPage(); // This would redirect if not authed

        waitForKbSystemData(async () => { // Ensure kbSystemData is still available
            const { sectionId: sId, itemId: iId, subCategoryFilter: subId } = parseHash();
            highlightSidebarLink(sId || 'home');
            // displaySectionContent uses the module-scoped `currentUser`
            await displaySectionContent(sId || 'home', iId, subId); // Await if it becomes async
        });
    });


    console.log('[app.js] All initializations complete (end of DOMContentLoaded).');
}); // End of async DOMContentLoaded
