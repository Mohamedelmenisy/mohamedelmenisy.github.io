// js/data.js

// This will be expanded significantly.
// For now, it's just a placeholder to show where data will live.

const kbSystemData = {
    meta: {
        version: "0.1.0",
        lastGlobalUpdate: "2023-10-28T10:00:00Z"
    },
    sections: [
        {
            id: "support",
            name: "Support",
            icon: "fas fa-headset",
            description: "Resources and procedures for the Support team.",
            articles: [
                {
                    id: "sup001",
                    title: "How to Handle a High Priority Ticket",
                    tags: ["high priority", "escalation", "critical issue"],
                    lastUpdated: "2023-10-27",
                    contentPath: "articles/support/sup001.html", // Or actual HTML/Markdown content
                    summary: "Step-by-step guide for managing and resolving high priority support tickets efficiently."
                },
                // ... more articles
            ],
            subCategories: [
                { id: "cases", name: "Cases" },
                { id: "escalation", name: "Escalation Procedures" },
                { id: "tools", name: "Support Tools" }
            ],
            glossary: [
                { term: "SLA", definition: "Service Level Agreement - a commitment between a service provider and a client." }
            ]
        },
        {
            id: "partner_care",
            name: "Partner Care",
            icon: "fas fa-handshake",
            description: "Information for managing and supporting our partners.",
            articles: [] // Populate later
        },
        // ... other sections from the sidebar
        {
            id: "forms_templates",
            name: "Forms/Templates",
            icon: "fas fa-file-alt",
            description: "A collection of frequently used forms and document templates.",
            items: [
                {
                    id: "form001",
                    title: "New Client Onboarding Checklist",
                    type: "checklist", // 'form', 'template', 'link'
                    url: "/templates/client_onboarding.pdf", // or a link to an online form
                    description: "Standard checklist for onboarding new clients."
                }
            ]
        }
    ],
    // Global glossary, or common terms can also be here
    // User preferences (might be stored server-side later)
};

// Function to load content (will be more sophisticated)
function loadSectionContent(sectionId) {
    const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
    if (sectionData) {
        // Logic to render articles, subcategories, etc.
        console.log(`Loading content for ${sectionData.name}`);
        // This is where you'd update the #pageContent in dashboard.html
        // For example, iterate through sectionData.articles and create HTML elements
        return sectionData; // Return data for rendering
    }
    return null;
}

// Placeholder for search functionality
function searchKb(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];
    kbSystemData.sections.forEach(section => {
        section.articles.forEach(article => {
            if (article.title.toLowerCase().includes(lowerQuery) ||
                (article.tags && article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                (article.summary && article.summary.toLowerCase().includes(lowerQuery))
            ) {
                results.push({ ...article, sectionName: section.name, sectionId: section.id });
            }
        });
        // Could also search section names, descriptions, glossary terms etc.
    });
    return results;
}
