import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Maximize2, X, ExternalLink, Film } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ProjectVideoShowcaseProps {
  videoSrc?: string;
  liveUrl?: string;
  projectName?: string;
  caption?: string;
}

export function ProjectVideoShowcase({
  videoSrc = '/projects/srivishnu/demo.mp4',
  liveUrl = 'https://srivishnugrandpg.com',
  projectName = 'Sri Vishnu Grand PG',
  caption = 'Website walkthrough',
}: ProjectVideoShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lightboxVideoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxPlaying, setLightboxPlaying] = useState(true);
  const [lightboxProgress, setLightboxProgress] = useState(0);
  const [lightboxDuration, setLightboxDuration] = useState(0);
  const [lightboxCurrentTime, setLightboxCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [userManuallyPaused, setUserManuallyPaused] = useState(false);

  // Lock scroll with Lenis integration when lightbox is active
  useScrollLock(isLightboxOpen);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // IntersectionObserver: Play when entering viewport, pause when leaving
  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
        setIsInViewport(visible);

        const video = videoRef.current;
        if (!video) return;

        if (visible) {
          if (!prefersReducedMotion && !userManuallyPaused && !isLightboxOpen) {
            video.play().then(() => setIsPlaying(true)).catch(() => {
              setIsPlaying(false);
            });
          }
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [prefersReducedMotion, userManuallyPaused, isLightboxOpen]);

  // Read video natural dimensions on metadata load to eliminate black bars
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
  };

  // Handle time update for progress bar on inline video
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const current = video.currentTime;
    const dur = video.duration;
    setProgress((current / dur) * 100);
  };

  // Toggle play/pause for inline player
  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setUserManuallyPaused(false);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
      setUserManuallyPaused(true);
    }
  };

  // Open lightbox
  const openLightbox = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setIsLightboxOpen(true);
    setLightboxPlaying(true);
  };

  // Close lightbox
  const closeLightbox = useCallback(() => {
    if (lightboxVideoRef.current) {
      lightboxVideoRef.current.pause();
    }
    setIsLightboxOpen(false);
    setLightboxPlaying(false);

    if (isInViewport && !prefersReducedMotion && !userManuallyPaused && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isInViewport, prefersReducedMotion, userManuallyPaused]);

  // Keyboard navigation inside lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const lbVid = lightboxVideoRef.current;
        if (!lbVid) return;
        if (lbVid.paused) {
          lbVid.play().then(() => setLightboxPlaying(true)).catch(() => {});
        } else {
          lbVid.pause();
          setLightboxPlaying(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, closeLightbox]);

  // Lightbox time tracking
  const handleLightboxTimeUpdate = () => {
    const video = lightboxVideoRef.current;
    if (!video || !video.duration) return;
    setLightboxCurrentTime(video.currentTime);
    setLightboxDuration(video.duration);
    setLightboxProgress((video.currentTime / video.duration) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = lightboxVideoRef.current;
    if (!video || !video.duration) return;
    const targetTime = (parseFloat(e.target.value) / 100) * video.duration;
    video.currentTime = targetTime;
    setLightboxProgress(parseFloat(e.target.value));
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Fallback if video fails to load
  if (hasError) {
    return (
      <div className="relative w-full rounded-2xl bg-[#0c0c0f] p-6 sm:p-8 border-2 border-dashed border-white/20 flex flex-col items-center justify-center min-h-[320px] text-center">
        <Film className="h-10 w-10 text-[#8A8A92] mb-3 opacity-60" />
        <span className="font-mono text-sm text-[#8A8A92] uppercase tracking-wider">
          Screenshots coming soon
        </span>
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-[#C6FF3D] hover:underline"
          >
            <span>Visit {liveUrl.replace(/^https?:\/\//, '')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    );
  }

  const browserBarText = liveUrl ? liveUrl.replace(/^https?:\/\//, '') : projectName;

  return (
    <div
      ref={containerRef}
      className="group relative w-full rounded-2xl bg-[#0c0c0f] border border-[#C6FF3D]/40 shadow-[0_0_40px_rgba(198,255,61,0.18)] hover:border-[#C6FF3D]/70 hover:shadow-[0_0_60px_rgba(198,255,61,0.28)] transition-all duration-300 overflow-hidden flex flex-col justify-between"
    >
      {/* Browser-style frame header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#141418]">
        {/* Three dots on the left */}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>

        {/* Slim bar showing real live URL or project name */}
        <div className="flex-1 max-w-[280px] sm:max-w-md mx-3 px-3.5 py-1.5 rounded-md bg-[#0A0A0B] border border-white/10 text-center font-mono text-xs text-[#A1A1AA] truncate select-all">
          {browserBarText}
        </div>

        {/* Green LIVE badge */}
        <div className="flex items-center min-w-[55px] justify-end">
          {liveUrl && (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Main Video Container: Edge-to-edge with NO black bars, natural aspect ratio, max-height 70vh, object-fit: cover */}
      <div
        onClick={openLightbox}
        style={{
          aspectRatio: aspectRatio ? `${aspectRatio}` : '16/10',
          maxHeight: '70vh',
        }}
        className="relative w-full bg-[#0A0A0B] flex items-center justify-center overflow-hidden cursor-pointer select-none"
      >
        <video
          ref={videoRef}
          src={videoSrc}
          preload="metadata"
          muted
          loop
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover select-none"
        />

        {/* Centered Pill "Click to expand" on hover */}
        <div className="absolute inset-0 pointer-events-none hidden sm:flex items-center justify-center z-10">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 px-4 py-2 rounded-full bg-[#0A0A0B]/85 backdrop-blur-md border border-[#C6FF3D]/50 text-[#C6FF3D] font-mono text-xs flex items-center gap-2 shadow-2xl">
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Click to expand</span>
          </div>
        </div>

        {/* Maximize prompt top-right for mobile / quick click */}
        <button
          type="button"
          onClick={openLightbox}
          aria-label="Expand video in fullscreen lightbox"
          className="absolute top-3 right-3 p-2 rounded-md bg-[#0A0A0B]/85 backdrop-blur-sm border border-white/20 text-[#A1A1AA] hover:text-[#C6FF3D] hover:border-[#C6FF3D]/40 transition-colors opacity-95 sm:opacity-0 group-hover:opacity-100 z-10"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Controls Overlay: Small lime play/pause button (always muted) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        >
          {/* Lime Play/Pause button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-[#C6FF3D] text-[#0A0A0B] hover:bg-[#d6ff5e] transition-transform active:scale-95 shadow-lg"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Thin lime progress bar at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden z-10">
          <div
            className="h-full bg-[#C6FF3D] transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Caption under the player: One size larger & brighter JetBrains Mono text */}
      <div className="px-5 py-3.5 bg-[#0c0c0f] border-t border-white/10 flex items-center justify-between">
        <span className="font-mono text-sm sm:text-base font-semibold text-[#F4F4F0] tracking-wide">
          {caption}
        </span>
        <span className="font-mono text-xs text-[#8A8A92]/70 hidden sm:inline">
          Click video to expand
        </span>
      </div>

      {/* Full-screen Lightbox Modal (92vw by 88vh, Lenis stopped, uncropped and contained) */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-6 bg-black/95 backdrop-blur-md"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
          >
            {/* Lightbox Container 92vw by 88vh */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent="true"
              className="relative w-[92vw] h-[88vh] max-w-7xl max-h-[88vh] flex flex-col rounded-2xl bg-[#111114] border border-white/15 shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label={`${projectName} fullscreen video walkthrough`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-[#141418] shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm sm:text-base font-bold text-white">
                    {projectName}
                  </span>
                  <span className="text-white/20">/</span>
                  <span className="font-mono text-xs sm:text-sm text-[#C6FF3D]">
                    {caption}
                  </span>
                  {liveUrl && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 ml-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label="Close fullscreen video"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[#A1A1AA] hover:border-white/30 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Lightbox Video Viewport: Uncropped, contained, clean display */}
              <div className="relative flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-4 bg-[#070709] overflow-hidden">
                <video
                  ref={lightboxVideoRef}
                  src={videoSrc}
                  autoPlay
                  playsInline
                  loop
                  muted
                  onTimeUpdate={handleLightboxTimeUpdate}
                  onPlay={() => setLightboxPlaying(true)}
                  onPause={() => setLightboxPlaying(false)}
                  className="w-full h-full object-contain select-none"
                />
              </div>

              {/* Lightbox Video Controls Bar */}
              <div className="p-4 bg-[#141418] border-t border-white/10 flex flex-col gap-2.5 shrink-0">
                {/* Seek Scrubber */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={lightboxProgress}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#C6FF3D]"
                    aria-label="Video scrubber"
                  />
                  <div className="font-mono text-xs text-[#8A8A92] shrink-0 min-w-[75px] text-right">
                    {formatTime(lightboxCurrentTime)} / {formatTime(lightboxDuration)}
                  </div>
                </div>

                {/* Control buttons & Links */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const vid = lightboxVideoRef.current;
                        if (!vid) return;
                        if (vid.paused) {
                          vid.play().then(() => setLightboxPlaying(true)).catch(() => {});
                        } else {
                          vid.pause();
                          setLightboxPlaying(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C6FF3D] text-[#0A0A0B] font-mono text-xs font-semibold hover:bg-[#d6ff5e] transition-colors"
                    >
                      {lightboxPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                    <span className="font-mono text-[11px] text-[#8A8A92] hidden sm:inline">
                      Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white text-[10px]">Space</kbd> to toggle
                    </span>
                  </div>

                  {liveUrl && (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-[#C6FF3D] hover:underline"
                    >
                      <span>Visit Live Site</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
