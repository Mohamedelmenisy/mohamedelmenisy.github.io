// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    // Protect page - Redirect to login if not authenticated
    if (typeof protectPage === 'function') {
        protectPage();
    } else {
        if (!Auth.isAuthenticated()) { Auth.logout(); return; }
    }

    const currentUser = Auth.getCurrentUser();
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

    if (kbSystemData && kbSystemData.meta) {
        if (kbVersionSpan) kbVersionSpan.textContent = kbSystemData.meta.version;
        if (footerKbVersionSpan) footerKbVersionSpan.textContent = kbSystemData.meta.version;
        if (lastKbUpdateSpan) lastKbUpdateSpan.textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
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
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            Auth.logout();
        });
    }

    // --- Sidebar Navigation & Content Loading ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const pageContent = document.getElementById('pageContent');
    const initialPageContent = pageContent.innerHTML; // Save initial content for home

    function highlightSidebarLink(sectionId) {
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    function renderArticleCard(article, section) {
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col transform hover:-translate-y-1 card-animate">
                <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${section.iconColorClass || 'bg-gray-100 dark:bg-gray-700'} mr-4">
                         <i class="${section.icon || 'fas fa-file-alt'} text-xl ${section.iconTextColorClass || 'text-gray-500 dark:text-gray-400'}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white">${article.title}</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${article.summary || 'No summary available.'}</p>
                ${article.tags && article.tags.length > 0 ? `
                <div class="mb-4">
                    ${article.tags.map(tag => `<span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full mr-1 mb-1 inline-block">${tag}</span>`).join('')}
                </div>` : ''}
                <div class="mt-auto flex justify-between items-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Last updated: ${article.lastUpdated}</span>
                    <a href="${article.contentPath}" target="_blank" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        Read More <i class="fas fa-arrow-right ml-1 text-xs"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function renderItemCard(item, section) { // For Forms/Templates items
        return `
            <div class="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col transform hover:-translate-y-1 card-animate">
                 <div class="flex items-center mb-3">
                    <div class="p-3 rounded-full ${section.iconColorClass || 'bg-purple-100 dark:bg-purple-900'} mr-4">
                         <i class="${section.icon || 'fas fa-file-alt'} text-xl ${section.iconTextColorClass || 'text-purple-500 dark:text-purple-400'}"></i>
                    </div>
                    <h3 class="font-semibold text-lg text-gray-800 dark:text-white">${item.title}</h3>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">${item.description || 'No description available.'}</p>
                <div class="mt-auto flex justify-between items-center">
                    <span class="text-xs bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full uppercase font-semibold">${item.type}</span>
                    <a href="${item.url}" target="_blank" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        Open <i class="fas fa-external-link-alt ml-1 text-xs"></i>
                    </a>
                </div>
            </div>
        `;
    }

    function displaySectionContent(sectionId) {
        if (sectionId === 'home') {
            pageContent.innerHTML = initialPageContent;
            if (currentSectionTitleEl) currentSectionTitleEl.textContent = "Welcome";
            if (breadcrumbsContainer) {
                breadcrumbsContainer.innerHTML = `<a href="dashboard.html" class="hover:underline">Home</a>`;
                breadcrumbsContainer.classList.remove('hidden');
            }
            // Re-apply welcome message if needed
            if (currentUser && welcomeUserName) {
                const userDisplayName = currentUser.fullName || currentUser.email;
                document.getElementById('welcomeUserName').textContent = `Welcome, ${userDisplayName}!`; // Re-find element
            }
             if (kbSystemData && kbSystemData.meta) { // re-apply meta
                document.getElementById('kbVersion').textContent = kbSystemData.meta.version;
                document.getElementById('lastKbUpdate').textContent = new Date(kbSystemData.meta.lastGlobalUpdate).toLocaleDateString();
            }
            // Re-add animation class for initial cards if they were removed
            const initialCards = pageContent.querySelectorAll('.grid > .card');
            initialCards.forEach((card, index) => {
                card.classList.add('card-animate');
                card.style.animationDelay = `${(index + 1) * 0.1}s`;
            });
            return;
        }

        const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
        if (!sectionData) {
            pageContent.innerHTML = `<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center"><h2 class="text-xl font-semibold mb-3">Section not found</h2><p>The requested section "${sectionId}" does not exist.</p></div>`;
            return;
        }

        // Basic icon color mapping (can be expanded in data.js or here)
        const sectionDisplayInfo = {
            support: { icon: 'fas fa-headset', iconColorClass: 'bg-blue-100 dark:bg-blue-900', iconTextColorClass: 'text-blue-500 dark:text-blue-400'},
            partner_care: { icon: 'fas fa-handshake', iconColorClass: 'bg-teal-100 dark:bg-teal-900', iconTextColorClass: 'text-teal-500 dark:text-teal-400'},
            forms_templates: { icon: 'fas fa-file-alt', iconColorClass: 'bg-purple-100 dark:bg-purple-900', iconTextColorClass: 'text-purple-500 dark:text-purple-400'},
            default: { icon: 'fas fa-folder', iconColorClass: 'bg-gray-100 dark:bg-gray-700', iconTextColorClass: 'text-gray-500 dark:text-gray-400'}
        };
        const displayInfo = sectionDisplayInfo[sectionId] || sectionDisplayInfo.default;


        let contentHTML = `<div class="space-y-8">`;
        contentHTML += `<div class="flex justify-between items-center">
                          <h2 class="text-3xl font-bold text-gray-800 dark:text-white">${sectionData.name}</h2>
                          <div>
                            <!-- Add any section-specific actions here, e.g. "Add new article" -->
                          </div>
                        </div>`;
        contentHTML += `<p class="text-gray-600 dark:text-gray-300 mt-1 mb-6">${sectionData.description}</p>`;


        if (sectionData.articles && sectionData.articles.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2 border-gray-300 dark:border-gray-600">Articles</h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">`;
            sectionData.articles.forEach(article => {
                contentHTML += renderArticleCard(article, displayInfo);
            });
            contentHTML += `</div>`;
        }

        if (sectionData.items && sectionData.items.length > 0) { // For Forms/Templates
            contentHTML += `<h3 class="text-2xl font-semibold mt-8 mb-4 text-gray-700 dark:text-gray-200 border-b pb-2 border-gray-300 dark:border-gray-600">Available ${sectionData.name}</h3>`;
            contentHTML += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">`;
            sectionData.items.forEach(item => {
                contentHTML += renderItemCard(item, displayInfo);
            });
            contentHTML += `</div>`;
        }
        
        if (sectionData.subCategories && sectionData.subCategories.length > 0) {
            contentHTML += `<h3 class="text-2xl font-semibold mt-8 mb-4 text-gray-700 dark:text-gray-200 border-b pb-2 border-gray-300 dark:border-gray-600">Sub-Categories</h3>`;
            contentHTML += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">`;
            sectionData.subCategories.forEach(subCat => {
                 contentHTML += `
                    <a href="#" data-section="${sectionId}" data-subcategory="${subCat.id}" class="sub-category-link bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-center card-animate">
                        <i class="fas fa-folder-open text-2xl mb-2 ${displayInfo.iconTextColorClass || 'text-indigo-500'}"></i>
                        <h4 class="font-medium text-gray-700 dark:text-gray-200">${subCat.name}</h4>
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
                        <strong class="text-indigo-600 dark:text-indigo-400">${entry.term}:</strong> ${entry.definition}
                    </div>
                `;
            });
            contentHTML += `</div>`;
        }

        if (!sectionData.articles?.length && !sectionData.items?.length && !sectionData.subCategories?.length && !sectionData.glossary?.length) {
            contentHTML += `<div class="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg text-center card-animate">
                                <i class="fas fa-info-circle text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                                <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200">No content yet</h3>
                                <p class="text-gray-500 dark:text-gray-400">Content for the "${sectionData.name}" section is being prepared. Please check back later.</p>
                            </div>`;
        }

        contentHTML += `</div>`; // End of space-y-8
        pageContent.innerHTML = contentHTML;

        // Apply staggered animations to newly loaded cards
        const newCards = pageContent.querySelectorAll('.card-animate');
        newCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`; // Faster staggering for content lists
        });


        if (currentSectionTitleEl) currentSectionTitleEl.textContent = sectionData.name;
        if (breadcrumbsContainer) {
            breadcrumbsContainer.innerHTML = `<a href="#" data-section-trigger="home" class="quick-link-button hover:underline">Home</a> <span class="mx-1 text-gray-400 dark:text-gray-500">></span> ${sectionData.name}`;
            breadcrumbsContainer.classList.remove('hidden');
             // Add event listeners for new breadcrumb home link
            breadcrumbsContainer.querySelector('[data-section-trigger="home"]').addEventListener('click', (e) => {
                e.preventDefault();
                handleSectionTrigger('home');
            });
        }
    }

    function handleSectionTrigger(sectionId) {
        highlightSidebarLink(sectionId);
        displaySectionContent(sectionId);
        // Update URL hash (optional, for deep linking)
        // window.location.hash = sectionId;
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            if (sectionId) {
                handleSectionTrigger(sectionId);
            }
        });
    });

    // Handle quick link clicks (e.g., from homepage cards)
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('[data-section-trigger]');
        if (target) {
            e.preventDefault();
            const sectionId = target.dataset.sectionTrigger;
            handleSectionTrigger(sectionId);
        }
        // TODO: Handle data-subcat-trigger if needed for more specific links
    });

    // Initial load (e.g., from hash or default to home)
    // For now, default to home view which is already in HTML.
    // If you want to load a specific section from hash:
    // const initialSection = window.location.hash.substring(1) || 'home';
    // handleSectionTrigger(initialSection);
    // For now, just ensure home is active if no other section is loaded via other means
    if (!window.location.hash) {
         highlightSidebarLink('home'); // Highlight home link by default
    }


    // --- Global Search Functionality ---
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    let searchDebounceTimer;

    if (globalSearchInput && searchResultsContainer) {
        globalSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const query = globalSearchInput.value.trim();
                if (query.length > 1) {
                    const results = searchKb(query); // searchKb is from data.js
                    renderSearchResults(results, query);
                } else {
                    searchResultsContainer.innerHTML = '';
                    searchResultsContainer.classList.add('hidden');
                }
            }, 300); // Debounce search
        });

        // Hide search results when clicking outside
        document.addEventListener('click', (event) => {
            if (!globalSearchInput.contains(event.target) && !searchResultsContainer.contains(event.target)) {
                searchResultsContainer.classList.add('hidden');
            }
        });
         // Show on focus if there's text
        globalSearchInput.addEventListener('focus', () => {
            if (globalSearchInput.value.trim().length > 1 && searchResultsContainer.children.length > 0) {
                searchResultsContainer.classList.remove('hidden');
            }
        });
    }

    function renderSearchResults(results, query) {
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<div class="p-3 text-sm text-gray-500 dark:text-gray-400">No results found for "${escapeHTML(query)}".</div>`;
            searchResultsContainer.classList.remove('hidden');
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-gray-200 dark:divide-gray-700';

        results.slice(0, 10).forEach(result => { // Show top 10 results
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${result.sectionId}/${result.id}`; // Potential link structure
            a.className = 'block p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                handleSectionTrigger(result.sectionId);
                // TODO: Scroll to or highlight specific article if possible after section load
                searchResultsContainer.classList.add('hidden');
                globalSearchInput.value = ''; // Clear search input
            });

            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-semibold text-gray-800 dark:text-gray-100';
            titleDiv.innerHTML = highlightText(result.title, query);

            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'text-xs text-gray-500 dark:text-gray-400 mt-0.5';
            summaryDiv.innerHTML = result.summary ? highlightText(truncateText(result.summary, 100), query) : '';
            
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'text-xs text-indigo-500 dark:text-indigo-400 mt-1';
            sectionDiv.textContent = `Section: ${result.sectionName}`;

            a.appendChild(titleDiv);
            if (result.summary) a.appendChild(summaryDiv);
            a.appendChild(sectionDiv);
            li.appendChild(a);
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
        searchResultsContainer.classList.remove('hidden');
    }

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function (match) {
            return {
                '&': '&',
                '<': '<',
                '>': '>',
                '"': '"',
                "'": '''
            }[match];
        });
    }

    function highlightText(text, query) {
        if (!query) return escapeHTML(text);
        const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escape regex special chars
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return escapeHTML(text).replace(regex, '<mark>$1</mark>');
    }
    
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // TODO: "Ask a Question" functionality can be added later.
});
