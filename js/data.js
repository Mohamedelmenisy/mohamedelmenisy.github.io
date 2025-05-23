// js/data.js
const kbSystemData = {
    meta: { /* ... */ },
    sections: [
        {
            id: "dashboard_home", // Special ID for dashboard view
            name: "Dashboard",
            icon: "layout-dashboard"
            // No articles here, it's a special view
        },
        {
            id: "support",
            name: "Support",
            icon: "life-buoy",
            description: "Resources and procedures for the Support team.",
            articles: [
                {
                    id: "sup001",
                    title: "Handling High Priority Tickets",
                    tags: ["high priority", "escalation", "critical issue", "sop"],
                    lastUpdated: "Nov 01, 2023",
                    summary: "Step-by-step guide for managing and resolving P1 support tickets efficiently and effectively.",
                    contentPath: "articles/support/sup001.html"
                },
                {
                    id: "sup002",
                    title: "Password Reset Procedure for Enterprise Clients",
                    tags: ["password", "reset", "enterprise", "security"],
                    lastUpdated: "Oct 25, 2023",
                    summary: "Secure method for resetting passwords for enterprise-level client accounts.",
                    contentPath: "articles/support/sup002.html"
                }
            ]
        },
        {
            id: "logistics",
            name: "Logistics",
            icon: "truck",
            description: "Logistics operations, 3PL management, and driver information.",
            articles: [
                {
                    id: "log001",
                    title: "New 3PL Partner Onboarding Process",
                    tags: ["3pl", "onboarding", "partner", "checklist"],
                    lastUpdated: "Oct 28, 2023",
                    summary: "Detailed steps and requirements for integrating a new third-party logistics partner into our network.",
                    contentPath: "articles/logistics/log001.html"
                }
            ]
        },
        // ... other sections
        {
            id: "forms_templates",
            name: "Forms & Templates",
            icon: "folder-open",
            description: "Collection of essential forms and document templates.",
            articles: [ // Can also list templates as "articles" for consistency in display
                 {
                    id: "tpl001",
                    title: "Client Onboarding Checklist PDF",
                    tags: ["template", "pdf", "onboarding", "client"],
                    lastUpdated: "Sep 15, 2023",
                    summary: "Downloadable PDF checklist for new client onboarding.",
                    type: "template_link", // Differentiator
                    url: "/path/to/client_onboarding.pdf"
                }
            ]
        }
    ]
};

// Enhanced searchKb function
function searchKb(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];
    if (!kbSystemData || !kbSystemData.sections) return results;

    kbSystemData.sections.forEach(section => {
        if (section.articles) {
            section.articles.forEach(article => {
                let score = 0;
                const titleLower = article.title.toLowerCase();
                const summaryLower = (article.summary || "").toLowerCase();
                
                if (titleLower.includes(lowerQuery)) {
                    score += 10; // Higher score for title match
                }
                if (summaryLower.includes(lowerQuery)) {
                    score += 2;
                }
                if (article.tags && article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
                    score += 5; // Good score for tag match
                }

                if (score > 0) {
                    results.push({ ...article, sectionName: section.name, sectionId: section.id, score });
                }
            });
        }
    });
    // Sort results by score (higher score first)
    return results.sort((a, b) => b.score - a.score);
}

// Placeholder for fetching article content (e.g., via AJAX if content is in separate files)
// function getArticleContent(articlePath) { /* ... */ }
