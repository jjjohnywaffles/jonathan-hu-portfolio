import { useState, useCallback, useMemo, useContext } from 'react';
import { FileSystemContext } from '../context/fileSystemContextDef';
import { HOME_PATH } from '../data/filesystem';
import { resolvePath } from '../utils/pathUtils';
import type { LocalFileSystem, FSNode } from '../types/filesystem';

export function useLocalFileSystem(): LocalFileSystem {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useLocalFileSystem must be used within a FileSystemProvider');
  }
  const { root, getNode, isLoading } = context;
  const [currentPath, setCurrentPath] = useState(HOME_PATH);

  const navigate = useCallback(
    (path: string): boolean => {
      const resolved = resolvePath(currentPath, path);
      const node = getNode(resolved);

      if (!node || node.type !== 'folder') {
        return false;
      }

      setCurrentPath(resolved);
      return true;
    },
    [currentPath, getNode]
  );

  const listDirectory = useCallback(
    (path?: string): FSNode[] | null => {
      const targetPath = path ? resolvePath(currentPath, path) : currentPath;
      const node = getNode(targetPath);

      if (!node || node.type !== 'folder') {
        return null;
      }

      return Object.values(node.children);
    },
    [currentPath, getNode]
  );

  const resolvePathFromCurrent = useCallback(
    (relativePath: string): string => {
      return resolvePath(currentPath, relativePath);
    },
    [currentPath]
  );

  const getCompletions = useCallback(
    (partial: string): string[] => {
      if (!partial) {
        const items = listDirectory();
        if (!items) return [];
        return items.map((item) => item.name + (item.type === 'folder' ? '/' : ''));
      }

      const lastSlash = partial.lastIndexOf('/');
      let dirPath: string;
      let prefix: string;

      if (lastSlash === -1) {
        dirPath = currentPath;
        prefix = partial;
      } else if (lastSlash === 0) {
        dirPath = partial.slice(0, lastSlash) || '/';
        prefix = partial.slice(lastSlash + 1);
      } else {
        dirPath = resolvePath(currentPath, partial.slice(0, lastSlash));
        prefix = partial.slice(lastSlash + 1);
      }

      const node = getNode(dirPath);
      if (!node || node.type !== 'folder') {
        return [];
      }

      const matches = Object.values(node.children)
        .filter((child) => child.name.toLowerCase().startsWith(prefix.toLowerCase()))
        .map((child) => {
          const suffix = child.type === 'folder' ? '/' : '';
          if (lastSlash === -1) {
            return child.name + suffix;
          } else {
            return partial.slice(0, lastSlash + 1) + child.name + suffix;
          }
        });

      return matches;
    },
    [currentPath, listDirectory, getNode]
  );

  return useMemo<LocalFileSystem>(
    () => ({
      currentPath,
      root,
      navigate,
      listDirectory,
      getNode,
      resolvePath: resolvePathFromCurrent,
      getCompletions,
      isLoading,
    }),
    [
      currentPath,
      root,
      navigate,
      listDirectory,
      getNode,
      resolvePathFromCurrent,
      getCompletions,
      isLoading,
    ]
  );
}
