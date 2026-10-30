import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useChat, SUGGESTION_CHIPS } from './useChat';
import { MessageContent } from './MessageContent';
import { useScrollLock } from '../../hooks/useScrollLock';
import { getLenis } from '../../hooks/useLenis';

interface ChatWidgetProps {
  isPageLoaded?: boolean;
}

export function ChatWidget({ isPageLoaded = true }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const {
    messages,
    input,
    setInput,
    isTyping,
    isModelLoading,
    showSuggestions,
    initChat,
    sendMessage,
    clearChat,
  } = useChat();

  // Lock body scroll and pause Lenis smooth scroll while chat panel is open
  useScrollLock(isOpen);

  // Auto-scroll to the newest message
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
      });
    }
  }, [messages, isTyping, isOpen, prefersReducedMotion]);

  const handleOpen = useCallback(() => {
    lastActiveElementRef.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
    initChat();
  }, [initChat]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      launcherRef.current?.focus();
    }, 50);
  }, []);

  // Move focus to input when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Tab trapping & Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
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
  }, [isOpen, handleClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    sendMessage(input);
  };

  const handleOpenInquiryForm = useCallback(() => {
    handleClose();
    setTimeout(() => {
      const lenis = getLenis();
      if (lenis) {
        try {
          lenis.scrollTo('#contact', { duration: 1.5 });
        } catch {
          document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 250);
  }, [handleClose]);

  return (
    <div id="chat-widget">
      {/* ============================================================== */}
      {/* 1. LAUNCHER BUTTON                                             */}
      {/* ============================================================== */}
      {!isOpen && isPageLoaded && (
        <div
          className="fixed right-5 sm:right-8 z-[70] flex items-center gap-2 select-none"
          style={{
            bottom: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)))',
          }}
        >
          <span
            aria-hidden="true"
            className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-[#121215]/90 border border-[#C6FF3D]/40 text-[#C6FF3D] font-mono text-[11px] font-bold tracking-wider shadow-lg pointer-events-none"
          >
            ASK
          </span>
          <button
            ref={launcherRef}
            type="button"
            onClick={handleOpen}
            aria-label="Ask about Charan"
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0A0A0B] shadow-[0_4px_24px_rgba(198,255,61,0.45)] flex items-center justify-center transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]"
          >
            {/* Inline SVG chat bubble */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" />
            </svg>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CHAT PANEL                                                  */}
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
              onClick={handleClose}
              className="sm:hidden fixed inset-0 z-[89] bg-black/60 backdrop-blur-xs pointer-events-auto"
              aria-hidden="true"
            />

            {/* Panel Container */}
            <div className="fixed inset-0 sm:inset-auto sm:right-8 sm:bottom-8 z-[90] flex items-end sm:items-auto pointer-events-none">
              {/* Panel Card */}
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="chat-widget-header"
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
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="pointer-events-auto relative z-10 w-full sm:w-[400px] h-[85dvh] sm:h-[600px] sm:max-h-[85vh] bg-[#0A0A0B] border border-[#C6FF3D]/25 sm:rounded-2xl rounded-t-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(198,255,61,0.08)] flex flex-col overflow-hidden text-left"
              >
                {/* HEADER */}
                <div className="shrink-0 px-4 pt-3.5 pb-3 border-b border-white/10 bg-[#111114]/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C6FF3D] animate-pulse" />
                      <h2
                        id="chat-widget-header"
                        className="font-mono text-xs font-bold tracking-wider text-[#F4F4F0] uppercase"
                      >
                        ASK ABOUT CHARAN
                      </h2>
                    </div>
                    <p className="font-mono text-[10px] text-[#A1A1AA] mt-0.5">
                      Answers come only from Charan's portfolio data
                    </p>
                    {isModelLoading && (
                      <p className="font-mono text-[10px] text-[#C6FF3D] mt-0.5 animate-pulse">
                        Loading smart search...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {messages.length > 1 && (
                      <button
                        type="button"
                        onClick={clearChat}
                        className="font-mono text-[10px] text-zinc-400 hover:text-[#C6FF3D] px-2 py-1 rounded transition-colors"
                      >
                        Clear chat
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close chat"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {/* Inline close X SVG */}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* MESSAGE LIST */}
                <div
                  data-lenis-prevent
                  aria-live="polite"
                  className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3.5"
                >
                  {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[88%] sm:max-w-[85%] rounded-2xl p-3 sm:p-3.5 shadow-sm text-sm ${
                            isUser
                              ? 'bg-[#C6FF3D] text-[#0A0A0B] font-medium rounded-tr-sm'
                              : 'bg-[#121215] border border-white/10 text-[#F4F4F0] rounded-tl-sm'
                          }`}
                        >
                          <MessageContent text={msg.text} isUser={isUser} />

                          {/* Sources chips on bot answers (hidden for intent answers) */}
                          {!isUser &&
                            msg.kind !== 'intent' &&
                            msg.confidence !== 'low' &&
                            msg.sources &&
                            msg.sources.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[10px] text-[#A1A1AA] uppercase tracking-wider">
                                  Sources:
                                </span>
                                {msg.sources.map((src, idx) => {
                                  const clean = src.title
                                    .replace(/^Q:\s*/i, '')
                                    .replace(/^Project:\s*/i, '');
                                  return (
                                    <span
                                      key={idx}
                                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 select-none"
                                    >
                                      {clean}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                          {/* Tappable suggestion chips under answer */}
                          {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-[10px] text-[#C6FF3D] font-bold tracking-wider select-none">
                                TRY:
                              </span>
                              {msg.suggestions.map((suggestion, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => sendMessage(suggestion)}
                                  className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C6FF3D]/50 text-zinc-300 hover:text-[#C6FF3D] transition-colors text-left active:scale-95"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Fallback actions only for kind "fallback" */}
                          {!isUser && msg.kind === 'fallback' && (
                            <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-2">
                              <a
                                href="mailto:bonamukkalacharan@gmail.com"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C6FF3D] hover:bg-[#d4ff66] text-[#0A0A0B] text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95"
                              >
                                <span>Email Charan</span>
                              </a>
                              <button
                                type="button"
                                onClick={handleOpenInquiryForm}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[#F4F4F0] border border-white/10 text-xs font-medium tracking-wide transition-all active:scale-95"
                              >
                                <span>Open inquiry form</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Welcome state suggestion chips (under the first bot message) */}
                        {!isUser && showSuggestions && (
                          <div className="mt-3 flex flex-wrap gap-1.5 max-w-full">
                            {SUGGESTION_CHIPS.map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => sendMessage(chip)}
                                className="font-mono text-[11px] px-2.5 py-1.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-white/10 hover:border-[#C6FF3D]/50 text-[#E4E4E7] hover:text-[#C6FF3D] transition-all text-left active:scale-95"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-start">
                      <div className="bg-[#121215] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                        <span
                          className={`w-2 h-2 rounded-full bg-[#C6FF3D] ${
                            prefersReducedMotion ? 'opacity-80' : 'animate-bounce'
                          }`}
                          style={
                            prefersReducedMotion ? undefined : { animationDelay: '0ms' }
                          }
                        />
                        <span
                          className={`w-2 h-2 rounded-full bg-[#C6FF3D] ${
                            prefersReducedMotion ? 'opacity-80' : 'animate-bounce'
                          }`}
                          style={
                            prefersReducedMotion ? undefined : { animationDelay: '150ms' }
                          }
                        />
                        <span
                          className={`w-2 h-2 rounded-full bg-[#C6FF3D] ${
                            prefersReducedMotion ? 'opacity-80' : 'animate-bounce'
                          }`}
                          style={
                            prefersReducedMotion ? undefined : { animationDelay: '300ms' }
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* INPUT AREA */}
                <form
                  onSubmit={handleSubmit}
                  className="shrink-0 p-3 border-t border-white/10 bg-[#111114]/80"
                >
                  <div className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask anything about Charan"
                      maxLength={200}
                      className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-[#18181B] border border-white/10 text-base sm:text-sm text-[#F4F4F0] placeholder-zinc-500 focus:outline-none focus:border-[#C6FF3D] transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      aria-label="Send"
                      className="absolute right-1.5 p-2 rounded-lg bg-[#C6FF3D] text-[#0A0A0B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4ff66] transition-all active:scale-95"
                    >
                      {/* Inline Send arrow SVG */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </form>

                {/* FOOTER */}
                <div
                  className="shrink-0 px-4 py-2 bg-[#0A0A0B] border-t border-white/5 text-center"
                  style={{
                    paddingBottom: 'max(0.5rem, calc(0.5rem + env(safe-area-inset-bottom, 0px)))',
                  }}
                >
                  <span className="font-mono text-[10px] text-[#A1A1AA]">
                    Automated assistant. Answers come from Charan's own portfolio data.
                  </span>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
