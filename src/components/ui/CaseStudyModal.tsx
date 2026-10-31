import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Github, ExternalLink, CheckCircle2, Layers } from 'lucide-react';
import { Project } from '../../data/projects';
import { ProjectDiagramVisual } from './ProjectDiagramVisual';
import { useScrollLock } from '../../hooks/useScrollLock';

interface CaseStudyModalProps {
  project: Project | null;
  onClose: () => void;
  onSelectProject?: (proj: Project) => void;
}

export function CaseStudyModal({ project, onClose }: CaseStudyModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Lock body scroll and stop Lenis globally while modal is open
  useScrollLock(Boolean(project));

  // Reset scroll position and manage focus on open/close
  useEffect(() => {
    if (project) {
      triggerElementRef.current = document.activeElement as HTMLElement | null;

      // Reset scroll position to top
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }

      // Small delay to ensure modal is rendered before focusing
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    } else if (triggerElementRef.current) {
      triggerElementRef.current.focus();
    }
  }, [project]);

  // Trap focus and handle Escape
  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 md:p-8">
        {/* Backdrop (touch & click friendly) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A0A0B]/90 backdrop-blur-md"
          aria-hidden="true"
        />

        {/* Modal Window: Flex column with fixed max height */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[calc(100dvh-48px)] w-full max-w-4xl overflow-hidden rounded-none sm:rounded-2xl border border-white/10 bg-[#111114] shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-study-title"
        >
          {/* Header (flex-shrink-0, sticky top) */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-white/10 px-5 sm:px-6 py-3.5 sm:py-4 bg-[#141418] pt-[max(0.875rem,env(safe-area-inset-top,0px))] sm:pt-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="font-mono text-xs font-semibold text-[#C6FF3D]">
                CASE STUDY #{project.indexNumber}
              </span>
              <span className="text-white/20">/</span>
              <span className="font-mono text-xs text-[#A1A1AA]">{project.category}</span>
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/10 text-[#A1A1AA] hover:border-white/30 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D] cursor-pointer"
              aria-label="Close case study dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content (ONLY scroll area: flex-1 min-h-0 overflow-y-auto) */}
          <div
            ref={scrollContainerRef}
            tabIndex={0}
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain focus-visible:outline-none px-6 py-6 sm:px-10 sm:py-8 space-y-8 pb-16 sm:pb-20"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {/* Title & Tagline */}
            <div>
              <h2 id="case-study-title" className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#F4F4F0]">
                {project.title}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#C6FF3D] font-mono">
                {project.tagline}
              </p>
              {project.clientOrContext && (
                <p className="mt-1 text-xs text-[#A1A1AA] font-mono">
                  Context: {project.clientOrContext}
                </p>
              )}
            </div>

            {/* Factual Technical Highlights */}
            {project.facts && project.facts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-white/10 py-5">
                {project.facts.map((fact, i) => (
                  <div key={i} className="flex flex-col border-l border-white/10 pl-4">
                    <span className="font-mono text-[10px] text-[#A1A1AA] uppercase">
                      {fact.label}
                    </span>
                    <span className="mt-1 font-mono text-xs font-semibold text-[#F4F4F0]">
                      {fact.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Architecture Diagram */}
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
                <Layers className="h-3.5 w-3.5 text-[#C6FF3D]" />
                <span>Architecture Flow: {project.architecture.title}</span>
              </div>
              <div className="w-full overflow-x-auto scrollbar-thin">
                <ProjectDiagramVisual projectId={project.id} />
              </div>
            </div>

            {/* Section 1: Problem */}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
                The Problem
              </h3>
              <p className="font-body text-sm sm:text-base text-[#F4F4F0]/90 leading-relaxed bg-[#16161A] p-4 sm:p-5 rounded-xl border border-white/5">
                {project.problem}
              </p>
            </div>

            {/* Section 2: What I Built */}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
                What I Engineered
              </h3>
              <p className="font-body text-sm sm:text-base text-[#F4F4F0]/90 leading-relaxed mb-3">
                {project.whatIBuilt}
              </p>
              {project.approach && (
                <p className="font-body text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  {project.approach}
                </p>
              )}
            </div>

            {/* Section 3: Architecture Steps */}
            {project.architecture.steps && project.architecture.steps.length > 0 && (
              <div>
                <h3 className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
                  Pipeline Steps
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.architecture.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-white/10 bg-[#16161A] flex flex-col justify-between"
                    >
                      <span className="font-mono text-xs font-semibold text-[#C6FF3D] mb-1">
                        {step.step}
                      </span>
                      <span className="text-xs text-[#F4F4F0]/80 leading-relaxed">
                        {step.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Key Decisions */}
            {project.keyDecisions && project.keyDecisions.length > 0 && (
              <div>
                <h3 className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
                  Key Technical Decisions
                </h3>
                <div className="space-y-2.5">
                  {project.keyDecisions.map((kd, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-[#141418]">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#F4F4F0]">
                        <CheckCircle2 className="h-4 w-4 text-[#C6FF3D] shrink-0" />
                        <span>{kd.decision}</span>
                      </div>
                      <div className="mt-1 pl-6 text-xs text-[#A1A1AA] leading-relaxed">
                        {kd.rationale}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack */}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
                Technologies Used
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[#F4F4F0]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer (flex-shrink-0, stays visible, does NOT overlap content) */}
          <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 sm:px-6 py-3.5 sm:py-4 bg-[#141418]">
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-mono uppercase text-[#F4F4F0] hover:border-[#C6FF3D] hover:text-[#C6FF3D] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D] cursor-pointer"
              >
                <Github className="h-3.5 w-3.5" />
                <span>GitHub Repository</span>
              </a>
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#C6FF3D] px-4 py-2 text-xs font-mono font-semibold uppercase text-[#0A0A0B] hover:bg-[#d4ff66] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D] cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Live Demo</span>
                </a>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-xs font-mono text-[#A1A1AA] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D] min-h-[44px] px-3 flex items-center cursor-pointer"
            >
              Close [ESC]
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
