// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('[app.js - YOUR VERSION BASE] DOMContentLoaded fired.');

    // Protect page - Redirect to login if not authenticated
    if (typeof protectPage === 'function') {
        console.log('[app.js - YOUR VERSION BASE] Calling protectPage().');
        protectPage();
    } else {
        console.warn('[app.js - YOUR VERSION BASE] protectPage function not found. Checking Auth object.');
        // Fallback or check for Auth object directly if protectPage is not global
        if (typeof Auth !== 'undefined' && Auth.isAuthenticated) {
            if (!Auth.isAuthenticated()) {
                console.log('[app.js - YOUR VERSION BASE] Auth.isAuthenticated is false, calling Auth.logout().');
                Auth.logout();
                return; // Stop further execution
            }
            console.log('[app.js - YOUR VERSION BASE] User is authenticated via Auth object.');
        } else {
            console.error("[app.js - YOUR VERSION BASE] CRITICAL: Authentication mechanism (protectPage or Auth object) not found.");
        }
    }

    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    console.log('[app.js - YOUR VERSION BASE] Current user:', currentUser);

    const userNameDisplay = document.getElementById('userNameDisplay');
    const welcomeUserName = document.getElementById('welcomeUserName');
    const kbVersionSpan = document.getElementById('kbVersion');
    const lastKbUpdateSpan = document.getElementById('lastKbUpdate');
    const footerKbVersionSpan = document.getElementById('footerKbVersion');


    if (currentUser) {
        const userDisplayName = currentUser.fullName || currentUser.email;
        if (userNameDisplay) userNameDisplay.textContent = userDisplayName;
        if (welcomeUserName) welcomeUserName.textContent = `Welcome, ${userDisplayName}!`;
    }

    if (typeof kbSystemData !== 'undefined' && kbSystemData.meta) { // Check kbSystemData before accessing meta
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
    } else {
        console.warn('[app.js - YOUR VERSION BASE] kbSystemData or kbSystemData.meta is not available on initial load for version info.');
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
        // Ensure mark styles are updated (from your dash.html)
        const isDark = htmlElement.classList.contains('dark');
        document.querySelectorAll('#searchResultsContainer mark').forEach(mark => {
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
    if (logoutButton && typeof Auth !== 'undefined' && Auth.logout) { // Added Auth check
        logoutButton.addEventListener('click', () => {
            Auth.logout();
        });
    }

    // --- Sidebar Navigation & Content Loading ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');
    
    // Ensure pageContent exists before trying to get its innerHTML
    const initialPageContent = pageContent ? pageContent.innerHTML : "<p>Error: pageContent missing.</p>"; 

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    // These render functions are from YOUR FILE
    function renderArticleCard(article, section) {
        // Determine icon and color classes based on section (passed as 'section' which is 'displayInfo' in your file)
        const iconClass = section.icon || 'fas fa-file-alt';
        const iconContainerClass = section.iconColorClass || 'bg-gray-100 dark:bg-gray-700';
        const iconTextColor = section.iconTextColorClass || 'text-gray-500 dark:text-gray-400';

        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col transform hover:-translate-y-1 card-animate">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${iconContainerClass} mr-4">
                         <i class="${iconClass} text-xl ${iconTextColor}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white">${escapeHTML(article.title)}</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${escapeHTML(article.summary || 'No summary available.')}</p>
                ${article.tags && article.tags.length > 0 ? `
                <div class="mb-4">
                    ${article.tags.map(tag => `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full mr-1 mb-1 inline-block">${escapeHTML(tag)}</span>`).join('')}
                </div>` : ''}
                <div class="mt-auto flex justify-between items-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Last updated: ${escapeHTML(article.lastUpdated)}</span>
                    <a href="${article.contentPath}" target="_blank" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        Read More <i class="fas fa-arrow-right ml-1 text-xs"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function renderItemCard(item, section) { // For Forms/Templates items - FROM YOUR FILE
        const iconClass = section.icon || 'fas fa-file-alt';
        const iconContainerClass = section.iconColorClass || 'bg-purple-100 dark:bg-purple-900'; // Specific to forms/templates in your original
        const iconTextColor = section.iconTextColorClass || 'text-purple-500 dark:text-purple-400';
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col transform hover:-translate-y-1 card-animate">
                 <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${iconContainerClass} mr-4">
                         <i class="${iconClass} text-xl ${iconTextColor}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white">${escapeHTML(item.title)}</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${escapeHTML(item.description || 'No description available.')}</p>
                <div class="mt-auto flex justify-between items-center">
                    <span class="text-xs bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full uppercase font-semibold">${escapeHTML(item.type)}</span>
                    <a href="${item.url}" target="_blank" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        Open <i class="fas fa-external-link-alt ml-1 text-xs"></i>
                    </a>
                </div>
            </div>
        `;
    }

    // This is the displaySectionContent from YOUR FILE
    function displaySectionContent(sectionId) {
        console.log(`[app.js - YOUR VERSION BASE] displaySectionContent CALLED for sectionId: "${sectionId}"`);
        if (!pageContent) {
            console.error("[app.js - YOUR VERSION BASE] pageContent is NULL in displaySectionContent. Cannot render.");
            return;
        }
        if (typeof kbSystemData === 'undefined' || !kbSystemData.sections) {
            console.error("[app.js - YOUR VERSION BASE] kbSystemData or kbSystemData.sections is UNDEFINED in displaySectionContent.");
            pageContent.innerHTML = "<p>Error: Knowledge base data is missing or not loaded correctly.</p>";
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Data Error";
            return;
        }


        if (sectionId === 'home') {
            pageContent.innerHTML = initialPageContent;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Welcome";
            if (breadcrumbsContainer) {
                // YOUR FILE used dashboard.html, if using JS nav, it should be # or trigger
                breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="hover:underline">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            // Re-apply welcome message if needed (element might be part of initialPageContent)
            const welcomeUserEl = document.getElementById('welcomeUserName'); // Re-find
            if (currentUser && welcomeUserEl) {
                const userDisplayName = currentUser.fullName || currentUser.email;
                welcomeUserEl.textContent = `Welcome, ${userDisplayName}!`; 
            }
            const kbVersionEl = document.getElementById('kbVersion'); // Re-find
            const lastKbUpdateEl = document.getElementById('lastKbUpdate'); // Re-find
            if (kbSystemData && kbSystemData.meta) { 
                if (kbVersionEl) kbVersionEl.textContent = kbSystemData.meta.version;
                if (lastKbUpdateEl) lastKbUpdateEl.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }
            // Re-add animation class for initial cards
            const initialCards = pageContent.querySelectorAll('.grid > .card'); // Your selector
            initialCards.forEach((card, index) => {
                card.classList.add('card-animate'); // Ensure class is present
                card.style.animationDelay = `${(index + 1) * 0.1}s`;
            });
            console.log(`[app.js - YOUR VERSION BASE] Rendered 'home' section.`);
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            console.warn(`[app.js - YOUR VERSION BASE] Section data NOT FOUND for: "${sectionId}"`);
            pageContent.innerHTML = `<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center"><h2 class="text-xl font-semibold mb-3">Section not found</h2><p>The requested section "${escapeHTML(sectionId)}" does not exist.</p></div>`;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Not Found";
            return;
        }
        console.log(`[app.js - YOUR VERSION BASE] Found sectionData for "${sectionId}". Preparing HTML.`);

        // Basic icon color mapping (FROM YOUR FILE)
        const sectionDisplayInfo = {
            support: { icon: 'fas fa-headset', iconColorClass: 'bg-blue-100 dark:bg-blue-900', iconTextColorClass: 'text-blue-500 dark:text-blue-400'},
            partner_care: { icon: 'fas fa-handshake', iconColorClass: 'bg-teal-100 dark:bg-teal-900', iconTextColorClass: 'text-teal-500 dark:text-teal-400'},
            forms_templates: { icon: 'fas fa-file-alt', iconColorClass: 'bg-purple-100 dark:bg-purple-900', iconTextColorClass: 'text-purple-500 dark:text-purple-400'},
            default: { icon: 'fas fa-folder', iconColorClass: 'bg-gray-100 dark:bg-gray-700', iconTextColorClass: 'text-gray-500 dark:text-gray-400'}
        };
        // In YOUR FILE, 'displayInfo' was passed to render functions.
        // We'll use sectionData directly, and render functions will use sectionData.themeColor (added to data.js) and getThemeColors.
        // For the old way, 'displayInfo' would be:
        const displayInfoForOldRender = sectionDisplayInfo[sectionId] || sectionDisplayInfo.default;
        // IMPORTANT: If your old renderArticleCard expected 'displayInfo' for main icon, it might differ now.
        // The newer render functions use sectionData.icon (from data.js) and sectionData.themeColor (from data.js) via getThemeColors.

        let contentHTML = `<div class="space-y-8">`;
        contentHTML += `<div class="flex justify-between items-center">
                          <h2 class="text-3xl font-bold text-gray-800 dark:text-white">${escapeHTML(sectionData.name)}</h2>
                          <div></div>
                        </div>`;
        contentHTML += `<p class="text-gray-600 dark:text-gray-300 mt-1 mb-6">${escapeHTML(sectionData.description)}</p>`;

        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2 border-gray-300 dark:border-gray-600">Articles</h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">`;
            sectionData.articles.forEach(article => {
                // Use the renderArticleCard from YOUR FILE's logic, passing displayInfoForOldRender
                contentHTML += renderArticleCard(article, displayInfoForOldRender); 
            });
            contentHTML += `</div>`;
        }

        if (sectionData.items && sectionData.items.length > 0) { 
            contentHTML += `<h3 class="text-2xl font-semibold mt-8 mb-4 text-gray-700 dark:text-gray-200 border-b pb-2 border-gray-300 dark:border-gray-600">Available ${escapeHTML(sectionData.name)}</h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">`;
            sectionData.items.forEach(item => {
                // Use the renderItemCard from YOUR FILE's logic
                contentHTML += renderItemCard(item, displayInfoForOldRender); 
            });
            contentHTML += `</div>`;
        }
        
        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-8 mb-4 text-gray-700 dark:text-gray-200 border-b pb-2 border-gray-300 dark:border-gray-600">Sub-Categories</h3>`;
            contentHTML += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">`;
            sectionData.subCategories.forEach(subCat => {
                 contentHTML += `
                    <a href="#" data-section="${sectionId}" data-subcategory="${subCat.id}" class="sub-category-link bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-center card-animate">
                        <i class="fas fa-folder-open text-2xl mb-2 ${displayInfoForOldRender.iconTextColorClass || 'text-indigo-500'}"></i>
                        <h4 class="font-medium text-gray-700 dark:text-gray-200">${escapeHTML(subCat.name)}</h4>
                    </a>`;
            });
            contentHTML += `</div>`;
        }

        if (sectionData.glossary && sectionData.glossary.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-8 mb-4 text-gray-700 dark:text-gray-200 border-b pb-2 border-gray-300 dark:border-gray-600">Glossary</h3>`;
            contentHTML += `<div class="space-y-3">`;
            sectionData.glossary.forEach(entry => {
                contentHTML += `
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow card-animate">
                        <strong class="text-indigo-600 dark:text-indigo-400">${escapeHTML(entry.term)}:</strong> ${escapeHTML(entry.definition)}
                    </div>
                `;
            });
            contentHTML += `</div>`;
        }

        if (!sectionData.articles?.length && !sectionData.items?.length && !sectionData.subCategories?.length && !sectionData.glossary?.length) {
            contentHTML += `<div class="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg text-center card-animate">
                                <i class="fas fa-info-circle text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                                <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200">No content yet</h3>
                                <p class="text-gray-500 dark:text-gray-400">Content for the "${escapeHTML(sectionData.name)}" section is being prepared. Please check back later.</p>
                            </div>`;
        }

        contentHTML += `</div>`; 
        
        try {
            pageContent.innerHTML = contentHTML;
            console.log(`[app.js - YOUR VERSION BASE] Successfully set innerHTML for section "${sectionId}".`);
        } catch (e) {
            console.error(`[app.js - YOUR VERSION BASE] Error setting innerHTML for section "${sectionId}":`, e);
            pageContent.innerHTML = `<p>Error rendering content.</p>`;
        }


        const newCards = pageContent.querySelectorAll('.card-animate');
        newCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`; 
        });


        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            // Breadcrumb home link needs to trigger JS nav
            breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="quick-link-button hover:underline">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> ${escapeHTML(sectionData.name)}`;
            breadcrumbsContainer.classList.remove('hidden');
            const homeBreadcrumbLink = breadcrumbsContainer.querySelector('[data-section-trigger="home"]');
            if (homeBreadcrumbLink) { 
                homeBreadcrumbLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleSectionTrigger('home');
                });
            }
        }
    }

    // This is the handleSectionTrigger from YOUR FILE
    function handleSectionTrigger(sectionId) {
        console.log(`[app.js - YOUR VERSION BASE] handleSectionTrigger CALLED for sectionId: "${sectionId}"`);
        if (typeof kbSystemData === 'undefined') { // Added safety check
            console.error("[app.js - YOUR VERSION BASE] kbSystemData is undefined in handleSectionTrigger!");
            return;
        }
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId);
        // window.location.hash = sectionId; // YOUR FILE HAD THIS COMMENTED OUT - KEEPING IT COMMENTED
    }

    // This is the sidebarLinks loop from YOUR FILE
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // YOUR FILE HAD THIS
            const sectionId = this.dataset.section;
            console.log(`[app.js - YOUR VERSION BASE] Sidebar link clicked, data-section: "${sectionId}"`);
            if (sectionId) {
                handleSectionTrigger(sectionId);
            } else {
                console.warn('[app.js - YOUR VERSION BASE] Clicked sidebar link has no data-section attribute.');
            }
        });
    });

    // This is the body click listener from YOUR FILE
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('[data-section-trigger]');
        if (target) {
            e.preventDefault(); // YOUR FILE HAD THIS
            const sectionId = target.dataset.sectionTrigger;
            console.log(`[app.js - YOUR VERSION BASE] Body click data-section-trigger: "${sectionId}"`);
            handleSectionTrigger(sectionId);
        }
        // TODO: Handle data-subcat-trigger if needed (YOUR FILE HAD THIS TODO)
        // For now, to integrate "Support Tools" link on home page from dash.html:
        const homeSubcatTrigger = e.target.closest('[data-subcat-trigger]');
        if (homeSubcatTrigger && pageContent.querySelector('#welcomeUserName')) { // Check if on home page
             e.preventDefault();
             const triggerValue = homeSubcatTrigger.dataset.subcatTrigger; // e.g., "support.tools"
             if (triggerValue && triggerValue.includes('.')) {
                const [sectionId, subId] = triggerValue.split('.');
                // In this simplified model, we don't have subCategory filtering in displaySectionContent by default.
                // So, just load the main section.
                handleSectionTrigger(sectionId); 
                // If you want to scroll to a specific article (like Zendesk):
                if (sectionId === 'support' && subId === 'tools') {
                     setTimeout(() => {
                        const zendeskArticleCard = Array.from(pageContent.querySelectorAll('.card h3')).find(h3 => h3.textContent.toLowerCase().includes('zendesk'));
                        if (zendeskArticleCard) {
                            const cardElement = zendeskArticleCard.closest('.card');
                            if (cardElement) {
                                cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Add a temporary highlight if desired
                                cardElement.style.outline = '2px solid blue';
                                setTimeout(() => { cardElement.style.outline = ''; }, 2500);
                            }
                        }
                    }, 300); // Delay for content to render
                }
             }
        }
    });

    // Initial load (FROM YOUR FILE)
    if (!window.location.hash) { // Your file checked this for initial highlight
         highlightSidebarLink('home'); 
    }
    // Ensure home content is loaded if nothing else specified.
    // Since your old file didn't explicitly call handleSectionTrigger('home') here,
    // it relied on the initial HTML in pageContent.
    // To be safe, if you want JS to always render 'home' initially:
    console.log("[app.js - YOUR VERSION BASE] Triggering 'home' section load on initial page setup.");
    handleSectionTrigger('home');


    // --- Global Search Functionality (FROM YOUR FILE) ---
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    let searchDebounceTimer;

    if (globalSearchInput && searchResultsContainer) {
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length > 1 && typeof searchKb === 'function') { // check searchKb
                    const results = searchKb(query); 
                    renderGlobalSearchResults(results, query); // Changed from renderSearchResults
                } else {
                    searchResultsContainer.innerHTML = '';
                    searchResultsContainer.classList.add('hidden');
                }
            }, 300); 
        });

        document.addEventListener('click', (event) => {
            if (globalSearchInput && searchResultsContainer && // Added null checks
                !globalSearchInput.contains(event.target) && 
                !searchResultsContainer.contains(event.target)) {
                searchResultsContainer.classList.add('hidden');
            }
        });
        globalSearchInput.addEventListener('focus', () => {
            if (globalSearchInput.value.trim().length > 1 && searchResultsContainer.children.length > 0) {
                searchResultsContainer.classList.remove('hidden');
            }
        });
    }

    // Renamed to avoid conflict if you had a renderSearchResults elsewhere in original.
    // This is the renderSearchResults from YOUR FILE, adapted slightly.
    function renderGlobalSearchResults(results, query) {
        if (!searchResultsContainer) return; // Added safety check
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<div class="p-3 text-sm text-gray-500 dark:text-gray-400">No results found for "${escapeHTML(query)}".</div>`;
            searchResultsContainer.classList.remove('hidden');
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-gray-200 dark:divide-gray-700';

        results.slice(0, 10).forEach(result => { 
            const li = document.createElement('li');
            const a = document.createElement('a');
            // YOUR FILE's link structure for search results
            a.href = `#${result.sectionId}/${result.id}`; // This implies hash usage, but nav is not hash-based.
            // For consistency with non-hash nav, make search results also trigger JS nav:
            a.href = `javascript:void(0);`; // Prevent hash change
            a.dataset.sectionTrigger = result.sectionId;
            if (result.type === 'article' || result.type === 'item' || result.type === 'case') {
                a.dataset.itemId = result.id; // To potentially focus the item
            }
            // Class to identify these links for the body click listener
            a.className = 'block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors global-search-result-link'; 
            
            // The body click listener for 'data-section-trigger' will handle this.
            // It will also need to hide searchResultsContainer and clear globalSearchInput.

            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-semibold text-gray-800 dark:text-gray-100';
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 100), query) : '';
            
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'text-xs text-indigo-500 dark:text-indigo-400 mt-1';
            sectionDiv.textContent = `Section: ${escapeHTML(result.sectionName || "Unknown")}`;

            a.appendChild(titleDiv);
            if (result.summary) a.appendChild(summaryDiv);
            a.appendChild(sectionDiv);
            li.appendChild(a);
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
        searchResultsContainer.classList.remove('hidden');
        applyTheme(htmlElement.classList.contains('dark') ? 'dark' : 'light'); // Ensure mark styles
    }
    
    console.log('[app.js - YOUR VERSION BASE] All initializations complete.');
});
