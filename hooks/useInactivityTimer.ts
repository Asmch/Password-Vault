import { useEffect, useRef } from 'react';

interface UseInactivityTimerProps {
  timeoutMs?: number;
  onIdle: () => void;
  isActive: boolean; // Only run timer if vault is actually unlocked/active
}

export function useInactivityTimer({
  timeoutMs = 5 * 60 * 1000, // 5 minutes default
  onIdle,
  isActive,
}: UseInactivityTimerProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const handleActivity = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onIdle();
      }, timeoutMs);
    };

    // Initial setup
    handleActivity();

    // Listen to standard activity events
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, handleActivity));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [isActive, timeoutMs, onIdle]);
}
