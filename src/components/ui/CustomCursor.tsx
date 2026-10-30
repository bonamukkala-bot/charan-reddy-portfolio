import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

interface CursorState {
  visible: boolean;
  type: 'default' | 'card' | 'button' | 'link';
  text?: string;
}

export function CustomCursor() {
  const [cursorState, setCursorState] = useState<CursorState>({
    visible: false,
    type: 'default',
  });
  const [isTouch, setIsTouch] = useState(true);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Completely disabled on touch devices and for reduced motion
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFinePointer || prefersReducedMotion) {
      setIsTouch(true);
      return;
    }
    setIsTouch(false);

    let currentX = -100;
    let currentY = -100;
    let targetX = -100;
    let targetY = -100;
    let isVisible = false;
    let rafId = 0;

    const render = () => {
      // Smooth interpolation: 0.2 factor for crisp responsiveness
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = 0;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (
        e.clientX < 0 ||
        e.clientY < 0 ||
        e.clientX > window.innerWidth ||
        e.clientY > window.innerHeight
      ) {
        if (isVisible) {
          isVisible = false;
          setCursorState((prev) => ({ ...prev, visible: false }));
        }
        return;
      }

      targetX = e.clientX;
      targetY = e.clientY;

      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }

      if (!isVisible) {
        isVisible = true;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const projectCard = target.closest('[data-cursor="view"]');
      const button = target.closest('button, [data-cursor="pointer"]');
      const link = target.closest('a');

      let newType: CursorState['type'] = 'default';
      let text: string | undefined = undefined;

      if (projectCard) {
        newType = 'card';
        text = 'View';
      } else if (button) {
        newType = 'button';
      } else if (link) {
        newType = 'link';
      }

      setCursorState((prev) => {
        if (prev.visible && prev.type === newType && prev.text === text) return prev;
        return { visible: true, type: newType, text };
      });
    };

    const handleMouseLeave = () => {
      isVisible = false;
      setCursorState((prev) => ({ ...prev, visible: false }));
    };

    const handleMouseEnter = () => {
      isVisible = true;
      setCursorState((prev) => ({ ...prev, visible: true }));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  if (isTouch || !cursorState.visible) return null;

  const isCard = cursorState.type === 'card';
  const isButton = cursorState.type === 'button';
  const isLink = cursorState.type === 'link';

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-[9999] -translate-x-1/2 -translate-y-1/2 will-change-transform"
      style={{
        transform: 'translate3d(-100px, -100px, 0)',
      }}
    >
      {isCard ? (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C6FF3D] text-[12px] font-semibold tracking-wider text-[#0A0A0B] uppercase shadow-[0_0_20px_rgba(198,255,61,0.5)]"
        >
          {cursorState.text || 'View'}
        </motion.div>
      ) : isButton || isLink ? (
        <motion.div
          animate={{ scale: 1.6 }}
          transition={{ duration: 0.15 }}
          className="h-6 w-6 rounded-full border border-[#C6FF3D] bg-[#C6FF3D]/10"
        />
      ) : (
        <div className="relative flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-[#C6FF3D]" />
          <div className="absolute h-5 w-5 rounded-full border border-[#C6FF3D]/40" />
        </div>
      )}
    </div>
  );
}
