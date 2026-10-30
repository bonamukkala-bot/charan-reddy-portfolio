import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

export interface CertificateItem {
  id: string;
  title: string;
  type: 'Achievement' | 'Hackathon' | 'Workshop';
  rank?: string;
  description: string;
  issuer: string;
  date: string;
  certificateId?: string;
  image: string;
}

export const certificatesData: CertificateItem[] = [
  {
    id: 'hackerrank-orchestrate-june-2026',
    title: 'HackerRank Orchestrate, June 2026',
    type: 'Achievement',
    rank: '#619 / 1,773',
    description: 'Final rank #619 of 1,773, for building and deploying an AI agent.',
    issuer: 'HackerRank',
    date: 'June 2026',
    image: '/certificates/hackerrank-orchestrate-june-2026.jpeg',
  },
  {
    id: 'hackerrank-orchestrate-may-2026',
    title: 'HackerRank Orchestrate, May 2026',
    type: 'Achievement',
    rank: '1007th Place',
    description: 'Certificate of Excellence, 1007th place, for building and submitting an AI agent.',
    issuer: 'HackerRank',
    date: 'May 2026',
    image: '/certificates/hackerrank-orchestrate-may-2026.jpeg',
  },
  {
    id: 'isro-antariksh-hackathon-2026',
    title: 'Bharatiya Antariksh Hackathon 2026',
    type: 'Hackathon',
    description: 'Idea submission, presented by ISRO, powered by Hack2skill. Certificate ID 2026H2S06BAH-P04872.',
    issuer: 'ISRO x Hack2skill',
    date: '2026',
    certificateId: '2026H2S06BAH-P04872',
    image: '/certificates/isro-antariksh-hackathon-2026.jpeg',
  },
  {
    id: 'neurax-hackathon-2026',
    title: 'NeuraX Hackathon 2.0, Round 2',
    type: 'Hackathon',
    description: '14th–15th March 2026, CMR Technical Campus, Dept. of CSE (AI & ML), in collaboration with Salesforce, powered by StepUpMark.AI.',
    issuer: 'CMR Technical Campus x Salesforce',
    date: '14–15 March 2026',
    image: '/certificates/neurax-hackathon-2026.jpeg',
  },
  {
    id: 'ipl-crunch-26',
    title: "IPL Crunch '26",
    type: 'Hackathon',
    description: 'Skill-based data hackathon on Wooble.',
    issuer: 'Wooble',
    date: '03 June 2026',
    image: '/certificates/ipl-crunch-26.jpeg',
  },
  {
    id: 'takeover-hackathon',
    title: 'Takeover Hackathon',
    type: 'Hackathon',
    description: 'Built under pressure and shipped. Mindset that creates technology.',
    issuer: 'NIAT x Chevella',
    date: '18-07-2026',
    image: '/certificates/takeover-hackathon.jpeg',
  },
  {
    id: 'vibe-with-india',
    title: 'Vibe With India Virtual Hackathon',
    type: 'Hackathon',
    description: 'Virtual Hackathon VIBE WITH INDIA.',
    issuer: 'Devnovate / HackWithIndia',
    date: '20 March 2026',
    image: '/certificates/vibe-with-india.jpeg',
  },
  {
    id: 'ai-agents-201',
    title: 'AI Agents 201 Hands-On Workshop',
    type: 'Workshop',
    description: 'Demonstrating active participation in building AI-driven solutions and real-world problem solving.',
    issuer: 'NxtWave Institute of Advanced Technologies (NIAT)',
    date: '13-04-2026',
    image: '/certificates/ai-agents-201.jpeg',
  },
  {
    id: 'tagit-workshop',
    title: 'TagIT Workshop',
    type: 'Workshop',
    description: 'Hosted by Robotics and Advanced Technologies Team of NIAT.',
    issuer: 'Robotics Team (NIAT)',
    date: '24-09-2026',
    image: '/certificates/tagit-workshop.jpeg',
  },
];

type FilterType = 'All' | 'Achievement' | 'Hackathon' | 'Workshop';

export function CertificatesBlock() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Lock scroll when lightbox is open
  useScrollLock(selectedLightboxIndex !== null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const filteredCertificates = certificatesData.filter((item) => {
    if (activeFilter === 'All') return true;
    return item.type === activeFilter;
  });

  const counts: Record<FilterType, number> = {
    All: certificatesData.length,
    Achievement: certificatesData.filter((c) => c.type === 'Achievement').length,
    Hackathon: certificatesData.filter((c) => c.type === 'Hackathon').length,
    Workshop: certificatesData.filter((c) => c.type === 'Workshop').length,
  };

  const handleNextLightbox = useCallback(() => {
    if (selectedLightboxIndex === null) return;
    setSelectedLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % filteredCertificates.length : null
    );
  }, [selectedLightboxIndex, filteredCertificates.length]);

  const handlePrevLightbox = useCallback(() => {
    if (selectedLightboxIndex === null) return;
    setSelectedLightboxIndex((prev) =>
      prev !== null
        ? (prev - 1 + filteredCertificates.length) % filteredCertificates.length
        : null
    );
  }, [selectedLightboxIndex, filteredCertificates.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedLightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLightboxIndex, handleNextLightbox, handlePrevLightbox]);

  const activeCert =
    selectedLightboxIndex !== null ? filteredCertificates[selectedLightboxIndex] : null;

  return (
    <div className="mt-24 pt-20 border-t border-white/10">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#C6FF3D] mb-3">
            <Award className="h-4 w-4 text-[#C6FF3D]" />
            <span>HACKATHONS & CERTIFICATIONS</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#F4F4F0]">
            Competitive Builds & Credentials
          </h3>
          <p className="font-body text-sm text-[#A1A1AA] mt-2 max-w-2xl leading-relaxed">
            Verified submissions, national hackathons, and hands-on AI engineering workshops.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Achievement', 'Hackathon', 'Workshop'] as FilterType[]).map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveFilter(tab);
                  setSelectedLightboxIndex(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#C6FF3D] text-[#0A0A0B] font-bold shadow-[0_0_14px_rgba(198,255,61,0.3)]'
                    : 'bg-white/5 text-[#A1A1AA] hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#0A0A0B]/20 text-[#0A0A0B]' : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {counts[tab]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Grid: 3 cols desktop, 2 tablet, 1 mobile */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredCertificates.map((cert, idx) => {
            const isTopAchievement = cert.type === 'Achievement';
            return (
              <motion.button
                layout
                key={cert.id}
                type="button"
                onClick={() => setSelectedLightboxIndex(idx)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{
                  duration: prefersReducedMotion ? 0.15 : 0.35,
                  delay: prefersReducedMotion ? 0 : Math.min(idx * 0.05, 0.3),
                }}
                className={`group relative text-left rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-1 focus:ring-[#C6FF3D] cursor-pointer ${
                  isTopAchievement
                    ? 'bg-[#0c0c10] border border-[#C6FF3D]/40 shadow-[0_0_24px_rgba(198,255,61,0.08)] hover:border-[#C6FF3D]/80 hover:shadow-[0_0_36px_rgba(198,255,61,0.2)]'
                    : 'bg-[#0c0c10] border border-white/10 hover:border-[#C6FF3D]/40 hover:shadow-[0_0_24px_rgba(198,255,61,0.12)]'
                }`}
              >
                {/* Certificate Image Stage: Aspect-ratio 16/10 on dark surface, object-fit contain */}
                <div className="relative aspect-[16/10] w-full bg-[#070709] border-b border-white/10 flex items-center justify-center overflow-hidden">
                  <img
                    src={cert.image}
                    alt={`${cert.title} - ${cert.issuer}`}
                    width={640}
                    height={400}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain select-none transition-transform duration-300 group-hover:scale-[1.02]"
                  />

                  {/* Zoom prompt badge on hover */}
                  <div className="absolute top-3 right-3 p-1.5 rounded-md bg-[#0A0A0B]/85 backdrop-blur-sm border border-white/20 text-[#A1A1AA] group-hover:text-[#C6FF3D] group-hover:border-[#C6FF3D]/50 transition-colors opacity-0 group-hover:opacity-100 shadow-md">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 bg-[#0c0c10]">
                  <div>
                    {/* Top Row: Type Badge + Rank / Tag */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {cert.type === 'Achievement' ? (
                        <span className="font-mono text-[10px] font-bold text-[#0A0A0B] bg-[#C6FF3D] px-2 py-0.5 rounded shadow-[0_0_8px_rgba(198,255,61,0.3)]">
                          Achievement
                        </span>
                      ) : cert.type === 'Hackathon' ? (
                        <span className="font-mono text-[10px] text-white/90 bg-white/5 border border-white/20 px-2 py-0.5 rounded">
                          Hackathon
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#A1A1AA] bg-white/[0.03] border border-white/10 px-2 py-0.5 rounded">
                          Workshop
                        </span>
                      )}

                      {/* Rank text for achievements in mono */}
                      {cert.rank && (
                        <span className="font-mono text-xs font-bold text-[#C6FF3D] tabular-nums">
                          {cert.rank}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="font-display text-sm sm:text-base font-bold text-[#F4F4F0] group-hover:text-[#C6FF3D] transition-colors leading-snug line-clamp-2">
                      {cert.title}
                    </h4>

                    {/* Description preview */}
                    <p className="font-body text-xs text-[#A1A1AA] mt-1.5 line-clamp-2 leading-relaxed">
                      {cert.description}
                    </p>
                  </div>

                  {/* Issuer and Date */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between font-mono text-[11px] text-[#8A8A92]">
                    <span className="truncate max-w-[65%]">{cert.issuer}</span>
                    <span className="shrink-0">{cert.date}</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox / Expanded View Modal */}
      <AnimatePresence>
        {activeCert && (
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-6 bg-black/95 backdrop-blur-md"
            onClick={() => setSelectedLightboxIndex(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent="true"
              className="relative w-[92vw] h-[88vh] max-w-6xl max-h-[88vh] flex flex-col rounded-2xl bg-[#111114] border border-white/15 shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label={`${activeCert.title} certificate`}
            >
              {/* Lightbox Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-[#141418] shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm sm:text-base font-bold text-white truncate max-w-[280px] sm:max-w-md">
                    {activeCert.title}
                  </span>
                  <span className="font-mono text-xs text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20 shrink-0">
                    {selectedLightboxIndex! + 1} of {filteredCertificates.length}
                  </span>
                  {activeCert.rank && (
                    <span className="hidden sm:inline font-mono text-xs font-bold text-[#C6FF3D] border-l border-white/15 pl-3">
                      {activeCert.rank}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLightboxIndex(null)}
                  aria-label="Close certificate lightbox"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[#A1A1AA] hover:border-white/30 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Lightbox Image Stage: Contained, full certificate sharpness */}
              <div className="relative flex-1 min-h-0 w-full flex items-center justify-center p-3 sm:p-6 bg-[#070709] overflow-hidden">
                <img
                  src={activeCert.image}
                  alt={`${activeCert.title} - ${activeCert.issuer}`}
                  className="w-full h-full object-contain select-none"
                />

                {/* Prev Button */}
                <button
                  type="button"
                  onClick={handlePrevLightbox}
                  aria-label="Previous certificate"
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/85 border border-white/20 text-white hover:text-[#C6FF3D] hover:border-[#C6FF3D]/50 transition-all shadow-xl"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNextLightbox}
                  aria-label="Next certificate"
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/85 border border-white/20 text-white hover:text-[#C6FF3D] hover:border-[#C6FF3D]/50 transition-all shadow-xl"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              {/* Lightbox Footer */}
              <div className="p-3 bg-[#141418] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-[#8A8A92] shrink-0">
                <div className="flex items-center gap-3 truncate">
                  <span className="text-white">{activeCert.issuer}</span>
                  <span>·</span>
                  <span>{activeCert.date}</span>
                  {activeCert.certificateId && (
                    <>
                      <span>·</span>
                      <span className="text-zinc-400">ID: {activeCert.certificateId}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[11px] shrink-0">
                  <span>Use ← → arrows to browse</span>
                  <span>
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px]">
                      ESC
                    </kbd>{' '}
                    to close
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
