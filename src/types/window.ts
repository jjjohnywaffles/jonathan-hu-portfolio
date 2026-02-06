import type { ComponentType, ReactNode } from 'react';

export type WindowState = 'normal' | 'minimized' | 'maximized';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WindowConfig {
  id: string;
  appId: string;
  title: string;
  state: WindowState;
  position: Position;
  size: Size;
  zIndex: number;
  isOpen: boolean;
  minimizedAt?: number; // timestamp for ordering minimized windows
  data?: Record<string, unknown>;
}

export interface TextEditData {
  fileName: string;
  fileType: string;
  content: string;
}

export interface PreviewData {
  fileName: string;
  url: string;
}

export interface AppComponentProps {
  windowId: string;
  isMaximized: boolean;
  isFocused: boolean;
  data?: Record<string, unknown>;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: ReactNode;
  component: ComponentType<AppComponentProps>;
  defaultSize: Size;
  defaultPosition?: Position;
}

export interface WindowManagerState {
  windows: Record<string, WindowConfig>;
  windowOrder: string[]; // IDs ordered by z-index (last = topmost)
  focusedWindowId: string | null;
}

export type WindowManagerAction =
  | {
      type: 'OPEN_APP';
      payload: {
        appId: string;
        windowId: string;
        title: string;
        position: Position;
        size: Size;
        data?: Record<string, unknown>;
      };
    }
  | { type: 'CLOSE_WINDOW'; payload: { windowId: string } }
  | { type: 'MINIMIZE_WINDOW'; payload: { windowId: string } }
  | { type: 'MAXIMIZE_WINDOW'; payload: { windowId: string } }
  | { type: 'RESTORE_WINDOW'; payload: { windowId: string } }
  | { type: 'FOCUS_WINDOW'; payload: { windowId: string } }
  | { type: 'UPDATE_POSITION'; payload: { windowId: string; position: Position } }
  | { type: 'UPDATE_SIZE'; payload: { windowId: string; size: Size } };

export interface WindowManagerActions {
  openApp: (appId: string, options?: { title?: string; data?: Record<string, unknown> }) => string; // returns windowId
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updatePosition: (windowId: string, position: Position) => void;
  updateSize: (windowId: string, size: Size) => void;
}

export interface WindowManagerContextType extends WindowManagerState, WindowManagerActions {
  getApp: (appId: string) => AppDefinition | undefined;
  apps: AppDefinition[];
  hasMaximizedWindow: boolean;
}
