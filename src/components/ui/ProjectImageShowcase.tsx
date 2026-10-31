import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

export interface SlideItem {
  src: string;
  caption: string;
  alt: string;
}

interface ProjectImageShowcaseProps {
  slides?: SlideItem[];
  images?: string[];
  captions?: string[];
  basePath?: string;
  projectName?: string;
}

export function ProjectImageShowcase({
  slides: customSlides,
  images = ['1.png', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg', '6.jpeg', '7.jpeg'],
  captions = ['Dashboard', 'Hiring pipeline', 'Analytics', 'Candidate detail', 'Candidates', 'Job management', 'Sign in'],
  basePath = '/projects/recruitmate',
  projectName = 'RecruitMate AI',
}: ProjectImageShowcaseProps) {
  // Build slide items preserving original captions for alt and aria-labels
  const slides: SlideItem[] = customSlides || images.map((img, idx) => {
    const rawCaption = captions[idx] || `View ${idx + 1}`;
    const src = img.startsWith('/') ? img : `${basePath}/${img}`;
    const alt = `${projectName} - ${rawCaption}`;
    return {
      src,
      caption: rawCaption,
      alt,
    };
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(
    typeof document !== 'undefined' ? document.hidden : false
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Lock scroll when lightbox is open (Lenis stopped/started)
  useScrollLock(isLightboxOpen);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Track browser tab visibility (pause autoplay when hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track viewport presence (pause autoplay when card is off-screen)
  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInViewport(entry.isIntersecting && entry.intersectionRatio >= 0.15);
      },
      { threshold: [0, 0.15, 0.5] }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Navigation handlers with direction
  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToIndex = (idx: number) => {
    if (idx === currentIndex) return;
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
    setTimerResetKey((prev) => prev + 1);
  };

  const handleManualNext = () => {
    goToNext();
    setTimerResetKey((prev) => prev + 1);
  };

  const handleManualPrev = () => {
    goToPrev();
    setTimerResetKey((prev) => prev + 1);
  };

  // Preload upcoming slide image so there is no flash or blank frame during transition
  useEffect(() => {
    if (slides.length <= 1) return;
    const nextIdx = (currentIndex + 1) % slides.length;
    const nextSrc = slides[nextIdx]?.src;
    if (nextSrc) {
      const img = new Image();
      img.src = nextSrc;
    }
  }, [currentIndex, slides]);

  // Clean timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start autoplay timer:
  // After a 500ms transition completes, a full 2000ms hold is guaranteed.
  const startTimer = useCallback(
    (delay = 2000) => {
      clearTimer();
      const isPaused =
        !isInViewport ||
        isTabHidden ||
        isHovered ||
        isFocused ||
        isLightboxOpen ||
        prefersReducedMotion ||
        slides.length <= 1;

      if (isPaused) return;

      timerRef.current = setTimeout(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, delay);
    },
    [
      clearTimer,
      isInViewport,
      isTabHidden,
      isHovered,
      isFocused,
      isLightboxOpen,
      prefersReducedMotion,
      slides.length,
    ]
  );

  // When currentIndex changes, allow 500ms for slide transition + 2000ms for full hold (total 2500ms)
  useEffect(() => {
    startTimer(2500);
    return () => clearTimer();
  }, [currentIndex, timerResetKey, startTimer, clearTimer]);

  // Pause / Resume smoothly when interaction states change
  useEffect(() => {
    const isPaused =
      !isInViewport ||
      isTabHidden ||
      isHovered ||
      isFocused ||
      isLightboxOpen ||
      prefersReducedMotion ||
      slides.length <= 1;

    if (isPaused) {
      clearTimer();
    } else {
      // Resume smoothly with full 2000ms hold
      startTimer(2000);
    }
  }, [
    isHovered,
    isFocused,
    isInViewport,
    isTabHidden,
    isLightboxOpen,
    prefersReducedMotion,
    slides.length,
    startTimer,
    clearTimer,
  ]);

  // Touch handlers for swipe (restarts timer)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Horizontal swipe threshold 40px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleManualPrev();
      } else {
        handleManualNext();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Keyboard navigation when carousel or lightbox is focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleManualPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleManualNext();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsLightboxOpen(true);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleManualNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleManualPrev();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isLightboxOpen, slides.length]);

  const currentSlide = slides[currentIndex] || slides[0];

  // Motion variants animating ONLY transform (x) and opacity
  const slideVariants = {
    enter: (dir: number) => ({
      x: prefersReducedMotion ? '0%' : dir > 0 ? '100%' : '-100%',
      opacity: prefersReducedMotion ? 0 : 0.3,
    }),
    center: {
      x: '0%',
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: prefersReducedMotion ? '0%' : dir > 0 ? '-100%' : '100%',
      opacity: prefersReducedMotion ? 0 : 0.3,
    }),
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${projectName} screenshots showcase`}
      aria-live="off"
      className="group relative w-full rounded-2xl bg-[#0c0c0f] border border-[#C6FF3D]/40 shadow-[0_0_40px_rgba(198,255,61,0.18)] hover:border-[#C6FF3D]/70 hover:shadow-[0_0_60px_rgba(198,255,61,0.28)] transition-all duration-300 overflow-hidden flex flex-col justify-between focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setIsFocused(false);
        }
      }}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Browser-style Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#141418] shrink-0">
        <div className="flex items-center gap-2">
          {/* Browser 3 dots */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D] animate-pulse" />
          <span className="font-mono text-xs text-[#F4F4F0] font-semibold">
            {projectName} Showcase
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
            Real App
          </span>
        </div>
      </div>

      {/* Main Image Stage: Reserved aspect-ratio 16/10 with zero layout shift, dark background matching card, reduced padding for larger screenshot */}
      <div className="relative w-full aspect-[16/10] bg-[#0c0c0f] overflow-hidden flex items-center justify-center p-0.5 sm:p-1 select-none">
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={currentSlide.src}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { duration: prefersReducedMotion ? 0 : 0.5, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: prefersReducedMotion ? 0.2 : 0.4, ease: 'easeInOut' },
            }}
            className="absolute inset-0 p-1 sm:p-1.5 flex items-center justify-center pointer-events-none"
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${currentIndex + 1} of ${slides.length}: ${currentSlide.caption}`}
          >
            {imageErrors[currentSlide.src] ? (
              <div className="w-full h-full flex items-center justify-center p-3 pointer-events-auto">
                <div className="rounded-lg border border-dashed border-white/20 bg-white/[0.02] py-4 px-4 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-[11px] font-medium tracking-wide text-[#8A8A92]">
                    Screenshot coming soon
                  </span>
                  <span className="font-mono text-[9px] text-[#8A8A92]/60 mt-0.5">
                    Docker Compose setup in repository
                  </span>
                </div>
              </div>
            ) : (
              <img
                src={currentSlide.src}
                alt={currentSlide.alt}
                width={1600}
                height={1000}
                loading="lazy"
                decoding="async"
                onError={() =>
                  setImageErrors((prev) => ({ ...prev, [currentSlide.src]: true }))
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className="max-w-full max-h-full w-full h-full object-contain object-center rounded-lg shadow-xl cursor-zoom-in pointer-events-auto transition-transform duration-200 hover:scale-[1.01]"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Preload only the immediate next slide image */}
        {slides.length > 1 && (
          <img
            src={slides[(currentIndex + 1) % slides.length].src}
            alt=""
            width={1600}
            height={1000}
            className="hidden"
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Prev / Next Chevrons: always visible on touch/mobile for direct access, hover on desktop */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleManualPrev();
          }}
          aria-label="Previous screenshot"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-[#0A0A0B]/85 backdrop-blur-sm border border-white/15 text-[#F4F4F0] hover:text-[#C6FF3D] hover:border-[#C6FF3D]/50 transition-all sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 z-10 flex items-center justify-center shadow-lg cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleManualNext();
          }}
          aria-label="Next screenshot"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-[#0A0A0B]/85 backdrop-blur-sm border border-white/15 text-[#F4F4F0] hover:text-[#C6FF3D] hover:border-[#C6FF3D]/50 transition-all sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 z-10 flex items-center justify-center shadow-lg cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Pagination Dots Bar: 44px tap targets for easy touch interaction */}
      <div
        className="py-1 px-3 bg-[#0c0c0f] border-t border-white/5 flex items-center justify-center gap-0.5 sm:gap-1.5 select-none shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {slides.map((slide, dotIdx) => {
          const isActive = dotIdx === currentIndex;
          return (
            <button
              key={dotIdx}
              type="button"
              onClick={() => goToIndex(dotIdx)}
              aria-label={`Go to slide ${dotIdx + 1} of ${slides.length}: ${slide.caption}`}
              aria-current={isActive ? 'true' : undefined}
              className="min-h-[44px] min-w-[28px] sm:min-w-[32px] flex items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D] rounded-full cursor-pointer"
            >
              <span
                className={`h-1.5 transition-all duration-300 rounded-full pointer-events-none ${
                  isActive
                    ? 'w-6 bg-[#C6FF3D] shadow-[0_0_8px_rgba(198,255,61,0.5)]'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Lightbox Modal (unchanged behavior, no 'Click to expand' hint) */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-6 bg-black/95 backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
          >
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent="true"
              className="relative w-[96vw] sm:w-[92vw] h-[92dvh] sm:h-[88vh] max-w-7xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-2xl bg-[#111114] border border-white/15 shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label={`${projectName} fullscreen screenshot`}
            >
              {/* Top Bar inside Lightbox */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-5 py-3 sm:py-3.5 bg-[#141418] shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-mono text-xs sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-none">
                    {currentSlide.caption}
                  </span>
                  <span className="font-mono text-[10px] sm:text-xs text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
                    {currentIndex + 1} of {slides.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  aria-label="Close lightbox"
                  className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/15 text-[#A1A1AA] hover:border-white/30 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Lightbox Image Container: Contained and uncropped */}
              <div className="relative flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-6 bg-[#070709] overflow-hidden">
                <img
                  src={currentSlide.src}
                  alt={currentSlide.alt}
                  className="w-full h-full object-contain select-none"
                />

                {/* Prev Button in Lightbox */}
                <button
                  type="button"
                  onClick={handleManualPrev}
                  aria-label="Previous screenshot"
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] p-2.5 sm:p-3 rounded-full bg-black/85 border border-white/20 text-white hover:text-[#C6FF3D] hover:border-[#C6FF3D]/50 transition-all shadow-xl flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                {/* Next Button in Lightbox */}
                <button
                  type="button"
                  onClick={handleManualNext}
                  aria-label="Next screenshot"
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] p-2.5 sm:p-3 rounded-full bg-black/85 border border-white/20 text-white hover:text-[#C6FF3D] hover:border-[#C6FF3D]/50 transition-all shadow-xl flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              {/* Bottom Bar in Lightbox */}
              <div className="p-3 bg-[#141418] border-t border-white/10 flex items-center justify-between font-mono text-xs text-[#8A8A92] shrink-0">
                <span>Use left/right arrows to browse</span>
                <span>
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px]">
                    ESC
                  </kbd>{' '}
                  to close
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
