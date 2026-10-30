export interface Service {
  id: string;
  number: string;
  title: string;
  tagline: string;
  description: string;
  deliverables: string[];
  techStack: string[];
  idealFor: string;
}

export const servicesData: Service[] = [
  {
    id: 'ai-agents-chatbots',
    number: '01',
    title: 'AI Chatbots & Multi-Agent Systems',
    tagline: 'WhatsApp, web concierge, and multi-agent task pipelines',
    description:
      'Custom LLM-powered assistants engineered for specific operational flows. I build systems with structured outputs, vector knowledge retrieval, WhatsApp integrations, and specialized agent tasks.',
    deliverables: [
      'WhatsApp Business API integration & web chat widgets',
      'RAG knowledge retrieval over custom company documents & FAQs',
      'Multi-agent task pipelines with role specialization',
      'Bilingual Telugu & English conversational flows',
    ],
    techStack: ['Python', 'FastAPI', 'Groq', 'Flask', 'PostgreSQL', 'LangChain'],
    idealFor: 'Hostels, agencies, and businesses with high customer inquiry volumes.',
  },
  {
    id: 'business-websites',
    number: '02',
    title: 'Business Websites That Rank & Convert',
    tagline: 'Fast React architecture, structured schema, and local search setup',
    description:
      'Engineered web applications built for speed, clean responsiveness, and high conversion. I implement semantic markup, local SEO structured data, and direct lead handoff systems.',
    deliverables: [
      'Mobile-first React / TypeScript / Vite or Next.js engineering',
      'Local Hyderabad & regional structured data (Schema.org JSON-LD)',
      'Direct WhatsApp and email lead capture integrations',
      'Optimized performance, fast load times, and clean UI',
    ],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vercel', 'TanStack Router'],
    idealFor: 'Local businesses, founders, luxury studios, and commercial services.',
  },
  {
    id: 'ai-automation-dashboards',
    number: '03',
    title: 'AI Automation For Small Businesses',
    tagline: 'Custom diagnostics, automated workflows, and data processing',
    description:
      'Replace manual spreadsheet copy-pasting and repetitive analysis with deterministic software. I build web dashboards that compute business metrics and generate actionable summaries.',
    deliverables: [
      'Deterministic sales, inventory, and expense diagnostics in pandas',
      'Custom internal portals and order tracking workflows',
      'Automated data ingestion and report generation',
      'Clean interactive dashboards with Recharts & export features',
    ],
    techStack: ['FastAPI', 'React', 'Python Pandas', 'NumPy', 'Tailwind'],
    idealFor: 'SMB owners, retail shops, wholesale distributors, and founders.',
  },
];

export const processSteps = [
  {
    number: '01',
    title: 'Discuss & Scope',
    timeframe: 'Initial Consultation', // [CONFIRM: adjust timeframe estimate as needed]
    description:
      'I discuss your specific business problem, technical requirements, and target timeline. We establish clear, agreed deliverables and project scope before writing any code.',
  },
  {
    number: '02',
    title: 'Build & Iterate',
    timeframe: 'Active Development', // [CONFIRM: adjust timeframe estimate as needed]
    description:
      'I build the working product in transparent stages. You receive staging links to review features, provide feedback, and verify real progress.',
  },
  {
    number: '03',
    title: 'Launch & Handoff',
    timeframe: 'Deployment', // [CONFIRM: adjust timeframe estimate as needed]
    description:
      'I deploy the application to production on your domain with SSL, edge caching, and complete code handoff with documentation.',
  },
];

export const serviceMeta = {
  turnaroundNote: 'Turnaround timeline depends on project scope and deliverables.', // [CONFIRM: update if you have a standard SLA]
};
