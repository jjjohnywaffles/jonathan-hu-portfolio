import { createContext } from 'react';
import type { FileSystemContextType } from '../types/filesystem';

export const FileSystemContext = createContext<FileSystemContextType | null>(null);
