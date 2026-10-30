import { motion } from 'motion/react';
import { GraduationCap, MapPin, Target, Sparkles, Code2, Rocket } from 'lucide-react';
import { siteConfig } from '../../data/site';
import { CertificatesBlock } from '../ui/CertificatesBlock';

export function AboutSection() {
  return (
    <section id="about" className="relative w-full bg-[#0A0A0B] py-24 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Section Header */}
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
          <span>Origin & Mindset</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F4F4F0] mb-16">
          Behind the Terminal
        </h2>

        {/* 2-Column Story Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-20">
          {/* Left Column: 5 Cols - Tall Rounded Portrait with object-position focused on face */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#16161A] shadow-2xl"
            >
              <img
                src="/images/charan-about.jpg"
                alt="Charan (Bonamukkala Charan Reddy) smiling in red shirt"
                className="h-full w-full object-cover object-[center_20%] filter contrast-105"
                loading="lazy"
                width="600"
                height="800"
              />
              {/* Subtle dark gradient overlay for bottom legibility */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/60 to-transparent pointer-events-none" />

              {/* Bottom location badge */}
              <div className="absolute bottom-5 left-5 right-5 z-10">
                <div className="flex items-center gap-1.5 font-mono text-xs text-[#C6FF3D] mb-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Hyderabad, India</span>
                </div>
                <p className="font-display text-xs sm:text-sm font-semibold text-white/95 leading-snug">
                  Bonamukkala Charan Reddy · Generative AI Engineer
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 7 Cols - Story in First Person */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F4F0] leading-snug">
              Hi, I’m Charan. I build multi-agent intelligence and ship real products.
            </h3>

            <div className="space-y-4 font-body text-base text-[#A1A1AA] leading-relaxed">
              <p>
                I am a second-year B.Sc Computer Science student at{' '}
                <span className="text-[#F4F4F0] font-medium">NIAT Hyderabad</span> (degree conferred via{' '}
                <span className="text-[#F4F4F0] font-medium">BITS Pilani</span>), specializing in Generative AI.
              </p>
              <p>
                Rather than staying strictly in theoretical coursework, I focus on building practical applications with verified logic. From building multi-agent recruitment triage platforms to engineering deterministic small-business diagnostic software in pandas and FastAPI, I build software that solves real operational problems.
              </p>
              <p>
                My current technical focus centers on{' '}
                <span className="text-[#C6FF3D] font-mono">multi-agent systems</span> and vision LLMs, designing pipelines where specialized agents coordinate to verify complex data flows, extract structured schemas, and perform deterministic calculations.
              </p>
              <p>
                I am preparing for{' '}
                <span className="text-[#F4F4F0] font-medium">Google Summer of Code 2027</span> by actively studying open-source codebases, and targeting AI/ML engineering roles in India while remaining open to select freelance client work.
              </p>
            </div>

            {/* Quick Badges */}
            <div className="pt-2 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-2">
                <GraduationCap className="h-4 w-4 text-[#C6FF3D]" />
                <span className="font-mono text-xs text-[#F4F4F0]">NIAT Hyderabad / BITS Pilani Degree</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-2">
                <Target className="h-4 w-4 text-[#C6FF3D]" />
                <span className="font-mono text-xs text-[#F4F4F0]">Targeting: GSoC 2027 & AI/ML Roles</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Operating Principles */}
        <div className="mb-20">
          <span className="font-mono text-xs uppercase tracking-widest text-[#C6FF3D] block mb-2">
            Engineering Principles
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F4F0] mb-8">
            How I Work & Build
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {siteConfig.principles.map((pr, idx) => (
              <motion.div
                key={pr.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className="rounded-xl border border-white/10 bg-[#111114] p-6 hover:border-[#C6FF3D]/40 transition-colors"
              >
                <span className="font-mono text-xs font-bold text-[#C6FF3D] mb-3 block">
                  Principle {pr.number}
                </span>
                <h4 className="font-display text-lg font-bold text-[#F4F4F0] mb-2">
                  {pr.title}
                </h4>
                <p className="font-body text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  {pr.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* What I'm Focused on Now (Replaces old invented milestone dates) */}
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] block mb-2">
            Active Roadmap
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F4F0] mb-8">
            What I’m Focused on Now
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {siteConfig.currentFocus.map((focus, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className="rounded-xl border border-white/10 bg-[#111114] p-6 flex flex-col justify-between hover:border-[#C6FF3D]/40 transition-colors"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-[#C6FF3D] mb-4">
                    {idx === 0 && <Sparkles className="h-5 w-5" />}
                    {idx === 1 && <Rocket className="h-5 w-5" />}
                    {idx === 2 && <Code2 className="h-5 w-5" />}
                  </div>
                  <h4 className="font-display text-lg font-bold text-[#F4F4F0] mb-2">
                    {focus.title}
                  </h4>
                  <p className="font-body text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                    {focus.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 font-mono text-[11px] text-[#C6FF3D]">
                  Active Priority · 2026/2027
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hackathons & Certifications Block */}
        <CertificatesBlock />
      </div>
    </section>
  );
}
