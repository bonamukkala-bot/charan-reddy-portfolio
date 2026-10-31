import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, Github, ExternalLink, Code2, ShieldAlert, Activity, GitBranch } from 'lucide-react';
import { moreProjects, Project } from '../../data/projects';

interface MoreWorkSectionProps {
  onSelectProject: (proj: Project) => void;
}

type CategoryFilter = 'All' | 'AI & Agents' | 'Full-stack' | 'Client' | 'Hackathon';

const filterCategories: CategoryFilter[] = ['All', 'AI & Agents', 'Full-stack', 'Client', 'Hackathon'];

export function MoreWorkSection({ onSelectProject }: MoreWorkSectionProps) {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('All');

  const filteredProjects = moreProjects.filter((p) => {
    if (activeFilter === 'All') return true;
    return p.category === activeFilter;
  });

  const getVisualIcon = (id: string) => {
    switch (id) {
      case 'ai-business-doctor':
        return <Activity className="h-6 w-6 text-[#C6FF3D]" />;
      case 'hackerrank-orchestrate':
        return <GitBranch className="h-6 w-6 text-[#C6FF3D]" />;
      case 'sentinel-agent':
        return <ShieldAlert className="h-6 w-6 text-[#C6FF3D]" />;
      case 'nuerax-hackathon':
        return <Code2 className="h-6 w-6 text-[#C6FF3D]" />;
      default:
        return <Code2 className="h-6 w-6 text-[#C6FF3D]" />;
    }
  };

  return (
    <section className="relative w-full bg-[#0A0A0B] py-24 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
              <span>Extended Repositories</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F4F0]">
              More Work & Prototypes
            </h2>
          </div>

          {/* Filter Tabs */}
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#111114] p-1.5"
          >
            {filterCategories.map((cat) => {
              const isSelected = activeFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`relative px-3.5 py-2 sm:py-1.5 min-h-[44px] inline-flex items-center justify-center font-mono text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D] ${
                    isSelected ? 'text-[#0A0A0B] font-semibold' : 'text-[#A1A1AA] hover:text-[#F4F4F0]'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="filterActivePill"
                      className="absolute inset-0 rounded-lg bg-[#C6FF3D]"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Animated Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProjects.map((project, idx) => {
              const isLastAlone = (filteredProjects.length - 1) % 3 === 0 && idx === filteredProjects.length - 1;
              return (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                data-cursor="view"
                onClick={() => onSelectProject(project)}
                className={`group relative flex flex-col justify-between rounded-xl border border-white/10 bg-[#111114] overflow-hidden transition-all duration-200 hover:border-[#C6FF3D]/40 hover:bg-[#151519] cursor-pointer ${
                  isLastAlone ? 'lg:col-span-3' : ''
                }`}
              >
                {/* Visual Header: Tasteful generated cover with faint project monogram */}
                <div className="relative h-32 w-full bg-[#16161c] border-b border-white/5 p-4 flex items-center justify-between overflow-hidden">
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-[#C6FF3D]/40 transition-colors">
                      {getVisualIcon(project.id)}
                    </div>
                    <div>
                      <span className="font-mono text-xs font-semibold text-[#C6FF3D]">
                        #{project.indexNumber}
                      </span>
                      <span className="font-mono text-[11px] text-[#A1A1AA] block">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  {/* Faint large project monogram behind */}
                  <div className="absolute right-2 -bottom-4 font-display text-7xl font-black text-white/[0.04] select-none pointer-events-none uppercase">
                    {project.title.slice(0, 3)}
                  </div>

                  {/* Action links with 44px tap target padding */}
                  <div className="relative z-10 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Live site for ${project.title}`}
                        className="text-[#A1A1AA] hover:text-[#C6FF3D] transition-colors h-11 w-11 flex items-center justify-center rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`GitHub repo for ${project.title}`}
                        className="text-[#A1A1AA] hover:text-[#C6FF3D] transition-colors h-11 w-11 flex items-center justify-center rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-xl font-bold text-[#F4F4F0] group-hover:text-[#C6FF3D] transition-colors">
                        {project.title}
                      </h3>
                      <ArrowUpRight className="h-4 w-4 text-[#A1A1AA] group-hover:text-[#C6FF3D] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1" />
                    </div>

                    <p className="mt-2.5 font-body text-xs sm:text-sm text-[#A1A1AA] leading-relaxed line-clamp-3">
                      {project.whatIBuilt || project.tagline}
                    </p>

                    {/* Highlighted strip */}
                    {(project.stripText || project.clientOrContext || (project.facts && project.facts[0]?.value)) && (
                      <div className="mt-3 font-mono text-[11px] text-[#C6FF3D] bg-[#C6FF3D]/5 border border-[#C6FF3D]/20 px-2 py-1 rounded">
                        {project.stripText || project.clientOrContext || project.facts[0].value}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-1.5">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#A1A1AA]"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="font-mono text-[10px] px-2 py-0.5 text-white/30">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
