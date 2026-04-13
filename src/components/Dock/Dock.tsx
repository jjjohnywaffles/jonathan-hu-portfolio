import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWindowManager } from '../../hooks/useWindowManager';
import { DockAppItem } from './DockItem';
import { DockMinimizedPreview } from './DockMinimizedPreview';

const ICON_SIZE = 48;
const GAP = 8;
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 35 };

function reconcileOrder(dockOrder: string[], availableIds: string[]): string[] {
  const available = new Set(availableIds);
  const kept = dockOrder.filter((id) => available.has(id));
  const keptSet = new Set(kept);
  const added = availableIds.filter((id) => !keptSet.has(id));
  return [...kept, ...added];
}

export const Dock = () => {
  const { apps, windows, hasMaximizedWindow } = useWindowManager();

  const [dockOrder, setDockOrder] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [didDrag, setDidDrag] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const iconStartRef = useRef({ x: 0, y: 0 });

  const dockAppIds = apps
    .filter(
      (app) => app.pinToDock !== false || Object.values(windows).some((w) => w.appId === app.id)
    )
    .map((a) => a.id);

  const orderedDockApps = reconcileOrder(dockOrder, dockAppIds);

  const handleDragStart = (e: React.MouseEvent, index: number) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    iconStartRef.current = { x: rect.left, y: rect.top };
    setDragIndex(index);
    setDropIndex(index);
    setDragPos({ x: rect.left, y: rect.top });
    setDidDrag(false);
  };

  useEffect(() => {
    if (dragIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (!didDrag && Math.abs(dx) + Math.abs(dy) < 4) return;
      if (!didDrag) setDidDrag(true);

      setDragPos({
        x: iconStartRef.current.x + dx,
        y: iconStartRef.current.y + dy,
      });

      const container = containerRef.current;
      if (!container) return;

      const iconChildren = Array.from(container.children).filter((c) =>
        (c as HTMLElement).hasAttribute('data-dock-index')
      ) as HTMLElement[];

      let newDropIndex = orderedDockApps.length;
      for (const child of iconChildren) {
        const idx = Number(child.getAttribute('data-dock-index'));
        if (idx === dragIndex) continue;
        const rect = child.getBoundingClientRect();
        if (e.clientX < rect.left + rect.width / 2) {
          newDropIndex = idx;
          break;
        }
      }
      setDropIndex(newDropIndex);
    };

    const handleMouseUp = () => {
      if (didDrag && dropIndex !== null && dragIndex !== dropIndex) {
        const newOrder = [...orderedDockApps];
        const [moved] = newOrder.splice(dragIndex, 1);
        newOrder.splice(dropIndex > dragIndex ? dropIndex - 1 : dropIndex, 0, moved);
        setDockOrder(newOrder);
      }
      setDragIndex(null);
      setDropIndex(null);
      setDidDrag(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragIndex, dropIndex, didDrag, orderedDockApps]);

  const minimizedWindows = Object.values(windows)
    .filter((w) => w.state === 'minimized')
    .sort((a, b) => (a.minimizedAt || 0) - (b.minimizedAt || 0));

  if (hasMaximizedWindow) return null;

  const isDragging = dragIndex !== null && didDrag;

  return (
    <>
      {/* Floating dragged icon */}
      {isDragging && (
        <div
          className="fixed z-1001 pointer-events-none"
          style={{ left: dragPos.x, top: dragPos.y, width: ICON_SIZE, height: ICON_SIZE }}
        >
          <div className="opacity-85 scale-110">
            <DockAppItem appId={orderedDockApps[dragIndex!]} />
          </div>
        </div>
      )}

      <motion.div
        className="fixed bottom-2 left-0 right-0 flex justify-center z-1000 pointer-events-none"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-2 pt-1.5 px-3 pb-1 bg-dock-bg backdrop-blur-[20px] rounded-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-auto">
          <div
            ref={containerRef}
            className="flex items-center"
            onClickCapture={(e) => {
              if (didDrag) {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
          >
            {orderedDockApps.map((appId, i) => {
              const isBeingDragged = isDragging && dragIndex === i;
              const showGapBefore = isDragging && dropIndex === i && dragIndex !== i;

              return (
                <div
                  key={appId}
                  data-dock-index={i}
                  className="flex items-center"
                  onMouseDown={(e) => handleDragStart(e, i)}
                >
                  <motion.div
                    animate={{ width: showGapBefore ? ICON_SIZE + GAP : 0 }}
                    transition={SPRING}
                  />
                  <motion.div
                    animate={{
                      width: isBeingDragged ? 0 : ICON_SIZE,
                      marginLeft: isBeingDragged ? 0 : i === 0 ? 0 : GAP,
                      opacity: isBeingDragged ? 0 : 1,
                    }}
                    transition={SPRING}
                    style={{ overflowX: 'hidden' }}
                  >
                    <div style={{ width: ICON_SIZE }}>
                      <DockAppItem appId={appId} />
                    </div>
                  </motion.div>
                </div>
              );
            })}
            <motion.div
              animate={{
                width: isDragging && dropIndex === orderedDockApps.length ? ICON_SIZE + GAP : 0,
              }}
              transition={SPRING}
            />
          </div>

          {minimizedWindows.length > 0 && <div className="w-px h-10 bg-white/20 mx-1" />}
          {minimizedWindows.map((w) => (
            <DockMinimizedPreview key={w.id} windowConfig={w} />
          ))}
        </div>
      </motion.div>
    </>
  );
};
