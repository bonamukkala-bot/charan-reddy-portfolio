import { motion } from 'motion/react';
import { Instagram, Youtube, Linkedin, ArrowUpRight, Film, Globe, Users } from 'lucide-react';
import { creatorData } from '../../data/creator';
import { WatchMyWorkShowcase } from '../ui/WatchMyWorkShowcase';

export function ContentCreatorSection() {
  return (
    <section id="content" className="relative w-full bg-[#0A0A0B] py-24 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Section Header */}
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
          <span>Tech Education & Creator</span>
        </div>

        {/* 2-Column Split: Image on Left, Channels on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          {/* Left: charan-coding.jpg in rounded card with thin lime border */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[#C6FF3D]/30 bg-[#16161A] shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
            >
              <img
                src="/images/charan-coding.jpg"
                alt="Charan coding on a laptop from behind in classroom"
                className="h-full w-full object-cover object-center"
                loading="lazy"
                decoding="async"
                width="640"
                height="800"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/85 via-transparent to-transparent pointer-events-none" />

              {/* Bottom Badge */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-[#0A0A0B]/90 p-3 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-[#C6FF3D]" />
                  <span className="font-mono text-xs text-[#F4F4F0] font-medium">Bilingual Tech Series</span>
                </div>
                <span className="font-mono text-[11px] text-[#C6FF3D]">Telugu · English</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Creator Copy & Verified Factual Chips */}
          <div className="lg:col-span-7 flex flex-col items-start lg:pl-4">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F4F4F0] leading-tight">
              {creatorData.headline}
            </h2>

            <p className="mt-4 font-body text-base sm:text-lg text-[#F4F4F0]/90 leading-relaxed">
              {creatorData.copy}
            </p>

            <p className="mt-2 font-body text-sm text-[#A1A1AA] leading-relaxed">
              {creatorData.subcopy}
            </p>

            {/* Factual Chips (No fabricated numbers) */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-1.5 font-mono text-xs text-[#F4F4F0]">
                <Globe className="h-3.5 w-3.5 text-[#C6FF3D]" />
                <span>{creatorData.languages}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-1.5 font-mono text-xs text-[#F4F4F0]">
                <Users className="h-3.5 w-3.5 text-[#C6FF3D]" />
                <span>{creatorData.audience}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-1.5 font-mono text-xs text-[#F4F4F0]">
                <Film className="h-3.5 w-3.5 text-[#C6FF3D]" />
                <span>{creatorData.platforms}</span>
              </span>
            </div>

            {/* Verified Channel Cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
              {creatorData.channels.map((ch) => (
                <div
                  key={ch.id}
                  className="rounded-xl border border-white/10 bg-[#111114] p-4 flex flex-col justify-between hover:border-[#C6FF3D]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-[#C6FF3D] font-semibold uppercase">
                        {ch.platform}
                      </span>
                      {ch.platform === 'Instagram' ? (
                        <Instagram className="h-3.5 w-3.5 text-[#A1A1AA]" />
                      ) : ch.platform === 'LinkedIn' ? (
                        <Linkedin className="h-3.5 w-3.5 text-[#A1A1AA]" />
                      ) : (
                        <Youtube className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                    <div className="font-display text-sm font-bold text-[#F4F4F0]">
                      {ch.name}
                    </div>
                    <div className="font-mono text-xs text-[#C6FF3D] mt-0.5">
                      {ch.handle}
                    </div>
                    <p className="mt-2 text-xs text-[#A1A1AA] leading-relaxed">
                      {ch.description}
                    </p>
                  </div>

                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-between gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-mono text-[#F4F4F0] hover:border-[#C6FF3D] hover:text-[#C6FF3D] transition-colors"
                  >
                    <span>{ch.buttonLabel}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Watch my work playable video showcase */}
        <WatchMyWorkShowcase />
      </div>
    </section>
  );
}
