export type FileType = 'text' | 'markdown' | 'link' | 'image' | 'pdf' | 'component' | 'executable';

export interface FileNode {
  type: 'file';
  name: string;
  fileType: FileType;
  content?: string;
  url?: string;
  componentPath?: string;
}

export interface FolderNode {
  type: 'folder';
  name: string;
  children: Record<string, FSNode>;
}

export type FSNode = FileNode | FolderNode;

export interface FileSystemState {
  currentPath: string;
  root: FolderNode;
}

export interface FileSystemContextType extends FileSystemState {
  navigate: (path: string) => boolean;
  listDirectory: (path?: string) => FSNode[] | null;
  getNode: (path: string) => FSNode | null;
  resolvePath: (relativePath: string) => string;
  getCompletions: (partial: string) => string[];
  isLoading?: boolean;
}
