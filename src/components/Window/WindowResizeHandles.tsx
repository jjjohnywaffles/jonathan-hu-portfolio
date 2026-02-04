import type { ResizeDirection } from '../../hooks/useWindowResize';

interface WindowResizeHandlesProps {
  onResizeStart: (direction: ResizeDirection) => (e: React.MouseEvent) => void;
}

export const WindowResizeHandles = ({ onResizeStart }: WindowResizeHandlesProps) => {
  return (
    <>
      {/* Edge handles */}
      <div
        className="absolute z-20 top-0 left-2 right-2 h-1 cursor-ns-resize"
        onMouseDown={onResizeStart('n')}
      />
      <div
        className="absolute z-20 bottom-0 left-2 right-2 h-1 cursor-ns-resize"
        onMouseDown={onResizeStart('s')}
      />
      <div
        className="absolute z-20 right-0 top-2 bottom-2 w-1 cursor-ew-resize"
        onMouseDown={onResizeStart('e')}
      />
      <div
        className="absolute z-20 left-0 top-2 bottom-2 w-1 cursor-ew-resize"
        onMouseDown={onResizeStart('w')}
      />

      {/* Corner handles */}
      <div
        className="absolute z-20 top-0 right-0 w-3 h-3 cursor-nesw-resize"
        onMouseDown={onResizeStart('ne')}
      />
      <div
        className="absolute z-20 top-0 left-0 w-3 h-3 cursor-nwse-resize"
        onMouseDown={onResizeStart('nw')}
      />
      <div
        className="absolute z-20 bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
        onMouseDown={onResizeStart('se')}
      />
      <div
        className="absolute z-20 bottom-0 left-0 w-3 h-3 cursor-nesw-resize"
        onMouseDown={onResizeStart('sw')}
      />
    </>
  );
};
