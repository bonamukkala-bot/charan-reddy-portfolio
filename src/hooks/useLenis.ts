import { useEffect } from 'react';
import Lenis from 'lenis';

let globalLenis: Lenis | null = null;

export function getLenis(): Lenis | null {
  return globalLenis;
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

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    globalLenis = lenis;

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
