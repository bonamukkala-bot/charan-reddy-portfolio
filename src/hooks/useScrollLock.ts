import { useEffect } from 'react';
import { stopLenis, startLenis } from './useLenis';

let activeLocksCount = 0;
let previousScrollY = 0;
let originalHtmlOverflow = '';
let originalBodyOverflow = '';
let originalBodyPosition = '';
let originalBodyTop = '';
let originalBodyWidth = '';
let originalBodyPaddingRight = '';

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (activeLocksCount === 0) {
      // 1. Pause smooth scroll
      stopLenis();

      // 2. Measure scrollbar width to prevent layout jump
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // 3. Save current state
      previousScrollY = window.scrollY;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyOverflow = document.body.style.overflow;
      originalBodyPosition = document.body.style.position;
      originalBodyTop = document.body.style.top;
      originalBodyWidth = document.body.style.width;
      originalBodyPaddingRight = document.body.style.paddingRight;

      // 4. Apply lock to html and body
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${previousScrollY}px`;
      document.body.style.width = '100%';

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    activeLocksCount += 1;

    return () => {
      activeLocksCount = Math.max(0, activeLocksCount - 1);

      if (activeLocksCount === 0) {
        // Restore all previous styles
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        document.body.style.paddingRight = originalBodyPaddingRight;

        // Restore exact scroll position
        window.scrollTo(0, previousScrollY);

        // Resume smooth scroll
        startLenis();
      }
    };
  }, [isLocked]);
}
