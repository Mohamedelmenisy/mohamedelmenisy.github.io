kbSystemData = {
    sections: [
        {
            id: "support",
            name: "Support",
            description: "Support documentation and procedures.",
            themeColor: "indigo",
            icon: "fas fa-headset",
            articles: [
                { id: "sup001", title: "How to Handle a High Priority Ticket", summary: "Step-by-step guide for managing and resolving high priority support tickets efficiently and effectively.", tags: ["high priority", "escalation", "critical issue"], contentPath: "https://example.com/sup001" },
                { id: "sup002", title: "Standard Ticket Resolution Workflow", summary: "Overview of the standard workflow for handling all types of support tickets from creation to resolution.", tags: ["workflow", "standard procedure", "tickets"], contentPath: "https://example.com/sup002" },
                { id: "sup003", title: "Using the Zendesk Integration", summary: "A comprehensive guide on how to use the Zendesk integration for managing customer support interactions.", tags: ["zendesk", "tools", "integration"], contentPath: "https://example.com/sup003" }
            ],
            cases: [
                { id: "case001", title: "Frequent System Disconnects - User Alpha", summary: "User Alpha reports frequent disconnects from the main platform. Initial investigation points to network instability.", tags: ["connectivity", "disconnect", "user report", "alpha client"], status: "Pending Investigation", contentPath: "https://example.com/case001", resolutionStepsPreview: "Steps: 1. Check user's local network. 2. Review server logs..." },
                { id: "case002", title: "Payment Gateway Error - Order #12345", summary: "Order #12345 failed at payment stage. Customer unable to complete purchase. Gateway issue.", tags: ["payment", "gateway", "error", "critical"], status: "Escalated to Tier 2", contentPath: "https://example.com/case002", resolutionStepsPreview: "Steps: 1. Verify error code with Stripe. 2. Check for recent gateway updates..." }
            ],
            items: [
                { id: "item001", title: "Support Tool Guide", description: "Guide to using support tools.", type: "document", url: "https://example.com/item001" },
                { id: "item002", title: "FAQ Document", description: "Frequently asked questions.", type: "faq", url: "https://example.com/item002" }
            ],
            subCategories: [
                { id: "tools", name: "Tools" },
                { id: "guides", name: "Guides" }
            ],
            glossary: [
                { term: "Escalation", definition: "The process of transferring a ticket to a higher support level." },
                { term: "Resolution", definition: "The final step of solving a support issue." }
            ]
        },
        {
            id: "partner_care",
            name: "Partner Care",
            description: "Resources for partner support.",
            themeColor: "green",
            icon: "fas fa-handshake",
            articles: [
                { id: "pc001", title: "Partner Onboarding", summary: "Steps to onboard new partners.", tags: ["onboarding", "partners"], contentPath: "https://example.com/pc001" }
            ],
            cases: [],
            items: [],
            subCategories: [],
            glossary: []
        },
        // Add more sections as per your original data
    ],
    meta: {
        version: "0.1.2",
        lastGlobalUpdate: "2023-11-28T12:00:00Z",
        dashboardStats: {
            openCases: 12,
            resolvedCases: 45,
            criticalIssues: 3
        }
    },
    searchKb: function(query) {
        const results = [];
        this.sections.forEach(section => {
            section.articles.forEach(article => {
                if (article.title.toLowerCase().includes(query.toLowerCase()) || article.summary.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ sectionId: section.id, id: article.id, title: article.title, summary: article.summary, type: 'article', sectionName: section.name, themeColor: section.themeColor });
                }
            });
            section.cases.forEach(caseItem => {
                if (caseItem.title.toLowerCase().includes(query.toLowerCase()) || caseItem.summary.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ sectionId: section.id, id: caseItem.id, title: caseItem.title, summary: caseItem.summary, type: 'case', sectionName: section.name, themeColor: section.themeColor });
                }
            });
            section.items.forEach(item => {
                if (item.title.toLowerCase().includes(query.toLowerCase()) || item.description.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ sectionId: section.id, id: item.id, title: item.title, summary: item.description, type: 'item', sectionName: section.name, themeColor: section.themeColor });
                }
            });
            if (section.name.toLowerCase().includes(query.toLowerCase())) {
                results.push({ sectionId: section.id, title: section.name, summary: section.description, type: 'section_match', sectionName: section.name, themeColor: section.themeColor });
            }
            section.glossary.forEach(entry => {
                if (entry.term.toLowerCase().includes(query.toLowerCase()) || entry.definition.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ sectionId: section.id, title: entry.term, summary: entry.definition, type: 'glossary_term', sectionName: section.name, themeColor: section.themeColor });
                }
            });
        });
        return results;
    }
};
