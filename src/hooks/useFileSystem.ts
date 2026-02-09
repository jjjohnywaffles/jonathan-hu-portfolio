import { useContext } from 'react';
import { FileSystemContext } from '../context/fileSystemContextDef';
import type { FileSystemTreeContextType } from '../types/filesystem';

export function useFileSystem(): FileSystemTreeContextType {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
}
