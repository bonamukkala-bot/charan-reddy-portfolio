export interface SiteConfig {
  name: string;
  fullName: string;
  role: string;
  tagline: string;
  subheadline: string;
  location: {
    city: string;
    country: string;
    timezone: string;
  };
  contact: {
    email: string;
    // WHATSAPP_NUMBER: If empty string, WhatsApp buttons throughout the site are hidden.
    // e.g. "919900000000" (country code + phone number without + or spaces)
    whatsappNumber: string;
    responseSpeed: string;
  };
  status: {
    openForWork: boolean;
    openForWorkLabel: string;
    nowBuilding: string;
    languages: string;
    greetingTelugu: string;
  };
  stats: {
    value: string;
    label: string;
    suffix?: string;
    description: string;
  }[];
  stackMarquee: string[];
  secondaryMarquee: string[];
  principles: {
    number: string;
    title: string;
    description: string;
  }[];
  currentFocus: {
    title: string;
    description: string;
  }[];
}

export const siteConfig: SiteConfig = {
  name: "Charan",
  fullName: "Bonamukkala Charan Reddy",
  role: "Generative AI Engineer & Developer",
  tagline: "I build AI products that actually ship.",
  subheadline:
    "Multi-agent systems, full-stack products, and client work. Second-year B.Sc Computer Science student at NIAT Hyderabad (degree via BITS Pilani), specializing in Generative AI.",
  location: {
    city: "Hyderabad",
    country: "India",
    timezone: "Asia/Kolkata",
  },
  contact: {
    email: "bonamukkalacharan@gmail.com",
    // If empty string, the WhatsApp button is automatically hidden.
    whatsappNumber: "", // [VERIFY: Add your WhatsApp phone number here (e.g., "919876543210") to show the button, or leave empty to keep hidden]
    responseSpeed: "Usually replies within 24 hours.",
  },
  status: {
    openForWork: true,
    openForWorkLabel: "Open for freelance projects",
    nowBuilding: "Multi-agent AI pipelines",
    languages: "Telugu + English",
    greetingTelugu: "నమస్కారం",
  },
  // Real, verified stats only:
  stats: [
    {
      value: "9",
      suffix: "",
      label: "Projects on GitHub",
      description: "Repositories across AI agents, full-stack & ML",
    },
    {
      value: "7",
      suffix: "",
      label: "AI Agents in One Platform",
      description: "Autonomous recruiting pipeline in RecruitMate",
    },
    {
      value: "85.3",
      suffix: "%",
      label: "IPL Pre-Match Accuracy",
      description: "Ensemble model with AUC 0.93 and isotonic calibration",
    },
    {
      value: "2",
      suffix: "",
      label: "Client Sites Delivered",
      description: "Production websites shipped for active businesses", // [VERIFY: change this number to the true count if higher]
    },
  ],
  stackMarquee: [
    "Python",
    "FastAPI",
    "Flask",
    "React",
    "TypeScript",
    "Groq",
    "MongoDB",
    "Pandas",
    "NumPy",
    "Tailwind",
    "Docker",
    "Vercel",
  ],
  secondaryMarquee: [
    "Multi-Agent Systems",
    "Vision LLMs",
    "Isotonic Calibration",
    "SHAP Explainability",
    "JWT Authentication",
    "Cloudflare Turnstile",
    "Supabase",
    "PostgreSQL",
    "Recharts",
    "TanStack Router",
    "Framer Motion",
    "REST APIs",
  ],
  principles: [
    {
      number: "01",
      title: "Ship early and touch reality",
      description:
        "Code sitting on localhost teaches nothing. I deploy fast, test with real data, and verify behavior in production rather than relying on theoretical assumptions.",
    },
    {
      number: "02",
      title: "Measure real business results",
      description:
        "AI is only valuable if it produces a reliable outcome. I prioritize deterministic calculation for business logic, rigorous validation, and measurable improvements over unverified vanity metrics.",
    },
    {
      number: "03",
      title: "Write things people can understand",
      description:
        "Complex multi-agent architectures and machine learning ensembles should be explainable in clear, honest language. If an engineer, client, or student cannot follow it, the architecture is not finished.",
    },
  ],
  currentFocus: [
    {
      title: "Building Multi-Agent AI Systems",
      description:
        "Designing autonomous multi-agent pipelines with role specialization, structured outputs, and deterministic guardrails.",
    },
    {
      title: "Shipping Real Projects for Clients",
      description:
        "Engineering high-performance web applications and diagnostic tools with clean authentication, API integrations, and production deployments.",
    },
    {
      title: "Preparing for Google Summer of Code 2027",
      description:
        "Deepening open-source contributions, studying codebase architectures, and building production-grade software tools.",
    },
  ],
};
