import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, ChevronLeft, ChevronRight, Youtube, Instagram, ExternalLink, VolumeX } from 'lucide-react';
import { showcaseVideos } from '../../data/videos';
import { useScrollLock } from '../../hooks/useScrollLock';

/**
 * Maps each reel to its self-hosted files by card title.
 */
export function getReelSlug(title: string): string | null {
  if (title === '30 Days 30 AI Tools: Day 4') return '30-days-day-4';
  if (title === 'Client Project') return 'client-project';
  if (title === 'Text to Cinematic Video with Telugu Heroes') return 'telugu-heroes';
  if (title === 'IPL Win Predictor Project') return 'ipl-win-predictor';
  if (title.startsWith('How to Get Your Website Indexed')) return 'website-indexing';
  return null;
}

export function WatchMyWorkShowcase() {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [playingReelIndex, setPlayingReelIndex] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Stop Lenis & lock body scroll while modal is active
  useScrollLock(selectedVideoIndex !== null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Indices eligible for fallback modal (YouTube or unmapped reels)
  const modalIndices = useMemo(
    () =>
      showcaseVideos
        .map((v, i) => (v.platform === 'youtube' || !getReelSlug(v.title) ? i : -1))
        .filter((i) => i !== -1),
    []
  );

  const stopPlayingReel = useCallback((targetIdx?: number) => {
    const idxToFocus = targetIdx !== undefined ? targetIdx : playingReelIndex;
    if (activeVideoRef.current) {
      activeVideoRef.current.pause();
      activeVideoRef.current.currentTime = 0;
    }
    setPlayingReelIndex(null);
    setShowUnmuteButton(false);
    setVideoError(false);

    if (idxToFocus !== null && idxToFocus !== undefined) {
      setTimeout(() => {
        playButtonRefs.current[idxToFocus]?.focus();
      }, 50);
    }
  }, [playingReelIndex]);

  const handlePlayReel = (idx: number) => {
    // If modal is open, close it
    if (selectedVideoIndex !== null) {
      setSelectedVideoIndex(null);
    }
    // Pause any currently playing reel and reset its time
    if (activeVideoRef.current) {
      activeVideoRef.current.pause();
      activeVideoRef.current.currentTime = 0;
    }
    setPlayingReelIndex(idx);
    setShowUnmuteButton(false);
    setVideoError(false);
  };

  // Autoplay & sound logic when inline reel starts playing
  useEffect(() => {
    if (playingReelIndex === null) return;
    const video = activeVideoRef.current;
    if (!video) return;

    if (prefersReducedMotion) {
      // With reduced motion, do NOT autoplay; loads with controls and waits for user to play
      video.pause();
      return;
    }

    // Try playing with sound
    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setShowUnmuteButton(false);
        })
        .catch((err) => {
          // Unmuted playback rejected by browser, fall back to muted
          console.log('Unmuted playback rejected, retrying muted:', err);
          video.muted = true;
          video
            .play()
            .then(() => {
              setShowUnmuteButton(true);
            })
            .catch((e) => {
              console.warn('Muted playback also rejected:', e);
            });
        });
    }
  }, [playingReelIndex, prefersReducedMotion]);

  // Pause and return to poster state when card is scrolled out of view (~30% visible)
  useEffect(() => {
    if (playingReelIndex === null) return;
    const cardEl = cardRefs.current[playingReelIndex];
    if (!cardEl) return;

    let initialCheckDone = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (!initialCheckDone) {
          initialCheckDone = true;
          if (entry.intersectionRatio >= 0.3) return;
        }
        if (entry.intersectionRatio < 0.3) {
          stopPlayingReel(playingReelIndex);
        }
      },
      {
        threshold: [0, 0.3, 0.5, 1.0],
      }
    );

    observer.observe(cardEl);

    return () => {
      observer.disconnect();
    };
  }, [playingReelIndex, stopPlayingReel]);

  const handleUnmute = () => {
    if (activeVideoRef.current) {
      activeVideoRef.current.muted = false;
    }
    setShowUnmuteButton(false);
  };

  const openModal = (index: number) => {
    // If an inline reel is playing, stop it
    if (activeVideoRef.current) {
      activeVideoRef.current.pause();
      activeVideoRef.current.currentTime = 0;
    }
    setPlayingReelIndex(null);
    setShowUnmuteButton(false);
    setVideoError(false);

    lastActiveElementRef.current = document.activeElement as HTMLElement | null;
    setSelectedVideoIndex(index);

    const video = showcaseVideos[index];
    // If reel has NO mapped file, load Instagram embed script on demand
    if (video?.platform === 'instagram' && !getReelSlug(video.title)) {
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
    if (modalIndices.length <= 1) return;
    setSelectedVideoIndex((prev) => {
      if (prev === null) return null;
      const currentPos = modalIndices.indexOf(prev);
      const prevPos = (currentPos - 1 + modalIndices.length) % modalIndices.length;
      return modalIndices[prevPos];
    });
  }, [modalIndices]);

  const handleNextVideo = useCallback(() => {
    if (modalIndices.length <= 1) return;
    setSelectedVideoIndex((prev) => {
      if (prev === null) return null;
      const currentPos = modalIndices.indexOf(prev);
      const nextPos = (currentPos + 1) % modalIndices.length;
      return modalIndices[nextPos];
    });
  }, [modalIndices]);

  // Keyboard navigation inside modal & Tab trapping
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
      } else if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"]), video, a[href]'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
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

  // Current video item for modal
  const currentVideo = selectedVideoIndex !== null ? showcaseVideos[selectedVideoIndex] : null;

  // Scroll controls for horizontal row
  const scrollRow = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -340 : 340;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

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
          const reelSlug = isYouTube ? null : getReelSlug(video.title);
          const isPlayingThisReel = playingReelIndex === idx;

          return (
            <div
              key={video.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`flex-none snap-start flex flex-col justify-between ${
                isYouTube
                  ? 'w-[498px] sm:w-[604px]'
                  : 'w-[158px] sm:w-[191px]'
              }`}
            >
              {/* Card Media Container: unified height ~280px on mobile, ~340px on desktop */}
              <div
                data-lenis-prevent={isPlayingThisReel ? 'true' : undefined}
                className={`group relative w-full h-[280px] sm:h-[340px] rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-all duration-300 ${
                  isPlayingThisReel
                    ? 'border-[#C6FF3D]/50 bg-black'
                    : 'bg-[#111114] cursor-pointer hover:border-[#C6FF3D]/50'
                }`}
                onClick={() => {
                  if (!isPlayingThisReel) {
                    if (reelSlug) {
                      handlePlayReel(idx);
                    } else {
                      openModal(idx);
                    }
                  }
                }}
              >
                {/* Background Media / Poster (swapped for native <video> when playing) */}
                {isPlayingThisReel && reelSlug ? (
                  videoError ? (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-3 text-center bg-[#0A0A0B]">
                      <p className="font-mono text-xs text-[#A1A1AA] mb-3">
                        Video unavailable here
                      </p>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0A0A0B] font-mono text-[11px] font-bold tracking-wide transition-all active:scale-95 shadow-[0_0_15px_rgba(198,255,61,0.3)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Open on Instagram</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={activeVideoRef}
                        data-lenis-prevent="true"
                        src={`/reels/${reelSlug}.mp4`}
                        poster={`/reels/${reelSlug}.jpg`}
                        autoPlay={!prefersReducedMotion}
                        playsInline
                        controls
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-contain bg-black"
                        onError={() => setVideoError(true)}
                        onEnded={() => stopPlayingReel(idx)}
                        onVolumeChange={() => {
                          if (
                            activeVideoRef.current &&
                            !activeVideoRef.current.muted &&
                            activeVideoRef.current.volume > 0
                          ) {
                            setShowUnmuteButton(false);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      />

                      {/* Small Tap to unmute button if autoplay with sound was blocked */}
                      {showUnmuteButton && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmute();
                          }}
                          className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0A0A0B]/85 hover:bg-[#111114] border border-[#C6FF3D]/50 text-[#C6FF3D] font-mono text-[10px] sm:text-xs font-semibold backdrop-blur-md shadow-lg transition-all active:scale-95"
                        >
                          <VolumeX className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span>Tap to unmute</span>
                        </button>
                      )}
                    </>
                  )
                ) : (
                  <>
                    {/* Poster Thumbnail */}
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
                    ) : reelSlug ? (
                      <img
                        src={`/reels/${reelSlug}.jpg`}
                        alt={video.title}
                        width={400}
                        height={711}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-contain bg-black transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-b from-[#18181D] via-[#111114] to-[#0A0A0B] pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(198,255,61,0.08)_0%,_transparent_70%)] pointer-events-none" />
                      </>
                    )}
                  </>
                )}

                {/* Top Platform Badge (Kept both before and during playback) */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0A0A0B]/85 px-2.5 py-1 font-mono text-[10px] sm:text-[11px] text-[#F4F4F0] backdrop-blur-md pointer-events-none">
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

                {/* Overlays hidden while playing so they do not cover controls */}
                {!isPlayingThisReel && (
                  <>
                    {/* Subtle dark gradient overlay at bottom so title text stays readable */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/95 via-[#0A0A0B]/30 to-transparent pointer-events-none" />

                    {/* Lime Circular Play Button in Center */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <button
                        ref={(el) => {
                          playButtonRefs.current[idx] = el;
                        }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (reelSlug) {
                            handlePlayReel(idx);
                          } else {
                            openModal(idx);
                          }
                        }}
                        aria-label={video.title}
                        className="pointer-events-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#C6FF3D] text-[#0A0A0B] shadow-[0_0_24px_rgba(198,255,61,0.45)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_36px_rgba(198,255,61,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
                      >
                        <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current ml-0.5" />
                      </button>
                    </div>

                    {/* Bottom Title over Dark Gradient */}
                    <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                      <h4 className="font-display text-xs sm:text-sm font-semibold text-[#F4F4F0] leading-snug line-clamp-2 drop-shadow group-hover:text-white transition-colors">
                        {video.title}
                      </h4>
                    </div>
                  </>
                )}
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

      {/* Video Modal Player (fallback for YouTube and unmapped Instagram reels) */}
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
              ref={modalRef}
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
                  {/* Prev / Next buttons inside modal (if multiple modal videos) */}
                  {modalIndices.length > 1 && (
                    <>
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
                    </>
                  )}

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
                /* Fallback unmapped Instagram: vertical player with embed iframe */
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
