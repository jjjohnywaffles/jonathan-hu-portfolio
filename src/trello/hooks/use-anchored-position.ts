import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type AnchoredPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'bottom'
  | 'top-start'
  | 'top-end'
  | 'top'
  | 'right'
  | 'left'
  | 'center';

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

export type UseAnchoredPositionProps = {
  isOpen: boolean;
  anchorRef?: React.RefObject<HTMLElement | null>;
  contentRef?: React.RefObject<HTMLElement | null>;
  placement?: AnchoredPlacement;
  offset?: number;
  viewportPadding?: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
  /**
   * If true, compute using the anchor position on open and keep it fixed.
   */
  lockOnOpen?: boolean;
  /** Control reflow triggers */
  reflowOnScroll?: boolean;
  reflowOnResize?: boolean;
  reflowOnContentResize?: boolean;
};

export type AnchoredPosition = {
  top: number;
  left: number;
  actualPlacement: AnchoredPlacement;
};

/**
 * Unified anchored positioning hook used for popovers and dropdowns.
 * - Measures content size when available
 * - Clamps to viewport with padding
 * - Repositions on window scroll/resize and content resizes
 */
export function useAnchoredPosition({
  isOpen,
  anchorRef,
  contentRef,
  placement = 'bottom-start',
  offset = 8,
  viewportPadding = 16,
  fallbackWidth = 300,
  fallbackHeight = 420,
  lockOnOpen = false,
  reflowOnScroll = true,
  reflowOnResize = true,
  reflowOnContentResize = true,
}: UseAnchoredPositionProps): AnchoredPosition {
  const [position, setPosition] = useState<AnchoredPosition>({
    top: -9999,
    left: -9999,
    actualPlacement: placement,
  });
  const lockedAnchorRectRef = useRef<Rect | null>(null);
  const hasLockedOnOpenRef = useRef(false);

  const getViewport = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const getContentSize = useCallback(() => {
    const rect = contentRef?.current?.getBoundingClientRect();
    const width = rect && rect.width > 0 ? rect.width : fallbackWidth;
    const height = rect && rect.height > 0 ? rect.height : fallbackHeight;
    return { width, height };
  }, [contentRef, fallbackHeight, fallbackWidth]);

  const getAnchorRect = useCallback((): Rect | null => {
    if (lockOnOpen && lockedAnchorRectRef.current) {
      return lockedAnchorRectRef.current;
    }
    if (!anchorRef?.current) return null;
    const r = anchorRef.current.getBoundingClientRect();
    return {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      right: r.right,
      bottom: r.bottom,
    };
  }, [anchorRef, lockOnOpen]);

  const compute = useCallback((): AnchoredPosition => {
    if (!isOpen) {
      return { top: -9999, left: -9999, actualPlacement: placement };
    }

    // Center placement ignores anchor
    if (placement === 'center') {
      const { width, height } = getContentSize();
      const vp = getViewport();
      const top = Math.max(viewportPadding, (vp.height - height) / 2);
      const left = Math.max(viewportPadding, (vp.width - width) / 2);
      return { top, left, actualPlacement: 'center' };
    }

    const anchor = getAnchorRect();
    if (!anchor) {
      return { top: -9999, left: -9999, actualPlacement: placement };
    }

    const { width: cw, height: ch } = getContentSize();
    const vp = getViewport();

    let top = -9999;
    let left = -9999;
    let actual: AnchoredPlacement = placement;

    const place = (pl: AnchoredPlacement) => {
      switch (pl) {
        case 'bottom-start':
          top = anchor.bottom + offset;
          left = anchor.left;
          break;
        case 'bottom-end':
          top = anchor.bottom + offset;
          left = anchor.right - cw;
          break;
        case 'bottom':
          top = anchor.bottom + offset;
          left = anchor.left + (anchor.width - cw) / 2;
          break;
        case 'top-start':
          top = anchor.top - ch - offset;
          left = anchor.left;
          break;
        case 'top-end':
          top = anchor.top - ch - offset;
          left = anchor.right - cw;
          break;
        case 'top':
          top = anchor.top - ch - offset;
          left = anchor.left + (anchor.width - cw) / 2;
          break;
        case 'right':
          top = anchor.top;
          left = anchor.right + offset;
          break;
        case 'left':
          top = anchor.top;
          left = anchor.left - cw - offset;
          break;
        default:
          top = anchor.bottom + offset;
          left = anchor.left;
      }
    };

    // initial placement
    place(placement);

    // Clamp to viewport; shift vertically if bottom overflow
    const maxLeft = vp.width - cw - viewportPadding;
    const maxTop = vp.height - ch - viewportPadding;
    if (placement.startsWith('bottom')) {
      const overflow = top + ch - (vp.height - viewportPadding);
      if (overflow > 0) top = Math.max(viewportPadding, top - overflow);
    }
    left = Math.max(viewportPadding, Math.min(left, maxLeft));
    top = Math.max(viewportPadding, Math.min(top, maxTop));

    // If top placement still overflows (not enough space above), fall back to bottom
    if (placement.startsWith('top') && anchor.top - ch - offset < viewportPadding) {
      place('bottom-start');
      actual = 'bottom-start';
      const fallbackOverflow = top + ch - (vp.height - viewportPadding);
      if (fallbackOverflow > 0) top = Math.max(viewportPadding, top - fallbackOverflow);
      left = Math.max(viewportPadding, Math.min(left, maxLeft));
      top = Math.max(viewportPadding, Math.min(top, maxTop));
    }

    return { top, left, actualPlacement: actual };
  }, [isOpen, placement, getContentSize, getAnchorRect, offset, viewportPadding]);

  // Compute on open and when dependencies change
  useEffect(() => {
    if (!isOpen) {
      setPosition({ top: -9999, left: -9999, actualPlacement: placement });
      lockedAnchorRectRef.current = null;
      hasLockedOnOpenRef.current = false;
      return;
    }
    if (lockOnOpen && !hasLockedOnOpenRef.current) {
      // lock the anchor rect at the time of open
      const a = anchorRef?.current?.getBoundingClientRect();
      if (a) {
        lockedAnchorRectRef.current = {
          top: a.top,
          left: a.left,
          width: a.width,
          height: a.height,
          right: a.right,
          bottom: a.bottom,
        };
        hasLockedOnOpenRef.current = true;
      }
    }
    const update = () => setPosition(compute());
    // delay a frame to ensure content is mounted and measurable
    const raf = requestAnimationFrame(() => requestAnimationFrame(update));
    return () => cancelAnimationFrame(raf);
  }, [isOpen, placement, compute, lockOnOpen, anchorRef]);

  // Reposition on scroll/resize while open (configurable)
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => {
      const cb = () => setPosition(compute());
      requestAnimationFrame(cb);
    };
    if (reflowOnScroll) {
      window.addEventListener('scroll', handler, true);
    }
    if (reflowOnResize) {
      window.addEventListener('resize', handler);
    }
    return () => {
      if (reflowOnScroll) {
        window.removeEventListener('scroll', handler, true);
      }
      if (reflowOnResize) {
        window.removeEventListener('resize', handler);
      }
    };
  }, [isOpen, compute, reflowOnScroll, reflowOnResize]);

  // Reposition when content resizes (configurable)
  useEffect(() => {
    if (!isOpen || !contentRef?.current || !reflowOnContentResize) return;
    const obs = new ResizeObserver(() => setPosition(compute()));
    obs.observe(contentRef.current);
    return () => obs.disconnect();
  }, [isOpen, contentRef, compute, reflowOnContentResize]);

  return position;
}
