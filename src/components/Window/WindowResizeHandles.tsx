import type { ResizeDirection } from '../../hooks/useWindowResize';

interface WindowResizeHandlesProps {
  onResizeStart: (direction: ResizeDirection) => (e: React.MouseEvent) => void;
}

export const WindowResizeHandles = ({ onResizeStart }: WindowResizeHandlesProps) => {
  return (
    <>
      {/* Edge handles */}
      <div className="resize-handle resize-n" onMouseDown={onResizeStart('n')} />
      <div className="resize-handle resize-s" onMouseDown={onResizeStart('s')} />
      <div className="resize-handle resize-e" onMouseDown={onResizeStart('e')} />
      <div className="resize-handle resize-w" onMouseDown={onResizeStart('w')} />

      {/* Corner handles */}
      <div className="resize-handle resize-ne" onMouseDown={onResizeStart('ne')} />
      <div className="resize-handle resize-nw" onMouseDown={onResizeStart('nw')} />
      <div className="resize-handle resize-se" onMouseDown={onResizeStart('se')} />
      <div className="resize-handle resize-sw" onMouseDown={onResizeStart('sw')} />
    </>
  );
};
