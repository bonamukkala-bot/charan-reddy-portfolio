import { useEffect, useRef } from 'react';
import { onLenisScroll } from '../../hooks/useLenis';

interface TerminalScrollBarProps {
  isReady?: boolean;
}

const SECTION_SEQUENCE = '{work}{services}{content}{about}{contact}_';

export function TerminalScrollBar({ isReady = true }: TerminalScrollBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const percentTextRef = useRef<HTMLSpanElement>(null);
  const unfilledTextRef = useRef<HTMLSpanElement>(null);
  const filledTextContainerRef = useRef<HTMLDivElement>(null);
  const filledTextRef = useRef<HTMLSpanElement>(null);
  const remainingTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let lastPct = -1;
    let lastTypedText = '';
    let hasFlashedAtEnd = false;

    const computeProgress = (): number => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollable = docHeight - winHeight;

      if (scrollable <= 0) return 0;
      return Math.max(0, Math.min(1, scrollY / scrollable));
    };

    const applyProgressToDOM = (progress: number) => {
      const pct = Math.round(progress * 100);

      // ScaleX transform for hardware accelerated fill
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${progress})`;
      }

      // Foreground dual-contrast clip
      if (filledTextContainerRef.current) {
        const remainingClipPercent = (1 - progress) * 100;
        filledTextContainerRef.current.style.clipPath = `inset(0 ${remainingClipPercent}% 0 0)`;
      }

      // Update text only if pct integer changed to avoid layout thrashing
      if (pct !== lastPct) {
        lastPct = pct;
        const paddedPct = pct < 10 ? `0${pct}%` : `${pct}%`;

        if (percentTextRef.current) {
          percentTextRef.current.textContent = paddedPct;
        }

        // Typed section sequence text: update only when visible characters change
        const totalChars = SECTION_SEQUENCE.length;
        const charCount = Math.floor(progress * totalChars);
        const typedText = charCount > 0 ? SECTION_SEQUENCE.slice(0, charCount) : '';

        if (typedText !== lastTypedText) {
          lastTypedText = typedText;
          if (unfilledTextRef.current) {
            unfilledTextRef.current.textContent = typedText;
          }
          if (filledTextRef.current) {
            filledTextRef.current.textContent = typedText;
          }
        }

        // Right indicator
        if (remainingTextRef.current) {
          if (pct >= 100) {
            remainingTextRef.current.textContent = 'end of page';

            if (!hasFlashedAtEnd && trackRef.current) {
              hasFlashedAtEnd = true;
              trackRef.current.classList.add('border-[#C6FF3D]', 'shadow-[0_0_12px_rgba(198,255,61,0.35)]');
              setTimeout(() => {
                trackRef.current?.classList.remove('border-[#C6FF3D]', 'shadow-[0_0_12px_rgba(198,255,61,0.35)]');
              }, 600);
            }
          } else {
            hasFlashedAtEnd = false;
            const remainingPct = Math.max(0, 100 - pct);
            const remainingPadded = remainingPct < 10 ? `0${remainingPct}` : `${remainingPct}`;
            remainingTextRef.current.innerHTML = `${remainingPadded}% <span class="text-zinc-500">remaining</span>`;
          }
        }
      }
    };

    let scheduled = false;
    const requestUpdate = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          applyProgressToDOM(computeProgress());
        });
      }
    };

    // Initial render
    applyProgressToDOM(computeProgress());

    // Single subscription through Lenis and native passive window events
    const unsubLenis = onLenisScroll(requestUpdate);
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });

    return () => {
      unsubLenis();
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed top-0 left-0 right-0 z-[60] h-[22px] md:h-[34px] bg-[#0A0A0B] border-b border-white/10 px-3 md:px-6 pointer-events-none select-none flex items-center transition-opacity duration-500 ${
        isReady ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2.5 md:gap-4 font-mono text-[10px] md:text-xs">
        {/* Left Indicator: Arrow + Percentage */}
        <div className="flex items-center gap-1 shrink-0 text-[#C6FF3D] font-bold tabular-nums w-auto md:w-[62px]">
          <span className="text-[#C6FF3D] text-[10px] md:text-xs leading-none select-none">→</span>
          <span ref={percentTextRef} className="tabular-nums tracking-tight">
            00%
          </span>
        </div>

        {/* Center Progress Bar: Track + Fill + Dual-contrast Text */}
        <div
          ref={trackRef}
          className="relative flex-1 h-[4px] md:h-[22px] rounded-full bg-white/10 md:bg-[#111114] md:border md:border-white/10 overflow-hidden flex items-center transition-[border-color,box-shadow] duration-300 md:shadow-inner"
        >
          {/* Fill Bar (Animated ONLY via scaleX transform with left origin) */}
          <div
            ref={fillRef}
            className="absolute inset-0 bg-gradient-to-r from-[#C6FF3D] via-[#c2fc34] to-[#bbf438] origin-left will-change-transform pointer-events-none"
            style={{ transform: 'scaleX(0)' }}
          />

          {/* Layer 1: Background Unfilled Text (Hidden on mobile below 768px) */}
          <div className="hidden md:flex absolute inset-0 items-center px-2.5 sm:px-3 text-zinc-400 font-mono text-[10px] sm:text-[11px] tracking-tight pointer-events-none overflow-hidden whitespace-nowrap">
            <span ref={unfilledTextRef} className="tabular-nums" />
          </div>

          {/* Layer 2: Foreground Filled Text (Hidden on mobile below 768px) */}
          <div
            ref={filledTextContainerRef}
            className="hidden md:flex absolute inset-0 items-center px-2.5 sm:px-3 text-[#0A0A0B] font-mono font-bold text-[10px] sm:text-[11px] tracking-tight pointer-events-none overflow-hidden whitespace-nowrap will-change-[clip-path]"
            style={{ clipPath: 'inset(0 100% 0 0)' }}
          >
            <span ref={filledTextRef} className="tabular-nums" />
          </div>
        </div>

        {/* Right Indicator: Remaining percentage or 'end of page' */}
        <div className="shrink-0 flex items-center justify-end font-mono text-[10px] md:text-[11px] text-[#A1A1AA] tabular-nums min-w-max text-right">
          <span
            ref={remainingTextRef}
            className="tabular-nums tracking-tight transition-all duration-200"
          >
            100% <span className="text-zinc-500">remaining</span>
          </span>
        </div>
      </div>
    </div>
  );
}
