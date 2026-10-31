import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { allProjects } from '../../data/projects';
import type { TechSphereItem, TechLayer } from '../ui/TechSphere';

const loadTechSphere = () => import('../ui/TechSphere');
let techSpherePrefetched = false;

export function prefetchTechSphere() {
  if (!techSpherePrefetched && typeof window !== 'undefined') {
    techSpherePrefetched = true;
    loadTechSphere();
  }
}

const TechSphere = lazy(() =>
  loadTechSphere().then((mod) => ({ default: mod.TechSphere }))
);

type Layer = 'Build' | 'AI' | 'Data' | 'Ship';

function classifyTech(tech: string): Layer {
  const lower = tech.toLowerCase();

  // AI layer
  if (
    lower.includes('llm') ||
    lower.includes('agent') ||
    lower.includes('assistant') ||
    lower.includes('groq') ||
    lower.includes('xgboost') ||
    lower.includes('lightgbm') ||
    lower.includes('forest') ||
    lower.includes('lstm') ||
    lower.includes('shap') ||
    lower.includes('vision') ||
    lower.includes('image analysis') ||
    lower.includes('policy synthesis')
  ) {
    return 'AI';
  }

  // Data layer
  if (
    lower.includes('mongo') ||
    lower.includes('postgres') ||
    lower.includes('supabase') ||
    lower.includes('pandas') ||
    lower.includes('numpy') ||
    lower.includes('mlflow') ||
    lower.includes('database')
  ) {
    return 'Data';
  }

  // Ship layer
  if (
    lower.includes('docker') ||
    lower.includes('vercel') ||
    lower.includes('cloudflare') ||
    lower.includes('turnstile') ||
    lower.includes('edge functions') ||
    lower.includes('jwt') ||
    lower.includes('razorpay')
  ) {
    return 'Ship';
  }

  // Default to Build
  return 'Build';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function StackExplorerSection() {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TechLayer | 'All'>('All');
  const [isMobileOrReduced, setIsMobileOrReduced] = useState(false);

  // Prefetch TechSphere only on desktop when motion is not reduced
  useEffect(() => {
    const check = () => {
      const isSmall = window.innerWidth < 768;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMob = isSmall || reduced;
      setIsMobileOrReduced(isMob);
      if (!isMob) {
        prefetchTechSphere();
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Derive tech -> project names mapping strictly from existing project data
  const { techMap, categorizedTech, projectList, sphereItems } = useMemo(() => {
    const map: Record<string, string[]> = {};

    allProjects.forEach((project) => {
      project.tags.forEach((tag) => {
        if (!map[tag]) {
          map[tag] = [];
        }
        if (!map[tag].includes(project.title)) {
          map[tag].push(project.title);
        }
      });
    });

    const unique = Object.keys(map);

    const categories: Record<Layer, string[]> = {
      Build: [],
      AI: [],
      Data: [],
      Ship: [],
    };

    unique.forEach((tech) => {
      const layer = classifyTech(tech);
      categories[layer].push(tech);
    });

    const items: TechSphereItem[] = unique.map((tech) => {
      const category = classifyTech(tech) as TechLayer;
      const projects = map[tech] || [];
      return {
        name: tech,
        category,
        projects,
        usageCount: projects.length,
        initials: getInitials(tech),
      };
    });

    const projects = allProjects.map((p) => p.title);

    return {
      techMap: map,
      categorizedTech: categories,
      projectList: projects,
      sphereItems: items,
    };
  }, []);

  const activeProjects = selectedTech ? techMap[selectedTech] || [] : [];
  const usageCount = selectedTech ? (techMap[selectedTech]?.length || 0) : 0;

  const visibleSphereItems = useMemo(() => {
    if (activeFilter === 'All') return sphereItems;
    return sphereItems.filter((item) => item.category === activeFilter);
  }, [sphereItems, activeFilter]);

  const categoryDotColor: Record<Layer, string> = {
    Build: 'bg-sky-400',
    AI: 'bg-[#C6FF3D]',
    Data: 'bg-purple-400',
    Ship: 'bg-amber-400',
  };

  return (
    <section className="relative w-full border-b border-white/5 bg-[#0A0A0B] py-16 overflow-hidden">
      {/* Stack Explorer Main Container */}
      <div
        className="mx-auto max-w-7xl px-6 md:px-10"
        onMouseLeave={() => setSelectedTech(null)}
      >
        {/* Explorer Header & Caption */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
              <span>Stack Explorer</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F0]">
              Technology & System Layers
            </h3>
          </div>

          {/* Interactive Caption */}
          <div className="font-mono text-xs sm:text-sm h-6 flex items-center">
            {selectedTech ? (
              <span className="text-[#C6FF3D]">
                {selectedTech} — used in {usageCount} {usageCount === 1 ? 'project' : 'projects'}
              </span>
            ) : (
              <span className="text-[#8A8A92]">
                Hover or tap any tech to inspect project usage
              </span>
            )}
          </div>
        </div>

        {/* Category Filter Buttons: All, Build, AI, Data, Ship */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-2">
          {[
            { label: 'All', count: sphereItems.length },
            { label: 'Build', count: categorizedTech.Build.length },
            { label: 'AI', count: categorizedTech.AI.length },
            { label: 'Data', count: categorizedTech.Data.length },
            { label: 'Ship', count: categorizedTech.Ship.length },
          ].map((cat) => {
            const isActive = activeFilter === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveFilter(cat.label as TechLayer | 'All')}
                aria-pressed={isActive}
                className={`font-mono text-xs rounded-full px-4 py-2 min-h-[44px] inline-flex items-center justify-center border transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D] ${
                  isActive
                    ? 'bg-[#C6FF3D] text-[#0A0A0B] border-[#C6FF3D] font-semibold shadow-[0_0_16px_rgba(198,255,61,0.35)] scale-105'
                    : 'border-white/10 text-[#A1A1AA] bg-white/[0.03] hover:border-white/30 hover:text-white'
                }`}
              >
                <span>{cat.label}</span>
                <span className="ml-1.5 opacity-60 text-[10px]">({cat.count})</span>
              </button>
            );
          })}
        </div>

        {/* Visual: CSS Grid on mobile/reduced motion to avoid Three.js bundle, 3D Rotating Tech-Sphere on desktop */}
        {isMobileOrReduced ? (
          <div className="my-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 max-h-[360px] overflow-y-auto p-1 pr-1.5 scrollbar-thin">
              {visibleSphereItems.map((item) => {
                const isSelected = selectedTech === item.name;
                const dotColor = categoryDotColor[item.category] || 'bg-[#C6FF3D]';
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedTech(isSelected ? null : item.name)}
                    aria-pressed={isSelected}
                    className={`min-h-[48px] w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#16161c] border-[#C6FF3D] shadow-[0_0_16px_rgba(198,255,61,0.25)] text-[#F4F4F0] scale-[1.01]'
                        : 'bg-[#111114]/80 border-white/10 hover:border-white/20 text-[#D4D4D8]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${dotColor} ${
                          isSelected ? 'animate-pulse' : ''
                        }`}
                      />
                      <span className="font-mono text-xs sm:text-sm font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#8A8A92] shrink-0 rounded bg-white/5 px-1.5 py-0.5">
                      {item.usageCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <Suspense
            fallback={
              <div
                className="relative aspect-square w-full max-w-[680px] mx-auto rounded-3xl bg-[#0c0c0f] border border-white/5 my-2"
                aria-hidden="true"
              />
            }
          >
            <TechSphere
              items={sphereItems}
              activeFilter={activeFilter}
              selectedTech={selectedTech}
              onSelectTech={setSelectedTech}
            />
          </Suspense>
        )}

        {/* Below Chips: Compact Row of Project Names (Highlights when tech is hovered/tapped) */}
        <div>
          <div className="font-mono text-xs text-[#8A8A92] uppercase tracking-wider mb-3">
            Projects in Codebase
          </div>

          <div className="flex flex-wrap gap-2.5">
            {projectList.map((projectTitle) => {
              const isMatched = selectedTech ? activeProjects.includes(projectTitle) : null;

              return (
                <div
                  key={projectTitle}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-mono transition-all duration-200 ${
                    isMatched === true
                      ? 'border-[#C6FF3D] bg-[#16161c] text-[#F4F4F0] font-semibold shadow-[0_0_16px_rgba(198,255,61,0.25)] opacity-100 scale-[1.02]'
                      : isMatched === false
                      ? 'border-white/5 bg-[#111114]/40 text-[#8A8A92] opacity-30'
                      : 'border-white/10 bg-[#111114] text-[#A1A1AA] opacity-90'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        isMatched === true
                          ? 'bg-[#C6FF3D] animate-pulse'
                          : 'bg-white/20'
                      }`}
                    />
                    <span>{projectTitle}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

