import { HOME_PATH } from '../data/filesystem';

export const isAbsolutePath = (path: string): boolean => {
  return path.startsWith('/');
};

export const normalizePath = (path: string): string => {
  // Handle empty or root
  if (!path || path === '/') return '/';

  // Replace multiple slashes with single
  let normalized = path.replace(/\/+/g, '/');

  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
};

export const getParentPath = (path: string): string => {
  const normalized = normalizePath(path);
  if (normalized === '/') return '/';

  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === 0) return '/';
  return normalized.slice(0, lastSlash);
};

export const getBasename = (path: string): string => {
  const normalized = normalizePath(path);
  if (normalized === '/') return '/';

  const lastSlash = normalized.lastIndexOf('/');
  return normalized.slice(lastSlash + 1);
};

export const resolvePath = (currentPath: string, relativePath: string): string => {
  // Handle empty path
  if (!relativePath || relativePath === '.') {
    return normalizePath(currentPath);
  }

  // Handle home shortcut
  if (relativePath === '~') {
    return HOME_PATH;
  }

  if (relativePath.startsWith('~/')) {
    return normalizePath(HOME_PATH + '/' + relativePath.slice(2));
  }

  // Handle absolute path
  if (isAbsolutePath(relativePath)) {
    return normalizePath(relativePath);
  }

  // Handle relative path
  const basePath = normalizePath(currentPath);
  const parts = basePath === '/' ? [''] : basePath.split('/');
  const relativeParts = relativePath.split('/');

  for (const part of relativeParts) {
    if (part === '' || part === '.') {
      continue;
    } else if (part === '..') {
      if (parts.length > 1) {
        parts.pop();
      }
    } else {
      parts.push(part);
    }
  }

  const result = parts.join('/');
  return result === '' ? '/' : result;
};

export const joinPath = (...parts: string[]): string => {
  return normalizePath(parts.join('/'));
};

export const getDisplayPath = (path: string): string => {
  const normalized = normalizePath(path);

  // Show ~ for home directory
  if (normalized === HOME_PATH) {
    return '~';
  }

  // Show ~/... for paths under home
  if (normalized.startsWith(HOME_PATH + '/')) {
    return '~' + normalized.slice(HOME_PATH.length);
  }

  return normalized;
};
