import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { FileSystemTreeContextType, FSNode, FolderNode } from '../types/filesystem';
import { normalizePath } from '../utils/pathUtils';
import { FileSystemContext } from './fileSystemContextDef';

export { FileSystemContext };

const emptyFileSystem: FolderNode = {
  type: 'folder',
  name: '',
  children: {},
};

interface FileSystemProviderProps {
  children: ReactNode;
}

export function FileSystemProvider({ children }: FileSystemProviderProps) {
  const [fileSystem, setFileSystem] = useState<FolderNode>(emptyFileSystem);
  const [isLoading, setIsLoading] = useState(true);

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

  const contextValue = useMemo<FileSystemTreeContextType>(
    () => ({
      root: fileSystem,
      getNode,
      isLoading,
    }),
    [fileSystem, getNode, isLoading]
  );

  return <FileSystemContext.Provider value={contextValue}>{children}</FileSystemContext.Provider>;
}
