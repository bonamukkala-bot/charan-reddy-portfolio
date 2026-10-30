import { ArrowLeft, Github, ExternalLink, CheckCircle2, Layers } from 'lucide-react';
import { Project } from '../data/projects';
import { ProjectDiagramVisual } from '../components/ui/ProjectDiagramVisual';

interface CaseStudyPageProps {
  project: Project;
  onBack: () => void;
}

export function CaseStudyPage({ project, onBack }: CaseStudyPageProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] bg-grain text-[#F4F4F0] pt-28 pb-20 selection:bg-[#C6FF3D] selection:text-[#0A0A0B]">
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        {/* Back Link */}
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A1A1AA] hover:text-[#C6FF3D] transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Selected Work</span>
        </button>

        {/* Header Block */}
        <div className="border-b border-white/10 pb-10 mb-12">
          <div className="flex items-center gap-3 font-mono text-xs text-[#A1A1AA] mb-3">
            <span className="text-[#C6FF3D] font-bold">CASE STUDY #{project.indexNumber}</span>
            <span>·</span>
            <span>{project.category}</span>
            {project.clientOrContext && (
              <>
                <span>·</span>
                <span className="text-white/60">{project.clientOrContext}</span>
              </>
            )}
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#F4F4F0] leading-tight">
            {project.title}
          </h1>

          <p className="mt-4 font-mono text-base sm:text-lg text-[#C6FF3D] max-w-2xl">
            {project.tagline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-mono uppercase text-[#F4F4F0] hover:border-[#C6FF3D] hover:text-[#C6FF3D] transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub Code</span>
            </a>

            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#C6FF3D] px-5 py-2.5 text-xs font-mono font-semibold uppercase text-[#0A0A0B] hover:bg-[#d4ff66] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Live Deployment</span>
              </a>
            )}
          </div>
        </div>

        {/* Technical Facts Banner */}
        {project.facts && project.facts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 rounded-2xl border border-white/10 bg-[#111114] p-6 sm:p-8 mb-16">
            {project.facts.map((fact, i) => (
              <div key={i} className="flex flex-col border-l border-white/10 pl-5">
                <span className="font-mono text-xs text-[#A1A1AA] uppercase">
                  {fact.label}
                </span>
                <span className="mt-1 font-mono text-sm sm:text-base font-semibold text-[#F4F4F0]">
                  {fact.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Visual Architecture Feature Panel */}
        <div className="rounded-2xl border border-white/10 bg-[#111114] p-6 sm:p-10 mb-16">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-4">
            <Layers className="h-4 w-4 text-[#C6FF3D]" />
            <span>Architecture Flow Breakdown</span>
          </div>
          <ProjectDiagramVisual projectId={project.id} />
        </div>

        {/* Narrative Sections */}
        <div className="space-y-12">
          {/* Problem */}
          {project.problem && (
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
                01 / The Real-World Challenge
              </h2>
              <p className="font-body text-base sm:text-lg text-[#F4F4F0]/90 leading-relaxed bg-[#141418] p-6 rounded-xl border border-white/5">
                {project.problem}
              </p>
            </div>
          )}

          {/* Approach & What I Built */}
          {project.whatIBuilt && (
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
                02 / Approach & What I Engineered
              </h2>
              <div className="space-y-4 font-body text-base text-[#A1A1AA] leading-relaxed">
                <p className="text-[#F4F4F0] text-lg font-medium leading-relaxed">
                  {project.whatIBuilt}
                </p>
                {project.approach && <p>{project.approach}</p>}
              </div>
            </div>
          )}

          {/* Architecture Steps */}
          {project.architecture && project.architecture.steps && project.architecture.steps.length > 0 && (
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
                03 / System Pipeline: {project.architecture.title}
              </h2>
              <p className="text-sm text-[#A1A1AA] mb-6">
                {project.architecture.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.architecture.steps.map((st, i) => (
                  <div key={i} className="p-5 rounded-xl border border-white/10 bg-[#141418]">
                    <div className="font-mono text-xs font-semibold text-[#C6FF3D] mb-1">
                      {st.step}
                    </div>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      {st.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Decisions */}
          {project.keyDecisions && project.keyDecisions.length > 0 && (
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
                04 / Key Decisions & Trade-Offs
              </h2>
              <div className="space-y-4">
                {project.keyDecisions.map((kd, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-white/10 bg-[#141418]">
                    <div className="flex items-center gap-2 text-base font-semibold text-[#F4F4F0]">
                      <CheckCircle2 className="h-4 w-4 text-[#C6FF3D] shrink-0" />
                      <span>{kd.decision}</span>
                    </div>
                    <p className="mt-2 text-sm text-[#A1A1AA] pl-6 leading-relaxed">
                      {kd.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stack */}
          {project.tags && project.tags.length > 0 && (
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
                05 / Full Technology Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tg) => (
                  <span
                    key={tg}
                    className="font-mono text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-[#16161A] text-[#F4F4F0]"
                  >
                    {tg}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 font-mono text-xs uppercase text-[#A1A1AA] hover:text-[#C6FF3D] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Projects</span>
          </button>

          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#C6FF3D] px-6 py-2.5 text-xs font-mono font-semibold uppercase text-[#0A0A0B] hover:bg-[#d4ff66] transition-colors"
          >
            <span>Star on GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
