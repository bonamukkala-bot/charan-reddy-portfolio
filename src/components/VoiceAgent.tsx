import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import { useScrollLock } from '../hooks/useScrollLock';

interface VoiceAgentProps {
  isPageLoaded?: boolean;
  isOverlayOpen?: boolean;
}

function formatRemainingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VoiceAgent({
  isPageLoaded = true,
  isOverlayOpen = false,
}: VoiceAgentProps) {
  const {
    isOpen,
    callState,
    speakerState,
    errorType,
    isMuted,
    turns,
    secondsRemaining,
    openPanel,
    closePanel,
    startCall,
    endCall,
    toggleMute,
    fallbackToChat,
  } = useVoiceAgent();

  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showMobileLabel, setShowMobileLabel] = useState(true);
  const mobileLabelTimerRef = useRef<number | null>(null);
  const [imageError, setImageError] = useState(false);

  // Check reduced-motion media query
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Check desktop media query (>= 768px)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Show mobile label for first 6 seconds after page load
  useEffect(() => {
    if (!isPageLoaded) return;
    const timer = window.setTimeout(() => {
      setShowMobileLabel(false);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [isPageLoaded]);

  const triggerMobileLabel = React.useCallback(() => {
    setShowMobileLabel(true);
    if (mobileLabelTimerRef.current) window.clearTimeout(mobileLabelTimerRef.current);
    mobileLabelTimerRef.current = window.setTimeout(() => {
      setShowMobileLabel(false);
    }, 3500);
  }, []);

  // Lock body scroll while panel is open
  useScrollLock(isOpen);

  // Scroll transcript to bottom on new turns
  useEffect(() => {
    if (transcriptBottomRef.current) {
      transcriptBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns]);

  // Tab trapping and Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
        setTimeout(() => launcherRef.current?.focus(), 50);
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  }, [isOpen, closePanel]);

  // Set initial focus inside panel on open
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const timer = setTimeout(() => {
        const primaryBtn = panelRef.current?.querySelector<HTMLElement>(
          'button[data-autofocus="true"], button'
        );
        primaryBtn?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, callState]);

  // Hide or close if an overlay/modal/mobile-menu opens
  useEffect(() => {
    if (isOverlayOpen && isOpen) {
      closePanel();
    }
  }, [isOverlayOpen, isOpen, closePanel]);

  return (
    <>
      {/* ============================================================== */}
      {/* 1. FLOATING LAUNCHER BUTTON                                     */}
      {/* Stacked directly ABOVE the chatbot ASK button                   */}
      {/* Chatbot is at bottom 1.5rem (24px). Chatbot height is 56px.     */}
      {/* Voice button is positioned at bottom 1.5rem + 4.25rem = 5.75rem */}
      {/* ============================================================== */}
      {!isOpen && isPageLoaded && !isOverlayOpen && (
        <div
          className="fixed right-5 sm:right-8 z-[70] flex items-center gap-2 select-none"
          style={{
            bottom: 'calc(max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 0px))) + 4.25rem)',
          }}
        >
          <AnimatePresence>
            {(isDesktop || showMobileLabel) && (
              <motion.span
                aria-hidden="true"
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, x: 6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, x: 6 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#121215]/90 border border-[#C6FF3D]/40 text-[#C6FF3D] font-mono text-[11px] font-bold tracking-wider shadow-lg pointer-events-none whitespace-nowrap"
              >
                TALK TO ME
              </motion.span>
            )}
          </AnimatePresence>

          <div className="relative flex items-center justify-center">
            {/* Subtle pulsing ring animation for voice avatar button only */}
            {!prefersReducedMotion && (
              <motion.span
                aria-hidden="true"
                className="absolute -inset-1 rounded-full border border-[#C6FF3D]/60 pointer-events-none"
                animate={{
                  scale: [1, 1.16, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}

            <button
              ref={launcherRef}
              type="button"
              onClick={openPanel}
              onMouseEnter={triggerMobileLabel}
              onFocus={triggerMobileLabel}
              onTouchStart={triggerMobileLabel}
              aria-label="Talk to Charan, voice conversation"
              className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full ${
                imageError ? 'bg-[#C6FF3D] text-[#0A0A0B]' : 'bg-[#000000] border-2 border-[#C6FF3D]'
              } shadow-[0_4px_24px_rgba(198,255,61,0.45)] flex items-center justify-center transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]`}
            >
              {!imageError ? (
                <>
                  {/* Avatar circle with black background, scale(0.92), 50% 100% origin */}
                  <div className="w-full h-full rounded-full overflow-hidden flex items-end justify-center bg-[#000000]">
                    <img
                      src="/images/charan-avatar-128.webp"
                      srcSet="/images/charan-avatar-128.webp 1x, /images/charan-avatar-256.webp 2x"
                      alt="Charan"
                      width={56}
                      height={56}
                      decoding="async"
                      draggable={false}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      style={{
                        transform: 'scale(0.92)',
                        transformOrigin: '50% 100%',
                      }}
                    />
                  </div>

                  {/* Tiny pulsing green "live" dot at top-right */}
                  <span
                    aria-hidden="true"
                    className="absolute top-0 right-0 sm:top-0.5 sm:right-0.5 flex h-3 w-3 items-center justify-center pointer-events-none z-10"
                  >
                    {!prefersReducedMotion && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6FF3D] opacity-75" />
                    )}
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C6FF3D] ring-1 ring-[#0A0A0B]" />
                  </span>

                  {/* Small lime circular badge with mic icon at bottom-right edge */}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 -right-0.5 sm:bottom-0 sm:right-0 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#C6FF3D] text-[#0A0A0B] flex items-center justify-center shadow-md border-2 border-[#0A0A0B] pointer-events-none z-10"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                  </span>
                </>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. VOICE PANEL                                                  */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              onClick={closePanel}
              className="sm:hidden fixed inset-0 z-[89] bg-black/60 backdrop-blur-xs pointer-events-auto"
              aria-hidden="true"
            />

            {/* Panel Container */}
            <div className="fixed inset-0 sm:inset-auto sm:right-8 sm:bottom-8 z-[90] flex items-end sm:items-auto pointer-events-none p-3 sm:p-0">
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="voice-widget-header"
                initial={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 0, scale: 0.96, y: 12 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: 1, y: 0 }
                }
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.96, y: 12 }
                }
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="pointer-events-auto w-full sm:w-[380px] max-w-[420px] bg-[#0A0A0B] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans text-white text-sm"
                style={{
                  maxHeight: 'min(560px, calc(100dvh - 3rem))',
                }}
              >
                {/* Panel Header */}
                <div className="px-5 py-4 border-b border-white/10 bg-[#121215]/80 backdrop-blur-md flex items-center justify-between select-none">
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full bg-black border border-[#C6FF3D]/50 overflow-hidden flex items-end justify-center shrink-0">
                      <img
                        src="/images/charan-avatar-128.webp"
                        srcSet="/images/charan-avatar-128.webp 1x, /images/charan-avatar-256.webp 2x"
                        alt="Charan"
                        width={36}
                        height={36}
                        decoding="async"
                        draggable={false}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        style={{
                          transform: 'scale(0.92)',
                          transformOrigin: '50% 100%',
                        }}
                      />
                      {callState === 'active' && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#C6FF3D] rounded-full animate-ping opacity-75" />
                      )}
                    </div>
                    <div>
                      <h2
                        id="voice-widget-header"
                        className="text-sm font-semibold tracking-wide text-white flex items-center gap-2"
                      >
                        <span>Talk to Charan</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono tracking-wider font-semibold uppercase bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/25">
                          Voice
                        </span>
                      </h2>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {callState === 'active'
                          ? `${formatRemainingTime(secondsRemaining)} remaining`
                          : 'Interactive voice session'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closePanel}
                    aria-label="Close voice panel"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>

                {/* Panel Body */}
                <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto min-h-[300px]">
                  {/* STATE 1: IDLE / PRE-CALL */}
                  {callState === 'idle' && (
                    <div className="flex flex-col items-center text-center justify-center my-auto py-4">
                      <div className="w-16 h-16 rounded-full bg-[#121215] border border-[#C6FF3D]/30 flex items-center justify-center text-[#C6FF3D] mb-4 shadow-[0_0_24px_rgba(198,255,61,0.15)]">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                      </div>

                      <p className="text-base text-zinc-100 font-medium max-w-[280px] leading-relaxed mb-6">
                        &ldquo;Hi, I&apos;m Charan. What do you want to know about me?&rdquo;
                      </p>

                      <button
                        type="button"
                        data-autofocus="true"
                        onClick={startCall}
                        className="w-full py-3 px-4 rounded-xl bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0A0A0B] font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] shadow-[0_2px_16px_rgba(198,255,61,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]"
                      >
                        Speak with Charan
                      </button>

                      <p className="text-[12px] text-zinc-500 font-mono mt-3">
                        AI voice clone of Charan
                      </p>
                    </div>
                  )}

                  {/* STATE 2: CONNECTING / CALL LIVE */}
                  {(callState === 'connecting' || callState === 'active') && (
                    <div className="flex flex-col h-full justify-between gap-4">
                      {/* Top Status & Waveform */}
                      <div className="flex flex-col items-center">
                        {/* Status Badge */}
                        <div
                          aria-live="polite"
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121215] border border-white/10 text-xs font-mono font-medium text-zinc-300 mb-5"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              speakerState === 'speaking'
                                ? 'bg-[#C6FF3D] animate-pulse'
                                : speakerState === 'listening'
                                ? 'bg-[#C6FF3D]'
                                : 'bg-amber-400 animate-ping'
                            }`}
                          />
                          <span>
                            {speakerState === 'connecting' && 'Connecting to voice...'}
                            {speakerState === 'listening' && 'Listening to you...'}
                            {speakerState === 'speaking' && 'Charan is speaking...'}
                          </span>
                        </div>

                        {/* Audio Waveform */}
                        <div
                          className="h-16 flex items-center justify-center gap-1.5 px-4"
                          aria-hidden="true"
                        >
                          {prefersReducedMotion ? (
                            <div className="w-16 h-2 rounded-full bg-[#C6FF3D]/60 shadow-[0_0_12px_rgba(198,255,61,0.5)]" />
                          ) : (
                            [30, 65, 95, 45, 80, 100, 70, 50, 85, 40].map((baseHeight, i) => {
                              const isSpeaking = speakerState === 'speaking';
                              const isListening = speakerState === 'listening';
                              const scaleY = isSpeaking
                                ? (baseHeight / 100) * 1.2
                                : isListening
                                ? 0.25 + (i % 3) * 0.15
                                : 0.2;

                              return (
                                <motion.div
                                  key={i}
                                  animate={{
                                    scaleY: isSpeaking
                                      ? [scaleY * 0.4, scaleY, scaleY * 0.6]
                                      : scaleY,
                                    opacity: isSpeaking ? 1 : isListening ? 0.7 : 0.35,
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    repeatType: 'reverse',
                                    duration: isSpeaking ? 0.35 + (i % 4) * 0.08 : 1,
                                    ease: 'easeInOut',
                                  }}
                                  className="w-1.5 rounded-full bg-[#C6FF3D] origin-center"
                                  style={{
                                    height: '42px',
                                  }}
                                />
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Live Transcript Area */}
                      <div
                        aria-live="polite"
                        className="flex-1 max-h-[160px] overflow-y-auto bg-[#121215]/60 border border-white/5 rounded-xl p-3 flex flex-col gap-2.5 text-xs font-sans"
                      >
                        {turns.length === 0 ? (
                          <div className="text-zinc-500 italic text-center my-auto font-mono text-[11px]">
                            {callState === 'connecting'
                              ? 'Requesting microphone and starting...'
                              : 'Say hello to Charan...'}
                          </div>
                        ) : (
                          turns.map((turn) => {
                            const isAgent = turn.role === 'agent';
                            return (
                              <div
                                key={turn.id}
                                className={`flex flex-col ${
                                  isAgent ? 'items-start' : 'items-end'
                                }`}
                              >
                                <span className="text-[10px] font-mono font-medium text-zinc-500 mb-0.5">
                                  {isAgent ? 'Charan' : 'You'}
                                </span>
                                <div
                                  className={`rounded-lg px-2.5 py-1.5 max-w-[85%] leading-relaxed ${
                                    isAgent
                                      ? 'bg-zinc-800/80 text-zinc-100 border border-white/5'
                                      : 'bg-[#C6FF3D]/15 text-[#C6FF3D] border border-[#C6FF3D]/25'
                                  } ${!turn.final ? 'opacity-65 italic' : 'opacity-100'}`}
                                >
                                  {turn.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={transcriptBottomRef} />
                      </div>

                      {/* Call Controls */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={toggleMute}
                          disabled={callState !== 'active'}
                          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                          className={`flex-1 py-2.5 px-3 rounded-xl border font-mono text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150 ${
                            isMuted
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-zinc-800/80 hover:bg-zinc-700/80 border-white/10 text-zinc-200'
                          } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]`}
                        >
                          {isMuted ? (
                            <>
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <line x1="2" x2="22" y1="2" y2="22" />
                                <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                                <path d="M5 10v2a7 7 0 0 0 12 5" />
                                <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                                <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                                <line x1="12" x2="12" y1="19" y2="22" />
                              </svg>
                              <span>Unmute</span>
                            </>
                          ) : (
                            <>
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" x2="12" y1="19" y2="22" />
                              </svg>
                              <span>Mute</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => endCall('user_ended')}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-200 font-mono text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.8 19.8 0 0 1-3.12-8.68A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                            <line x1="23" x2="1" y1="1" y2="23" />
                          </svg>
                          <span>End Call</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STATE 3: ENDED */}
                  {callState === 'ended' && (
                    <div className="flex flex-col items-center text-center justify-center my-auto py-2">
                      <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-white/10 flex items-center justify-center text-zinc-300 mb-3">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>

                      <h3 className="text-base font-semibold text-white mb-1">
                        Call ended
                      </h3>
                      <p className="text-xs text-zinc-400 mb-5 font-mono">
                        Thanks for talking with Charan!
                      </p>

                      {turns.length > 0 && (
                        <div className="w-full max-h-[140px] overflow-y-auto bg-[#121215]/80 border border-white/5 rounded-xl p-3 flex flex-col gap-2 text-xs mb-4 text-left font-sans">
                          {turns.map((turn) => (
                            <div key={turn.id} className="text-zinc-300">
                              <span className="font-mono text-[10px] text-zinc-500 mr-1.5">
                                {turn.role === 'agent' ? 'Charan:' : 'You:'}
                              </span>
                              <span>{turn.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        data-autofocus="true"
                        onClick={startCall}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0A0A0B] font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] shadow-[0_2px_16px_rgba(198,255,61,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
                      >
                        Speak again
                      </button>
                    </div>
                  )}

                  {/* STATE 4: ERROR / FALLBACK */}
                  {callState === 'error' && (
                    <div className="flex flex-col items-center text-center justify-center my-auto py-2">
                      <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" x2="12" y1="8" y2="12" />
                          <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                      </div>

                      <h3 className="text-sm font-semibold text-white mb-1.5">
                        {errorType === 'permission_denied'
                          ? 'Microphone access denied'
                          : 'Voice is unavailable right now'}
                      </h3>

                      <p className="text-xs text-zinc-400 leading-relaxed max-w-[280px] mb-5">
                        {errorType === 'permission_denied'
                          ? 'Please enable microphone access in your browser to speak with Charan, or continue in text chat.'
                          : 'You can still ask anything about projects, experience and skills using the text chatbot.'}
                      </p>

                      <div className="w-full flex flex-col gap-2">
                        <button
                          type="button"
                          data-autofocus="true"
                          onClick={fallbackToChat}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0A0A0B] font-semibold text-xs tracking-wide transition-all duration-200 active:scale-[0.98] shadow-[0_2px_16px_rgba(198,255,61,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
                        >
                          Chat via text instead
                        </button>

                        <button
                          type="button"
                          onClick={startCall}
                          className="w-full py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                        >
                          Try voice again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

