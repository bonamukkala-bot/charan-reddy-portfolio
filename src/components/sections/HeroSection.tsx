import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUpRight, Github, Linkedin, Instagram, Sparkles, Youtube } from 'lucide-react';
import { siteConfig } from '../../data/site';
import { socialLinks } from '../../data/socials';
import { useISTTime } from '../../hooks/useISTTime';
import { HeroNetworkCanvas } from '../ui/HeroNetworkCanvas';

interface HeroSectionProps {
  onOpenContactModal: () => void;
  onExploreWork: () => void;
  isReady?: boolean;
}

const rotatingRoles = [
  'Generative AI Engineer',
  'Multi-Agent Systems Builder',
  'Freelance Web/AI Developer',
  'Tech Content Creator',
];

export function HeroSection({ onOpenContactModal, onExploreWork, isReady = true }: HeroSectionProps) {
  const istTime = useISTTime();
  const [roleIndex, setRoleIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTouchOrReduced, setIsTouchOrReduced] = useState(true);

  // Role rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % rotatingRoles.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Parallax tracking only on desktop without reduced-motion
  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFinePointer || prefersReducedMotion) {
      setIsTouchOrReduced(true);
      return;
    }
    setIsTouchOrReduced(false);

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const parallaxPhoto = isTouchOrReduced ? '' : `translate(${mousePos.x * 10}px, ${mousePos.y * 8}px)`;
  const parallaxText = isTouchOrReduced ? '' : `translate(${mousePos.x * -14}px, ${mousePos.y * -10}px)`;
  const parallaxGlow = isTouchOrReduced ? '' : `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`;

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden bg-[#0A0A0B] bg-grain pt-28 pb-10 flex flex-col justify-between"
    >
      {/* Node Network Canvas in background */}
      <HeroNetworkCanvas />

      {/* Main Container */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center min-h-[72vh]">
          {/* Left Column: 6.5 Cols - Clean Uncluttered Dark Space */}
          <div className="lg:col-span-7 flex flex-col items-start z-30 pt-4 lg:pt-0">
            {/* Location & Time Stamp */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.5, delay: 0.0 }}
              className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#A1A1AA] mb-4"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D] animate-ping" />
              <span>
                {siteConfig.location.city.toUpperCase()}, {siteConfig.location.country.toUpperCase()} — {istTime || 'LIVE IST'}
              </span>
            </motion.div>

            {/* Main Headline with Masked Rising Lines and Animated Underline */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#F4F4F0] leading-[1.08] max-w-2xl text-balance">
              <span className="block overflow-hidden pb-1">
                <motion.span
                  className="block"
                  initial={{ y: '110%' }}
                  animate={isReady ? { y: '0%' } : { y: '110%' }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                >
                  I build AI products that
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-1">
                <motion.span
                  className="block"
                  initial={{ y: '110%' }}
                  animate={isReady ? { y: '0%' } : { y: '110%' }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
                >
                  <span className="relative inline-block text-[#C6FF3D]">
                    actually ship.
                    <svg
                      className="absolute -bottom-2 left-0 w-full overflow-visible"
                      height="8"
                      viewBox="0 0 240 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <motion.path
                        d="M3 5.5C60 2 180 2 237 6"
                        stroke="#C6FF3D"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={isReady ? { pathLength: 1 } : { pathLength: 0 }}
                        transition={{ delay: 0.55, duration: 0.7, ease: 'easeOut' }}
                      />
                    </svg>
                  </span>
                </motion.span>
              </span>
            </h1>

            {/* Cycling Role */}
            {Boolean(rotatingRoles && rotatingRoles[roleIndex] && rotatingRoles[roleIndex].trim()) && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                transition={{ duration: 0.5, delay: 0.24 }}
                className="mt-6 flex items-center gap-2.5 font-mono text-sm sm:text-base text-[#F4F4F0] min-h-[30px]"
              >
                <span className="text-[#C6FF3D] font-bold">&gt;</span>
                <motion.span
                  key={roleIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="text-white/95 border-b border-[#C6FF3D]/40 pb-0.5"
                >
                  {rotatingRoles[roleIndex]}
                </motion.span>
              </motion.div>
            )}

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.32 }}
              className="mt-4 font-body text-base md:text-lg text-[#A1A1AA] leading-relaxed max-w-xl"
            >
              {siteConfig.subheadline}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.5, delay: 0.40 }}
              className="mt-7 flex flex-wrap items-center gap-4"
            >
              <button
                onClick={onExploreWork}
                data-cursor="pointer"
                className="group relative inline-flex items-center gap-2 rounded-full bg-[#C6FF3D] px-6 sm:px-7 py-3 text-xs sm:text-sm font-semibold tracking-wider text-[#0A0A0B] uppercase transition-all duration-200 hover:bg-[#d4ff66] hover:shadow-[0_0_28px_rgba(198,255,61,0.4)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
              >
                <span>View my work</span>
                <ArrowDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
              </button>

              <button
                onClick={onOpenContactModal}
                data-cursor="pointer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 sm:px-7 py-3 text-xs sm:text-sm font-semibold tracking-wider text-[#F4F4F0] uppercase backdrop-blur-sm transition-all duration-200 hover:border-[#C6FF3D]/60 hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
              >
                <span>Hire me</span>
                <ArrowUpRight className="h-4 w-4 text-[#C6FF3D]" />
              </button>
            </motion.div>
          </div>

          {/* Right Column: 5.5 Cols - Stage with Giant Outlined CHARAN + Photo Overlap */}
          <div className="lg:col-span-5 relative flex items-end justify-center lg:justify-end min-h-[460px] md:min-h-[580px] lg:min-h-[72vh]">
            {/* Radial Lime Glow behind Subject */}
            <div
              className="pointer-events-none absolute right-[10%] top-[25%] -z-5 h-[360px] w-[360px] md:h-[440px] md:w-[440px] rounded-full bg-[#C6FF3D]/12 blur-[100px] transition-transform duration-500 ease-out"
              style={{ transform: parallaxGlow }}
            />

            {/* Giant Outlined Typography "CHARAN" & "REDDY" strictly on Right Stage */}
            <div
              className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center select-none overflow-hidden transition-transform duration-500 ease-out"
              style={{ transform: parallaxText }}
              aria-hidden="true"
            >
              <span
                className="font-display text-[clamp(4.2rem,10.5vw,10.2rem)] font-black leading-none tracking-tight uppercase whitespace-nowrap opacity-75"
                style={{
                  WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.28)',
                  color: 'transparent',
                }}
              >
                CHARAN
              </span>
              <span className="font-display text-[clamp(1.4rem,2.8vw,2.8rem)] font-bold tracking-[0.32em] text-white/35 uppercase -mt-2 md:-mt-4">
                REDDY
              </span>
            </div>

            {/* Cutout Photo - Breaking out of any box, 85vh tall, feathering at waist */}
            <div
              className="relative z-10 w-full flex justify-center items-end transition-transform duration-300 ease-out"
              style={{ transform: parallaxPhoto }}
            >
              <div
                className="relative flex justify-center items-end max-w-[420px] sm:max-w-[480px] lg:max-w-[540px] w-full"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
                }}
              >
                <img
                  src="/images/charan-hero-cutout.png"
                  alt="Charan (Bonamukkala Charan Reddy) - Generative AI Engineer"
                  className="h-[62vh] sm:h-[72vh] md:h-[82vh] lg:h-[86vh] w-auto max-w-none object-contain object-bottom filter contrast-[1.04]"
                  width="700"
                  height="960"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              {/* Floating Status Chip 1: Open for freelance projects */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={isReady ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
                transition={{ duration: 0.5, delay: 0.48 }}
                className="absolute top-10 -left-2 sm:-left-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-[#111114]/90 px-3 py-1.5 shadow-xl backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C6FF3D] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C6FF3D]" />
                </span>
                <span className="font-mono text-[11px] font-medium text-[#F4F4F0]">
                  {siteConfig.status.openForWorkLabel}
                </span>
              </motion.div>

              {/* Floating Status Chip 2: Now building */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={isReady ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
                transition={{ duration: 0.5, delay: 0.56 }}
                className="absolute bottom-28 -right-2 sm:-right-4 z-20 max-w-[210px] rounded-xl border border-white/10 bg-[#111114]/90 p-2.5 shadow-xl backdrop-blur-md"
              >
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#A1A1AA] uppercase">
                  <Sparkles className="h-3 w-3 text-[#C6FF3D]" />
                  <span>Now Building</span>
                </div>
                <div className="mt-1 font-display text-xs font-semibold text-[#F4F4F0] leading-tight">
                  {siteConfig.status.nowBuilding}
                </div>
              </motion.div>

              {/* Floating Status Chip 3: Telugu + English + Namaskaram Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: 0.5, delay: 0.64 }}
                className="absolute -bottom-2 left-4 sm:left-8 z-20 flex items-center gap-2 rounded-lg border border-[#C6FF3D]/30 bg-[#16161A]/95 px-3 py-1.5 shadow-lg backdrop-blur-md"
              >
                <span className="font-display text-xs font-medium text-[#C6FF3D]">
                  {siteConfig.status.greetingTelugu}
                </span>
                <span className="text-white/20">|</span>
                <span className="font-mono text-[11px] text-[#A1A1AA]">
                  {siteConfig.status.languages}
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Bottom Bar: Scroll Cue & Social Icons */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10 pt-6 mt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#A1A1AA]">
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="flex h-5 w-3 items-start justify-center rounded-full border border-white/20 p-0.5"
          >
            <div className="h-1.5 w-1 rounded-full bg-[#C6FF3D]" />
          </motion.div>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-4 text-[#A1A1AA]">
          <a
            href="https://github.com/bonamukkala-bot"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            className="transition-colors hover:text-[#C6FF3D] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/bonamukkala-charan"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            className="transition-colors hover:text-[#C6FF3D] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="https://www.instagram.com/charan.insights"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram profile"
            className="transition-colors hover:text-[#C6FF3D] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href="https://www.youtube.com/@charanreddysinsights"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube channel"
            className="transition-colors hover:text-[#C6FF3D] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]"
          >
            <Youtube className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
