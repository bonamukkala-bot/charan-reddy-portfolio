import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion } from 'motion/react';
import { stopLenis, startLenis } from '../../hooks/useLenis';

interface PageLoaderProps {
  onExitStart?: () => void;
  onComplete: () => void;
}

const marqueeRoles = 'AI ENGINEER • MULTI-AGENT SYSTEMS BUILDER • FULL STACK DEVELOPER • TECH CONTENT CREATOR • ';

export function PageLoader({ onExitStart, onComplete }: PageLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [borderFlashed, setBorderFlashed] = useState(false);
  const [isPillExiting, setIsPillExiting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTouchOrReduced, setIsTouchOrReduced] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const [pillDim, setPillDim] = useState({ w: 260, h: 48 });
  const pillRef = useRef<HTMLDivElement>(null);

  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const singleMarqueeBlockRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  // Measure pill dimensions for precision SVG border
  useLayoutEffect(() => {
    if (pillRef.current) {
      const { offsetWidth, offsetHeight } = pillRef.current;
      if (offsetWidth && offsetHeight) {
        setPillDim({ w: offsetWidth, h: offsetHeight });
      }
    }
  }, []);

  // Update progress ref for RAF loops
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Lock body scroll and stop Lenis immediately upon mount
  useEffect(() => {
    stopLenis();
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Check pointer and motion preferences
  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setPrefersReducedMotion(reducedMotionQuery.matches);
    setIsTouchOrReduced(!isFinePointer || reducedMotionQuery.matches);

    const onMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      setIsTouchOrReduced(!isFinePointer || e.matches);
    };

    reducedMotionQuery.addEventListener('change', onMotionChange);
    return () => reducedMotionQuery.removeEventListener('change', onMotionChange);
  }, []);

  // Subtle magnetic float effect (2 to 4px) tied to mouse movement on desktop
  useEffect(() => {
    if (isTouchOrReduced) return;

    const onMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const x = ((e.clientX - cx) / cx) * 3.5;
      const y = ((e.clientY - cy) / cy) * 3.5;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [isTouchOrReduced]);

  // Infinite Marquee animation that speeds up smoothly as progress increases
  useEffect(() => {
    let offset = 0;
    let rafId: number;

    const loop = () => {
      if (prefersReducedMotion) return;

      // Base speed ~1.2px/frame, accelerating up to ~4.6px/frame at 100%
      const speed = 1.2 + (progressRef.current / 100) * 3.4;
      offset += speed;

      if (singleMarqueeBlockRef.current) {
        const blockWidth = singleMarqueeBlockRef.current.offsetWidth;
        if (blockWidth > 0 && offset >= blockWidth) {
          offset -= blockWidth;
        }
      }

      if (marqueeTrackRef.current) {
        marqueeTrackRef.current.style.transform = `translate3d(-${offset}px, 0, 0)`;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [prefersReducedMotion]);

  // Organic counter animation tied to real fonts & window loading
  useEffect(() => {
    let fontsLoaded = false;
    let windowLoaded = false;

    if (document.fonts) {
      document.fonts.ready
        .then(() => {
          fontsLoaded = true;
        })
        .catch(() => {
          fontsLoaded = true;
        });
    } else {
      fontsLoaded = true;
    }

    if (document.readyState === 'complete') {
      windowLoaded = true;
    } else {
      const handleLoad = () => {
        windowLoaded = true;
      };
      window.addEventListener('load', handleLoad, { once: true });
    }

    const startTime = performance.now();
    let isCompleteTriggered = false;
    let rafId: number;

    const triggerCompletion = () => {
      if (isCompleteTriggered) return;
      isCompleteTriggered = true;

      setIsReady(true);
      setBorderFlashed(true);

      // Hold for about 300ms after reaching READY
      setTimeout(() => {
        // Trigger hero and nav staggered entrance
        if (onExitStart) {
          onExitStart();
        }
        setIsPillExiting(true);

        // Curtain lifts away
        setTimeout(() => {
          setIsExiting(true);

          // Full completion after 1000ms transition
          setTimeout(() => {
            setIsRemoved(true);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            startLenis();
            onComplete();
          }, 1000);
        }, 120);
      }, 300);
    };

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const assetsReady = fontsLoaded && (windowLoaded || document.readyState === 'complete');

      // Fast-track for reduced motion
      if (prefersReducedMotion) {
        if (elapsed > 700 && assetsReady) {
          setProgress(100);
          triggerCompletion();
          return;
        }
        const p = Math.min(99, Math.floor((elapsed / 700) * 100));
        setProgress(p);
        rafId = requestAnimationFrame(updateCounter);
        return;
      }

      // Eased, slightly irregular curve with natural pauses around ~30%, ~60%, ~85%
      // Minimum duration ~2.4s - 2.8s, maximum ~4.5s
      let target = 0;
      if (elapsed < 380) {
        // Quick start: 0% -> 28%
        target = (elapsed / 380) * 28;
      } else if (elapsed < 880) {
        // Small pause around 30%: 28% -> 33%
        target = 28 + ((elapsed - 380) / 500) * 5;
      } else if (elapsed < 1450) {
        // Advance: 33% -> 58%
        target = 33 + ((elapsed - 880) / 570) * 25;
      } else if (elapsed < 1850) {
        // Small pause around 60%: 58% -> 63%
        target = 58 + ((elapsed - 1450) / 400) * 5;
      } else if (elapsed < 2350) {
        // Advance: 63% -> 85%
        target = 63 + ((elapsed - 1850) / 500) * 22;
      } else if (elapsed < 2700) {
        // Pause around 85%: 85% -> 88%
        target = 85 + ((elapsed - 2350) / 350) * 3;
      } else {
        // Final stretch (2700ms+)
        if (assetsReady || elapsed >= 4500) {
          // Fast final push to 100%
          const pushElapsed = elapsed - 2700;
          target = 88 + (pushElapsed / 320) * 12;
        } else {
          // Creep gracefully up to 96% until assets are ready or 4500ms max
          target = 88 + Math.min(8, ((elapsed - 2700) / 1600) * 8);
        }
      }

      const currentP = Math.min(100, Math.floor(target));
      setProgress(currentP);

      if (currentP >= 100) {
        triggerCompletion();
      } else {
        rafId = requestAnimationFrame(updateCounter);
      }
    };

    rafId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(rafId);
  }, [prefersReducedMotion, onExitStart, onComplete]);

  // Don't render once exit finishes completely
  if (isRemoved) return null;

  return (
    <div
      aria-hidden={isExiting}
      className={`fixed inset-0 z-[99999] flex flex-col justify-between overflow-hidden bg-[#0A0A0B] select-none ${
        isExiting ? 'pointer-events-none' : ''
      }`}
      style={{
        transform: prefersReducedMotion
          ? undefined
          : isExiting
          ? 'translateY(-100%)'
          : 'translateY(0%)',
        opacity: prefersReducedMotion && isExiting ? 0 : 1,
        clipPath: prefersReducedMotion
          ? undefined
          : isExiting
          ? 'polygon(0% 0%, 100% 0%, 100% calc(100% - 6vh), 50% 100%, 0% calc(100% - 6vh))'
          : 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%)',
        transition: prefersReducedMotion
          ? 'opacity 350ms ease-out'
          : isExiting
          ? 'transform 1000ms cubic-bezier(0.76, 0, 0.24, 1), clip-path 1000ms cubic-bezier(0.76, 0, 0.24, 1)'
          : 'none',
        willChange: isExiting ? 'transform, clip-path' : undefined,
      }}
    >
      {/* Polite Screen Reader Announcement (Only Loading and Ready) */}
      <div role="status" aria-live="polite" className="sr-only">
        {isReady ? 'Ready' : 'Loading'}
      </div>

      {/* Top Header Row */}
      <div className="relative z-20 flex items-center justify-between px-6 sm:px-10 pt-7">
        {/* Top-Left: Site Name / Logo */}
        <div className="flex items-center font-display text-lg sm:text-xl font-bold tracking-tight text-[#F4F4F0]">
          <span>Charan</span>
          <span className="text-[#C6FF3D]">.</span>
        </div>

        {/* Top-Right: Tiny Animated Equalizer Bars in Lime */}
        <div
          className="flex items-end gap-1 h-4 sm:h-5 px-2 py-1 rounded bg-white/5 border border-white/5"
          aria-hidden="true"
        >
          <motion.span
            animate={{ height: ['4px', '16px', '6px', '14px', '4px'] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="w-0.5 sm:w-1 rounded-full bg-[#C6FF3D]"
          />
          <motion.span
            animate={{ height: ['14px', '4px', '18px', '8px', '14px'] }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut', delay: 0.15 }}
            className="w-0.5 sm:w-1 rounded-full bg-[#C6FF3D]"
          />
          <motion.span
            animate={{ height: ['6px', '18px', '4px', '15px', '6px'] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut', delay: 0.3 }}
            className="w-0.5 sm:w-1 rounded-full bg-[#C6FF3D]"
          />
          <motion.span
            animate={{ height: ['12px', '6px', '14px', '4px', '12px'] }}
            transition={{ repeat: Infinity, duration: 0.85, ease: 'easeInOut', delay: 0.45 }}
            className="w-0.5 sm:w-1 rounded-full bg-[#C6FF3D]"
          />
        </div>
      </div>

      {/* Center: Giant Seamless Marquee Text */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none z-10"
        style={{
          opacity: isExiting ? 0 : 0.16,
          filter: isExiting ? 'blur(12px)' : 'none',
          transition: isExiting ? 'opacity 0.5s ease-out, filter 0.5s ease-out' : 'none',
        }}
      >
        <div
          ref={marqueeTrackRef}
          className="flex whitespace-nowrap will-change-transform"
        >
          <div ref={singleMarqueeBlockRef} className="flex shrink-0 items-center">
            <span className="font-display font-black tracking-tighter uppercase text-[clamp(72px,14vw,220px)] leading-none text-[#F4F4F0] px-4">
              {marqueeRoles}
            </span>
          </div>
          <div className="flex shrink-0 items-center">
            <span className="font-display font-black tracking-tighter uppercase text-[clamp(72px,14vw,220px)] leading-none text-[#F4F4F0] px-4">
              {marqueeRoles}
            </span>
          </div>
        </div>
      </div>

      {/* Dead Center on Top of Marquee: Pill-Shaped Loader */}
      <div className="relative z-30 flex items-center justify-center my-auto px-4">
        <motion.div
          ref={pillRef}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{
            opacity: isPillExiting ? 0 : 1,
            scale: isPillExiting ? 1.14 : 1,
          }}
          transition={{
            opacity: { duration: isPillExiting ? 0.28 : 0.45, ease: 'easeOut' },
            scale: { duration: isPillExiting ? 0.32 : 0.5, ease: [0.16, 1, 0.3, 1] },
          }}
          style={{
            transform: isTouchOrReduced
              ? undefined
              : `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
          }}
          className={`relative flex items-center justify-between gap-4 sm:gap-6 rounded-full bg-[#111114] px-5 sm:px-7 py-3 sm:py-3.5 border transition-all duration-300 ${
            borderFlashed
              ? 'border-[#C6FF3D] shadow-[0_0_36px_rgba(198,255,61,0.6)]'
              : 'border-white/15 shadow-[0_0_24px_rgba(198,255,61,0.18)]'
          }`}
        >
          {/* Sweeping Lime Gradient Border along the Pill Perimeter */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none rounded-full overflow-visible"
            viewBox={`0 0 ${pillDim.w} ${pillDim.h}`}
            style={{ width: '100%', height: '100%' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="pillLimeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C6FF3D" stopOpacity="0.2" />
                <stop offset="60%" stopColor="#C6FF3D" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#C6FF3D" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect
              x="1"
              y="1"
              width={Math.max(10, pillDim.w - 2)}
              height={Math.max(10, pillDim.h - 2)}
              rx={Math.max(10, (pillDim.h - 2) / 2)}
              fill="none"
              stroke="url(#pillLimeGrad)"
              strokeWidth="1.5"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.max(0, 100 - progress)}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-150 ease-out"
            />
          </svg>

          {/* Left: LOADING / READY Slide Swap */}
          <div className="h-[1.4em] overflow-hidden relative w-[64px] sm:w-[72px] flex items-center font-mono text-xs sm:text-sm font-semibold tracking-wider uppercase">
            <div
              className="flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: isReady ? 'translateY(-50%)' : 'translateY(0%)' }}
            >
              <span className="h-[1.4em] flex items-center text-white/80">LOADING</span>
              <span className="h-[1.4em] flex items-center text-[#C6FF3D] font-bold">READY</span>
            </div>
          </div>

          {/* Center Divider Dot */}
          <span className="h-1 w-1 rounded-full bg-white/20 shrink-0" aria-hidden="true" />

          {/* Right: Jitter-Free Tabular Odometer Counter + Blinking Terminal Block Cursor */}
          <div className="flex items-center" aria-hidden="true">
            <OdometerCounter value={progress} />
            <span
              className="inline-block w-2 sm:w-2.5 h-3.5 sm:h-4 bg-[#C6FF3D] ml-1.5 rounded-[1px] animate-pulse"
              aria-hidden="true"
            />
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Thin 1px Progress Line Fixed at the Very Bottom in Lime */}
      <div className="relative z-20 pb-6 px-6 sm:px-10">
        <div className="fixed bottom-0 left-0 right-0 h-[1.5px] bg-white/10 z-[100000] pointer-events-none">
          <div
            className="h-full bg-[#C6FF3D] transition-[width] duration-100 ease-out shadow-[0_0_8px_#C6FF3D]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Jitter-free odometer counter with fixed container width and vertical roll
 */
function OdometerCounter({ value }: { value: number }) {
  const hundreds = Math.floor(value / 100);
  const tens = Math.floor((value % 100) / 10);
  const ones = value % 10;

  return (
    <div className="inline-flex items-center justify-end w-[4.6ch] sm:w-[5.2ch] font-mono tabular-nums text-sm sm:text-base font-bold text-[#C6FF3D] select-none">
      <div className="flex items-center overflow-hidden h-[1.4em]">
        {value >= 100 && <OdometerDigit digit={hundreds} />}
        {value >= 10 && <OdometerDigit digit={tens} />}
        <OdometerDigit digit={ones} />
      </div>
      <span className="ml-0.5 text-[#C6FF3D]">%</span>
    </div>
  );
}

function OdometerDigit({ digit }: { digit: number }) {
  return (
    <div className="relative h-[1.4em] w-[0.62em] overflow-hidden inline-block">
      <div
        className="transition-transform duration-250 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col items-center"
        style={{ transform: `translateY(-${digit * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="h-[1.4em] flex items-center justify-center leading-none">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
