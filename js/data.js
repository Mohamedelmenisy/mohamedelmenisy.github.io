// js/data.js

// Knowledge base system data, with cases initialized empty for Supabase integration.

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
            cases: [], // Populated from Supabase
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
            ],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: []
        },
        {
            id: "logistics",
            name: "Logistics",
            icon: "fas fa-truck",
            themeColor: "green",
            description: "Documentation related to logistics operations, supply chain management, and transportation.",
            articles: [],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: []
        },
        {
            id: "customer_care",
            name: "Customer Care",
            icon: "fas fa-users",
            themeColor: "indigo",
            description: "Guidelines and best practices for providing excellent customer care and support.",
            articles: [],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: []
        },
        {
            id: "dist_follow_up",
            name: "Distribution & Follow up",
            icon: "fas fa-people-carry",
            themeColor: "cyan",
            description: "Procedures for product distribution and post-delivery follow-up with customers and partners.",
            articles: [
                {
                    id: "df001",
                    title: "Post-Delivery Follow-Up Protocol",
                    tags: ["follow-up", "distribution", "customer satisfaction"],
                    lastUpdated: "2023-11-15",
                    contentPath: "articles/dist_follow_up/df001.html",
                    summary: "Guidelines for conducting follow-up after product delivery to ensure customer satisfaction."
                }
            ],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: [
                { term: "POD", definition: "Proof of Delivery - Documentation confirming that a shipment has been delivered to the recipient." }
            ]
        },
        {
            id: "logistics_driver",
            name: "Logistics (Driver Complaints)",
            icon: "fas fa-truck-loading",
            themeColor: "red",
            description: "Resources for handling driver-related complaints and issues in logistics operations.",
            articles: [
                {
                    id: "ld001",
                    title: "Resolving Driver Complaints",
                    tags: ["driver", "complaints", "logistics"],
                    lastUpdated: "2023-11-01",
                    contentPath: "articles/logistics_driver/ld001.html",
                    summary: "Steps to address and resolve complaints from drivers effectively."
                }
            ],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: []
        },
        {
            id: "logistics_3pl",
            name: "Logistics-3PL",
            icon: "fas fa-warehouse",
            themeColor: "purple",
            description: "Information on managing third-party logistics (3PL) providers and their integration.",
            articles: [
                {
                    id: "l3pl001",
                    title: "3PL Provider Onboarding",
                    tags: ["3PL", "logistics", "onboarding"],
                    lastUpdated: "2023-10-20",
                    contentPath: "articles/logistics_3pl/l3pl001.html",
                    summary: "Process for onboarding and integrating third-party logistics providers."
                }
            ],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: [
                { term: "3PL", definition: "Third-Party Logistics - Outsourcing logistics and supply chain operations to a third-party provider." }
            ]
        },
        {
            id: "order_at_store",
            name: "Order at Store (Mac)",
            icon: "fas fa-store",
            themeColor: "yellow",
            description: "Guides for managing in-store orders, specifically for Mac-based systems.",
            articles: [
                {
                    id: "os001",
                    title: "Processing In-Store Orders",
                    tags: ["in-store", "orders", "Mac"],
                    lastUpdated: "2023-11-05",
                    contentPath: "articles/order_at_store/os001.html",
                    summary: "How to process customer orders using Mac-based systems in-store."
                }
            ],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: []
        },
        {
            id: "logistics_admin",
            name: "Logistics-Admin",
            icon: "fas fa-clipboard-list",
            themeColor: "gray",
            description: "Administrative resources and procedures for logistics operations.",
            articles: [
                {
                    id: "la001",
                    title: "Logistics Reporting Guidelines",
                    tags: ["reporting", "logistics", "admin"],
                    lastUpdated: "2023-11-12",
                    contentPath: "articles/logistics_admin/la001.html",
                    summary: "Best practices for generating and submitting logistics reports."
                }
            ],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: []
        },
        {
            id: "os",
            name: "Operating Systems",
            icon: "fas fa-desktop",
            themeColor: "sky",
            description: "Documentation for operating systems used across the organization.",
            articles: [
                {
                    id: "os001",
                    title: "OS Configuration Guide",
                    tags: ["operating systems", "configuration"],
                    lastUpdated: "2023-10-30",
                    contentPath: "articles/os/os001.html",
                    summary: "Guide for configuring operating systems for organizational use."
                }
            ],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: [
                { term: "OS", definition: "Operating System - Software that manages computer hardware and software resources." }
            ]
        },
        {
            id: "compensation",
            name: "Compensation Policies",
            icon: "fas fa-money-check-alt",
            themeColor: "lime",
            description: "Policies and guidelines related to employee and partner compensation.",
            articles: [
                {
                    id: "comp001",
                    title: "Compensation Policy Overview",
                    tags: ["compensation", "policy"],
                    lastUpdated: "2023-11-08",
                    contentPath: "articles/compensation/comp001.html",
                    summary: "Overview of the organization's compensation policies for employees and partners."
                }
            ],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: []
        },
        {
            id: "op_instructions",
            name: "Operational Instructions",
            icon: "fas fa-book-open",
            themeColor: "pink",
            description: "Detailed operational instructions for various departments and processes.",
            articles: [
                {
                    id: "oi001",
                    title: "Standard Operating Procedures",
                    tags: ["SOP", "operations"],
                    lastUpdated: "2023-11-03",
                    contentPath: "articles/op_instructions/oi001.html",
                    summary: "Collection of standard operating procedures for daily operations."
                }
            ],
            cases: [], // Populated from Supabase
            subCategories: [],
            glossary: []
        },
        {
            id: "forms_templates",
            name: "Forms/Templates",
            icon: "fas fa-file-alt",
            themeColor: "amber",
            description: "Collection of forms and templates for various organizational needs.",
            articles: [],
            cases: [], // Populated from Supabase
            items: [
                {
                    id: "ft001",
                    title: "Client Onboarding Checklist",
                    type: "template",
                    description: "Checklist for onboarding new clients.",
                    url: "templates/client_onboarding_checklist.pdf"
                },
                {
                    id: "ft002",
                    title: "Support Ticket Form",
                    type: "form",
                    description: "Form for submitting support tickets.",
                    url: "forms/support_ticket_form.pdf"
                }
            ],
            subCategories: [],
            glossary: []
        }
    ]
};
