import { useState, useEffect, useRef } from 'react';
import { Bot, Activity, ShieldCheck, MessageSquare, Sparkles, Cpu, Store, Home, GitBranch, Layers, Image as ImageIcon, Video } from 'lucide-react';
import { ProjectImageShowcase } from './ProjectImageShowcase';
import { ProjectVideoShowcase } from './ProjectVideoShowcase';
import { CharanEstatesVideoPreview } from './CharanEstatesVideoPreview';

interface ProjectDiagramVisualProps {
  projectId: string;
}

export function ProjectDiagramVisual({ projectId }: ProjectDiagramVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [recruitMateView, setRecruitMateView] = useState<'showcase' | 'architecture'>('showcase');
  const [atelierView, setAtelierView] = useState<'showcase' | 'architecture'>('showcase');
  const [sriVishnuView, setSriVishnuView] = useState<'showcase' | 'architecture'>('showcase');

  // Reset to default screenshot carousel when this project moves out of view (visitor moves to another project)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            setRecruitMateView('showcase');
            setAtelierView('showcase');
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Also reset to default screenshot carousel if projectId changes
  useEffect(() => {
    setRecruitMateView('showcase');
    setAtelierView('showcase');
  }, [projectId]);

  // 1. RecruitMate AI: Real screenshots showcase (auto-advancing slider) + optional 7-agent pipeline view
  if (projectId === 'recruitmate-ai') {
    return (
      <div ref={containerRef} className="relative w-full flex flex-col gap-2">
        {/* View toggle */}
        <div className="flex items-center justify-between px-0.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setRecruitMateView((prev) => (prev === 'architecture' ? 'showcase' : 'architecture'))}
              aria-pressed={recruitMateView === 'architecture'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                recruitMateView === 'architecture'
                  ? 'bg-[#C6FF3D] text-[#0A0A0B] font-semibold'
                  : 'text-[#8A8A92] hover:text-white'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>7-Agent Pipeline</span>
            </button>
          </div>
          <span className="font-mono text-[10px] text-[#8A8A92]">
            RecruitMate AI
          </span>
        </div>

        {recruitMateView === 'showcase' ? (
          <ProjectImageShowcase
            images={['1.png', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg', '6.jpeg', '7.jpeg']}
            captions={['Dashboard', 'Hiring pipeline', 'Analytics', 'Candidate detail', 'Candidates', 'Job management', 'Sign in']}
            basePath="/projects/recruitmate"
            projectName="RecruitMate AI"
          />
        ) : (
          <div className="relative w-full rounded-xl bg-[#0c0c0f] p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#C6FF3D]" />
                <span className="font-mono text-xs text-[#F4F4F0] font-semibold">RecruitMate 7-Agent Architecture</span>
              </div>
              <span className="font-mono text-[10px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
                Flask + Groq
              </span>
            </div>

            {/* 7 Agents Sequence Flow */}
            <div className="my-auto py-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                  <span className="font-mono text-[9px] text-[#8A8A92] block">Agent 1</span>
                  <span className="font-display text-[11px] font-bold text-white">JD Parser</span>
                </div>
                <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                  <span className="font-mono text-[9px] text-[#8A8A92] block">Agent 2</span>
                  <span className="font-display text-[11px] font-bold text-white">Resume Screener</span>
                </div>
                <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                  <span className="font-mono text-[9px] text-[#8A8A92] block">Agent 3</span>
                  <span className="font-display text-[11px] font-bold text-white">Question Gen</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 py-0.5">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#C6FF3D] to-transparent" />
                <span className="font-mono text-[9px] text-[#C6FF3D]">tokenized public link</span>
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#C6FF3D] to-transparent" />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <div className="p-2 rounded bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 text-center">
                  <span className="font-mono text-[9px] text-[#C6FF3D] block">Agent 4</span>
                  <span className="font-display text-[10px] font-bold text-[#C6FF3D]">AI Interviewer</span>
                </div>
                <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                  <span className="font-mono text-[9px] text-[#8A8A92] block">Agent 5</span>
                  <span className="font-display text-[10px] font-bold text-white">Evaluator</span>
                </div>
                <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                  <span className="font-mono text-[9px] text-[#8A8A92] block">Agent 6</span>
                  <span className="font-display text-[10px] font-bold text-white">Comparator</span>
                </div>
                <div className="p-2 rounded bg-white/5 border border-white/10 text-center">
                  <span className="font-mono text-[9px] text-[#8A8A92] block">Agent 7</span>
                  <span className="font-display text-[10px] font-bold text-white">Scheduler & Mail</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 font-mono text-[10px] text-[#8A8A92]">
              <span>~28 Endpoints (4 Blueprints)</span>
              <span className="text-[#C6FF3D]">Cloudflare Turnstile Verified</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Atelier: Real screenshots showcase (12 images) + Architecture diagram view
  if (projectId === 'atelier') {
    return (
      <div ref={containerRef} className="relative w-full flex flex-col gap-2">
        {/* View toggle */}
        <div className="flex items-center justify-between px-0.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setAtelierView((prev) => (prev === 'architecture' ? 'showcase' : 'architecture'))}
              aria-pressed={atelierView === 'architecture'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                atelierView === 'architecture'
                  ? 'bg-[#C6FF3D] text-[#0A0A0B] font-semibold'
                  : 'text-[#8A8A92] hover:text-white'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Architecture</span>
            </button>
          </div>
          <span className="font-mono text-[10px] text-[#8A8A92]">
            Atelier
          </span>
        </div>

        {atelierView === 'showcase' ? (
          <ProjectImageShowcase
            images={['1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg', '6.jpeg', '7.jpeg', '8.jpeg', '9.jpeg', '10.jpeg', '11.jpeg', '12.jpeg']}
            captions={[
              'Storefront',
              'Collection',
              'Product page',
              'Delivery check',
              'Admin dashboard',
              'Review requests and stock alerts',
              'Add product',
              'Record order',
              'Deliveries',
              'Customers',
              'Workers and payroll',
              'Delivery zones',
            ]}
            basePath="/projects/atelier"
            projectName="Atelier"
          />
        ) : (
          <div className="relative w-full rounded-xl bg-[#0c0c0f] p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-[#C6FF3D]" />
                <span className="font-mono text-xs text-[#F4F4F0] font-semibold">Atelier Architecture</span>
              </div>
              <span className="font-mono text-[10px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
                React + Supabase + Groq
              </span>
            </div>

            <div className="my-auto py-3 space-y-2.5">
              {/* Main 3-step Pipeline Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-[#8A8A92] block">01 Storefront</span>
                    <div className="font-display text-xs font-bold text-white mt-1">Customer Storefront</div>
                  </div>
                  <span className="font-mono text-[9px] text-[#8A8A92] mt-2 block">
                    React + Vite · WhatsApp / call flow
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-[#C6FF3D] block">02 Core Backend</span>
                    <div className="font-display text-xs font-bold text-[#C6FF3D] mt-1">Supabase</div>
                  </div>
                  <span className="font-mono text-[9px] text-[#C6FF3D]/80 mt-2 block">
                    Database + multi-image storage
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-[#8A8A92] block">03 Management</span>
                    <div className="font-display text-xs font-bold text-white mt-1">Admin CRM</div>
                  </div>
                  <span className="font-mono text-[9px] text-[#8A8A92] mt-2 block">
                    Product CRUD + order tracking
                  </span>
                </div>
              </div>

              {/* Side card: Groq Chatbot */}
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#C6FF3D] shrink-0" />
                  <div>
                    <span className="font-mono text-[10px] font-semibold text-white block">Groq Chatbot</span>
                    <span className="font-mono text-[9px] text-[#8A8A92]">Supabase Edge Function</span>
                  </div>
                </div>
                <span className="font-mono text-[9px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
                  English / Telugu / Hindi toggle
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 font-mono text-[10px] text-[#8A8A92]">
              <span>WhatsApp / Direct Call Flow</span>
              <span className="text-[#C6FF3D]">Freelance Portfolio Piece</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 03. IPL Win Predictor: IPL data (17 seasons) -> XGBoost / LightGBM / Random Forest -> SHAP explanations -> FastAPI -> React UI
  if (projectId === 'ipl-win-predictor') {
    return (
      <div className="relative w-full rounded-xl bg-[#0c0c0f] p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#C6FF3D]" />
            <span className="font-mono text-xs text-[#F4F4F0] font-semibold">Prediction Pipeline</span>
          </div>
          <span className="font-mono text-[10px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
            FastAPI + React
          </span>
        </div>

        <div className="my-auto py-3 space-y-2.5">
          {/* Card flow diagram: IPL data -> Models -> SHAP -> FastAPI -> React UI */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center">
            <div className="p-2 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
              <span className="font-mono text-[8px] text-[#8A8A92]">01 Ingest</span>
              <div className="font-display text-[11px] font-bold text-white mt-1">IPL Data</div>
              <span className="font-mono text-[8px] text-[#8A8A92] mt-0.5">17 seasons</span>
            </div>

            <div className="p-2 rounded bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex flex-col justify-between">
              <span className="font-mono text-[8px] text-[#C6FF3D]">02 Models</span>
              <div className="font-display text-[10px] font-bold text-[#C6FF3D] mt-1 leading-tight">
                XGBoost / LightGBM / RF
              </div>
              <span className="font-mono text-[8px] text-[#C6FF3D]/80 mt-0.5">Ensemble ML</span>
            </div>

            <div className="p-2 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
              <span className="font-mono text-[8px] text-[#8A8A92]">03 Explain</span>
              <div className="font-display text-[11px] font-bold text-white mt-1">SHAP</div>
              <span className="font-mono text-[8px] text-[#8A8A92] mt-0.5">Explanations</span>
            </div>

            <div className="p-2 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
              <span className="font-mono text-[8px] text-[#8A8A92]">04 Backend</span>
              <div className="font-display text-[11px] font-bold text-white mt-1">FastAPI</div>
              <span className="font-mono text-[8px] text-[#8A8A92] mt-0.5">REST API</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-2 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
              <span className="font-mono text-[8px] text-[#8A8A92]">05 Frontend</span>
              <div className="font-display text-[11px] font-bold text-white mt-1">React UI</div>
              <span className="font-mono text-[8px] text-[#8A8A92] mt-0.5">Interactive</span>
            </div>
          </div>

          {/* Clearly marked slot labeled "Screenshot coming soon" with a dashed border */}
          <div className="rounded-lg border border-dashed border-white/20 bg-white/[0.02] py-4 px-3 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-[11px] font-medium tracking-wide text-[#8A8A92]">
              Screenshot coming soon
            </span>
            <span className="font-mono text-[9px] text-[#8A8A92]/60 mt-0.5">
              Docker Compose setup in repository
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-white/10 font-mono text-[10px] text-[#8A8A92]">
          <span>Trained on 17 IPL seasons</span>
          <span className="text-[#C6FF3D]">88.73% accuracy</span>
        </div>
      </div>
    );
  }

  // 04. charanEstates: Property Catalog -> Dynamic Category Filters -> Responsive Cards -> Web App
  if (projectId === 'charan-estates') {
    return (
      <div className="relative w-full rounded-xl bg-[#0c0c0f] p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-[#C6FF3D]" />
            <span className="font-mono text-xs text-[#F4F4F0] font-semibold">Property Discovery Architecture</span>
          </div>
          <span className="font-mono text-[10px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
            React + TypeScript + Tailwind
          </span>
        </div>

        <div className="my-auto py-3 space-y-2.5">
          {/* Card flow */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="font-mono text-[9px] text-[#8A8A92]">01 Ingest</span>
              <div className="font-display text-xs font-bold text-white mt-1">Listing Data</div>
              <span className="font-mono text-[8px] text-[#8A8A92]">Property Catalog</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#C6FF3D]/10 border border-[#C6FF3D]/30">
              <span className="font-mono text-[9px] text-[#C6FF3D]">02 Filter Engine</span>
              <div className="font-display text-xs font-bold text-[#C6FF3D] mt-1">Category & Budget</div>
              <span className="font-mono text-[8px] text-[#C6FF3D]/80">Zero-latency state</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="font-mono text-[9px] text-[#8A8A92]">03 Presentation</span>
              <div className="font-display text-xs font-bold text-white mt-1">Property Cards</div>
              <span className="font-mono text-[8px] text-[#8A8A92]">Structured Details</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="font-mono text-[9px] text-[#8A8A92]">04 Interface</span>
              <div className="font-display text-xs font-bold text-white mt-1">Responsive UI</div>
              <span className="font-mono text-[8px] text-[#8A8A92]">Mobile & Desktop</span>
            </div>
          </div>

          {/* charanEstates video preview showcase */}
          <CharanEstatesVideoPreview />
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-white/10 font-mono text-[10px] text-[#8A8A92]">
          <span>Client-Side Filter Architecture</span>
          <span className="text-[#C6FF3D]">Full-stack Web App</span>
        </div>
      </div>
    );
  }

  // 05. Sri Vishnu Grand PG: Real screen recording video showcase + optional concierge pipeline
  if (projectId === 'sri-vishnu-grand-pg') {
    return (
      <div ref={containerRef} className="relative w-full flex flex-col gap-2">
        {/* View toggle */}
        <div className="flex items-center justify-between px-0.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setSriVishnuView('showcase')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                sriVishnuView === 'showcase'
                  ? 'bg-[#C6FF3D] text-[#0A0A0B] font-semibold'
                  : 'text-[#8A8A92] hover:text-white'
              }`}
            >
              <Video className="h-3 w-3" />
              <span>Video Walkthrough</span>
            </button>
            <button
              type="button"
              onClick={() => setSriVishnuView('architecture')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                sriVishnuView === 'architecture'
                  ? 'bg-[#C6FF3D] text-[#0A0A0B] font-semibold'
                  : 'text-[#8A8A92] hover:text-white'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Concierge Pipeline</span>
            </button>
          </div>
          <span className="font-mono text-[10px] text-[#8A8A92]">
            Sri Vishnu Grand PG
          </span>
        </div>

        {sriVishnuView === 'showcase' ? (
          <ProjectVideoShowcase
            videoSrc="/projects/srivishnu/demo.mp4"
            liveUrl="https://srivishnugrandpg.com"
            projectName="Sri Vishnu Grand PG"
            caption="Website walkthrough"
          />
        ) : (
          <div className="relative w-full rounded-xl bg-[#0c0c0f] p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#C6FF3D]" />
                <span className="font-mono text-xs text-[#F4F4F0] font-semibold">Concierge & Handoff Pipeline</span>
              </div>
              <span className="font-mono text-[10px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
                Vercel Edge + Groq
              </span>
            </div>

            <div className="my-auto py-3 space-y-2.5">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="font-mono text-[9px] text-[#8A8A92]">01 Inbound</span>
                  <div className="font-display text-xs font-bold text-white mt-1">Web Visitor</div>
                  <span className="font-mono text-[9px] text-[#8A8A92]">Hostel Search</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#C6FF3D]/10 border border-[#C6FF3D]/30">
                  <span className="font-mono text-[9px] text-[#C6FF3D]">02 AI Concierge</span>
                  <div className="font-display text-xs font-bold text-[#C6FF3D] mt-1">Edge Chatbot</div>
                  <span className="font-mono text-[9px] text-[#8A8A92]">Groq Inference</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="font-mono text-[9px] text-[#8A8A92]">03 Direct Link</span>
                  <div className="font-display text-xs font-bold text-white mt-1">WhatsApp Handoff</div>
                  <span className="font-mono text-[9px] text-[#8A8A92]">Pre-filled text</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="font-mono text-[9px] text-[#8A8A92]">04 Resolution</span>
                  <div className="font-display text-xs font-bold text-white mt-1">Hostel Owner</div>
                  <span className="font-mono text-[9px] text-emerald-400">Direct Booking</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 font-mono text-[10px] text-[#8A8A92]">
              <span>Gachibowli, Hyderabad</span>
              <span className="text-[#C6FF3D]">LodgingBusiness & FAQPage JSON-LD</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 06. AI Business Doctor: CSV upload -> pandas/NumPy analysis -> health score + priority actions -> Groq for language
  if (projectId === 'ai-business-doctor') {
    return (
      <div className="flex flex-col gap-3 w-full">
        <div className="relative w-full rounded-xl bg-[#0c0c0f] p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#C6FF3D]" />
              <span className="font-mono text-xs text-[#F4F4F0] font-semibold">Medical Diagnostic Pipeline</span>
            </div>
            <span className="font-mono text-[10px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
              FastAPI + pandas + Groq
            </span>
          </div>

          <div className="my-auto py-3 space-y-2.5">
            {/* Step 1 & 2 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="font-mono text-[10px] text-[#8A8A92] block">01 CSV Upload</span>
                <div className="font-display text-xs font-bold text-white mt-1">Transaction Ledger</div>
                <span className="font-mono text-[9px] text-[#8A8A92]">Sales & inventory records</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="font-mono text-[10px] text-[#C6FF3D] block">02 Deterministic Math</span>
                <div className="font-display text-xs font-bold text-[#C6FF3D] mt-1">pandas / NumPy Analysis</div>
                <span className="font-mono text-[9px] text-[#8A8A92]">Dead-stock & profit drivers</span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <span className="font-mono text-[9px] text-[#8A8A92]">↓ Feeds Verified Calculation ↓</span>
            </div>

            {/* Step 3 & 4 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-[#C6FF3D]/10 border border-[#C6FF3D]/30">
                <span className="font-mono text-[10px] text-[#C6FF3D] block">03 Scoring & Ranking</span>
                <div className="font-display text-xs font-bold text-[#C6FF3D] mt-1">0–100 Health Score</div>
                <span className="font-mono text-[9px] text-[#8A8A92]">Rupee impact priority list</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="font-mono text-[10px] text-[#8A8A92] block">04 Language Layer</span>
                <div className="font-display text-xs font-bold text-white mt-1">Groq (Llama 4 Scout)</div>
                <span className="font-mono text-[9px] text-[#8A8A92]">Doctor chat + Board PDF</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 font-mono text-[10px] text-[#8A8A92]">
            <span>Decoupled Arithmetic Layer</span>
            <span className="text-[#C6FF3D]">100% Deterministic Math</span>
          </div>
        </div>

        {/* Screenshots coming soon slot */}
        <div className="w-full rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-3 sm:p-4 flex items-center justify-center gap-2 text-center">
          <ImageIcon className="h-4 w-4 text-[#8A8A92] opacity-60" />
          <span className="font-mono text-xs text-[#8A8A92]">Screenshots coming soon</span>
        </div>
      </div>
    );
  }

  // 07. HackerRank Orchestrate (June 2026): Claim photos -> VLM image analysis -> Risk assessment -> Policy synthesis -> Decision
  if (projectId === 'hackerrank-orchestrate') {
    return (
      <div className="flex flex-col gap-3 w-full">
        <div className="relative w-full rounded-xl bg-[#0c0c0f] p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#C6FF3D]" />
              <span className="font-mono text-xs text-[#F4F4F0] font-semibold">Insurance Verification Pipeline</span>
            </div>
            <span className="font-mono text-[10px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
              Python + VLMs
            </span>
          </div>

          {/* 5-step horizontal flow */}
          <div className="my-auto py-3 space-y-2">
            <div className="grid grid-cols-5 gap-1.5 text-center">
              <div className="p-2 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-mono text-[8px] text-[#8A8A92]">Stage 1</span>
                <span className="font-display text-[10px] font-bold text-white mt-1">Claim Photos</span>
                <span className="font-mono text-[8px] text-[#8A8A92] mt-1">Car/Laptop</span>
              </div>
              <div className="p-2 rounded bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 flex flex-col justify-between">
                <span className="font-mono text-[8px] text-[#C6FF3D]">Stage 2</span>
                <span className="font-display text-[10px] font-bold text-[#C6FF3D] mt-1">VLM Vision</span>
                <span className="font-mono text-[8px] text-[#8A8A92] mt-1">Damage Check</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-mono text-[8px] text-[#8A8A92]">Stage 3</span>
                <span className="font-display text-[10px] font-bold text-white mt-1">Risk Assess</span>
                <span className="font-mono text-[8px] text-[#8A8A92] mt-1">Plausibility</span>
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10 flex flex-col justify-between">
                <span className="font-mono text-[8px] text-[#8A8A92]">Stage 4</span>
                <span className="font-display text-[10px] font-bold text-white mt-1">Policy Synth</span>
                <span className="font-mono text-[8px] text-[#8A8A92] mt-1">Clauses</span>
              </div>
              <div className="p-2 rounded bg-[#C6FF3D]/20 border border-[#C6FF3D]/40 flex flex-col justify-between">
                <span className="font-mono text-[8px] text-[#C6FF3D]">Stage 5</span>
                <span className="font-display text-[10px] font-bold text-[#C6FF3D] mt-1">Decision</span>
                <span className="font-mono text-[8px] text-[#C6FF3D] mt-1">Final Adjudication</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 font-mono text-[10px] text-[#8A8A92]">
            <span>Asset Damage Verification</span>
            <span className="text-[#C6FF3D]">Automated Policy Cross-Reference</span>
          </div>
        </div>

        {/* Screenshots coming soon slot */}
        <div className="w-full rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-3 sm:p-4 flex items-center justify-center gap-2 text-center">
          <ImageIcon className="h-4 w-4 text-[#8A8A92] opacity-60" />
          <span className="font-mono text-xs text-[#8A8A92]">Screenshots coming soon</span>
        </div>
      </div>
    );
  }

  // Fallback for extended repos (Sentinel Agent, Nuerax Hackathon, etc.)
  return (
    <div className="relative w-full rounded-xl bg-[#0c0c0f] p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[#C6FF3D]" />
          <span className="font-mono text-xs text-[#F4F4F0] font-semibold">Technical Architecture</span>
        </div>
        <span className="font-mono text-[10px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
          Source Repository
        </span>
      </div>

      <div className="my-auto py-4 space-y-3">
        <div className="rounded-lg border border-dashed border-white/20 bg-white/[0.02] py-6 px-4 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[11px] font-medium tracking-wide text-[#8A8A92]">
            Repository Documentation & Code Available
          </span>
          <span className="font-mono text-[9px] text-[#8A8A92]/60 mt-1">
            View full source implementation and commit log on GitHub
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-white/10 font-mono text-[10px] text-[#8A8A92]">
        <span>Verified Repository</span>
        <span className="text-[#C6FF3D]">Open Source</span>
      </div>
    </div>
  );
}
