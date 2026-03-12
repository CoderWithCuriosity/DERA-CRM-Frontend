import { useEffect, useRef } from 'react';

export function usePolling(
  callback: () => Promise<void> | void,
  interval: number,
  immediate: boolean = true
) {
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = async () => {
      await savedCallback.current();
    };

    if (immediate) {
      tick();
    }

    timeoutRef.current = window.setInterval(tick, interval);

    return () => {
      if (timeoutRef.current) {
        window.clearInterval(timeoutRef.current);
      }
    };
  }, [interval, immediate]);
}