import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { FileSystemContextType, FSNode, FolderNode } from '../types/filesystem';
import { HOME_PATH } from '../data/filesystem';
import { resolvePath, normalizePath } from '../utils/pathUtils';
import { FileSystemContext } from './fileSystemContextDef';

export { FileSystemContext };

// Empty filesystem as default
const emptyFileSystem: FolderNode = {
  type: 'folder',
  name: '',
  children: {},
};

interface FileSystemProviderProps {
  children: ReactNode;
}

export function FileSystemProvider({ children }: FileSystemProviderProps) {
  const [currentPath, setCurrentPath] = useState(HOME_PATH);
  const [fileSystem, setFileSystem] = useState<FolderNode>(emptyFileSystem);
  const [isLoading, setIsLoading] = useState(true);

  // Load filesystem manifest on mount
  useEffect(() => {
    fetch('/filesystem-manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load filesystem manifest');
        return res.json();
      })
      .then((manifest: FolderNode) => {
        setFileSystem(manifest);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load filesystem:', err);
        setIsLoading(false);
      });
  }, []);

  const getNode = useCallback(
    (path: string): FSNode | null => {
      const normalized = normalizePath(path);

      if (normalized === '/') {
        return fileSystem;
      }

      const parts = normalized.split('/').filter(Boolean);
      let current: FSNode = fileSystem;

      for (const part of parts) {
        if (current.type !== 'folder') {
          return null;
        }
        const child: FSNode | undefined = current.children[part];
        if (!child) {
          return null;
        }
        current = child;
      }

      return current;
    },
    [fileSystem]
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

  const resolvePathFromCurrent = useCallback(
    (relativePath: string): string => {
      return resolvePath(currentPath, relativePath);
    },
    [currentPath]
  );

  const getCompletions = useCallback(
    (partial: string): string[] => {
      if (!partial) {
        // Return all items in current directory
        const items = listDirectory();
        if (!items) return [];
        return items.map((item) => item.name + (item.type === 'folder' ? '/' : ''));
      }

      // Check if we're completing a path with directories
      const lastSlash = partial.lastIndexOf('/');
      let dirPath: string;
      let prefix: string;

      if (lastSlash === -1) {
        // No slash - completing in current directory
        dirPath = currentPath;
        prefix = partial;
      } else if (lastSlash === 0) {
        // Starts with / - absolute path
        dirPath = partial.slice(0, lastSlash) || '/';
        prefix = partial.slice(lastSlash + 1);
      } else {
        // Has slash in middle
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

  const contextValue = useMemo<FileSystemContextType>(
    () => ({
      currentPath,
      root: fileSystem,
      navigate,
      listDirectory,
      getNode,
      resolvePath: resolvePathFromCurrent,
      getCompletions,
      isLoading,
    }),
    [
      currentPath,
      fileSystem,
      navigate,
      listDirectory,
      getNode,
      resolvePathFromCurrent,
      getCompletions,
      isLoading,
    ]
  );

  return <FileSystemContext.Provider value={contextValue}>{children}</FileSystemContext.Provider>;
}
