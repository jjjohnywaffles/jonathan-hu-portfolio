import type { FSNode } from '../../types/filesystem';

interface DirectoryListingProps {
  items: FSNode[];
}

export const DirectoryListing = ({ items }: DirectoryListingProps) => {
  if (items.length === 0) {
    return null;
  }

  // Sort: folders first, then files, alphabetically within each group
  const sorted = [...items].sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'folder' ? -1 : 1;
  });

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
