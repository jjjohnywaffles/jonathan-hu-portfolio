import { useEffect } from 'react';

export type PointerPosition = { x: number; y: number } | null;

// Module-level global pointer ref so all hook consumers share the same value
const globalPointerRef: { current: PointerPosition } = { current: null };
let pointerTrackingAttached = false;
let pointerSuppressionCount = 0;

function isSuppressed(): boolean {
  return pointerSuppressionCount > 0;
}

export function pushPointerSuppression(): void {
  pointerSuppressionCount += 1;
  // Clear stale pointer so background handlers depending on pointer won't act
  globalPointerRef.current = null;
}

export function popPointerSuppression(): void {
  pointerSuppressionCount = Math.max(0, pointerSuppressionCount - 1);
}

function ensureGlobalPointerTracking(): void {
  if (pointerTrackingAttached || typeof window === 'undefined') {
    return;
  }
  const handleMouseMove = (e: MouseEvent) => {
    if (isSuppressed()) {
      return;
    }
    globalPointerRef.current = { x: e.clientX, y: e.clientY };
  };
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  pointerTrackingAttached = true;
}

/**
 * Tracks the latest window pointer position in a ref without causing re-renders.
 * Returns a ref whose current value is `{ x, y }` or `null` if unknown.
 */
export function usePointerPosition(): React.MutableRefObject<PointerPosition> {
  useEffect(() => {
    ensureGlobalPointerTracking();
  }, []);

  return globalPointerRef as React.MutableRefObject<PointerPosition>;
}

/**
 * Utility to check whether a pointer position lies within an element's client rect.
 */
export function isPointerWithinElement(
  el: Element | null | undefined,
  pointer: PointerPosition
): boolean {
  if (el == null || pointer == null) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return (
    pointer.x >= rect.left &&
    pointer.x <= rect.right &&
    pointer.y >= rect.top &&
    pointer.y <= rect.bottom
  );
}
