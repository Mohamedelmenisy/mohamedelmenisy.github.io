// js/data.js
const kbData = {
    categories: [
        { id: "basic_procedures", name: "Basic Procedures", icon: "fas fa-cogs" },
        { id: "troubleshooting", name: "Troubleshooting", icon: "fas fa-tools" },
        { id: "complaints_handling", name: "Complaints Handling", icon: "fas fa-angry" },
        { id: "forms_templates", name: "Forms & Templates", icon: "fas fa-file-alt" },
        { id: "product_info", name: "Product Information", icon: "fas fa-box-open" },
        { id: "glossary", name: "Glossary", icon: "fas fa-book" }
    ],
    articles: [
        {
            id: "proc001",
            categoryId: "basic_procedures",
            title: "Onboarding a New Client",
            tags: ["new client", "onboarding", "setup", "account creation"],
            lastUpdated: "2023-10-26",
            content: `
                <p class="mb-4 text-gray-700">This procedure outlines the steps to successfully onboard a new client into our system and ensure they have a smooth start.</p>
            `,
            checklist: [
                { text: "Greet the client and introduce yourself and the company.", completed: false },
                { text: "Verify client's identity and gather necessary contact information.", completed: false },
                { text: "Explain the service/product package they have signed up for.", completed: false },
                { text: "Create client account in the CRM system.", completed: false, link: "http://internal-crm.example.com/new-client" },
                { text: "Configure initial settings based on client requirements.", completed: false },
                { text: "Provide client with login credentials and welcome pack.", completed: false },
                { text: "Explain how to access support channels.", completed: false },
                { text: "Schedule a follow-up call/check-in if applicable.", completed: false }
            ],
            relatedArticles: ["ts001", "form001"] // IDs of related articles
        },
        {
            id: "ts001",
            categoryId: "troubleshooting",
            title: "Internet Connectivity Issues",
            tags: ["internet", "no connection", "slow internet", "wifi"],
            lastUpdated: "2023-10-25",
            content: `
                <p class="mb-4 text-gray-700">Follow these steps to diagnose and resolve common internet connectivity problems reported by clients.</p>
            `,
            checklist: [
                { text: "Ask client to describe the issue (no internet, slow, intermittent).", completed: false },
                { text: "Verify modem/router lights (Power, DSL/WAN, Internet, Wi-Fi).", completed: false },
                { text: "Instruct client to restart modem and router (unplug for 30s, plug back in).", completed: false },
                { text: "Instruct client to restart their computer/device.", completed: false },
                { text: "Check for any reported outages in the client's area.", completed: false, internal_tool: "http://outage-map.example.com" },
                { text: "If Wi-Fi issue, ask client to connect via Ethernet cable if possible.", completed: false },
                { text: "Guide client through checking network adapter settings.", completed: false },
                { text: "If issue persists, escalate to Tier 2 support with collected information.", completed: false, escalation_procedure: "proc005" }
            ],
            importantNotes: [
                "Always maintain a patient and empathetic tone.",
                "Document all steps taken in the support ticket."
            ]
        },
        {
            id: "comp001",
            categoryId: "complaints_handling",
            title: "Handling an Upset Customer",
            tags: ["complaint", "angry customer", "de-escalation"],
            lastUpdated: "2023-10-20",
            content: `
                <p class="mb-4 text-gray-700">A step-by-step guide to de-escalate situations with upset customers and work towards a resolution.</p>
            `,
            checklist: [
                { text: "Listen actively without interrupting (let them vent).", completed: false },
                { text: "Empathize with their frustration (e.g., 'I understand this must be frustrating').", completed: false },
                { text: "Apologize for the inconvenience, even if not directly our fault.", completed: false },
                { text: "Restate the problem to ensure understanding.", completed: false },
                { text: "Assure them you will help find a solution.", completed: false },
                { text: "Gather all necessary facts and investigate.", completed: false },
                { text: "Offer a clear solution or a timeline for one.", completed: false },
                { text: "Follow up to ensure satisfaction.", completed: false }
            ]
        },
        // --- Initial "Support" section example ---
        {
            id: "sup001",
            categoryId: "basic_procedures", // Or a dedicated "Support" category if preferred
            title: "Initial Support Call Flow",
            tags: ["support", "call flow", "first contact"],
            lastUpdated: "2023-10-27",
            content: `
                <p class="mb-4 text-gray-700">Standard flow for handling an initial support call to ensure all necessary information is gathered efficiently and professionally.</p>
            `,
            checklist: [
                { text: "Answer call within 3 rings with standard greeting: 'Thank you for calling [Company Name] Support, my name is [Your Name]. How can I help you today?'", completed: false },
                { text: "Listen actively to the customer's issue/request.", completed: false },
                { text: "Verify customer identity (e.g., account number, email, or other security questions).", completed: false },
                { text: "If new issue, create a new support ticket in the system.", completed: false, link: "http://ticketing-system.example.com/new" },
                { text: "If existing issue, retrieve the existing ticket.", completed: false },
                { text: "Clearly restate the issue to confirm understanding.", completed: false },
                { text: "Attempt first-call resolution using available knowledge base articles.", completed: false },
                { text: "If unable to resolve, gather all necessary details for escalation or further investigation.", completed: false },
                { text: "Provide the customer with the ticket number and an estimated time for resolution or next steps.", completed: false },
                { text: "Confirm if there's anything else you can assist with before ending the call.", completed: false },
                { text: "Thank the customer for calling.", completed: false }
            ],
            commonMistakes: [
                "Not verifying customer identity properly.",
                "Failing to create or update a support ticket.",
                "Over-promising on resolution times."
            ]
        }
        // Add more articles for other categories...
    ]
};
