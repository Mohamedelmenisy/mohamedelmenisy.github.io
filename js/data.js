// js/data.js

// Knowledge base system data, with cases initialized empty for Supabase integration.
// Articles and Items are still static here. Cases and SubCategories are fetched from Supabase by app.js.

const kbSystemData = {
    meta: {
        version: "0.1.2",
        lastGlobalUpdate: "2023-11-28T12:00:00Z"
    },
    sections: [
        {
            id: "support",
            name: "Support",
            icon: "fas fa-headset",
            themeColor: "blue",
            description: "Resources and procedures for the Support team, including ticket handling, escalation, and tool usage.",
            articles: [
                {
                    id: "sup001",
                    title: "How to Handle a High Priority Ticket",
                    tags: ["high priority", "escalation", "critical issue"],
                    lastUpdated: "2023-10-27",
                    contentPath: "articles/support/sup001.html", // app.js attempts to fetch this if it's an .html file
                    summary: "Step-by-step guide for managing and resolving high priority support tickets efficiently and effectively."
                },
                {
                    id: "sup002",
                    title: "Standard Ticket Resolution Workflow",
                    tags: ["workflow", "standard procedure", "tickets"],
                    lastUpdated: "2023-11-02",
                    contentPath: "articles/support/sup002.html",
                    summary: "Overview of the standard workflow for handling all types of support tickets from creation to resolution."
                },
                {
                    id: "sup003",
                    title: "Using the Zendesk Integration",
                    tags: ["zendesk", "tools", "integration"],
                    lastUpdated: "2023-10-15",
                    contentPath: "articles/support/sup003.html",
                    summary: "A comprehensive guide on how to use the Zendesk integration for managing customer support interactions."
                }
            ],
            // cases: [], // No longer needed here, app.js fetches from Supabase
            // subCategories: [], // No longer needed here, app.js fetches from Supabase
            // Example of how subCategories were structured, app.js now uses Supabase for this
            // subCategories: [
            //     { id: "cases", name: "Case Management" },
            //     { id: "escalation_procedures", name: "Escalation Procedures" },
            //     { id: "tools", name: "Support Tools" }
            // ],
            glossary: [
                { term: "SLA", definition: "Service Level Agreement - a commitment between a service provider and a client regarding service quality, availability, responsibilities." },
                { term: "P1", definition: "Priority 1 - A critical issue affecting multiple users or core functionality, requiring immediate attention." }
            ]
        },
        {
            id: "partner_care",
            name: "Partner Care",
            icon: "fas fa-handshake",
            themeColor: "teal",
            description: "Information for managing and supporting our valued partners, including onboarding, communication, and issue resolution.",
            articles: [
                {
                    id: "pc001",
                    title: "Partner Onboarding Process",
                    tags: ["onboarding", "new partner", "checklist"],
                    lastUpdated: "2023-11-10",
                    contentPath: "articles/partner_care/pc001.html",
                    summary: "Detailed checklist and steps for successfully onboarding new partners into our ecosystem."
                }
            ]
            // cases: [], subCategories: [], glossary: [] // Removed for brevity, app.js fetches dynamic parts
        },
        // ... (Other sections definitions from your data.js file) ...
        // Ensure all sections are defined here as app.js relies on sectionData for themeColor, icon, description etc.
        // even if their dynamic content (cases, subcategories) comes from Supabase.
        {
            id: "forms_templates",
            name: "Forms/Templates",
            icon: "fas fa-file-alt",
            themeColor: "purple", // Example, use actual color
            description: "A centralized collection of frequently used forms, document templates, and checklists.",
            items: [ // Items are still static in kbSystemData
                {
                    id: "form001",
                    title: "New Client Onboarding Checklist",
                    type: "checklist",
                    url: "/templates/client_onboarding.pdf", // Example path
                    description: "Standard checklist for onboarding new clients, ensuring all steps are covered.",
                    lastUpdated: "2023-09-15",
                },
                {
                    id: "form002",
                    title: "Incident Report Form",
                    type: "form",
                    url: "/templates/incident_report.docx", // Example path
                    description: "Form for reporting operational or security incidents.",
                    lastUpdated: "2023-10-01",
                }
            ]
            // articles: [], cases: [], subCategories: [], glossary: []
        }
    ]
};

// searchKb function remains. It currently searches kbSystemData.
// For cases and subcategories from Supabase, searchKb would need to be enhanced
// to also query Supabase, or the search results will be limited to static data.
function searchKb(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    if (!kbSystemData || !kbSystemData.sections) {
        console.warn("[data.js searchKb] kbSystemData or sections not found.");
        return results;
    }

    kbSystemData.sections.forEach(section => {
        // Search articles
        if (section.articles) {
            section.articles.forEach(article => {
                if (article.title.toLowerCase().includes(lowerQuery) ||
                    (article.tags && article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                    (article.summary && article.summary.toLowerCase().includes(lowerQuery))
                ) {
                    results.push({ ...article, sectionName: section.name, sectionId: section.id, type: 'article', themeColor: section.themeColor });
                }
            });
        }
        // Search items
        if (section.items) {
            section.items.forEach(item => {
                if (item.title.toLowerCase().includes(lowerQuery) ||
                    (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
                    item.type.toLowerCase().includes(lowerQuery)
                ) {
                    results.push({ ...item, sectionName: section.name, sectionId: section.id, type: 'item', themeColor: section.themeColor });
                }
            });
        }
        // Section name and description match
        if (section.name.toLowerCase().includes(lowerQuery) || (section.description && section.description.toLowerCase().includes(lowerQuery))) {
            if (!results.some(r => r.id === section.id && r.type === 'section_match')) {
                 results.push({
                    id: section.id,
                    title: section.name,
                    summary: section.description,
                    sectionName: section.name,
                    sectionId: section.id,
                    type: 'section_match',
                    themeColor: section.themeColor
                });
            }
        }
        // Glossary terms
        if(section.glossary) {
            section.glossary.forEach(term => {
                if(term.term.toLowerCase().includes(lowerQuery) || term.definition.toLowerCase().includes(lowerQuery)){
                    if(!results.some(r => r.id === `glossary_${term.term}` && r.sectionId === section.id)){
                         results.push({
                            id: `glossary_${term.term}`, // Create a unique ID for glossary terms for keying
                            title: term.term,
                            summary: term.definition,
                            sectionName: section.name,
                            sectionId: section.id,
                            type: 'glossary_term',
                            themeColor: section.themeColor
                        });
                    }
                }
            });
        }
        // Note: Cases and SubCategories are fetched dynamically from Supabase by app.js.
        // To include them in this client-side search, searchKb would need to be async
        // and query Supabase, or app.js would need to pass that dynamic data to searchKb.
        // For now, search is limited to what's in kbSystemData.
    });
    results.sort((a, b) => {
        const typePriority = { 'article': 0, 'case': 1, 'item': 2, 'section_match': 3, 'glossary_term': 4 };
        return (typePriority[a.type] || 5) - (typePriority[b.type] || 5);
    });
    return results;
}

// loadSectionContent is less critical if app.js directly uses kbSystemData.sections.find()
// and fetches dynamic content (cases, subcategories) from Supabase separately.
// However, if any part of app.js still calls it, it should be fine.
function loadSectionContent(sectionId) {
    if (!kbSystemData || !kbSystemData.sections) {
        console.warn("[data.js loadSectionContent] kbSystemData or sections not found.");
        return null;
    }
    const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
    if (sectionData) {
        // console.log(`[data.js] Static data for ${sectionData.name} conceptually ready.`);
        return sectionData;
    }
    return null;
}
