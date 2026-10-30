import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, ChevronLeft, ChevronRight, Youtube, Instagram, ExternalLink } from 'lucide-react';
import { showcaseVideos, ShowcaseVideo } from '../../data/videos';
import { useScrollLock } from '../../hooks/useScrollLock';

export function WatchMyWorkShowcase() {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Stop Lenis & lock body scroll while modal is active
  useScrollLock(selectedVideoIndex !== null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const openModal = (index: number) => {
    lastActiveElementRef.current = document.activeElement as HTMLElement | null;
    setSelectedVideoIndex(index);

    // Dynamically load Instagram embed script on demand when modal opens
    if (showcaseVideos[index]?.platform === 'instagram') {
      if (!document.getElementById('instagram-embed-script')) {
        const script = document.createElement('script');
        script.id = 'instagram-embed-script';
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      } else if ((window as unknown as { instgrm?: { Embeds: { process: () => void } } }).instgrm) {
        (window as unknown as { instgrm: { Embeds: { process: () => void } } }).instgrm.Embeds.process();
      }
    }
  };

  const closeModal = useCallback(() => {
    setSelectedVideoIndex(null);
    if (lastActiveElementRef.current) {
      lastActiveElementRef.current.focus();
    }
  }, []);

  const handlePrevVideo = useCallback(() => {
    setSelectedVideoIndex((prev) =>
      prev !== null ? (prev - 1 + showcaseVideos.length) % showcaseVideos.length : null
    );
  }, []);

  const handleNextVideo = useCallback(() => {
    setSelectedVideoIndex((prev) =>
      prev !== null ? (prev + 1) % showcaseVideos.length : null
    );
  }, []);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (selectedVideoIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevVideo();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVideoIndex, closeModal, handlePrevVideo, handleNextVideo]);

  // Focus close button on modal open
  useEffect(() => {
    if (selectedVideoIndex !== null) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
  }, [selectedVideoIndex]);

  // Scroll controls for horizontal row
  const scrollRow = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -340 : 340;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const currentVideo = selectedVideoIndex !== null ? showcaseVideos[selectedVideoIndex] : null;

  return (
    <div className="w-full pt-8 border-t border-white/5">
      {/* Heading Row with compact margin and scroll buttons */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between mb-5"
      >
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#C6FF3D] mb-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
            <span>WATCH</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F0]">
            Watch my work
          </h3>
        </div>

        {/* Row Scroll Navigation Arrows (Desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollRow('left')}
            aria-label="Scroll left"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#111114] text-white/70 hover:border-[#C6FF3D] hover:text-[#C6FF3D] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollRow('right')}
            aria-label="Scroll right"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#111114] text-white/70 hover:border-[#C6FF3D] hover:text-[#C6FF3D] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Single Horizontal Row for all 6 cards (1 YouTube + 5 Instagram Reels) */}
      <div
        ref={scrollContainerRef}
        data-lenis-prevent="true"
        className="reel-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 pt-1 px-0.5 select-none"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(198, 255, 61, 0.4) #111114',
        }}
      >
        {showcaseVideos.map((video, idx) => {
          const isYouTube = video.platform === 'youtube';
          return (
            <div
              key={video.id}
              className={`flex-none snap-start flex flex-col justify-between ${
                isYouTube
                  ? 'w-[498px] sm:w-[604px]'
                  : 'w-[158px] sm:w-[191px]'
              }`}
            >
              {/* Card Media Container: unified height ~280px on mobile, ~340px on desktop */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => openModal(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal(idx);
                  }
                }}
                aria-label={`Play ${video.platform === 'youtube' ? 'YouTube video' : 'Instagram reel'}: ${video.title}`}
                className="group relative w-full h-[280px] sm:h-[340px] rounded-2xl border border-white/10 bg-[#111114] overflow-hidden shadow-lg cursor-pointer transition-all duration-300 hover:border-[#C6FF3D]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
              >
                {/* Background Media / Poster */}
                {isYouTube ? (
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                    alt={video.title}
                    width={480}
                    height={360}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <InstagramPoster videoId={video.id} />
                )}

                {/* Gradient Overlays for readable text & depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/95 via-[#0A0A0B]/30 to-transparent pointer-events-none" />

                {/* Top Platform Badge */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0A0A0B]/85 px-2.5 py-1 font-mono text-[10px] sm:text-[11px] text-[#F4F4F0] backdrop-blur-md">
                  {isYouTube ? (
                    <>
                      <Youtube className="h-3.5 w-3.5 text-red-400" />
                      <span>YouTube</span>
                    </>
                  ) : (
                    <>
                      <Instagram className="h-3.5 w-3.5 text-[#C6FF3D]" />
                      <span>Instagram Reel</span>
                    </>
                  )}
                </div>

                {/* Lime Circular Play Button in Center */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#C6FF3D] text-[#0A0A0B] shadow-[0_0_24px_rgba(198,255,61,0.45)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_36px_rgba(198,255,61,0.65)]">
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Bottom Title over Dark Gradient */}
                <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                  <h4 className="font-display text-xs sm:text-sm font-semibold text-[#F4F4F0] leading-snug line-clamp-2 drop-shadow group-hover:text-white transition-colors">
                    {video.title}
                  </h4>
                </div>
              </div>

              {/* Small External Link Under Card */}
              <div className="mt-2 px-1">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-[#A1A1AA] hover:text-[#C6FF3D] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{isYouTube ? 'Watch on YouTube' : 'Open on Instagram'}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Modal Player */}
      <AnimatePresence>
        {selectedVideoIndex !== null && currentVideo && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={currentVideo.title}
            data-lenis-prevent="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
            onClick={closeModal}
          >
            {/* Modal Dialog Content Container (clicks inside do not close modal) */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full flex flex-col items-center justify-center max-h-[96vh]"
            >
              {/* Header Bar with Title, Counter & Action Controls */}
              <div className="w-full flex items-center justify-between mb-3 px-1 text-white">
                <div className="flex items-center gap-2 max-w-[70%] sm:max-w-[75%] overflow-hidden">
                  <span className="font-mono text-xs text-[#C6FF3D] shrink-0">
                    {selectedVideoIndex + 1}/{showcaseVideos.length}
                  </span>
                  <span className="font-display text-sm sm:text-base font-semibold text-[#F4F4F0] truncate">
                    {currentVideo.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Prev / Next buttons inside modal */}
                  <button
                    type="button"
                    onClick={handlePrevVideo}
                    aria-label="Previous video"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111114] text-white/80 hover:text-[#C6FF3D] hover:border-[#C6FF3D] border border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextVideo}
                    aria-label="Next video"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111114] text-white/80 hover:text-[#C6FF3D] hover:border-[#C6FF3D] border border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Prominent Close Button with Lime Hover Border */}
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={closeModal}
                    aria-label="Close modal player"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111114] text-white/90 hover:text-[#C6FF3D] border border-white/20 hover:border-[#C6FF3D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Player Frame based on platform */}
              {currentVideo.platform === 'youtube' ? (
                /* YouTube: 16:9 player, max-w min(960px, 92vw) */
                <div className="w-[min(960px,92vw)] aspect-video rounded-2xl overflow-hidden border border-white/20 bg-black shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&rel=0&playsinline=1&origin=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.origin : ''
                    )}`}
                    title={currentVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                /* Instagram: vertical player with clean white background behind embed */
                <div className="w-[min(420px,92vw)] max-h-[min(86vh,780px)] h-[min(80vh,720px)] rounded-2xl overflow-hidden border border-white/20 bg-white shadow-2xl flex flex-col">
                  <iframe
                    src={`https://www.instagram.com/reel/${currentVideo.id}/embed`}
                    title={currentVideo.title}
                    allowFullScreen
                    scrolling="no"
                    allow="autoplay; encrypted-media; fullscreen"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              )}

              {/* Fallback line under player */}
              <div className="mt-3 text-center">
                <span className="font-mono text-xs text-[#A1A1AA]">
                  Not loading?{' '}
                  <a
                    href={currentVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C6FF3D] hover:underline underline-offset-2 inline-flex items-center gap-0.5 ml-1"
                  >
                    <span>
                      {currentVideo.platform === 'youtube' ? 'Open on YouTube' : 'Open on Instagram'}
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Renders the Instagram poster or dark fallback without broken image icons
 */
function InstagramPoster({ videoId }: { videoId: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <>
      {!hasError && (
        <img
          src={`/reels/${videoId}.jpg`}
          alt=""
          width={400}
          height={711}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      {/* Dark fallback background with subtle lime accents */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#18181D] via-[#111114] to-[#0A0A0B] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(198,255,61,0.08)_0%,_transparent_70%)] pointer-events-none" />
    </>
  );
}
