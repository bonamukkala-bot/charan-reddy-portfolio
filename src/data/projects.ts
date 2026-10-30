export interface Project {
  id: string;
  slug: string;
  indexNumber: string;
  title: string;
  category: 'AI & Agents' | 'Full-stack' | 'Client' | 'Hackathon' | 'Full-Stack / E-commerce' | 'ML / Sports Analytics';
  isFeatured: boolean;
  featured?: boolean;
  showInMoreWork?: boolean;
  stripText?: string;
  tagline: string;
  problem: string;
  whatIBuilt: string;
  tags: string[];
  githubUrl: string;
  liveUrl?: string;
  images?: string[];
  videoUrl?: string;
  facts: { label: string; value: string }[];
  approach: string;
  architecture: {
    title: string;
    description: string;
    steps: { step: string; detail: string }[];
  };
  keyDecisions: {
    decision: string;
    rationale: string;
  }[];
  clientOrContext?: string;
}

export const featuredProjects: Project[] = [
  {
    id: 'recruitmate-ai',
    slug: 'recruitmate-ai',
    indexNumber: '01',
    title: 'RecruitMate AI',
    category: 'AI & Agents',
    isFeatured: true,
    tagline: 'Solo-built multi-tenant AI recruitment platform with 7 specialized agents',
    problem:
      'Hiring teams struggle to manually parse job descriptions, generate role-specific interview assessments, and evaluate candidate responses consistently across high-volume pipelines.',
    whatIBuilt:
      'A full-stack, solo-built multi-tenant AI recruitment platform. Features seven specialized AI agents (JD parser, resume screener, question generator, AI interviewer, answer evaluator, scheduler, and candidate comparator) plus an automated email sender. Implements custom JWT authentication, token-based public interview links, server-side Cloudflare Turnstile verification, and approximately 28 API endpoints across 4 Flask blueprints.',
    tags: ['React', 'Flask', 'MongoDB', 'Groq', 'JWT', 'Cloudflare Turnstile'],
    githubUrl: 'https://github.com/bonamukkala-bot/RecruitMate',
    liveUrl: 'https://recruit-mate-chi.vercel.app',
    images: ['1.png', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg', '6.jpeg', '7.jpeg'],
    clientOrContext: 'Solo-built SaaS Platform',
    facts: [
      { label: 'Architecture', value: '7 AI Agents in One Platform' },
      { label: 'Backend API', value: '~28 Endpoints Across 4 Flask Blueprints' },
      { label: 'Security', value: 'Custom JWT + Server-Side Cloudflare Turnstile' },
    ],
    approach:
      'Orchestrated 7 specialized agents each handling an atomic stage of the hiring funnel: JD parsing, resume screening against structured rubrics, tailored question generation, synchronous AI interviewing, automated answer evaluation, scheduling, and candidate comparison.',
    architecture: {
      title: '7-Agent Hiring Orchestration Pipeline',
      description: 'Role-specialized multi-agent workflow from job description to comparative ranking.',
      steps: [
        { step: '01 JD Parser', detail: 'Extracts core competencies, must-have skills, and evaluation criteria into structured models.' },
        { step: '02 Resume Screener', detail: 'Parses incoming resumes and screens candidate credentials against the structured JD criteria.' },
        { step: '03 Question Generator', detail: 'Dynamically synthesizes role-specific technical and behavioral questions.' },
        { step: '04 AI Interviewer & Evaluator', detail: 'Conducts token-based candidate sessions and objectively scores responses against standardized rubrics.' },
        { step: '05 Comparator & Scheduler', detail: 'Benchmarks candidate scores across applicants and dispatches scheduling notifications via email sender.' },
      ],
    },
    keyDecisions: [
      {
        decision: 'Agent specialization over a monolithic prompt',
        rationale: 'Decoupling JD parsing, questioning, evaluation, and comparison into 7 distinct agents with dedicated prompts eliminated role confusion and ensured reliable evaluations.',
      },
      {
        decision: 'Token-based public interview links with Cloudflare Turnstile',
        rationale: 'Allows candidates to complete interviews securely without creating full recruiter accounts, while server-side Turnstile verification stops automated bot submissions.',
      },
    ],
  },
  {
    id: 'atelier',
    slug: 'atelier',
    indexNumber: '02',
    title: 'Atelier',
    category: 'Full-Stack / E-commerce',
    isFeatured: true,
    tagline: 'Premium furniture storefront + admin CRM — React, Vite, Supabase',
    problem:
      'Furniture shops frequently struggle with complex, high-friction checkout carts when bespoke buyers prefer asking questions about materials, custom dimensions, and delivery directly via phone or WhatsApp.',
    whatIBuilt:
      'A premium furniture storefront with an admin CRM, built as a freelance portfolio piece for furniture shops. Customers contact the shop through WhatsApp or call instead of a cart and checkout.',
    tags: ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Framer Motion', 'Groq'],
    githubUrl: 'https://github.com/bonamukkala-bot/atelier-furniture-shop',
    liveUrl: 'https://atelier-furniture-shop.vercel.app',
    images: ['1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg', '6.jpeg', '7.jpeg', '8.jpeg', '9.jpeg', '10.jpeg', '11.jpeg', '12.jpeg'],
    clientOrContext: 'Freelance Portfolio Piece',
    facts: [
      { label: 'Storefront', value: 'Product catalog with WhatsApp / call contact flow' },
      { label: 'Admin CRM', value: 'Product CRUD with multi-image upload and order tracking' },
      { label: 'AI + Languages', value: 'Groq-powered chatbot (Edge Function) and English / Telugu / Hindi toggle' },
    ],
    approach:
      'Built a high-end furniture showcase prioritizing visual clarity and direct communication over cart friction. Provided shop owners with a full admin portal for inventory management and customer order tracking.',
    architecture: {
      title: 'Storefront & Backoffice CRM Architecture',
      description: 'Customer Storefront (React + Vite) -> Supabase (database + storage) -> Admin CRM (orders + products).',
      steps: [
        { step: '01 Storefront Catalog', detail: 'Responsive furniture catalog with multi-language toggle (English, Telugu, Hindi) and WhatsApp/call contact triggers.' },
        { step: '02 Groq Chatbot (Edge Function)', detail: 'Edge-deployed conversational assistant answering customer questions on dimensions, wood types, and availability.' },
        { step: '03 Supabase Database & Storage', detail: 'PostgreSQL database and bucket storage managing product specifications and multi-angle photo uploads.' },
        { step: '04 Admin CRM Portal', detail: 'Secured dashboard for shop management providing product CRUD and order status tracking.' },
      ],
    },
    keyDecisions: [
      {
        decision: 'Direct WhatsApp and Call contact flow instead of standard cart checkout',
        rationale: 'Bespoke high-ticket furniture purchases involve custom measurements and customer consultations; direct phone/WhatsApp handoff matches buyer expectations.',
      },
      {
        decision: 'Trilingual interface (English, Telugu, Hindi)',
        rationale: 'Broadens accessibility for regional and national buyers looking for bespoke craftsmanship in India.',
      },
    ],
  },
  {
    id: 'ipl-win-predictor',
    slug: 'ipl-win-predictor',
    indexNumber: '03',
    title: 'IPL Win Predictor',
    category: 'ML / Sports Analytics',
    isFeatured: true,
    tagline: 'IPL 2026 Win Predictor: 88.73% accuracy ML model with XGBoost, LightGBM, Random Forest, SHAP explanations, FastAPI + React',
    problem:
      'Cricket match forecasting requires evaluating complex historical patterns across past seasons while providing transparent explanations for prediction outputs rather than uncalibrated black-box guesses.',
    whatIBuilt:
      'An IPL match outcome prediction system built with an 88.73% accuracy machine learning model using XGBoost, LightGBM, and Random Forest with SHAP explanations. Features a FastAPI backend, an interactive React frontend, and a Docker Compose setup in the repository, trained on 17 seasons of IPL data.',
    tags: ['XGBoost', 'LightGBM', 'Random Forest', 'SHAP', 'FastAPI', 'React', 'Docker'],
    githubUrl: 'https://github.com/bonamukkala-bot/ipl-win-predictor',
    liveUrl: 'https://charan-reddy222-ipl-win-predictor.hf.space/',
    clientOrContext: 'Machine Learning Project',
    facts: [
      { label: 'Accuracy', value: '88.73% accuracy' },
      { label: 'Dataset', value: 'Trained on 17 IPL seasons' },
      { label: 'Explainability', value: 'SHAP explanations' },
    ],
    approach:
      'Trained XGBoost, LightGBM, and Random Forest models on 17 seasons of historical IPL match records, integrated SHAP values for granular feature attribution, and served predictions through a FastAPI backend to an interactive React frontend.',
    architecture: {
      title: 'Prediction Pipeline',
      description: 'IPL data (17 seasons) -> XGBoost / LightGBM / Random Forest -> SHAP explanations -> FastAPI -> React UI.',
      steps: [
        { step: '01 IPL Data', detail: 'Trained on 17 seasons of historical IPL match data.' },
        { step: '02 ML Models', detail: 'Ensemble of XGBoost, LightGBM, and Random Forest models.' },
        { step: '03 SHAP Explanations', detail: 'Feature attribution and interpretability for prediction factors.' },
        { step: '04 Full-Stack Delivery', detail: 'FastAPI backend, React frontend, and Docker Compose orchestration.' },
      ],
    },
    keyDecisions: [
      {
        decision: 'Ensemble of XGBoost, LightGBM, and Random Forest',
        rationale: 'Combining gradient-boosted trees and random forest models maximizes predictive stability across varied match conditions.',
      },
      {
        decision: 'SHAP feature attribution integration',
        rationale: 'Provides transparent insight into which in-game factors drive win probabilities instead of relying on opaque predictions.',
      },
    ],
  },
  {
    id: 'charan-estates',
    slug: 'charan-estates',
    indexNumber: '04',
    title: 'charanEstates',
    category: 'Full-stack',
    isFeatured: true,
    tagline: 'Real-estate web application with dynamic property discovery filters',
    problem:
      'Home searchers need a straightforward interface to browse property listings by category, budget, and location without cluttered third-party advertisements.',
    whatIBuilt:
      'A full-stack real-estate web application featuring interactive property browsing, structured listing views, category filtering, and clean responsive layouts.',
    tags: ['React', 'TypeScript', 'Tailwind', 'Web App'],
    githubUrl: 'https://github.com/bonamukkala-bot/charanEstates',
    liveUrl: 'https://charan-estates.vercel.app/',
    clientOrContext: 'Full-stack Web Application',
    facts: [
      { label: 'Focus', value: 'Property Discovery & Filter Architecture' },
      { label: 'Design', value: 'Mobile-Responsive Real Estate Interface' },
      { label: 'Stack', value: 'React + TypeScript + Tailwind' },
    ],
    approach:
      'Designed a clean catalog interface with client-side state filtering for quick navigation across property types.',
    architecture: {
      title: 'Property Listing & Filter Architecture',
      description: 'User Search -> Category Filters -> Property Detail Views.',
      steps: [
        { step: '01 Discovery Interface', detail: 'Search and filter listings by property category.' },
        { step: '02 Responsive Cards', detail: 'Structured display of property dimensions and amenities.' },
      ],
    },
    keyDecisions: [
      {
        decision: 'Client-side filter architecture',
        rationale: 'Provides instantaneous filter feedback across listings with zero network latency.',
      },
    ],
  },
  {
    id: 'sri-vishnu-grand-pg',
    slug: 'sri-vishnu-grand-pg',
    indexNumber: '05',
    title: 'Sri Vishnu Grand PG',
    category: 'Client',
    isFeatured: true,
    tagline: 'Production website for a hostel/PG business in Gachibowli, Hyderabad',
    problem:
      'A hostel and PG business in Gachibowli, Hyderabad needed a modern web presence to handle inquiries automatically, present room amenities, and guide prospective residents without repetitive manual phone calls.',
    whatIBuilt:
      'A production website for a hostel and paying-guest business in Gachibowli, Hyderabad. Engineered with React, TypeScript, Vite, Tailwind CSS, TanStack Router, Framer Motion, and deployed on Vercel. Features a Groq-powered AI chatbot deployed on a Vercel Edge Function with room booking flow, WhatsApp handoff buttons, and inline Google Maps integration; a blog system; an animated "Nearby Locations" section; and a comprehensive SEO setup including LodgingBusiness and FAQPage JSON-LD, GA4 analytics, Google Search Console, sitemap, and llms.txt.',
    tags: ['React', 'TypeScript', 'Vite', 'Tailwind', 'TanStack Router', 'Groq', 'Vercel Edge Functions'],
    githubUrl: 'https://github.com/bonamukkala-bot/srivishnugrandpg',
    liveUrl: 'https://srivishnugrandpg.com',
    videoUrl: '/projects/srivishnu/demo.mp4',
    clientOrContext: 'Commercial Client — Hospitality (Hyderabad)',
    facts: [
      { label: 'Conversational Concierge', value: 'Groq AI Chatbot on Vercel Edge Function' },
      { label: 'Direct Handoff', value: 'WhatsApp Booking Flow + Inline Google Maps' },
      { label: 'Structured SEO', value: 'LodgingBusiness & FAQPage JSON-LD + llms.txt' },
    ],
    approach:
      'Built a fast, accessible web platform tailored for mobile students and IT professionals. Equipped the site with an edge-deployed conversational assistant that answers amenity and pricing questions before handing qualified leads directly to the owner via WhatsApp.',
    architecture: {
      title: 'Visitor Concierge & Direct Owner Handoff Architecture',
      description: 'Edge-function chatbot handles initial triage; structured JSON-LD powers local discovery.',
      steps: [
        { step: '01 Local Structured SEO', detail: 'LodgingBusiness and FAQPage Schema.org structured data for local search discovery.' },
        { step: '02 Edge-Deployed Chatbot', detail: 'Vercel Edge Function with Groq answers inquiries on room types and amenities with zero cold starts.' },
        { step: '03 WhatsApp Booking Handoff', detail: 'Direct pre-filled WhatsApp link passes user requirements directly to hostel management.' },
        { step: '04 Location & Navigation', detail: 'Interactive distance calculator for Gachibowli IT corridor and colleges with inline maps.' },
      ],
    },
    keyDecisions: [
      {
        decision: 'Vercel Edge Functions for the Groq AI chatbot',
        rationale: 'Runs globally with sub-50ms execution overhead and eliminates heavy server containers for simple conversational triage.',
      },
      {
        decision: 'Pre-filled WhatsApp message buttons',
        rationale: 'Aligns with the local communication preference in Hyderabad, converting online visitors to direct chats in one tap.',
      },
    ],
  },
];

export const moreProjects: Project[] = [
  {
    id: 'ai-business-doctor',
    slug: 'ai-business-doctor',
    indexNumber: '06',
    title: 'AI Business Doctor',
    category: 'AI & Agents',
    isFeatured: false,
    featured: false,
    showInMoreWork: true,
    stripText: 'SMB Diagnostics Platform',
    tagline: 'Diagnostic platform for SMB sales & inventory data using a medical metaphor',
    problem:
      'Small business owners collect daily sales and inventory records but lack accessible tools to identify dead inventory, profit leaks, or reorder urgency before cash flow suffers.',
    whatIBuilt:
      'A diagnostic platform for small business sales and inventory data using a medical diagnostic metaphor (vitals, diagnosis, prescription, consultation). Built with FastAPI, pandas, NumPy, React 19, Vite, Recharts, and Groq (Llama 4 Scout). Generates a transparent 0–100 business health score, profit driver analysis, stop-selling detection, reorder alerts, anomaly detection, priority actions ranked by rupee impact, a session-memory "Consult the Doctor" chat, Board Meeting presentation mode, and PDF report export.',
    tags: ['FastAPI', 'pandas', 'NumPy', 'React 19', 'Recharts', 'Groq (Llama 4 Scout)'],
    githubUrl: 'https://github.com/bonamukkala-bot/ai-business-doctor',
    liveUrl: 'https://ai-business-doctor.vercel.app',
    clientOrContext: 'SMB Diagnostics Platform',
    facts: [
      { label: 'Math Reliability', value: '100% Deterministic pandas/NumPy Calculations' },
      { label: 'Scoring Engine', value: '0–100 Transparent Health Metric' },
      { label: 'Language Layer', value: 'Groq (Llama 4 Scout) Session Consultation' },
    ],
    approach:
      'Strict separation of math and language: all health scores, anomaly detections, and rupee-impact rankings are computed deterministically in pandas and NumPy. The Groq LLM is strictly utilized to provide natural language explanations, consultative Q&A, and board summaries.',
    architecture: {
      title: 'Deterministic Financial Analytics + Medical Diagnostic UI',
      description: 'Decoupled data pipeline: verified mathematical calculation feeds the linguistic diagnostic engine.',
      steps: [
        { step: '01 CSV / Ledger Ingest', detail: 'Ingests transaction and inventory exports and normalizes columns into standardized schemas.' },
        { step: '02 Deterministic Health Calculation', detail: 'Computes vital indicators: profit drivers, stop-selling signals, and reorder urgency in pandas.' },
        { step: '03 Rupee Impact Ranking', detail: 'Ranks priority actions by calculated monetary impact rather than subjective LLM guesses.' },
        { step: '04 Consult the Doctor (Groq)', detail: 'Llama 4 Scout on Groq provides natural language consultations with session memory and PDF export.' },
      ],
    },
    keyDecisions: [
      {
        decision: 'Computing all numbers in pandas rather than asking the LLM to calculate',
        rationale: 'LLMs can introduce subtle arithmetic errors. Decoupling mathematical computation guarantees that every figure and rupee ranking is 100% accurate and verifiable.',
      },
      {
        decision: 'Medical diagnostic UI metaphor',
        rationale: 'Framing complex financial ratios as "Vitals", "Diagnosis", and "Prescriptions" makes technical metrics immediately intuitive for non-finance business owners.',
      },
    ],
  },
  {
    id: 'hackerrank-orchestrate',
    slug: 'hackerrank-orchestrate-june26',
    indexNumber: '07',
    title: 'HackerRank Orchestrate (June 2026)',
    category: 'Hackathon',
    isFeatured: false,
    featured: false,
    showInMoreWork: true,
    stripText: 'HackerRank Orchestrate Competition',
    tagline: 'Autonomous multi-agent AI pipeline for insurance damage-claim verification',
    problem:
      'Insurance claim verification for damaged personal assets (automobiles, laptops, shipping parcels) is slowed down by manual photo inspections and repetitive policy clause cross-referencing.',
    whatIBuilt:
      'An autonomous multi-agent AI pipeline for insurance damage-claim verification built for HackerRank Orchestrate (June 2026). Utilizes vision-language models (VLMs) for image-based damage inspection, risk assessment, and policy synthesis across car, laptop, and package claims.',
    tags: ['Python', 'Vision LLMs', 'Multi-Agent', 'Image Analysis', 'Policy Synthesis'],
    githubUrl: 'https://github.com/bonamukkala-bot/hackerrank-orchestrate-june26',
    clientOrContext: 'HackerRank Orchestrate Competition',
    facts: [
      { label: 'Domain Pipeline', value: 'VLM Image Analysis + Policy Synthesis' },
      { label: 'Claim Scope', value: 'Automobile, Laptop & Package Damages' },
      { label: 'Workflow', value: 'Autonomous Claim Verification Pipeline' },
    ],
    approach:
      'Built a three-stage multi-agent verification pipeline where uploaded claim photos undergo VLM visual inspection to assess physical damage severity, followed by policy cross-referencing and automated claim synthesis.',
    architecture: {
      title: '3-Stage Multi-Agent Insurance Adjudication',
      description: 'Photos -> VLM Image Analysis -> Risk Assessment -> Policy Synthesis -> Decision.',
      steps: [
        { step: '01 Claim Photo Intake', detail: 'Ingests uploaded photos for car dents, cracked laptop screens, or damaged parcels.' },
        { step: '02 VLM Image Analysis', detail: 'Vision-language models inspect physical damage location, severity, and component impact.' },
        { step: '03 Risk Assessment', detail: 'Evaluates damage plausibility against reported incident details and historical risk indicators.' },
        { step: '04 Policy Synthesis & Decision', detail: 'Cross-references asset coverage criteria and synthesizes a verified claim decision.' },
      ],
    },
    keyDecisions: [
      {
        decision: 'Structured damage taxonomy for VLM prompts',
        rationale: 'Constraining visual inspection to explicit damage categories prevented ambiguous descriptions and allowed reliable policy clause matching.',
      },
    ],
  },
  {
    id: 'sentinel-agent',
    slug: 'sentinel-agent',
    indexNumber: '08',
    title: 'Sentinel Agent',
    category: 'Hackathon',
    isFeatured: false,
    featured: false,
    showInMoreWork: true,
    stripText: 'Container Log Diagnostics & Monitoring',
    tagline: 'AI agent for containerized microservice monitoring and incident diagnostics',
    problem:
      'Diagnosing microservice anomalies across container logs requires inspecting error traces, correlating log timestamps, and isolating root-cause containers.',
    whatIBuilt:
      'An AI agent built for containerized microservice monitoring, automated incident diagnostics, and error pattern inspection across Docker environments.',
    tags: ['Python', 'Docker', 'AI Agent', 'Diagnostics', 'Hackathon'],
    githubUrl: 'https://github.com/bonamukkala-bot/sentinel-agent',
    clientOrContext: 'Hackathon Project',
    facts: [
      { label: 'Scope', value: 'Container Log Diagnostics & Monitoring' },
      { label: 'Architecture', value: 'Autonomous Inspection Agent' },
      { label: 'Runtime', value: 'Python + Dockerized Services' },
    ],
    approach:
      'Equipped an AI agent with container log inspection tools to parse error exceptions and summarize diagnostic steps.',
    architecture: {
      title: 'Container Telemetry Diagnostic Loop',
      description: 'Log Stream -> Anomaly Inspection -> Diagnostic Summary.',
      steps: [
        { step: '01 Log Intake', detail: 'Collects container logs and inspects for exception traces.' },
        { step: '02 Anomaly Reasoning', detail: 'AI model isolates culprit service and formats incident summary.' },
      ],
    },
    keyDecisions: [
      {
        decision: 'Agent-driven log correlation',
        rationale: 'Automates first-pass triage to pinpoint error lines before human manual inspection.',
      },
    ],
  },
  {
    id: 'nuerax-hackathon',
    slug: 'nuerax-hackathon',
    indexNumber: '09',
    title: 'Nuerax Hackathon',
    category: 'Hackathon',
    isFeatured: false,
    featured: false,
    showInMoreWork: true,
    stripText: 'Adaptive Learning Assistant Concept',
    tagline: 'Adaptive AI assistant project developed during hackathon competition',
    problem:
      'Standardized learning materials often present complex technical subjects in monolithic blocks without adaptive pacing or interactive checkpoints.',
    whatIBuilt:
      'An adaptive AI assistant project designed to assist learning through structured topic breakdowns and interactive pacing, developed during a hackathon competition.',
    tags: ['React', 'Python', 'AI Assistant', 'Hackathon'],
    githubUrl: 'https://github.com/bonamukkala-bot/nuerax-hackathon',
    clientOrContext: 'Hackathon Project',
    facts: [
      { label: 'Scope', value: 'Adaptive Learning Assistant Concept' },
      { label: 'Delivery', value: 'Interactive Concept Decomposition' },
      { label: 'Context', value: 'Built in Hackathon Sprint' },
    ],
    approach:
      'Prototyped a conversational learning interface that decomposes complex concepts into sequential stepping stones.',
    architecture: {
      title: 'Adaptive Concept Stepping Architecture',
      description: 'Topic Input -> Concept Decomposition -> Interactive Checkpoint.',
      steps: [
        { step: '01 Topic Ingestion', detail: 'Parses complex topic prompt into manageable sub-modules.' },
        { step: '02 Interactive Checkpoints', detail: 'Presents guided steps with verification prompts.' },
      ],
    },
    keyDecisions: [
      {
        decision: 'Chunked concept delivery',
        rationale: 'Improves comprehension by avoiding overwhelming technical text walls.',
      },
    ],
  },
];

export const allProjects: Project[] = [...featuredProjects, ...moreProjects];
