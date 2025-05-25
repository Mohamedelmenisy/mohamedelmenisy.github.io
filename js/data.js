// js/data.js

// Stores access history in memory. For persistence, localStorage or a backend would be needed.
// This is not currently used by app.js after Supabase integration for logging.
// var accessHistory = [];

// Define standard case statuses for consistency - used by openCaseModal
const caseStatusOptions = [
    'New',
    'Pending Investigation',
    'In Progress',
    'On Hold - Awaiting Client',
    'On Hold - Awaiting 3rd Party',
    'Escalated to Tier 2',
    'Escalated to Engineering',
    'Awaiting Deployment',
    'Resolved',
    'Closed - Confirmed',
    'Closed - No Response'
];


const kbSystemData = {
    meta: {
        version: "0.1.3", // Updated version
        lastGlobalUpdate: "2023-12-01T10:00:00Z" // Updated date
    },
    sections: [ // This static data is still used for sections, articles, items, glossary
                // Cases and SubCategories are now primarily fetched from Supabase by app.js
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
                    summary: "Step-by-step guide for managing and resolving high priority support tickets efficiently and effectively.",
                    details: "Detailed content for High Priority Tickets:\n1. Acknowledge receipt within 15 minutes.\n2. Gather all necessary information from the reporter.\n3. Attempt initial diagnosis based on known issues.\n4. If unresolved within 1 hour, escalate to Tier 2 support with all gathered details.\n5. Keep the reporter updated every 30 minutes on progress."
                },
                {
                    id: "sup002",
                    title: "Standard Ticket Resolution Workflow",
                    tags: ["workflow", "standard procedure", "tickets"],
                    lastUpdated: "2023-11-02",
                    summary: "Overview of the standard workflow for handling all types of support tickets from creation to resolution.",
                    details: "The standard ticket resolution workflow involves: Intake > Triage > Assignment > Investigation > Resolution > Verification > Closure. Each step has defined SLAs and communication protocols."
                },
                {
                    id: "sup003",
                    title: "Using the Zendesk Integration",
                    tags: ["zendesk", "tools", "integration"],
                    lastUpdated: "2023-10-15",
                    summary: "A comprehensive guide on how to use the Zendesk integration for managing customer support interactions.",
                    details: "To use the Zendesk integration:\n- Ensure your InfiniBase account is linked.\n- Access Zendesk via the 'Tools' menu.\n- Tickets created in InfiniBase can be synced to Zendesk.\n- Customer replies in Zendesk can update InfiniBase case statuses."
                }
            ],
            // Static cases are now a fallback if Supabase is not available or if you want to mix.
            // app.js prioritizes Supabase cases.
            cases: [
                {
                    id: "case_static_001", // Differentiate from Supabase IDs if necessary
                    title: "Frequent System Disconnects - User Alpha (Static)",
                    tags: ["connectivity", "disconnect", "user report", "alpha client"],
                    lastUpdated: "2023-11-20",
                    summary: "User Alpha reports frequent disconnects from the main platform. Initial investigation points to network instability.",
                    status: "Pending Investigation",
                    assignedTo: "Support Team B",
                    resolutionStepsPreview: "1. Check user's local network configuration...", // Keep this a preview
                    // For static cases, 'content' would be the full HTML if you had it.
                    // 'resolutionSteps' could be plain text or markdown if 'content' is not used for detailed HTML.
                    content: "<p>1. Check user's local network configuration (ping, traceroute).</p><p>2. Review server logs for connection drops corresponding to user's report times.</p><p>3. Ask user for specific error messages or patterns observed.</p>",
                    type: "case" // Not strictly needed if rendered by renderCaseCard_enhanced
                }
            ],
             // Static subCategories are a fallback. app.js prioritizes Supabase.
            subCategories: [
                { id: "cases_overview", name: "Case Management Overview (Static)", description: "General guidelines for managing support cases." },
                { id: "escalation_procedures", name: "Escalation Procedures (Static)", description: "How and when to escalate issues." },
                { id: "tools_guides", name: "Support Tools Guides (Static)", description: "Manuals for internal support tools." }
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
            themeColor: "teal",
            description: "Information for managing and supporting our valued partners, including onboarding, communication, and issue resolution.",
            articles: [
                 {
                    id: "pc001",
                    title: "Partner Onboarding Process",
                    tags: ["onboarding", "new partner", "checklist"],
                    lastUpdated: "2023-11-10",
                    summary: "Detailed checklist and steps for successfully onboarding new partners into our ecosystem.",
                    details: "Partner Onboarding involves: Initial Contact > NDA Signing > Technical Integration Call > Training Session > Go-Live Support. Each phase has specific deliverables."
                }
            ],
            cases: [],
            subCategories: [
                { id: "partner_comm", name: "Partner Communication (Static)", description: "Best practices for partner comms."}
            ]
        },
        {
            id: "logistics",
            name: "Logistics",
            icon: "fas fa-truck",
            themeColor: "green",
            description: "Documentation related to logistics operations, supply chain management, and transportation.",
            articles: [], cases: [], subCategories: []
        },
        {
            id: "customer_care",
            name: "Customer Care",
            icon: "fas fa-users",
            themeColor: "indigo",
            description: "Guidelines and best practices for providing excellent customer care and support.",
            articles: [], cases: [], subCategories: []
        },
        {
            id: "dist_follow_up",
            name: "Distribution & Follow up",
            icon: "fas fa-people-carry",
            themeColor: "cyan",
            description: "Procedures for product distribution and post-delivery follow-up actions.",
            articles: [], cases: [], subCategories: []
        },
        {
            id: "logistics_driver",
            name: "Logistics (Driver Complaints)",
            icon: "fas fa-shipping-fast",
            themeColor: "lime",
            description: "Handling driver complaints and related logistical issues.",
            articles: [], cases: [], subCategories: []
        },
        {
            id: "logistics_3pl",
            name: "Logistics-3PL",
            icon: "fas fa-boxes",
            themeColor: "yellow",
            description: "Information specific to third-party logistics providers and collaborations.",
            articles: [], cases: [], subCategories: []
        },
        {
            id: "order_at_store",
            name: "Order at store (Mac)",
            icon: "fas fa-store",
            themeColor: "pink",
            description: "Procedures for orders placed at physical store locations using Mac systems.",
            articles: [], cases: [], subCategories: []
        },
        {
            id: "logistics_admin",
            name: "Logistics-Admin",
            icon: "fas fa-user-shield",
            themeColor: "red",
            description: "Administrative tasks and oversight for logistics operations.",
            articles: [], cases: [], subCategories: []
        },
        {
            id: "os",
            name: "Operating Systems",
            icon: "fab fa-windows",
            themeColor: "sky",
            description: "Guides and troubleshooting for supported operating systems.",
            articles: [], cases: [], subCategories: []
        },
        {
            id: "compensation",
            name: "Compensation Policies",
            icon: "fas fa-hand-holding-usd",
            themeColor: "amber",
            description: "Details on compensation policies, bonus structures, and related financial information for employees/partners.",
            articles: [], cases: [], subCategories: []
        },
        {
            id: "op_instructions",
            name: "Operational Instructions",
            icon: "fas fa-clipboard-list",
            themeColor: "slate",
            description: "General operational instructions and standard operating procedures (SOPs).",
            articles: [], cases: [], subCategories: []
        },
        {
            id: "forms_templates",
            name: "Forms/Templates",
            icon: "fas fa-file-alt",
            themeColor: "purple",
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
            ],
            cases: [], subCategories: []
        }
    ],
};


// searchKb searches the static kbSystemData.
// For dynamic Supabase data, this function would need to be async and query Supabase,
// or you'd use Supabase's full-text search capabilities.
function searchKb(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    if (!kbSystemData || !kbSystemData.sections) return results;

    kbSystemData.sections.forEach(section => {
        // Search articles
        if (section.articles) {
            section.articles.forEach(article => {
                if (article.title.toLowerCase().includes(lowerQuery) ||
                    (article.tags && article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                    (article.summary && article.summary.toLowerCase().includes(lowerQuery)) ||
                    (article.details && article.details.toLowerCase().includes(lowerQuery))
                ) {
                    results.push({ ...article, sectionName: section.name, sectionId: section.id, type: 'article', themeColor: section.themeColor });
                }
            });
        }
        // Search static cases (fallback)
        if (section.cases) {
            section.cases.forEach(caseItem => {
                if (caseItem.title.toLowerCase().includes(lowerQuery) ||
                    (caseItem.tags && caseItem.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                    (caseItem.summary && caseItem.summary.toLowerCase().includes(lowerQuery)) ||
                    (caseItem.status && caseItem.status.toLowerCase().includes(lowerQuery)) ||
                    (caseItem.content && typeof caseItem.content === 'string' && caseItem.content.toLowerCase().includes(lowerQuery))
                ) {
                    results.push({ ...caseItem, sectionName: section.name, sectionId: section.id, type: 'case', themeColor: section.themeColor, isStatic: true });
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
        // Match section itself
        if (section.name.toLowerCase().includes(lowerQuery) || section.description.toLowerCase().includes(lowerQuery)) {
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
        // Match static subcategories
        if (section.subCategories) {
            section.subCategories.forEach(subCat => {
                if (subCat.name.toLowerCase().includes(lowerQuery) || (subCat.description && subCat.description.toLowerCase().includes(lowerQuery))) {
                    if (!results.some(r => r.id === subCat.id && r.sectionId === section.id && r.type === 'sub_category_match_static')) {
                        results.push({
                            id: subCat.id, // This is the subCategory ID
                            title: subCat.name,
                            summary: subCat.description || `Sub-category in ${section.name}`,
                            sectionName: section.name,
                            sectionId: section.id,
                            type: 'sub_category_match_static', // Special type for search results to handle subcategory links
                            themeColor: section.themeColor
                        });
                    }
                }
            });
        }
        // Match glossary terms
        if(section.glossary) {
            section.glossary.forEach(termEntry => { // Renamed 'term' to 'termEntry' to avoid conflict
                if(termEntry.term.toLowerCase().includes(lowerQuery) || termEntry.definition.toLowerCase().includes(lowerQuery)){
                    if(!results.some(r => r.id === `glossary_${termEntry.term}` && r.sectionId === section.id)){
                         results.push({
                             id: `glossary_${termEntry.term}`, // Unique ID for glossary term search result
                             title: termEntry.term,
                             summary: termEntry.definition,
                             sectionName: section.name,
                             sectionId: section.id,
                             type: 'glossary_term',
                             themeColor: section.themeColor
                            });
                    }
                }
            });
        }
    });
    // Basic sort: articles, cases, items, then sections/glossary/subcategories
    results.sort((a, b) => {
        const typePriority = { 'article': 0, 'case': 1, 'item': 2, 'sub_category_match_static': 3, 'section_match': 4, 'glossary_term': 5 };
        return (typePriority[a.type] || 6) - (typePriority[b.type] || 6);
    });
    return results;
}
