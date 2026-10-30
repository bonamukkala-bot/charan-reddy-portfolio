import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Github, ExternalLink, ChevronRight } from 'lucide-react';
import { featuredProjects, Project } from '../../data/projects';
import { ProjectDiagramVisual } from '../ui/ProjectDiagramVisual';

interface FeaturedWorkSectionProps {
  onSelectProject: (proj: Project) => void;
}

interface FeaturedProjectItemProps {
  project: Project;
  headerOffset: number;
  onSelectProject: (proj: Project) => void;
}

function FeaturedProjectItem({
  project,
  headerOffset,
  onSelectProject,
}: FeaturedProjectItemProps) {
  const leftColRef = useRef<HTMLDivElement>(null);
  const [leftColHeight, setLeftColHeight] = useState<number>(0);
  const [windowHeight, setWindowHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900
  );
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const updateDimensions = () => {
      setWindowHeight(window.innerHeight);
      setIsDesktop(window.innerWidth >= 1024);
      if (leftColRef.current) {
        setLeftColHeight(leftColRef.current.offsetHeight);
      }
    };

    updateDimensions();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && leftColRef.current) {
      ro = new ResizeObserver(() => {
        if (leftColRef.current) {
          setLeftColHeight(leftColRef.current.offsetHeight);
        }
      });
      ro.observe(leftColRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (ro) ro.disconnect();
    };
  }, []);

  // Available height in the viewport below the sticky top offset (progress bar + navbar + 24px)
  const availableViewportHeight = Math.max(0, windowHeight - headerOffset);

  // Requirement:
  // - Desktop only (>= lg breakpoint)
  // - If the left column is taller than the available viewport height, do not use sticky for that project.
  const canStick = isDesktop && leftColHeight > 0 && leftColHeight <= availableViewportHeight;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      data-cursor="view"
      onClick={() => onSelectProject(project)}
      className="group relative cursor-pointer rounded-2xl border border-white/10 bg-[#111114] p-3 sm:p-6 md:p-8 lg:p-10 transition-all duration-300 hover:border-[#C6FF3D]/40 hover:bg-[#141418] hover:shadow-[0_12px_45px_rgba(0,0,0,0.7)]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[58%_calc(42%-40px)] gap-6 lg:gap-10 items-stretch">
        {/* LEFT COLUMN TRACK: Spans full height of project card */}
        <div className="relative w-full h-full">
          {/* STICKY CONTAINER: Sticks within the left column track on desktop when it fits */}
          <div
            ref={leftColRef}
            className="w-full flex flex-col gap-4"
            style={canStick ? { position: 'sticky', top: `${headerOffset}px` } : undefined}
          >
            {/* Visual Media Panel */}
            <ProjectDiagramVisual projectId={project.id} />

            {/* 3 Highlight Cards directly under the media card */}
            {project.facts && project.facts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {project.facts.map((fact, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-between"
                  >
                    <span className="font-mono text-[10px] text-[#A1A1AA] block uppercase tracking-wide">
                      {fact.label}
                    </span>
                    <span className="font-mono text-xs text-[#F4F4F0] font-medium mt-1 block">
                      {fact.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full flex flex-col justify-between h-full px-1 sm:px-0">
          <div>
            {/* Index & Category */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <span className="font-display text-4xl sm:text-5xl font-black text-[#C6FF3D] tracking-tighter">
                {project.indexNumber}
              </span>
              <div className="flex items-center gap-2 font-mono text-xs text-[#A1A1AA]">
                <span>{project.category}</span>
                {project.clientOrContext && (
                  <>
                    <span className="text-white/20">/</span>
                    <span className="text-[#F4F4F0]">{project.clientOrContext}</span>
                  </>
                )}
              </div>
            </div>

            {/* Title & Tagline */}
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F4F0] group-hover:text-[#C6FF3D] transition-colors">
              {project.title}
            </h3>
            <p className="mt-1 font-mono text-xs text-[#C6FF3D]">
              {project.tagline}
            </p>

            {/* Honest Problem Statement */}
            <div className="mt-4 text-xs sm:text-sm font-body text-[#A1A1AA] leading-relaxed">
              <span className="font-mono text-xs text-[#F4F4F0] font-semibold">The Challenge: </span>
              {project.problem}
            </div>

            {/* What I Built */}
            <p className="mt-3 font-body text-sm sm:text-base text-[#F4F4F0]/90 leading-relaxed">
              {project.whatIBuilt}
            </p>

            {/* Tech Chips */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[#A1A1AA] group-hover:border-white/20 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProject(project);
              }}
              className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#C6FF3D] hover:underline cursor-pointer"
            >
              <span>Deep Dive Case Study</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Live demo for ${project.title}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#C6FF3D] px-3.5 py-1.5 text-xs font-mono font-semibold uppercase text-[#0A0A0B] hover:bg-[#d4ff66] transition-colors"
                >
                  <span>Live demo</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`GitHub repository for ${project.title}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-mono uppercase text-[#F4F4F0] hover:border-white/30 hover:text-[#C6FF3D] transition-colors"
              >
                <Github className="h-3 w-3" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturedWorkSection({ onSelectProject }: FeaturedWorkSectionProps) {
  // Sticky top offset: scroll progress bar height + navbar height + 24px spacing
  const [headerOffset, setHeaderOffset] = useState<number>(122);

  useEffect(() => {
    const computeOffset = () => {
      const scrollBar = document.querySelector('[aria-hidden="true"].fixed.top-0') as HTMLElement | null;
      const header = document.querySelector('header') as HTMLElement | null;

      const scrollBarHeight = scrollBar ? scrollBar.offsetHeight || scrollBar.getBoundingClientRect().height : 34;
      const headerHeight = header ? header.offsetHeight : 64;

      const total = Math.round(scrollBarHeight + headerHeight + 24);
      setHeaderOffset(total);
      document.documentElement.style.setProperty('--project-sticky-top', `${total}px`);
    };

    computeOffset();

    const scrollBar = document.querySelector('[aria-hidden="true"].fixed.top-0');
    const header = document.querySelector('header');

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(computeOffset);
      if (scrollBar) ro.observe(scrollBar);
      if (header) ro.observe(header);
    }

    window.addEventListener('resize', computeOffset);
    return () => {
      window.removeEventListener('resize', computeOffset);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <section id="work" className="relative w-full bg-[#0A0A0B] py-24 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
              <span>Selected Case Studies</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F4F4F0]">
              Featured Work
            </h2>
          </div>
          <p className="font-body text-sm sm:text-base text-[#A1A1AA] max-w-md">
            Multi-agent systems, full-stack commerce, real-time sports analytics, and production client applications with real deployments.
          </p>
        </div>

        {/* Project Showcase Cards */}
        <div className="flex flex-col gap-10 md:gap-16 relative">
          {featuredProjects.map((project) => (
            <FeaturedProjectItem
              key={project.id}
              project={project}
              headerOffset={headerOffset}
              onSelectProject={onSelectProject}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
