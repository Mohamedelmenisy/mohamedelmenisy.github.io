// js/data.js
// (نفس محتوى data.js الذي قدمته في الرد السابق، والذي يحتوي على kbSystemData ودالة searchKb)
// تأكد من أن caseStatusOptions معرفة هنا إذا كان app.js يعتمد عليها.

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
        version: "0.2.0", // تحديث الإصدار
        lastGlobalUpdate: new Date().toISOString() // تاريخ التحديث الحالي
    },
    sections: [
        // ... (نفس تعريف الأقسام الثابتة: support, partner_care, logistics, etc.)
        // من المهم أن تكون IDs هنا فريدة ومتطابقة مع ما تتوقعه في Supabase إذا كنت ستربطها.
        // سأضع مثالاً لقسم واحد، أكمل الباقي من بياناتك
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
                // ... more articles
            ],
            // Cases سيتم جلبها من Supabase، هذا مجرد fallback أو مثال
            // cases: [],
            // SubCategories سيتم جلبها من Supabase
            // subCategories: [],
            glossary: [
                { term: "SLA", definition: "Service Level Agreement - a commitment between a service provider and a client regarding service quality, availability, responsibilities." },
                { term: "P1", definition: "Priority 1 - A critical issue affecting multiple users or core functionality, requiring immediate attention." }
            ]
        },
        {
            id: "forms_templates",
            name: "Forms/Templates",
            icon: "fas fa-file-alt",
            themeColor: "purple",
            description: "A centralized collection of frequently used forms, document templates, and checklists.",
            items: [
                { id: "form001", title: "New Client Onboarding Checklist", type: "checklist", url: "/infini-base/templates/client_onboarding.pdf", description: "Standard checklist for onboarding new clients.", lastUpdated: "2023-09-15" },
                { id: "form002", title: "Incident Report Form", type: "form", url: "/infini-base/templates/incident_report.docx", description: "Form for reporting operational or security incidents.", lastUpdated: "2023-10-01" },
            ],
        }
        // ... (أضف باقي الأقسام الثابتة هنا)
    ],
};

function searchKb(query) {
    // (نفس دالة searchKb من الردود السابقة، تبحث في kbSystemData)
    // ...
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
        // Search items (forms/templates)
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
        // Match glossary terms
        if(section.glossary) {
            section.glossary.forEach(termEntry => {
                if(termEntry.term.toLowerCase().includes(lowerQuery) || termEntry.definition.toLowerCase().includes(lowerQuery)){
                    if(!results.some(r => r.id === `glossary_${termEntry.term}` && r.sectionId === section.id)){
                         results.push({
                             id: `glossary_${termEntry.term}`,
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
        // لا يتم البحث في Cases و SubCategories هنا لأنها ستأتي من Supabase
        // يمكن إضافة بحث Supabase هنا لاحقًا إذا أردت بحثًا شاملاً
    });
    results.sort((a, b) => {
        const typePriority = { 'article': 0, 'item': 1, 'section_match': 2, 'glossary_term': 3 };
        return (typePriority[a.type] || 4) - (typePriority[b.type] || 4);
    });
    return results;
}
