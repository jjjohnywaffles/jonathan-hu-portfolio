import type { FSNode } from '../types/filesystem';

/** Sort filesystem nodes: folders first, then files, alphabetically within each group. */
export function sortFSNodes(items: FSNode[]): FSNode[] {
  return [...items].sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'folder' ? -1 : 1;
  });
}
