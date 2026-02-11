import { ChevronRight } from 'lucide-react';

interface FinderBreadcrumbProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const FinderBreadcrumb = ({ currentPath, onNavigate }: FinderBreadcrumbProps) => {
  // Split path into segments
  const segments = currentPath.split('/').filter(Boolean);

  // Build paths for each segment
  const pathSegments = segments.map((segment, index) => ({
    name: segment,
    path: '/' + segments.slice(0, index + 1).join('/'),
  }));

  // Add root
  const allSegments = [{ name: '/', path: '/' }, ...pathSegments];

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 bg-bg-secondary border-b border-border-primary overflow-x-auto">
      {allSegments.map((segment, index) => (
        <div key={segment.path} className="flex items-center gap-0.5">
          {index > 0 && <ChevronRight size={12} className="text-text-muted shrink-0" />}
          <button
            onClick={() => onNavigate(segment.path)}
            className={`px-1.5 py-0.5 text-sm rounded transition-colors whitespace-nowrap ${
              index === allSegments.length - 1
                ? 'text-text-primary font-medium'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            {segment.name}
          </button>
        </div>
      ))}
    </div>
  );
};
