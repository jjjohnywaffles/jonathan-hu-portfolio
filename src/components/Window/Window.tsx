import { useRef, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WindowHeader } from './WindowHeader';
import { WindowResizeHandles } from './WindowResizeHandles';
import { useWindowManager } from '../../hooks/useWindowManager';
import { useMouseProximity } from '../../hooks/useMouseProximity';
import { useWindowResize } from '../../hooks/useWindowResize';
import type { WindowConfig, Position, Size } from '../../types/window';
import './Window.css';

interface WindowProps {
  windowConfig: WindowConfig;
  children: ReactNode;
  dockPosition?: { x: number; y: number };
}

export const Window = ({ windowConfig, children, dockPosition }: WindowProps) => {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    focusWindow,
    updatePosition,
    updateSize,
    focusedWindowId,
  } = useWindowManager();

  const { id, title, state, position, size, zIndex } = windowConfig;
  const isFocused = focusedWindowId === id;
  const isMaximized = state === 'maximized';
  const isMinimized = state === 'minimized';

  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragPositionRef = useRef({ x: position.x, y: position.y });

  // Track if header is being hovered in maximized mode
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  // Window resize handling
  const handleResize = useCallback(
    (newPosition: Position, newSize: Size) => {
      updatePosition(id, newPosition);
      updateSize(id, newSize);
    },
    [id, updatePosition, updateSize]
  );

  const { isResizing, handleResizeStart } = useWindowResize({
    position,
    size,
    minWidth: 300,
    minHeight: 200,
    onResize: handleResize,
    enabled: !isMaximized && !isMinimized,
  });

  // Show header when mouse is near top edge in maximized mode
  const isNearTop = useMouseProximity({
    edge: 'top',
    threshold: 50,
    enabled: isMaximized && !isHeaderHovered,
  });

  // Header should show if near top OR if being hovered
  const showHeader = !isMaximized || isNearTop || isHeaderHovered;

  // Keep ref in sync with position prop when not dragging
  useEffect(() => {
    if (!isDragging && !isMaximized) {
      dragPositionRef.current = { x: position.x, y: position.y };
    }
  }, [isDragging, isMaximized, position.x, position.y]);

  const handleClose = useCallback(() => closeWindow(id), [closeWindow, id]);

  const handleMinimize = useCallback(() => minimizeWindow(id), [minimizeWindow, id]);

  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      restoreWindow(id);
    } else {
      maximizeWindow(id);
    }
  }, [isMaximized, maximizeWindow, restoreWindow, id]);

  const handleWindowClick = useCallback(() => {
    if (!isFocused && !isMinimized) {
      focusWindow(id);
    }
  }, [focusWindow, id, isFocused, isMinimized]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized || (e.target as HTMLElement).closest('.window-btn')) return;

      e.preventDefault();
      setIsDragging(true);
      dragOffsetRef.current = {
        x: e.clientX - dragPositionRef.current.x,
        y: e.clientY - dragPositionRef.current.y,
      };
    },
    [isMaximized]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = Math.max(0, e.clientY - dragOffsetRef.current.y);
      dragPositionRef.current = { x: newX, y: newY };
      updatePosition(id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, id, updatePosition]);

  // Calculate target position for dock
  const dockTargetX = dockPosition?.x ?? window.innerWidth / 2;
  const dockTargetY = dockPosition?.y ?? window.innerHeight - 35;

  // Determine animated values based on state
  const getAnimatedStyle = () => {
    if (isMinimized) {
      return {
        left: dockTargetX - 24,
        top: dockTargetY - 24,
        width: 48,
        height: 48,
        opacity: 0,
        scale: 0.2,
        borderRadius: 8,
      };
    }
    if (isMaximized) {
      return {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        opacity: 1,
        scale: 1,
        borderRadius: 0,
      };
    }
    // Normal state
    return {
      left: position.x,
      top: position.y,
      width: size.width,
      height: size.height,
      opacity: 1,
      scale: 1,
      borderRadius: 12,
    };
  };

  const animatedStyle = getAnimatedStyle();

  // Initial state - start from dock position
  const initialStyle = {
    left: dockTargetX - 24,
    top: dockTargetY - 24,
    width: 48,
    height: 48,
    opacity: 0,
    scale: 0.2,
    borderRadius: 8,
  };

  return (
    <motion.div
      className={`window ${isFocused ? 'focused' : ''} ${isMaximized ? 'maximized' : ''} ${isDragging || isResizing ? 'dragging' : ''} ${isMinimized ? 'minimized' : ''}`}
      style={{
        zIndex: isMinimized ? -1 : zIndex,
        pointerEvents: isMinimized ? 'none' : 'auto',
      }}
      initial={initialStyle}
      animate={animatedStyle}
      transition={
        isDragging || isResizing
          ? { duration: 0 }
          : {
              type: 'spring',
              stiffness: 400,
              damping: 35,
            }
      }
      onClick={handleWindowClick}
      onMouseDown={handleWindowClick}
    >
      {/* Header - overlays content in maximized mode, animates in/out */}
      <AnimatePresence>
        {showHeader && (
          <motion.div
            className={`window-header-container ${isMaximized ? 'maximized-header' : ''}`}
            initial={isMaximized ? { y: -38, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -38, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onMouseDown={handleDragStart}
            onMouseEnter={() => setIsHeaderHovered(true)}
            onMouseLeave={() => setIsHeaderHovered(false)}
          >
            <WindowHeader
              title={title}
              onClose={handleClose}
              onMinimize={handleMinimize}
              onMaximize={handleMaximize}
              isMaximized={isMaximized}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Window content - always rendered to preserve state */}
      <div className="window-content">{children}</div>

      {/* Resize handles - only show when not maximized/minimized */}
      {!isMaximized && !isMinimized && <WindowResizeHandles onResizeStart={handleResizeStart} />}
    </motion.div>
  );
};
