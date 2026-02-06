import type { FSNode } from '../../types/filesystem';
import { sortFSNodes } from '../../utils/fsUtils';

interface DirectoryListingProps {
  items: FSNode[];
}

export const DirectoryListing = ({ items }: DirectoryListingProps) => {
  if (items.length === 0) {
    return null;
  }

  const sorted = sortFSNodes(items);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-1">
      {sorted.map((item) => (
        <span
          key={item.name}
          className={
            item.type === 'folder' ? 'text-accent-secondary font-medium' : 'text-text-primary'
          }
        >
          {item.name}
          {item.type === 'folder' && '/'}
        </span>
      ))}
    </div>
  );
};
