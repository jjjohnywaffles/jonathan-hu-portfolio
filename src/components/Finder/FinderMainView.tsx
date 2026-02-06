import type { FSNode } from '../../types/filesystem';
import { FinderItem } from './FinderItem';
import { sortFSNodes } from '../../utils/fsUtils';
import type { ViewMode } from './FinderApp';

interface FinderMainViewProps {
  items: FSNode[];
  viewMode: ViewMode;
  selectedItem: string | null;
  onItemClick: (item: FSNode) => void;
  onItemDoubleClick: (item: FSNode) => void;
}

export const FinderMainView = ({
  items,
  viewMode,
  selectedItem,
  onItemClick,
  onItemDoubleClick,
}: FinderMainViewProps) => {
  const sortedItems = sortFSNodes(items);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <span>This folder is empty</span>
      </div>
    );
  }

  if (viewMode === 'icons') {
    return (
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {sortedItems.map((item) => (
            <FinderItem
              key={item.name}
              item={item}
              viewMode={viewMode}
              isSelected={selectedItem === item.name}
              onClick={() => onItemClick(item)}
              onDoubleClick={() => onItemDoubleClick(item)}
            />
          ))}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full">
        <thead className="bg-bg-tertiary sticky top-0">
          <tr className="text-left text-xs text-text-muted border-b border-border-primary">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium w-32">Kind</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <FinderItem
              key={item.name}
              item={item}
              viewMode={viewMode}
              isSelected={selectedItem === item.name}
              onClick={() => onItemClick(item)}
              onDoubleClick={() => onItemDoubleClick(item)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
