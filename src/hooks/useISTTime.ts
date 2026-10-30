import { useState, useEffect } from 'react';

export function useISTTime() {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      // Format to IST (Asia/Kolkata)
      const formatted = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
      setTimeStr(formatted);
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeStr;
}
