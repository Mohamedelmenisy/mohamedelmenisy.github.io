// js/data.js

// Stores access history in memory. For persistence, localStorage or a backend would be needed.
var accessHistory = []; // Use 'var' or ensure it's properly scoped if app.js is separate

// Define standard case statuses for consistency
const caseStatusOptions = [
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
                    // contentPath: "articles/support/sup001.html", // No longer for navigation
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
            cases: [
                {
                    id: "case001",
                    title: "Frequent System Disconnects - User Alpha",
                    tags: ["connectivity", "disconnect", "user report", "alpha client"],
                    lastUpdated: "2023-11-20",
                    summary: "User Alpha reports frequent disconnects from the main platform. Initial investigation points to network instability.",
                    status: "Pending Investigation", // Use one from caseStatusOptions
                    assignedTo: "Support Team B",
                    resolutionSteps: "1. Check user's local network configuration (ping, traceroute).\n2. Review server logs for connection drops corresponding to user's report times.\n3. Ask user for specific error messages or patterns observed.",
                    // contentPath: "articles/support/cases/case001.html", // No longer for navigation
                    type: "case"
                },
                {
                    id: "case002",
                    title: "Payment Gateway Error - Order #12345",
                    tags: ["payment", "gateway", "error", "critical"],
                    lastUpdated: "2023-11-22",
                    summary: "Order #12345 failed at payment stage. Customer unable to complete purchase. Gateway: Stripe.",
                    status: "Escalated to Tier 2",
                    assignedTo: "Finance Support",
                    resolutionSteps: "1. Verify error code with Stripe documentation.\n2. Check for recent gateway updates or outages.\n3. Attempt a test transaction with similar parameters if possible.",
                    type: "case"
                }
            ],
            subCategories: [
                { id: "cases_overview", name: "Case Management Overview", description: "General guidelines for managing support cases." },
                { id: "escalation_procedures", name: "Escalation Procedures", description: "How and when to escalate issues." },
                { id: "tools_guides", name: "Support Tools Guides", description: "Manuals for internal support tools." }
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
                { id: "partner_comm", name: "Partner Communication", description: "Best practices for partner comms."}
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
                    url: "/templates/client_onboarding.pdf", // This would still be an external link if it's a file download
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
            // No cases or subCategories typical for forms/templates, but can be added if needed
            cases: [], subCategories: []
        }
    ],
};

// This function is kept for searchKb, but individual section content is now directly handled by displaySectionContent
function loadSectionContent(sectionId) {
    const sectionData = kbSystemData.sections.find(s => s.id === sectionId);
    if (sectionData) {
        // console.log(`[data.js] Data for ${sectionData.name} conceptually ready.`);
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
                    (article.summary && article.summary.toLowerCase().includes(lowerQuery)) ||
                    (article.details && article.details.toLowerCase().includes(lowerQuery)) // Search in details too
                ) {
                    results.push({ ...article, sectionName: section.name, sectionId: section.id, type: 'article', themeColor: section.themeColor });
                }
            });
        }
        if (section.cases) {
            section.cases.forEach(caseItem => {
                if (caseItem.title.toLowerCase().includes(lowerQuery) ||
                    (caseItem.tags && caseItem.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                    (caseItem.summary && caseItem.summary.toLowerCase().includes(lowerQuery)) ||
                    (caseItem.status && caseItem.status.toLowerCase().includes(lowerQuery)) ||
                    (caseItem.resolutionSteps && caseItem.resolutionSteps.toLowerCase().includes(lowerQuery)) // Search in resolution steps
                ) {
                    results.push({ ...caseItem, sectionName: section.name, sectionId: section.id, type: 'case', themeColor: section.themeColor });
                }
            });
        }
        if (section.items) { // for forms/templates etc.
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
        if(section.glossary) {
            section.glossary.forEach(term => {
                if(term.term.toLowerCase().includes(lowerQuery) || term.definition.toLowerCase().includes(lowerQuery)){
                    if(!results.some(r => r.id === `glossary_${term.term}` && r.sectionId === section.id)){
                         results.push({
                             id: `glossary_${term.term}`,
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
    });
    results.sort((a, b) => {
        const typePriority = { 'article': 0, 'case': 1, 'item': 2, 'section_match': 3, 'glossary_term': 4 };
        return (typePriority[a.type] || 5) - (typePriority[b.type] || 5);
    });
    return results;
}
