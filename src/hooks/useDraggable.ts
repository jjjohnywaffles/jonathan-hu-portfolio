import { useState, useEffect, useRef } from 'react';

export interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  initialPosition: Position;
}

export function useDraggable({ initialPosition }: UseDraggableOptions) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const posRef = useRef(initialPosition);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setWasDragged(false);
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - offsetRef.current.x;
      const newY = e.clientY - offsetRef.current.y;
      posRef.current = { x: newX, y: newY };

      // Direct DOM update for smooth dragging
      const el = elementRef.current;
      if (el) {
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      const startX = posRef.current.x;
      const startY = posRef.current.y;
      const movedDistance = Math.abs(startX - position.x) + Math.abs(startY - position.y);

      setIsDragging(false);
      setPosition(posRef.current);

      if (movedDistance > 3) {
        setWasDragged(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return {
    position,
    isDragging,
    wasDragged,
    elementRef,
    handleMouseDown,
  };
}
