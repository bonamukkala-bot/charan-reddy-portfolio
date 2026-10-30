import React, { useState, useEffect, useRef, useCallback } from 'react';

// Left and Right tags in fixed safe slots:
// 2 in top band (top 3% to 13%), 2 in bottom band (bottom 3% to 15%)
// Horizontally: Left tags 2% to 30%, Right tags 70% to 98%
// Never overlap middle band where label, headline, tagline and chips are.
const LEFT_TAGS = [
  { text: '7 AI AGENTS · ONE PLATFORM', top: '4.5%', left: '2.5%', rotate: -2, depthX: 0.008, depthY: 0.006 },
  { text: 'MULTI-AGENT PIPELINES', top: '10.5%', left: '16.5%', rotate: 2, depthX: -0.007, depthY: 0.008 },
  { text: 'GROQ-POWERED CHATBOTS', bottom: '10%', left: '2.5%', rotate: -1.5, depthX: 0.009, depthY: -0.006 },
  { text: '85.3% IPL PRE-MATCH ACCURACY', bottom: '4%', left: '16.5%', rotate: 2, depthX: -0.007, depthY: -0.008 },
];

const RIGHT_TAGS = [
  { text: '2 CLIENT SITES DELIVERED', top: '4.5%', right: '16.5%', rotate: 2, depthX: -0.008, depthY: 0.006 },
  { text: 'SHIPPED ON VERCEL', top: '10.5%', right: '2.5%', rotate: -2, depthX: 0.007, depthY: 0.008 },
  { text: 'STOREFRONT + ADMIN CRM', bottom: '10%', right: '16.5%', rotate: 1.5, depthX: -0.009, depthY: -0.006 },
  { text: 'WHATSAPP BOOKING FLOW', bottom: '4%', right: '2.5%', rotate: -2, depthX: 0.007, depthY: -0.008 },
];

const MODE_1_CHIPS = ['MULTI-AGENT', 'GROQ', 'PYTHON', 'FASTAPI', 'FLASK', 'LIGHTGBM', 'XGBOOST', 'SHAP'];
const MODE_2_CHIPS = ['REACT', 'TYPESCRIPT', 'VITE', 'TAILWIND', 'SUPABASE', 'FRAMER MOTION', 'VERCEL'];

export function TwoModesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);
  const portraitRef = useRef<HTMLDivElement | null>(null);

  // Section and portrait dimensions for translateX calculation
  const sectionWidthRef = useRef<number>(1440);
  const portraitWidthRef = useRef<number>(540);

  // Split state: 0 to 1 across FULL section width
  const splitRef = useRef<number>(0.5);
  const targetSplitRef = useRef<number>(0.5);
  const pointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPtrRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isHoveredRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const isVisibleRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Responsive state
  const [isTouchOrSmall, setIsTouchOrSmall] = useState<boolean>(false);
  const [isWideScreen, setIsWideScreen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 1100 : true
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [activeMobileMode, setActiveMobileMode] = useState<'ai' | 'builder'>('ai');

  // Check media queries
  useEffect(() => {
    const checkMedia = () => {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const isSmall = window.innerWidth < 768;
      setIsTouchOrSmall(isCoarse || isSmall);

      const isWide = window.innerWidth >= 1100;
      setIsWideScreen(isWide);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setPrefersReducedMotion(reduced);
    };

    checkMedia();
    window.addEventListener('resize', checkMedia);
    return () => window.removeEventListener('resize', checkMedia);
  }, []);

  // Write CSS variables directly to section DOM to prevent re-renders on pointer moves
  const applyStyles = useCallback((split: number, ptr: { x: number; y: number }) => {
    const el = sectionRef.current;
    if (!el) return;

    el.style.setProperty('--split', split.toFixed(4));

    // Headline shift max 12px opposite to divider
    const hlShift = ((split - 0.5) * -24).toFixed(2);
    el.style.setProperty('--hl-shift', `${hlShift}px`);

    // Portrait position: translateX = split * (W - pw)
    // At split 0: left edge touches left edge of section (0px)
    // At split 1: right edge touches right edge of section (W - pw)
    // At split 0.5: exactly centered
    const W = sectionWidthRef.current || el.offsetWidth || el.getBoundingClientRect().width;
    const pw = portraitWidthRef.current || (portraitRef.current ? portraitRef.current.offsetWidth : 540);
    const travelDist = Math.max(0, W - pw);
    const portraitX = split * travelDist;
    el.style.setProperty('--portrait-x', `${portraitX.toFixed(2)}px`);

    // Floating tags drift (clamped to max 10px)
    const driftX = Math.max(-10, Math.min(10, ptr.x * 0.02)).toFixed(2);
    const driftY = Math.max(-10, Math.min(10, ptr.y * 0.02)).toFixed(2);
    el.style.setProperty('--ptr-x', `${driftX}px`);
    el.style.setProperty('--ptr-y', `${driftY}px`);
  }, []);

  // Measure W and pw with ResizeObserver
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      if (sectionRef.current) {
        sectionWidthRef.current = sectionRef.current.offsetWidth || sectionRef.current.getBoundingClientRect().width;
      }
      if (portraitRef.current) {
        portraitWidthRef.current = portraitRef.current.offsetWidth || portraitRef.current.getBoundingClientRect().width;
      }
      applyStyles(splitRef.current, currentPtrRef.current);
    });

    ro.observe(section);
    if (portraitRef.current) {
      ro.observe(portraitRef.current);
    }

    return () => ro.disconnect();
  }, [applyStyles]);

  // One requestAnimationFrame loop that runs ONLY while section is on screen and split is moving
  const runLoop = useCallback(() => {
    if (rafIdRef.current !== null) return;

    const tick = () => {
      if (!isVisibleRef.current) {
        rafIdRef.current = null;
        return;
      }

      const target = targetSplitRef.current;
      const current = splitRef.current;
      const diff = target - current;

      // Pointer drift lerp
      currentPtrRef.current.x += (pointerPosRef.current.x - currentPtrRef.current.x) * 0.08;
      currentPtrRef.current.y += (pointerPosRef.current.y - currentPtrRef.current.y) * 0.08;

      const splitFinished = Math.abs(diff) < 0.0004;
      const ptrFinished =
        Math.abs(pointerPosRef.current.x - currentPtrRef.current.x) < 0.2 &&
        Math.abs(pointerPosRef.current.y - currentPtrRef.current.y) < 0.2;

      if (splitFinished && ptrFinished && !isDraggingRef.current) {
        splitRef.current = target;
        applyStyles(target, currentPtrRef.current);
        if (handleRef.current) {
          handleRef.current.setAttribute('aria-valuenow', String(Math.round(target * 100)));
        }
        rafIdRef.current = null;
        return;
      }

      // Smooth lerp glide: 0.12 per frame
      splitRef.current += diff * 0.12;
      applyStyles(splitRef.current, currentPtrRef.current);
      if (handleRef.current) {
        handleRef.current.setAttribute('aria-valuenow', String(Math.round(splitRef.current * 100)));
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [applyStyles]);

  // IntersectionObserver to only animate when section is in viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting && Math.abs(targetSplitRef.current - splitRef.current) > 0.001) {
            runLoop();
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [runLoop]);

  // Pointer mapping: split = clamp((pointerX - 0.04 * sectionWidth) / (0.92 * sectionWidth), 0, 1)
  // Outer 4% on each side snaps to exactly 0 or 1.
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (isTouchOrSmall || prefersReducedMotion) return;

      const el = sectionRef.current;
      if (!el) return;

      isHoveredRef.current = true;
      const rect = el.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const raw = (pointerX - 0.04 * rect.width) / (0.92 * rect.width);
      targetSplitRef.current = Math.max(0, Math.min(1, raw));

      pointerPosRef.current = {
        x: pointerX - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      };

      runLoop();
    },
    [isTouchOrSmall, prefersReducedMotion, runLoop]
  );

  const handlePointerEnter = useCallback(() => {
    if (isTouchOrSmall || prefersReducedMotion) return;
    isHoveredRef.current = true;
  }, [isTouchOrSmall, prefersReducedMotion]);

  const handlePointerLeave = useCallback(() => {
    if (isTouchOrSmall || prefersReducedMotion) return;
    isHoveredRef.current = false;
    // Eases back to 0.5 when pointer leaves
    targetSplitRef.current = 0.5;
    pointerPosRef.current = { x: 0, y: 0 };
    runLoop();
  }, [isTouchOrSmall, prefersReducedMotion, runLoop]);

  // Handle Drag logic
  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (prefersReducedMotion) return;
      isDraggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

      const onPointerMove = (ev: PointerEvent) => {
        if (!isDraggingRef.current || !sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const pointerX = ev.clientX - rect.left;
        const raw = (pointerX - 0.04 * rect.width) / (0.92 * rect.width);
        targetSplitRef.current = Math.max(0, Math.min(1, raw));
        runLoop();
      };

      const onPointerUp = (ev: PointerEvent) => {
        isDraggingRef.current = false;
        (e.target as HTMLElement).releasePointerCapture?.(ev.pointerId);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        if (!isHoveredRef.current) {
          targetSplitRef.current = 0.5;
          runLoop();
        }
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [prefersReducedMotion, runLoop]
  );

  // Keyboard navigation for handle (slider: 0 to 100)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let handled = false;
      let next = targetSplitRef.current;

      if (e.key === 'ArrowLeft') {
        next = Math.max(0, next - 0.05);
        handled = true;
      } else if (e.key === 'ArrowRight') {
        next = Math.min(1, next + 0.05);
        handled = true;
      } else if (e.key === 'Home') {
        next = 0;
        handled = true;
      } else if (e.key === 'End') {
        next = 1;
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        targetSplitRef.current = next;
        if (prefersReducedMotion) {
          splitRef.current = next;
          applyStyles(next, { x: 0, y: 0 });
          if (handleRef.current) {
            handleRef.current.setAttribute('aria-valuenow', String(Math.round(next * 100)));
          }
        } else {
          runLoop();
        }
      }
    },
    [prefersReducedMotion, applyStyles, runLoop]
  );

  // Touch / Mobile toggle handler: "AI ENGINEER" sets split=1, "PRODUCT BUILDER" sets split=0
  const handleMobileToggle = useCallback(
    (mode: 'ai' | 'builder') => {
      setActiveMobileMode(mode);
      const target = mode === 'ai' ? 1.0 : 0.0;
      targetSplitRef.current = target;

      if (prefersReducedMotion) {
        splitRef.current = target;
        applyStyles(target, { x: 0, y: 0 });
      } else {
        const start = splitRef.current;
        const change = target - start;
        const startTime = performance.now();
        const duration = 500;

        const animateMobile = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          // EaseInOutQuad
          const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
          const val = start + change * ease;
          splitRef.current = val;
          applyStyles(val, { x: 0, y: 0 });

          if (progress < 1) {
            requestAnimationFrame(animateMobile);
          } else {
            splitRef.current = target;
            applyStyles(target, { x: 0, y: 0 });
          }
        };
        requestAnimationFrame(animateMobile);
      }
    },
    [prefersReducedMotion, applyStyles]
  );

  // Smooth scroll to Work section
  const handleScrollToWork = (e: React.MouseEvent) => {
    e.preventDefault();
    const workEl = document.getElementById('work');
    if (workEl) {
      workEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Bottom fade mask on portrait wrapper (left and right edge fades removed)
  const bottomFadeMaskStyle: React.CSSProperties = {
    WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
    maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
  };

  // Whether portrait travels with divider (desktop with mouse >= 1100px and no reduced motion)
  const isDesktopMoving = !isTouchOrSmall && !prefersReducedMotion && isWideScreen;

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={
        {
          '--split': isTouchOrSmall ? (activeMobileMode === 'ai' ? '1' : '0') : '0.5',
          '--portrait-x': 'calc(50vw - 19vw)',
          '--hl-shift': '0px',
          '--ptr-x': '0px',
          '--ptr-y': '0px',
          touchAction: 'pan-y',
        } as React.CSSProperties
      }
      className="relative w-full border-b border-white/5 bg-[#0A0A0B] overflow-hidden select-none"
    >
      {/* ============================================================== */}
      {/* SECTION KICKER: Outside both clipped layers                   */}
      {/* ============================================================== */}
      <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-20 font-mono text-[11px] sm:text-xs tracking-widest text-[#A1A1AA] uppercase flex items-center gap-2 select-none whitespace-nowrap pointer-events-none">
        <span className="text-[#C6FF3D]">●</span>
        <span>TWO SIDES OF MY WORK</span>
      </div>

      {/* ============================================================== */}
      {/* DESKTOP VIEW (width >= 768px)                                  */}
      {/* ============================================================== */}
      <div className="hidden md:block relative w-full h-[clamp(560px,88vh,820px)] min-h-[560px]">
        {/* ============================================================ */}
        {/* FULL-WIDTH LAYER 1: MODE 01 (Left)                          */}
        {/* Clipped to LEFT of divider: inset(0 calc((1 - split)*100%) 0 0) */}
        {/* ============================================================ */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none z-10"
          style={{
            clipPath: 'inset(0 calc((1 - var(--split, 0.5)) * 100%) 0 0)',
          }}
        >
          {/* Faint diagonal hatch background with subtle lime tint */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 25% 50%, rgba(198, 255, 61, 0.04), transparent 70%),
                repeating-linear-gradient(45deg, rgba(198, 255, 61, 0.035) 0px, rgba(198, 255, 61, 0.035) 1px, transparent 1px, transparent 12px)
              `,
            }}
          />

          {/* Mode 01 Decorative Code Text */}
          <span
            aria-hidden="true"
            className="hidden min-[1100px]:block absolute top-[4.5%] left-[28%] font-mono text-[11px] text-[#C6FF3D]/20 select-none pointer-events-none"
          >
            agents.run()
          </span>
          <span
            aria-hidden="true"
            className="hidden min-[1100px]:block absolute bottom-[4%] left-[4%] font-mono text-[11px] text-[#C6FF3D]/20 select-none pointer-events-none"
          >
            pipeline.verify()
          </span>

          {/* Mode 01 Floating Tags (Desktop only >= 1100px, safe slots) */}
          <div className="hidden min-[1100px]:block absolute inset-0 pointer-events-none">
            {LEFT_TAGS.map((tag) => (
              <div
                key={tag.text}
                style={{
                  top: tag.top,
                  left: tag.left,
                  bottom: tag.bottom,
                  transform: `translate(calc(var(--ptr-x, 0px) * ${tag.depthX}), calc(var(--ptr-y, 0px) * ${tag.depthY})) rotate(${tag.rotate}deg)`,
                }}
                className="absolute px-3 py-1.5 rounded-lg border border-white/10 bg-[#111114]/80 backdrop-blur-sm text-[10px] lg:text-[11px] font-mono text-[#A1A1AA] whitespace-nowrap shadow-md will-change-transform select-none"
              >
                {tag.text}
              </div>
            ))}
          </div>

          {/* Mode 01 Text Content Column */}
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10 h-full flex items-center justify-between pointer-events-none">
            <div
              style={{
                transform: 'translateX(var(--hl-shift, 0px))',
              }}
              className="w-[32%] max-w-[420px] pointer-events-auto will-change-transform"
            >
              <div className="font-mono text-xs text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2 mb-2">
                <span className="w-5 h-[2px] bg-[#C6FF3D] inline-block" />
                <span>MODE_01</span>
              </div>
              <h2
                className="font-display font-black uppercase tracking-tight text-[#F4F4F0] leading-[0.93]"
                style={{ fontSize: 'clamp(2rem, 4.8vw, 4.75rem)', textWrap: 'balance' }}
              >
                <span className="whitespace-nowrap">AI AGENT</span> <span className="whitespace-nowrap">ENGINEER</span>
              </h2>
              <div className="flex items-center gap-1.5 mt-3 mb-4">
                <div className="h-[3px] w-12 bg-[#C6FF3D]" />
                <div className="h-[3px] w-[3px] bg-[#C6FF3D]" />
              </div>
              <p className="font-mono text-xs sm:text-sm text-[#C6FF3D] font-medium leading-relaxed mb-5">
                Agents that coordinate, verify and ship.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MODE_1_CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="font-mono text-[10px] lg:text-[11px] px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[#A1A1AA]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FULL-WIDTH LAYER 2: MODE 02 (Right)                         */}
        {/* Clipped to RIGHT of divider: inset(0 0 0 calc(split*100%))   */}
        {/* ============================================================ */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none z-10"
          style={{
            clipPath: 'inset(0 0 0 calc(var(--split, 0.5) * 100%))',
          }}
        >
          {/* Faint horizontal scan lines background (neutral dark) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 75% 50%, rgba(255, 255, 255, 0.02), transparent 70%),
                repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.025) 0px, rgba(255, 255, 255, 0.025) 1px, transparent 1px, transparent 8px)
              `,
            }}
          />

          {/* Mode 02 Decorative Code Text */}
          <span
            aria-hidden="true"
            className="hidden min-[1100px]:block absolute top-[4.5%] right-[28%] font-mono text-[11px] text-white/15 select-none pointer-events-none"
          >
            &lt;div class=&quot;hero&quot;&gt;
          </span>
          <span
            aria-hidden="true"
            className="hidden min-[1100px]:block absolute top-[10.5%] right-[28%] font-mono text-[11px] text-white/12 select-none pointer-events-none"
          >
            display: grid;
          </span>
          <span
            aria-hidden="true"
            className="hidden min-[1100px]:block absolute bottom-[4%] right-[28%] font-mono text-[11px] text-white/15 select-none pointer-events-none"
          >
            &lt;/html&gt;
          </span>

          {/* Mode 02 Floating Tags (Desktop only >= 1100px, safe slots) */}
          <div className="hidden min-[1100px]:block absolute inset-0 pointer-events-none">
            {RIGHT_TAGS.map((tag) => (
              <div
                key={tag.text}
                style={{
                  top: tag.top,
                  right: tag.right,
                  bottom: tag.bottom,
                  transform: `translate(calc(var(--ptr-x, 0px) * ${tag.depthX}), calc(var(--ptr-y, 0px) * ${tag.depthY})) rotate(${tag.rotate}deg)`,
                }}
                className="absolute px-3 py-1.5 rounded-lg border border-white/10 bg-[#111114]/80 backdrop-blur-sm text-[10px] lg:text-[11px] font-mono text-[#A1A1AA] whitespace-nowrap shadow-md will-change-transform select-none"
              >
                {tag.text}
              </div>
            ))}
          </div>

          {/* Mode 02 Text Content Column */}
          <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10 h-full flex items-center justify-between pointer-events-none">
            <div
              style={{
                transform: 'translateX(var(--hl-shift, 0px))',
              }}
              className="ml-auto w-[32%] max-w-[420px] pointer-events-auto will-change-transform text-left"
            >
              <div className="font-mono text-xs text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2 mb-2">
                <span className="w-5 h-[2px] bg-[#C6FF3D] inline-block" />
                <span>MODE_02</span>
              </div>
              <h2
                className="font-display font-black uppercase tracking-normal text-[#F4F4F0] leading-[0.93]"
                style={{ fontSize: 'clamp(2rem, 4.8vw, 4.75rem)', textWrap: 'balance' }}
              >
                <span className="whitespace-nowrap">FULL&#8209;STACK</span> <span className="inline-block whitespace-nowrap">PRODUCT BUILDER</span>
              </h2>
              <div className="flex items-center gap-1.5 mt-3 mb-4">
                <div className="h-[3px] w-12 bg-[#C6FF3D]" />
                <div className="h-[3px] w-[3px] bg-[#C6FF3D]" />
              </div>
              <p className="font-mono text-xs sm:text-sm text-[#C6FF3D] font-medium leading-relaxed mb-5">
                Real products for real clients.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MODE_2_CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="font-mono text-[10px] lg:text-[11px] px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[#A1A1AA]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TRAVELING PORTRAIT BOX (Layering: IN FRONT of text layers z-20) */}
        {/* On desktop >= 1100px: translateX = split * (W - pw)          */}
        {/* Below 1100px or reduced motion: centered                     */}
        {/* ============================================================ */}
        <div
          ref={portraitRef}
          style={{
            ...bottomFadeMaskStyle,
            transform: isDesktopMoving
              ? 'translate3d(var(--portrait-x, 0px), 0, 0)'
              : 'translate3d(-50%, 0, 0)',
            left: isDesktopMoving ? '0' : '50%',
          }}
          className="pointer-events-none absolute bottom-0 z-20 h-[88%] w-[clamp(340px,38vw,560px)] aspect-[1024/1010] will-change-transform bg-transparent border-0 shadow-none overflow-hidden"
        >
          {/* Painted Image (Left split fraction of portrait box) */}
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none bg-transparent border-0 shadow-none"
            style={{
              clipPath: 'inset(0 calc((1 - var(--split, 0.5)) * 100%) 0 0)',
            }}
          >
            <img
              src="/split/painted.png"
              alt="AI Agent Engineer portrait"
              width={1024}
              height={1010}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain object-bottom select-none pointer-events-none bg-transparent border-0 shadow-none"
            />
          </div>

          {/* Normal Image (Right split fraction of portrait box) */}
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none bg-transparent border-0 shadow-none"
            style={{
              clipPath: 'inset(0 0 0 calc(var(--split, 0.5) * 100%))',
            }}
          >
            <img
              src="/split/real.png"
              alt="Product Builder portrait"
              width={1024}
              height={1010}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain object-bottom select-none pointer-events-none bg-transparent border-0 shadow-none"
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* DIVIDER LINE: Runs full height at calc(split * 100%)          */}
        {/* ============================================================== */}
        <div
          className="absolute top-0 bottom-0 z-30 pointer-events-none"
          style={{
            left: 'calc(var(--split, 0.5) * 100%)',
          }}
        >
          {/* Vertical Lime Line */}
          <div className="absolute top-0 bottom-0 left-0 w-[2px] -translate-x-1/2 bg-[#C6FF3D] shadow-[0_0_12px_rgba(198,255,61,0.6)]" />
        </div>

        {/* ============================================================== */}
        {/* HANDLE: Position clamped so it is NEVER cut off at ends        */}
        {/* ============================================================== */}
        <div
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
          aria-label="Switch between AI engineer and product builder"
          onPointerDown={handleDragStart}
          onKeyDown={handleKeyDown}
          style={{
            touchAction: 'none',
            left: 'clamp(16px, calc(var(--split, 0.5) * 100%), calc(100% - 16px))',
          }}
          className="z-40 pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#111114] border-2 border-[#C6FF3D] shadow-[0_0_16px_rgba(198,255,61,0.5)] flex items-center justify-center cursor-ew-resize hover:scale-110 active:scale-95 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]"
        >
          {/* Grip arrows */}
          <div className="flex items-center gap-0.5 text-[#C6FF3D] select-none text-[10px] font-mono leading-none">
            <span>‹</span>
            <span>›</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOTTOM LINK: Outside both clipped layers                       */}
        {/* ============================================================== */}
        <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20">
          <a
            href="#work"
            onClick={handleScrollToWork}
            className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] hover:text-[#C6FF3D] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>SEE THE WORK ↓</span>
          </a>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TOUCH / MOBILE VIEW (< 768px or pointer: coarse)               */}
      {/* ============================================================== */}
      <div className="block md:hidden px-6 pt-20 pb-12 flex flex-col items-center">
        {/* Two-option Segmented Toggle */}
        <div className="flex items-center p-1 rounded-full bg-[#141418] border border-white/10 mb-8 font-mono text-xs select-none shadow-lg">
          <button
            type="button"
            onClick={() => handleMobileToggle('ai')}
            className={`px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
              activeMobileMode === 'ai'
                ? 'bg-[#C6FF3D] text-[#0A0A0B] font-bold shadow-[0_0_12px_rgba(198,255,61,0.35)]'
                : 'text-[#8A8A92] hover:text-white'
            }`}
          >
            AI ENGINEER
          </button>
          <button
            type="button"
            onClick={() => handleMobileToggle('builder')}
            className={`px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
              activeMobileMode === 'builder'
                ? 'bg-[#C6FF3D] text-[#0A0A0B] font-bold shadow-[0_0_12px_rgba(198,255,61,0.35)]'
                : 'text-[#8A8A92] hover:text-white'
            }`}
          >
            PRODUCT BUILDER
          </button>
        </div>

        {/* Portrait Container (about 70vw tall max, stays centered) */}
        <div
          style={bottomFadeMaskStyle}
          className="relative w-[75vw] max-w-[340px] aspect-[1024/1010] mb-8 overflow-hidden bg-transparent border-0 shadow-none"
        >
          {/* Layer 1: Painted portrait */}
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none bg-transparent border-0 shadow-none"
            style={{
              clipPath: 'inset(0 calc((1 - var(--split, 1)) * 100%) 0 0)',
            }}
          >
            <img
              src="/split/painted.png"
              alt="AI Agent Engineer portrait"
              width={1024}
              height={1010}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain object-bottom select-none bg-transparent border-0 shadow-none"
            />
          </div>

          {/* Layer 2: Normal portrait */}
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none bg-transparent border-0 shadow-none"
            style={{
              clipPath: 'inset(0 0 0 calc(var(--split, 1) * 100%))',
            }}
          >
            <img
              src="/split/real.png"
              alt="Product Builder portrait"
              width={1024}
              height={1010}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain object-bottom select-none bg-transparent border-0 shadow-none"
            />
          </div>
        </div>

        {/* Active Mode Text Area (Stacked vertically) */}
        <div className="w-full max-w-md min-h-[200px] flex flex-col justify-start">
          {activeMobileMode === 'ai' ? (
            <div className="transition-opacity duration-300">
              <div className="font-mono text-xs text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2 mb-2">
                <span className="w-5 h-[2px] bg-[#C6FF3D] inline-block" />
                <span>MODE_01</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#F4F4F0] leading-none">
                AI AGENT ENGINEER
              </h2>
              <div className="flex items-center gap-1.5 mt-2.5 mb-3.5">
                <div className="h-[3px] w-10 bg-[#C6FF3D]" />
                <div className="h-[3px] w-[3px] bg-[#C6FF3D]" />
              </div>
              <p className="font-mono text-xs sm:text-sm text-[#C6FF3D] font-medium leading-relaxed mb-4">
                Agents that coordinate, verify and ship.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MODE_1_CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="font-mono text-[10px] px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[#A1A1AA]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="transition-opacity duration-300">
              <div className="font-mono text-xs text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2 mb-2">
                <span className="w-5 h-[2px] bg-[#C6FF3D] inline-block" />
                <span>MODE_02</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-normal text-[#F4F4F0] leading-none">
                <span className="whitespace-nowrap">FULL&#8209;STACK</span> PRODUCT BUILDER
              </h2>
              <div className="flex items-center gap-1.5 mt-2.5 mb-3.5">
                <div className="h-[3px] w-10 bg-[#C6FF3D]" />
                <div className="h-[3px] w-[3px] bg-[#C6FF3D]" />
              </div>
              <p className="font-mono text-xs sm:text-sm text-[#C6FF3D] font-medium leading-relaxed mb-4">
                Real products for real clients.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MODE_2_CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="font-mono text-[10px] px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[#A1A1AA]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Link (Mobile) */}
        <div className="mt-8">
          <a
            href="#work"
            onClick={handleScrollToWork}
            className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA] hover:text-[#C6FF3D] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>SEE THE WORK ↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
