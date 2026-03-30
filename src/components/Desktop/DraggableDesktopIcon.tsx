import type { ReactNode } from 'react';
import { useDraggable } from '../../hooks/useDraggable';
import type { Position } from '../../hooks/useDraggable';

interface DraggableDesktopIconProps {
  name: string;
  icon: ReactNode;
  isSelected: boolean;
  position: Position;
  onClick: (wasDragged: boolean) => void;
}

export const DraggableDesktopIcon = ({
  name,
  icon,
  isSelected,
  position,
  onClick,
}: DraggableDesktopIconProps) => {
  const { isDragging, wasDragged, elementRef, handleMouseDown } = useDraggable({
    initialPosition: position,
  });

  const displayName = name.replace('.app', '').replace('.link', '');

  return (
    <div
      ref={elementRef}
      data-desktop-icon
      className={`absolute z-0 flex w-16 flex-col items-center gap-1.5 select-none ${isDragging ? 'opacity-80' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'default',
        zIndex: isDragging ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onClick(wasDragged);
      }}
    >
      <div
        className={`w-12 h-12 flex items-center justify-center border rounded-[10px] transition-colors duration-200 ${
          isSelected
            ? 'bg-white/20 border-accent'
            : 'bg-transparent border-accent hover:bg-white/10'
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-[10px] text-center line-clamp-2 leading-tight font-mono px-1 rounded ${
          isSelected ? 'text-white bg-accent/50' : 'text-text-primary'
        }`}
      >
        {displayName}
      </span>
    </div>
  );
};
