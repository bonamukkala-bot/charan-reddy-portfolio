import React, { useState, useEffect, useRef, useCallback } from 'react';

// Left and Right tags as specified
const LEFT_TAGS = [
  { text: '7 AI AGENTS · ONE PLATFORM', top: '16%', left: '3%', rotate: -3, depthX: 0.02, depthY: 0.015 },
  { text: 'MULTI-AGENT PIPELINES', top: '27%', left: '21%', rotate: 2.5, depthX: -0.018, depthY: 0.02 },
  { text: 'GROQ-POWERED CHATBOTS', bottom: '23%', left: '4%', rotate: -2, depthX: 0.025, depthY: -0.015 },
  { text: '85.3% IPL PRE-MATCH ACCURACY', bottom: '11%', left: '20%', rotate: 3, depthX: -0.015, depthY: -0.02 },
];

const RIGHT_TAGS = [
  { text: '2 CLIENT SITES DELIVERED', top: '16%', right: '3%', rotate: 3, depthX: -0.02, depthY: 0.015 },
  { text: 'SHIPPED ON VERCEL', top: '27%', right: '21%', rotate: -2.5, depthX: 0.018, depthY: 0.02 },
  { text: 'STOREFRONT + ADMIN CRM', bottom: '23%', right: '4%', rotate: 2, depthX: -0.025, depthY: -0.015 },
  { text: 'WHATSAPP BOOKING FLOW', bottom: '11%', right: '20%', rotate: -3, depthX: 0.015, depthY: -0.02 },
];

const MODE_1_CHIPS = ['MULTI-AGENT', 'GROQ', 'PYTHON', 'FASTAPI', 'FLASK', 'LIGHTGBM', 'XGBOOST', 'SHAP'];
const MODE_2_CHIPS = ['REACT', 'TYPESCRIPT', 'VITE', 'TAILWIND', 'SUPABASE', 'FRAMER MOTION', 'VERCEL'];

export function TwoModesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  // Split state: 0 to 1
  const splitRef = useRef<number>(0.5);
  const targetSplitRef = useRef<number>(0.5);
  const pointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPtrRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isHoveredRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const isVisibleRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Touch / small-screen mode
  const [isTouchOrSmall, setIsTouchOrSmall] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [activeMobileMode, setActiveMobileMode] = useState<'ai' | 'builder'>('ai');
  const [sliderValue, setSliderValue] = useState<number>(50);

  // Check media queries
  useEffect(() => {
    const checkMedia = () => {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const isSmall = window.innerWidth < 768;
      setIsTouchOrSmall(isCoarse || isSmall);

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

    // Opacity: side moved away from gets brighter, other side dims to ~0.45
    const leftO = Math.max(0.45, Math.min(1, 0.45 + ((split - 0.08) / 0.84) * 0.55));
    const rightO = Math.max(0.45, Math.min(1, 0.45 + ((0.92 - split) / 0.84) * 0.55));
    el.style.setProperty('--left-o', leftO.toFixed(3));
    el.style.setProperty('--right-o', rightO.toFixed(3));

    // Headline shift max 12px opposite to divider
    const hlShift = ((split - 0.5) * -24).toFixed(2);
    el.style.setProperty('--hl-shift', `${hlShift}px`);

    // Portrait parallax shift max 10px
    const pShift = ((split - 0.5) * 20).toFixed(2);
    el.style.setProperty('--portrait-shift', `${pShift}px`);

    // Floating tags drift
    el.style.setProperty('--ptr-x', `${ptr.x.toFixed(1)}px`);
    el.style.setProperty('--ptr-y', `${ptr.y.toFixed(1)}px`);
  }, []);

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

      const splitFinished = Math.abs(diff) < 0.0006;
      const ptrFinished =
        Math.abs(pointerPosRef.current.x - currentPtrRef.current.x) < 0.2 &&
        Math.abs(pointerPosRef.current.y - currentPtrRef.current.y) < 0.2;

      if (splitFinished && ptrFinished && !isHoveredRef.current && !isDraggingRef.current) {
        splitRef.current = target;
        applyStyles(target, currentPtrRef.current);
        setSliderValue(Math.round(target * 100));
        rafIdRef.current = null;
        return;
      }

      // Smooth lerp: 0.12 per frame
      splitRef.current += diff * 0.12;
      applyStyles(splitRef.current, currentPtrRef.current);
      setSliderValue(Math.round(splitRef.current * 100));

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

  // Pointer move inside section (desktop)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (isTouchOrSmall || prefersReducedMotion) return;

      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const raw = (e.clientX - rect.left) / rect.width;
      // Clamped to 8% to 92% of section width
      targetSplitRef.current = Math.max(0.08, Math.min(0.92, raw));

      pointerPosRef.current = {
        x: e.clientX - rect.left - rect.width / 2,
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
    // Eases back to 50%
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
        const raw = (ev.clientX - rect.left) / rect.width;
        targetSplitRef.current = Math.max(0.08, Math.min(0.92, raw));
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

  // Keyboard navigation for handle
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let handled = false;
      let next = targetSplitRef.current;

      if (e.key === 'ArrowLeft') {
        next = Math.max(0.08, next - 0.05);
        handled = true;
      } else if (e.key === 'ArrowRight') {
        next = Math.min(0.92, next + 0.05);
        handled = true;
      } else if (e.key === 'Home') {
        next = 0.08;
        handled = true;
      } else if (e.key === 'End') {
        next = 0.92;
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        targetSplitRef.current = next;
        if (prefersReducedMotion) {
          splitRef.current = next;
          applyStyles(next, { x: 0, y: 0 });
          setSliderValue(Math.round(next * 100));
        } else {
          runLoop();
        }
      }
    },
    [prefersReducedMotion, applyStyles, runLoop]
  );

  // Touch / Mobile toggle handler
  const handleMobileToggle = useCallback(
    (mode: 'ai' | 'builder') => {
      setActiveMobileMode(mode);
      const target = mode === 'ai' ? 1.0 : 0.0;
      targetSplitRef.current = target;

      if (prefersReducedMotion) {
        splitRef.current = target;
        applyStyles(target, { x: 0, y: 0 });
        setSliderValue(Math.round(target * 100));
      } else {
        // Animate over ~500ms
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
          setSliderValue(Math.round(val * 100));

          if (progress < 1) {
            requestAnimationFrame(animateMobile);
          } else {
            splitRef.current = target;
            applyStyles(target, { x: 0, y: 0 });
            setSliderValue(Math.round(target * 100));
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

  // Shoulder mask styles for transparent fades
  const shoulderMaskStyle: React.CSSProperties = {
    WebkitMaskImage:
      'linear-gradient(to bottom, black 72%, transparent 100%), linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
    WebkitMaskComposite: 'source-in',
    maskImage:
      'linear-gradient(to bottom, black 72%, transparent 100%), linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
    maskComposite: 'intersect',
  };

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={
        {
          '--split': isTouchOrSmall ? (activeMobileMode === 'ai' ? '1' : '0') : '0.5',
          '--left-o': '0.75',
          '--right-o': '0.75',
          '--hl-shift': '0px',
          '--portrait-shift': '0px',
          '--ptr-x': '0px',
          '--ptr-y': '0px',
          touchAction: 'pan-y',
        } as React.CSSProperties
      }
      className="relative w-full border-b border-white/5 bg-[#0A0A0B] overflow-hidden select-none"
    >
      {/* ============================================================== */}
      {/* 1. SPLIT BACKGROUND PATTERNS */}
      {/* ============================================================== */}
      {/* Left of divider: Faint diagonal hatch pattern (45deg) with subtle lime tint */}
      <div
        className="absolute inset-0 pointer-events-none transition-none"
        style={{
          clipPath: 'inset(0 calc((1 - var(--split, 0.5)) * 100%) 0 0)',
          backgroundImage: `
            radial-gradient(ellipse at 25% 50%, rgba(198, 255, 61, 0.04), transparent 70%),
            repeating-linear-gradient(45deg, rgba(198, 255, 61, 0.035) 0px, rgba(198, 255, 61, 0.035) 1px, transparent 1px, transparent 12px)
          `,
        }}
      />

      {/* Right of divider: Faint horizontal scan lines (0deg), neutral dark */}
      <div
        className="absolute inset-0 pointer-events-none transition-none"
        style={{
          clipPath: 'inset(0 0 0 calc(var(--split, 0.5) * 100%))',
          backgroundImage: `
            radial-gradient(ellipse at 75% 50%, rgba(255, 255, 255, 0.02), transparent 70%),
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.025) 0px, rgba(255, 255, 255, 0.025) 1px, transparent 1px, transparent 8px)
          `,
        }}
      />

      {/* Top Center Label */}
      <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-20 font-mono text-[11px] sm:text-xs tracking-widest text-[#A1A1AA] uppercase flex items-center gap-2 select-none whitespace-nowrap pointer-events-none">
        <span className="text-[#C6FF3D]">●</span>
        <span>TWO SIDES OF MY WORK</span>
      </div>

      {/* ============================================================== */}
      {/* 2. DESKTOP VIEW (width >= 768px and pointer: fine) */}
      {/* ============================================================== */}
      <div className="hidden md:block relative w-full h-[clamp(560px,88vh,820px)] min-h-[560px]">
        {/* Floating Decorative Tags & Code snippets */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {/* Left Decorative Code */}
            <span
              aria-hidden="true"
              className="absolute top-[9%] left-[19%] font-mono text-[11px] text-[#C6FF3D]/15 select-none pointer-events-none"
            >
              agents.run()
            </span>
            <span
              aria-hidden="true"
              className="absolute bottom-[6%] left-[9%] font-mono text-[11px] text-[#C6FF3D]/15 select-none pointer-events-none"
            >
              pipeline.verify()
            </span>

            {/* Left Floating Tags */}
            {LEFT_TAGS.map((tag) => (
              <div
                key={tag.text}
                style={{
                  top: tag.top,
                  left: tag.left,
                  bottom: tag.bottom,
                  transform: `translate(calc(var(--ptr-x, 0px) * ${tag.depthX}), calc(var(--ptr-y, 0px) * ${tag.depthY})) rotate(${tag.rotate}deg)`,
                }}
                className="absolute px-3 py-1.5 rounded-lg border border-white/10 bg-[#111114]/80 backdrop-blur-sm text-[10px] lg:text-[11px] font-mono text-[#A1A1AA] whitespace-nowrap shadow-md will-change-transform"
              >
                {tag.text}
              </div>
            ))}

            {/* Right Decorative Code */}
            <span
              aria-hidden="true"
              className="absolute top-[9%] right-[19%] font-mono text-[11px] text-white/10 select-none pointer-events-none"
            >
              &lt;div class=&quot;hero&quot;&gt;
            </span>
            <span
              aria-hidden="true"
              className="absolute top-[32%] right-[5%] font-mono text-[11px] text-white/10 select-none pointer-events-none"
            >
              display: grid;
            </span>
            <span
              aria-hidden="true"
              className="absolute bottom-[6%] right-[11%] font-mono text-[11px] text-white/10 select-none pointer-events-none"
            >
              &lt;/html&gt;
            </span>

            {/* Right Floating Tags */}
            {RIGHT_TAGS.map((tag) => (
              <div
                key={tag.text}
                style={{
                  top: tag.top,
                  right: tag.right,
                  bottom: tag.bottom,
                  transform: `translate(calc(var(--ptr-x, 0px) * ${tag.depthX}), calc(var(--ptr-y, 0px) * ${tag.depthY})) rotate(${tag.rotate}deg)`,
                }}
                className="absolute px-3 py-1.5 rounded-lg border border-white/10 bg-[#111114]/80 backdrop-blur-sm text-[10px] lg:text-[11px] font-mono text-[#A1A1AA] whitespace-nowrap shadow-md will-change-transform"
              >
                {tag.text}
              </div>
            ))}
          </div>
        )}

        {/* ============================================================== */}
        {/* CENTER PORTRAIT: Stacked Layers clipped by var(--split) */}
        {/* ============================================================== */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Layer 1: Painted portrait (shown only to the LEFT of the divider) */}
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none"
            style={{
              clipPath: 'inset(0 calc((1 - var(--split, 0.5)) * 100%) 0 0)',
            }}
          >
            <div
              className="relative h-[88%] w-[clamp(320px,38vw,540px)] aspect-[1024/1010] flex items-end justify-center will-change-transform"
              style={{
                ...shoulderMaskStyle,
                transform: 'translateX(var(--portrait-shift, 0px))',
              }}
            >
              <img
                src="/split/painted.png"
                alt="AI Agent Engineer portrait"
                width={1024}
                height={1010}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain object-bottom select-none pointer-events-none"
              />
            </div>
          </div>

          {/* Layer 2: Normal portrait (shown only to the RIGHT of the divider) */}
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none"
            style={{
              clipPath: 'inset(0 0 0 calc(var(--split, 0.5) * 100%))',
            }}
          >
            <div
              className="relative h-[88%] w-[clamp(320px,38vw,540px)] aspect-[1024/1010] flex items-end justify-center will-change-transform"
              style={{
                ...shoulderMaskStyle,
                transform: 'translateX(var(--portrait-shift, 0px))',
              }}
            >
              <img
                src="/split/real.png"
                alt="Product Builder portrait"
                width={1024}
                height={1010}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain object-bottom select-none pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DIVIDER & HANDLE */}
        {/* ============================================================== */}
        <div
          className="absolute top-0 bottom-0 z-30 pointer-events-none"
          style={{
            left: 'calc(var(--split, 0.5) * 100%)',
          }}
        >
          {/* Vertical Lime Line */}
          <div className="absolute top-0 bottom-0 left-0 w-[2px] -translate-x-1/2 bg-[#C6FF3D] shadow-[0_0_12px_rgba(198,255,61,0.6)]" />

          {/* Small circular handle at mid-height (Draggable & Keyboard control) */}
          <div
            ref={handleRef}
            tabIndex={0}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={sliderValue}
            aria-label="Switch between AI engineer and product builder"
            onPointerDown={handleDragStart}
            onKeyDown={handleKeyDown}
            style={{ touchAction: 'none' }}
            className="pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#111114] border-2 border-[#C6FF3D] shadow-[0_0_16px_rgba(198,255,61,0.5)] flex items-center justify-center cursor-ew-resize hover:scale-110 active:scale-95 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]"
          >
            {/* Grip arrows */}
            <div className="flex items-center gap-0.5 text-[#C6FF3D] select-none text-[10px] font-mono leading-none">
              <span>‹</span>
              <span>›</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TEXT COLUMNS (Desktop) */}
        {/* ============================================================== */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10 h-full flex items-center justify-between pointer-events-none">
          {/* Left Column (Mode 01) */}
          <div
            style={{
              opacity: 'var(--left-o, 0.75)',
              transform: 'translateX(var(--hl-shift, 0px))',
            }}
            className="w-[30%] max-w-[400px] pointer-events-auto transition-opacity duration-150 will-change-transform"
          >
            <div className="font-mono text-xs text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2 mb-2">
              <span className="w-5 h-[2px] bg-[#C6FF3D] inline-block" />
              <span>MODE_01</span>
            </div>
            <h2
              className="font-display font-black uppercase tracking-tight text-[#F4F4F0] leading-[0.93]"
              style={{ fontSize: 'clamp(2.25rem, 4.6vw, 4.8rem)' }}
            >
              AI AGENT ENGINEER
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

          {/* Right Column (Mode 02) */}
          <div
            style={{
              opacity: 'var(--right-o, 0.75)',
              transform: 'translateX(var(--hl-shift, 0px))',
            }}
            className="w-[30%] max-w-[400px] pointer-events-auto transition-opacity duration-150 will-change-transform text-left"
          >
            <div className="font-mono text-xs text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2 mb-2">
              <span className="w-5 h-[2px] bg-[#C6FF3D] inline-block" />
              <span>MODE_02</span>
            </div>
            <h2
              className="font-display font-black uppercase tracking-normal text-[#F4F4F0] leading-[0.93]"
              style={{ fontSize: 'clamp(2.25rem, 4.6vw, 4.8rem)' }}
            >
              FULL-STACK PRODUCT BUILDER
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

        {/* Bottom Center Link (Desktop) */}
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
      {/* 3. TOUCH DEVICES / MOBILE VIEW (< 768px or pointer: coarse) */}
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

        {/* Portrait Container (about 70vw tall max) */}
        <div className="relative w-[75vw] max-w-[340px] aspect-[1024/1010] mb-8 overflow-hidden">
          {/* Layer 1: Painted portrait */}
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none"
            style={{
              clipPath: 'inset(0 calc((1 - var(--split, 1)) * 100%) 0 0)',
            }}
          >
            <div className="relative w-full h-full flex items-end justify-center" style={shoulderMaskStyle}>
              <img
                src="/split/painted.png"
                alt="AI Agent Engineer portrait"
                width={1024}
                height={1010}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain object-bottom select-none"
              />
            </div>
          </div>

          {/* Layer 2: Normal portrait */}
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none"
            style={{
              clipPath: 'inset(0 0 0 calc(var(--split, 1) * 100%))',
            }}
          >
            <div className="relative w-full h-full flex items-end justify-center" style={shoulderMaskStyle}>
              <img
                src="/split/real.png"
                alt="Product Builder portrait"
                width={1024}
                height={1010}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain object-bottom select-none"
              />
            </div>
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
                FULL-STACK PRODUCT BUILDER
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

