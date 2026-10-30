import { useState, useEffect, useRef } from 'react';

export function CharanEstatesVideoPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Track prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Monitor viewport visibility with threshold >= 0.40
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.40);
      },
      {
        threshold: [0, 0.40, 1.0],
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Detect open modals / lightboxes via DOM observation and pause playback
  useEffect(() => {
    const checkModalState = () => {
      const dialog = document.querySelector('[role="dialog"], [aria-modal="true"]');
      const isLocked = document.body.style.position === 'fixed' || document.body.style.overflow === 'hidden';
      setIsModalOpen(Boolean(dialog || isLocked));
    };

    checkModalState();

    const observer = new MutationObserver(checkModalState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  // Control playback based on visibility, modal state, and reduced motion
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    const shouldPlay = isInView && !isModalOpen && !prefersReducedMotion;

    if (shouldPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Handled gracefully (e.g. browser restrictions)
        });
      }
    } else {
      video.pause();
    }
  }, [isInView, isModalOpen, prefersReducedMotion, hasError]);

  // Error fallback: silently fall back to original dashed placeholder box
  if (hasError) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 bg-white/[0.02] py-4 px-3 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-[11px] font-medium tracking-wide text-[#8A8A92]">
          Screenshot coming soon
        </span>
        <span className="font-mono text-[9px] text-[#8A8A92]/60 mt-0.5">
          Repository on GitHub (bonamukkala-bot/charanEstates)
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-1.5 w-full">
      <div className="relative w-full rounded-lg overflow-hidden border border-white/10 bg-[#070709] shadow-inner">
        <video
          ref={videoRef}
          src="/projects/charanestates.mp4"
          poster="/projects/charanestates.jpg"
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setHasError(true)}
          className="w-full h-auto max-h-[220px] sm:max-h-[240px] aspect-[1920/964] object-cover block select-none"
        />
      </div>
      <div className="text-center font-mono text-[9px] text-[#8A8A92]/70">
        Repository on GitHub (bonamukkala-bot/charanEstates)
      </div>
    </div>
  );
}
