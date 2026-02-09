import { createContext } from 'react';
import type { FileSystemTreeContextType } from '../types/filesystem';

export const FileSystemContext = createContext<FileSystemTreeContextType | null>(null);
