import { ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import type { ViewMode } from './FinderApp';

interface FinderToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
}

export const FinderToolbar = ({
  viewMode,
  onViewModeChange,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
}: FinderToolbarProps) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary border-b border-border-primary">
      <div className="flex items-center gap-1">
        <button
          onClick={onGoBack}
          disabled={!canGoBack}
          className={`p-1 rounded transition-colors ${
            canGoBack ? 'text-text-primary hover:bg-bg-hover' : 'text-text-muted cursor-not-allowed'
          }`}
          aria-label="Go back"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={onGoForward}
          disabled={!canGoForward}
          className={`p-1 rounded transition-colors ${
            canGoForward
              ? 'text-text-primary hover:bg-bg-hover'
              : 'text-text-muted cursor-not-allowed'
          }`}
          aria-label="Go forward"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1 bg-bg-secondary rounded p-0.5">
        <button
          onClick={() => onViewModeChange('icons')}
          className={`p-1.5 rounded transition-colors ${
            viewMode === 'icons'
              ? 'bg-bg-hover text-accent'
              : 'text-text-muted hover:text-text-primary'
          }`}
          aria-label="Icon view"
        >
          <LayoutGrid size={14} />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-1.5 rounded transition-colors ${
            viewMode === 'list'
              ? 'bg-bg-hover text-accent'
              : 'text-text-muted hover:text-text-primary'
          }`}
          aria-label="List view"
        >
          <List size={14} />
        </button>
      </div>
    </div>
  );
};
