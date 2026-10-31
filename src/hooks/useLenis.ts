import { useEffect } from 'react';
import Lenis from 'lenis';

let globalLenis: Lenis | null = null;
type ScrollCallback = (lenis: Lenis) => void;
const scrollListeners = new Set<ScrollCallback>();

export function getLenis(): Lenis | null {
  return globalLenis;
}

export function onLenisScroll(cb: ScrollCallback): () => void {
  scrollListeners.add(cb);
  return () => {
    scrollListeners.delete(cb);
  };
}

export function stopLenis() {
  if (globalLenis) {
    try {
      globalLenis.stop();
    } catch {
      // safe fallback
    }
  }
}

export function startLenis() {
  if (globalLenis) {
    try {
      globalLenis.start();
    } catch {
      // safe fallback
    }
  }
}

export function useLenis() {
  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Detect touch-only environment to ensure native 120Hz momentum scrolling on phones
    const isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
      window.matchMedia('(pointer: coarse)').matches;

    // Use smoothWheel on desktop, pure native scrolling on touch phones
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !isTouchDevice,
      wheelMultiplier: 1.0,
      touchMultiplier: 0,
      syncTouch: false, // Ensure native touch scrolling on touch devices
    });

    globalLenis = lenis;

    lenis.on('scroll', (e) => {
      scrollListeners.forEach((listener) => {
        try {
          listener(e);
        } catch {
          // ignore error
        }
      });
    });

    // Single requestAnimationFrame loop driving Lenis
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      if (globalLenis === lenis) {
        globalLenis = null;
      }
    };
  }, []);
}
