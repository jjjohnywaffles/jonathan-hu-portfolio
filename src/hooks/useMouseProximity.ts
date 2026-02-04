import { useState, useEffect, useCallback } from 'react';

interface UseMouseProximityOptions {
  edge: 'top' | 'bottom' | 'left' | 'right';
  threshold: number; // pixels from edge
  enabled?: boolean;
}

export const useMouseProximity = ({
  edge,
  threshold,
  enabled = true,
}: UseMouseProximityOptions): boolean => {
  const [isNearEdge, setIsNearEdge] = useState(false);

  const checkProximity = useCallback(
    (e: MouseEvent) => {
      let isNear = false;

      switch (edge) {
        case 'top':
          isNear = e.clientY <= threshold;
          break;
        case 'bottom':
          isNear = e.clientY >= window.innerHeight - threshold;
          break;
        case 'left':
          isNear = e.clientX <= threshold;
          break;
        case 'right':
          isNear = e.clientX >= window.innerWidth - threshold;
          break;
      }

      setIsNearEdge(isNear);
    },
    [edge, threshold]
  );

  useEffect(() => {
    if (!enabled) {
      // Return early and reset on cleanup or next render with enabled=true
      return () => {
        // State will be reset when effect runs again with enabled=true
      };
    }

    window.addEventListener('mousemove', checkProximity);
    return () => window.removeEventListener('mousemove', checkProximity);
  }, [checkProximity, enabled]);

  // Return false immediately when disabled - no state update needed
  return enabled ? isNearEdge : false;
};
