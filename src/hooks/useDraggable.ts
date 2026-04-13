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
  const dragStartPosRef = useRef(initialPosition);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setWasDragged(false);
    setIsDragging(true);
    dragStartPosRef.current = posRef.current;
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

      const el = elementRef.current;
      if (el) {
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      const start = dragStartPosRef.current;
      const end = posRef.current;
      const movedDistance = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);

      setIsDragging(false);
      setPosition(end);

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
