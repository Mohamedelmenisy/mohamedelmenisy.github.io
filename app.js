// js/app.js
document.addEventListener('DOMContentLoaded', () => {
    const sidebarNav = document.getElementById('navigationMenu');
    const contentArea = document.getElementById('contentArea');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const searchInput = document.getElementById('searchInput');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');

    // --- State ---
    let currentArticleId = null;
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedKB')) || [];

    // --- Initial Setup ---
    function init() {
        renderSidebar();
        // Load default or first article, or a welcome message
        // For now, let's load the "Initial Support Call Flow" by default if it exists
        const defaultArticle = kbData.articles.find(article => article.id === 'sup001');
        if (defaultArticle) {
            renderArticle(defaultArticle.id);
        } else if (kbData.categories.length > 0 && kbData.articles.filter(a => a.categoryId === kbData.categories[0].id).length > 0) {
            // Fallback: Load first article of first category
            const firstArticleOfFirstCategory = kbData.articles.find(a => a.categoryId === kbData.categories[0].id);
            if (firstArticleOfFirstCategory) renderArticle(firstArticleOfFirstCategory.id);
        } else {
            renderWelcomeMessage();
        }
        // renderRecentlyViewed(); // Optional
        searchInput.addEventListener('input', handleSearch);
    }

    // --- Rendering Functions ---
    function renderSidebar() {
        sidebarNav.innerHTML = ''; // Clear existing items
        kbData.categories.forEach(category => {
            const categoryArticles = kbData.articles.filter(article => article.categoryId === category.id);
            if (categoryArticles.length === 0 && category.id !== 'search_results') return; // Don't show empty categories unless it's search

            const categoryLink = document.createElement('a');
            categoryLink.href = '#';
            categoryLink.dataset.categoryId = category.id;
            categoryLink.className = 'block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white';
            categoryLink.innerHTML = `<i class="${category.icon || 'fas fa-folder'} mr-3"></i>${category.name}`;

            categoryLink.addEventListener('click', (e) => {
                e.preventDefault();
                // For now, clicking a category might show the first article in it or a category overview
                const articlesInCategory = kbData.articles.filter(art => art.categoryId === category.id);
                if (articlesInCategory.length > 0) {
                    renderArticle(articlesInCategory[0].id);
                } else {
                    currentCategoryTitle.textContent = category.name;
                    contentArea.innerHTML = `<p class="text-gray-600">No articles found in ${category.name}.</p>`;
                    updateBreadcrumbs(null, category.name);
                }
                // Deselect other active links, select this one
                document.querySelectorAll('#navigationMenu a, #navigationMenu button').forEach(el => el.classList.remove('bg-gray-700', 'text-white'));
                categoryLink.classList.add('bg-gray-700', 'text-white');

            });
            sidebarNav.appendChild(categoryLink);

            // Optional: Sub-list for articles under each category
            const articleList = document.createElement('ul');
            articleList.className = 'ml-4 mt-1 space-y-1'; // Indent and style
            categoryArticles.forEach(article => {
                const articleItem = document.createElement('li');
                const articleLink = document.createElement('a');
                articleLink.href = '#';
                articleLink.dataset.articleId = article.id;
                articleLink.textContent = article.title;
                articleLink.className = 'block py-1 px-2 text-sm text-gray-300 rounded hover:bg-gray-600 hover:text-white';
                articleLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    renderArticle(article.id);
                     // Deselect other active links, select this one
                    document.querySelectorAll('#navigationMenu a, #navigationMenu button').forEach(el => el.classList.remove('bg-gray-700', 'text-white'));
                    categoryLink.classList.add('bg-gray-700', 'text-white'); // Highlight parent category
                    articleLink.classList.add('bg-gray-600', 'text-white'); // Highlight specific article
                });
                articleItem.appendChild(articleLink);
                articleList.appendChild(articleItem);
            });
            if (categoryArticles.length > 0) {
                 sidebarNav.appendChild(articleList);
            }
        });
    }

    function renderArticle(articleId) {
        const article = kbData.articles.find(art => art.id === articleId);
        if (!article) {
            contentArea.innerHTML = `<p class="text-red-500">Error: Article not found.</p>`;
            currentCategoryTitle.textContent = "Error";
            updateBreadcrumbs(null, "Error");
            return;
        }

        currentArticleId = articleId;
        const category = kbData.categories.find(cat => cat.id === article.categoryId);
        currentCategoryTitle.textContent = article.title;
        updateBreadcrumbs(article, category ? category.name : "Article");

        let html = `<div class="prose max-w-none">`; // Using Tailwind Typography plugin for nice text styling
        html += `<h2 class="text-2xl font-semibold mb-1 text-gray-700">${article.title}</h2>`;
        html += `<p class="text-xs text-gray-500 mb-4">Last updated: ${article.lastUpdated || 'N/A'}${article.tags ? ' | Tags: ' + article.tags.join(', ') : ''}</p>`;

        if (article.content) {
            html += `<div class="mb-6">${article.content}</div>`;
        }

        if (article.checklist && article.checklist.length > 0) {
            html += `<h3 class="text-xl font-semibold text-gray-700 mb-3 mt-6">Procedure / Checklist:</h3>`;
            html += `<ul class="space-y-3">`;
            article.checklist.forEach((item, index) => {
                html += `
                    <li class="flex items-start p-3 bg-gray-50 rounded-md border border-gray-200 hover:shadow-md transition-shadow">
                        <input type="checkbox" id="chk-${article.id}-${index}" data-article-id="${article.id}" data-step-index="${index}" class="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1 mr-3 flex-shrink-0" ${item.completed ? 'checked' : ''}>
                        <label for="chk-${article.id}-${index}" class="flex-grow text-gray-800 ${item.completed ? 'line-through text-gray-500' : ''}">${item.text}</label>
                        ${item.link ? `<a href="${item.link}" target="_blank" class="ml-3 text-blue-500 hover:underline text-sm flex-shrink-0"><i class="fas fa-external-link-alt mr-1"></i>Link</a>` : ''}
                        ${item.internal_tool ? `<a href="${item.internal_tool}" target="_blank" class="ml-3 text-indigo-500 hover:underline text-sm flex-shrink-0"><i class="fas fa-tools mr-1"></i>Tool</a>` : ''}
                        ${item.escalation_procedure ? `<a href="#" data-goto-article-id="${item.escalation_procedure}" class="goto-article-link ml-3 text-purple-500 hover:underline text-sm flex-shrink-0"><i class="fas fa-level-up-alt mr-1"></i>Escalate</a>` : ''}
                    </li>
                `;
            });
            html += `</ul>`;
        }

        if (article.importantNotes && article.importantNotes.length > 0) {
            html += `<div class="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">`;
            html += `<h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-exclamation-triangle mr-2"></i>Important Notes:</h4>`;
            html += `<ul class="list-disc list-inside text-yellow-700 space-y-1">`;
            article.importantNotes.forEach(note => {
                html += `<li>${note}</li>`;
            });
            html += `</ul></div>`;
        }

        if (article.commonMistakes && article.commonMistakes.length > 0) {
            html += `<div class="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">`;
            html += `<h4 class="font-semibold text-red-800 mb-2"><i class="fas fa-times-circle mr-2"></i>Common Mistakes to Avoid:</h4>`;
            html += `<ul class="list-disc list-inside text-red-700 space-y-1">`;
            article.commonMistakes.forEach(mistake => {
                html += `<li>${mistake}</li>`;
            });
            html += `</ul></div>`;
        }
         if (article.relatedArticles && article.relatedArticles.length > 0) {
            html += `<div class="mt-6 pt-4 border-t border-gray-200">`;
            html += `<h4 class="font-semibold text-gray-700 mb-2"><i class="fas fa-link mr-2"></i>Related Articles:</h4>`;
            html += `<ul class="list-none space-y-1">`;
            article.relatedArticles.forEach(relatedId => {
                const related = kbData.articles.find(a => a.id === relatedId);
                if(related) {
                     html += `<li><a href="#" data-goto-article-id="${related.id}" class="goto-article-link text-blue-600 hover:underline">${related.title}</a></li>`;
                }
            });
            html += `</ul></div>`;
        }

        html += `</div>`; // End prose
        contentArea.innerHTML = html;

        // Add event listeners for checkboxes and internal links
        contentArea.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', handleChecklistChange);
        });
        contentArea.querySelectorAll('.goto-article-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetArticleId = e.currentTarget.dataset.gotoArticleId;
                if(targetArticleId) renderArticle(targetArticleId);
            });
        });

        // addToRecentlyViewed(articleId); // Optional
    }

    function renderWelcomeMessage() {
        currentCategoryTitle.textContent = "Welcome";
        updateBreadcrumbs(null, "Home");
        contentArea.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-book-open text-6xl text-blue-500 mb-4"></i>
                <h2 class="text-4xl font-bold text-gray-800 mb-3">Welcome to the Knowledge Base</h2>
                <p class="text-lg text-gray-600">Select a category from the sidebar to browse articles, or use the search bar to find specific information.</p>
                <p class="text-sm text-gray-500 mt-6">This system is designed to help you quickly find procedures, troubleshooting steps, and other important information.</p>
            </div>
        `;
    }

    function updateBreadcrumbs(article, categoryName) {
        breadcrumbsContainer.innerHTML = `<a href="#" id="homeBreadcrumb" class="text-blue-600 hover:underline">Home</a>`;
        const homeBreadcrumb = document.getElementById('homeBreadcrumb');
        homeBreadcrumb.addEventListener('click', (e) => {
            e.preventDefault();
            renderWelcomeMessage();
            // Optionally clear active sidebar item
            document.querySelectorAll('#navigationMenu a, #navigationMenu button').forEach(el => el.classList.remove('bg-gray-700', 'text-white'));
        });

        if (categoryName) {
            breadcrumbsContainer.innerHTML += ` <span class="text-gray-400 mx-1">></span> <span id="breadcrumbCategory">${categoryName}</span>`;
        }
        if (article) {
             // If categoryName was not provided but article has categoryId
            if (!categoryName && article.categoryId) {
                const cat = kbData.categories.find(c => c.id === article.categoryId);
                if (cat) {
                    breadcrumbsContainer.innerHTML += ` <span class="text-gray-400 mx-1">></span> <span id="breadcrumbCategory">${cat.name}</span>`;
                }
            }
            breadcrumbsContainer.innerHTML += ` <span class="text-gray-400 mx-1">></span> <span class="text-gray-700 font-medium" id="breadcrumbCurrent">${article.title}</span>`;
        }
    }

    // --- Event Handlers ---
    function handleChecklistChange(event) {
        const checkbox = event.target;
        const articleId = checkbox.dataset.articleId;
        const stepIndex = parseInt(checkbox.dataset.stepIndex);
        const article = kbData.articles.find(art => art.id === articleId);

        if (article && article.checklist && article.checklist[stepIndex] !== undefined) {
            article.checklist[stepIndex].completed = checkbox.checked;
            // Optionally, re-render the article or just update the label style
            const label = checkbox.nextElementSibling;
            if (label) {
                label.classList.toggle('line-through', checkbox.checked);
                label.classList.toggle('text-gray-500', checkbox.checked);
            }
            // console.log(`Article ${articleId}, Step ${stepIndex} status: ${checkbox.checked}`);
            // Here you could also save the state to localStorage if persistence across sessions is needed for checklists
        }
    }

    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (query.length < 2 && query.length !== 0) { // Minimum 2 chars to search, or empty to clear
            if (currentArticleId) renderArticle(currentArticleId); // Re-render current if search cleared
            else renderWelcomeMessage();
            // Maybe remove search results category from sidebar if it exists
            const searchResultsCategoryEl = document.querySelector('[data-category-id="search_results"]');
            if (searchResultsCategoryEl) searchResultsCategoryEl.parentElement.remove(); // Remove the li if article is in li
            return;
        }
        if(query.length === 0) {
             if (currentArticleId) renderArticle(currentArticleId);
             else renderWelcomeMessage();
             return;
        }


        const results = kbData.articles.filter(article => {
            const titleMatch = article.title.toLowerCase().includes(query);
            const tagsMatch = article.tags && article.tags.some(tag => tag.toLowerCase().includes(query));
            // const contentMatch = article.content && article.content.toLowerCase().includes(query); // More intensive search
            return titleMatch || tagsMatch; // || contentMatch;
        });

        displaySearchResults(results, query);
    }

    function displaySearchResults(results, query) {
        currentCategoryTitle.textContent = `Search Results for "${query}"`;
        updateBreadcrumbs(null, `Search: ${query}`);

        if (results.length === 0) {
            contentArea.innerHTML = `<p class="text-gray-600">No articles found matching your search for "${query}".</p>`;
            return;
        }

        let html = `<h2 class="text-2xl font-semibold mb-4 text-gray-700">${results.length} results found:</h2>`;
        html += `<ul class="space-y-4">`;
        results.forEach(article => {
            const category = kbData.categories.find(cat => cat.id === article.categoryId);
            html += `
                <li class="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                    <a href="#" data-article-id="${article.id}" class="block search-result-link">
                        <h3 class="text-xl font-semibold text-blue-600 hover:underline mb-1">${article.title}</h3>
                        <p class="text-sm text-gray-500 mb-2">In: ${category ? category.name : 'Uncategorized'} | Last Updated: ${article.lastUpdated}</p>
                        ${article.content ? `<p class="text-gray-700 text-sm truncate">${stripHtml(article.content).substring(0,150)}...</p>` : ''}
                        ${article.tags ? `<p class="text-xs text-gray-500 mt-2">Tags: ${article.tags.join(', ')}</p>` : ''}
                    </a>
                </li>
            `;
        });
        html += `</ul>`;
        contentArea.innerHTML = html;

        contentArea.querySelectorAll('.search-result-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                renderArticle(e.currentTarget.dataset.articleId);
            });
        });
    }

    // --- Utility Functions ---
    function stripHtml(html) {
       let tmp = document.createElement("DIV");
       tmp.innerHTML = html;
       return tmp.textContent || tmp.innerText || "";
    }

    // --- Initialize ---
    init();
});
