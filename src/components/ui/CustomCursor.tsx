import { useEffect, useState } from 'react';
import { motion, useSpring } from 'motion/react';

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

  // Smooth spring physics
  const cursorX = useSpring(-100, { stiffness: 500, damping: 28 });
  const cursorY = useSpring(-100, { stiffness: 500, damping: 28 });

  useEffect(() => {
    // Check for touch / fine pointer and reduced motion
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFinePointer || prefersReducedMotion) {
      setIsTouch(true);
      return;
    }
    setIsTouch(false);

    const handleMouseMove = (e: MouseEvent) => {
      // If pointer is within window bounds
      if (
        e.clientX < 0 ||
        e.clientY < 0 ||
        e.clientX > window.innerWidth ||
        e.clientY > window.innerHeight
      ) {
        setCursorState((prev) => ({ ...prev, visible: false }));
        return;
      }

      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const projectCard = target.closest('[data-cursor="view"]');
      const button = target.closest('button, [data-cursor="pointer"]');
      const link = target.closest('a');

      if (projectCard) {
        setCursorState({ visible: true, type: 'card', text: 'View' });
      } else if (button) {
        setCursorState({ visible: true, type: 'button' });
      } else if (link) {
        setCursorState({ visible: true, type: 'link' });
      } else {
        setCursorState({ visible: true, type: 'default' });
      }
    };

    const handleMouseLeave = () => {
      setCursorState((prev) => ({ ...prev, visible: false }));
    };

    const handleMouseEnter = () => {
      setCursorState((prev) => ({ ...prev, visible: true }));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY]);

  if (isTouch || !cursorState.visible) return null;

  const isCard = cursorState.type === 'card';
  const isButton = cursorState.type === 'button';
  const isLink = cursorState.type === 'link';

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[9999] -translate-x-1/2 -translate-y-1/2"
      style={{
        x: cursorX,
        y: cursorY,
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
    </motion.div>
  );
}
