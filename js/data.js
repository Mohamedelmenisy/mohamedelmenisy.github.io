// js/data.js

// This will be expanded significantly.
// For now, it's just a placeholder to show where data will live.

const kbSystemData = {
    meta: {
        version: "0.1.2", // Updated version to reflect changes
        lastGlobalUpdate: "2023-11-28T12:00:00Z" // Updated date
    },
    sections: [
        {
            id: "support",
            name: "Support",
            icon: "fas fa-headset",
            themeColor: "blue", // Added for consistency with newer styling
            description: "Resources and procedures for the Support team, including ticket handling, escalation, and tool usage.",
            articles: [
                {
                    id: "sup001",
                    title: "How to Handle a High Priority Ticket",
                    tags: ["high priority", "escalation", "critical issue"],
                    lastUpdated: "2023-10-27",
                    contentPath: "articles/support/sup001.html",
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
            cases: [ // ADDED Case Management Data
                {
                    id: "case001",
                    title: "Frequent System Disconnects - User Alpha",
                    tags: ["connectivity", "disconnect", "user report", "alpha client"],
                    lastUpdated: "2023-11-20",
                    summary: "User Alpha reports frequent disconnects from the main platform. Initial investigation points to network instability.",
                    status: "Pending Investigation",
                    assignedTo: "Support Team B",
                    resolutionStepsPreview: "1. Check user's local network. 2. Review server logs...",
                    type: "case",
                    contentPath: "articles/support/cases/case001.html"
                },
                {
                    id: "case002",
                    title: "Payment Gateway Error - Order #12345",
                    tags: ["payment", "gateway", "error", "critical"],
                    lastUpdated: "2023-11-22",
                    summary: "Order #12345 failed at payment stage. Customer unable to complete purchase. Gateway: Stripe.",
                    status: "Escalated to Tier 2",
                    assignedTo: "Finance Support",
                    resolutionStepsPreview: "1. Verify error code with Stripe. 2. Check for recent gateway updates...",
                    type: "case",
                    contentPath: "articles/support/cases/case002.html"
                }
            ],
            subCategories: [
                { id: "cases", name: "Case Management" },
                { id: "escalation_procedures", name: "Escalation Procedures" },
                { id: "tools", name: "Support Tools" }
            ],
            glossary: [
                { term: "SLA", definition: "Service Level Agreement - a commitment between a service provider and a client regarding service quality, availability, responsibilities." },
                { term: "P1", definition: "Priority 1 - A critical issue affecting multiple users or core functionality, requiring immediate attention." }
            ]
        },
        {
            id: "partner_care",
            name: "Partner Care",
            icon: "fas fa-handshake",
            themeColor: "teal", // Added
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
        },
        {
            id: "logistics",
            name: "Logistics",
            icon: "fas fa-truck",
            themeColor: "green", // Added
            description: "Documentation related to logistics operations, supply chain management, and transportation.",
            articles: []
        },
        {
            id: "customer_care",
            name: "Customer Care",
            icon: "fas fa-users",
            themeColor: "indigo", // Added
            description: "Guidelines and best practices for providing excellent customer care and support.",
            articles: []
        },
        {
            id: "dist_follow_up",
            name: "Distribution & Follow up",
            icon: "fas fa-people-carry",
            themeColor: "cyan", // Added
            description: "Procedures for product distribution and post-delivery follow-up actions.",
            articles: []
        },
        {
            id: "logistics_driver",
            name: "Logistics (Driver Complaints)",
            icon: "fas fa-shipping-fast",
            themeColor: "lime", // Added
            description: "Handling driver complaints and related logistical issues.",
            articles: []
        },
        {
            id: "logistics_3pl",
            name: "Logistics-3PL",
            icon: "fas fa-boxes",
            themeColor: "yellow", // Added
            description: "Information specific to third-party logistics providers and collaborations.",
            articles: []
        },
        {
            id: "order_at_store",
            name: "Order at store (Mac)",
            icon: "fas fa-store",
            themeColor: "pink", // Added
            description: "Procedures for orders placed at physical store locations using Mac systems.",
            articles: []
        },
        {
            id: "logistics_admin",
            name: "Logistics-Admin",
            icon: "fas fa-user-shield",
            themeColor: "red", // Added
            description: "Administrative tasks and oversight for logistics operations.",
            articles: []
        },
        {
            id: "os",
            name: "Operating Systems",
            icon: "fab fa-windows",
            themeColor: "sky", // Added
            description: "Guides and troubleshooting for supported operating systems.",
            articles: []
        },
        {
            id: "compensation",
            name: "Compensation Policies",
            icon: "fas fa-hand-holding-usd",
            themeColor: "amber", // Added
            description: "Details on compensation policies, bonus structures, and related financial information for employees/partners.",
            articles: []
        },
        {
            id: "op_instructions",
            name: "Operational Instructions",
            icon: "fas fa-clipboard-list",
            themeColor: "slate", // Added
            description: "General operational instructions and standard operating procedures (SOPs).",
            articles: []
        },
        {
            id: "forms_templates",
            name: "Forms/Templates",
            icon: "fas fa-file-alt",
            themeColor: "purple", // Added
            description: "A centralized collection of frequently used forms, document templates, and checklists.",
            items: [
                {
                    id: "form001",
                    title: "New Client Onboarding Checklist",
                    type: "checklist",
                    url: "/templates/client_onboarding.pdf",
                    description: "Standard checklist for onboarding new clients, ensuring all steps are covered.",
                    lastUpdated: "2023-09-15",
                },
                {
                    id: "form002",
                    title: "Incident Report Form",
                    type: "form",
                    url: "/templates/incident_report.docx",
                    description: "Form for reporting operational or security incidents.",
                    lastUpdated: "2023-10-01",
                },
                {
                    id: "temp001",
                    title: "Standard Email Signature Template",
                    type: "template",
                    url: "/templates/email_signature_guide.html",
                    description: "Official email signature template and usage guidelines for company communication.",
                    lastUpdated: "2023-08-20",
                }
            ]
        }
    ],
};

function loadSectionContent(sectionId) {
    // This function is less critical if displaySectionContent in app.js handles data fetching directly.
    // However, searchKb still uses kbSystemData globally.
    const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
    if (sectionData) {
        console.log(`[data.js] Data for ${sectionData.name} conceptually ready.`);
        return sectionData;
    }
    return null;
}

function searchKb(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    if (!kbSystemData || !kbSystemData.sections) return results;

    kbSystemData.sections.forEach(section => {
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
        if (section.cases) { // ADDED search for cases
            section.cases.forEach(caseItem => {
                if (caseItem.title.toLowerCase().includes(lowerQuery) ||
                    (caseItem.tags && caseItem.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                    (caseItem.summary && caseItem.summary.toLowerCase().includes(lowerQuery)) ||
                    (caseItem.status && caseItem.status.toLowerCase().includes(lowerQuery))
                ) {
                    results.push({ ...caseItem, sectionName: section.name, sectionId: section.id, type: 'case', themeColor: section.themeColor });
                }
            });
        }
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
        if (section.name.toLowerCase().includes(lowerQuery) || section.description.toLowerCase().includes(lowerQuery)) {
            if (!results.some(r => r.id === section.id && r.type === 'section_match')) {
                 results.push({ id: section.id, title: section.name, summary: section.description, sectionName: section.name, sectionId: section.id, type: 'section_match', themeColor: section.themeColor});
            }
        }
        if(section.glossary) {
            section.glossary.forEach(term => {
                if(term.term.toLowerCase().includes(lowerQuery) || term.definition.toLowerCase().includes(lowerQuery)){
                    if(!results.some(r => r.id === `glossary_${term.term}` && r.sectionId === section.id)){
                         results.push({ id: `glossary_${term.term}`, title: term.term, summary: term.definition, sectionName: section.name, sectionId: section.id, type: 'glossary_term', themeColor: section.themeColor});
                    }
                }
            });
        }
    });
    results.sort((a, b) => {
        const typePriority = { 'article': 0, 'case': 1, 'item': 2, 'section_match': 3, 'glossary_term': 4 };
        return (typePriority[a.type] || 5) - (typePriority[b.type] || 5);
    });
    return results;
}
