import type { FileNode } from '../types/filesystem';

type OpenAppFn = (
  appId: string,
  options?: { title?: string; data?: Record<string, unknown> }
) => void;

/**
 * Opens a file node in the appropriate app.
 * Returns a message string if the file was handled, or null if it couldn't be opened.
 */
export function openFile(node: FileNode, openApp: OpenAppFn): { message: string } | null {
  if (node.fileType === 'executable' && node.content) {
    openApp(node.content);
    return { message: `Opening ${node.name}...` };
  }

  if (node.fileType === 'markdown' || node.fileType === 'text') {
    openApp('textedit', {
      title: node.name,
      data: { fileName: node.name, fileType: node.fileType, content: node.content || '' },
    });
    return { message: `Opening ${node.name}...` };
  }

  if (node.fileType === 'pdf' && node.url) {
    openApp('preview', {
      title: node.name,
      data: { fileName: node.name, url: node.url },
    });
    return { message: `Opening ${node.name}...` };
  }

  if (node.fileType === 'link' && node.url) {
    window.open(node.url, '_blank');
    return { message: `Opening ${node.name} in new tab...` };
  }

  return null;
}
