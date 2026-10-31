import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView } from 'motion/react';
import { siteConfig } from '../../data/site';
import { allProjects } from '../../data/projects';

interface CounterProps {
  target: number;
  decimals?: number;
  suffix?: string;
}

function StatCounter({ target, decimals = 0, suffix = '' }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!isInView) return;

    const duration = 1500;
    const startTime = performance.now();

    function update(time: number) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = ease * target;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(target);
      }
    }

    requestAnimationFrame(update);
  }, [isInView, target]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.floor(displayValue);

  return (
    <span ref={ref} className="font-display tabular-nums">
      {decimals === 0 && target < 10 && displayValue < 10 ? `0${formatted}` : formatted}
      {suffix}
    </span>
  );
}

export function MarqueeAndProofSection() {
  // Derive unique tech list for the marquee from project tags
  const uniqueTechList = useMemo(() => {
    const set = new Set<string>();
    allProjects.forEach((project) => {
      project.tags.forEach((tag) => set.add(tag));
    });
    return Array.from(set);
  }, []);

  return (
    <section className="relative w-full border-t border-b border-white/5 bg-[#0A0A0B] py-12 sm:py-16 overflow-hidden">
      {/* Proof Strip: 4 Verified Real Statistics (2x2 on phones) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 mb-10 sm:mb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {siteConfig.stats.map((stat, idx) => {
            const numericValue = parseFloat(stat.value) || 0;
            const hasDecimals = stat.value.includes('.');
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative flex flex-col border-l border-white/10 pl-3.5 sm:pl-5 md:pl-6 transition-colors hover:border-[#C6FF3D]"
              >
                <div className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-[#F4F4F0] group-hover:text-[#C6FF3D] transition-colors">
                  <StatCounter
                    target={numericValue}
                    decimals={hasDecimals ? 1 : 0}
                    suffix={stat.suffix}
                  />
                </div>
                <div className="mt-1.5 sm:mt-2 font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[#F4F4F0] font-medium">
                  {stat.label}
                </div>
                <div className="mt-1 text-[11px] sm:text-xs text-[#A1A1AA] leading-relaxed">
                  {stat.description}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Top: One Slim Single-Row Marquee (slow, lime dot separators, JetBrains Mono, muted gray, pauses on hover and reduced-motion) */}
      <div className="relative w-full overflow-hidden border-t border-b border-white/5 py-3 flex items-center group bg-[#0d0d10]">
        <div className="flex shrink-0 animate-[marquee_45s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused] items-center gap-7 whitespace-nowrap">
          {[...uniqueTechList, ...uniqueTechList].map((tech, i) => (
            <span
              key={`marquee-item-1-${tech}-${i}`}
              className="inline-flex items-center gap-7 font-mono text-xs sm:text-sm text-[#8A8A92] transition-colors duration-200 hover:text-white"
            >
              <span>{tech}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
            </span>
          ))}
        </div>
        <div
          className="flex shrink-0 animate-[marquee_45s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused] items-center gap-7 whitespace-nowrap"
          aria-hidden="true"
        >
          {[...uniqueTechList, ...uniqueTechList].map((tech, i) => (
            <span
              key={`marquee-item-2-${tech}-${i}`}
              className="inline-flex items-center gap-7 font-mono text-xs sm:text-sm text-[#8A8A92] transition-colors duration-200 hover:text-white"
            >
              <span>{tech}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
