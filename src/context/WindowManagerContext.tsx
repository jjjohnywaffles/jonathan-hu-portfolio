import { useReducer, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  WindowManagerState,
  WindowManagerAction,
  WindowManagerContextType,
  AppDefinition,
  Position,
  Size,
} from '../types/window';
import { WindowManagerContext } from './windowManagerContextDef';

export { WindowManagerContext };

const BASE_Z_INDEX = 100;

// Helper to recalculate z-indices based on window order
function recalculateZIndices(
  windows: WindowManagerState['windows'],
  order: string[]
): WindowManagerState['windows'] {
  const updated = { ...windows };
  order.forEach((id, index) => {
    updated[id] = {
      ...updated[id],
      zIndex: BASE_Z_INDEX + index,
    };
  });
  return updated;
}

function windowManagerReducer(
  state: WindowManagerState,
  action: WindowManagerAction
): WindowManagerState {
  switch (action.type) {
    case 'OPEN_APP': {
      const { windowId, appId, title, position, size, data } = action.payload;
      const newZIndex = BASE_Z_INDEX + state.windowOrder.length;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            id: windowId,
            appId,
            title,
            state: 'normal',
            position,
            size,
            zIndex: newZIndex,
            isOpen: true,
            data,
          },
        },
        windowOrder: [...state.windowOrder, windowId],
        focusedWindowId: windowId,
      };
    }

    case 'CLOSE_WINDOW': {
      const { windowId } = action.payload;
      const remainingWindows = Object.fromEntries(
        Object.entries(state.windows).filter(([id]) => id !== windowId)
      );
      const newOrder = state.windowOrder.filter((id) => id !== windowId);

      return {
        ...state,
        windows: remainingWindows,
        windowOrder: newOrder,
        focusedWindowId:
          state.focusedWindowId === windowId
            ? newOrder[newOrder.length - 1] || null
            : state.focusedWindowId,
      };
    }

    case 'MINIMIZE_WINDOW': {
      const { windowId } = action.payload;
      const window = state.windows[windowId];
      if (!window) return state;

      const newOrder = state.windowOrder.filter((id) => id !== windowId);

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            state: 'minimized',
            minimizedAt: Date.now(),
          },
        },
        windowOrder: newOrder,
        focusedWindowId:
          state.focusedWindowId === windowId
            ? newOrder[newOrder.length - 1] || null
            : state.focusedWindowId,
      };
    }

    case 'MAXIMIZE_WINDOW': {
      const { windowId } = action.payload;
      const window = state.windows[windowId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            state: 'maximized',
          },
        },
        focusedWindowId: windowId,
      };
    }

    case 'RESTORE_WINDOW': {
      const { windowId } = action.payload;
      const window = state.windows[windowId];
      if (!window) return state;

      // If restoring from minimized, add back to window order
      const wasMinimized = window.state === 'minimized';
      const newOrder = wasMinimized ? [...state.windowOrder, windowId] : state.windowOrder;
      const updatedWindows = recalculateZIndices(state.windows, newOrder);

      return {
        ...state,
        windows: {
          ...updatedWindows,
          [windowId]: {
            ...updatedWindows[windowId],
            state: 'normal',
            minimizedAt: undefined,
          },
        },
        windowOrder: newOrder,
        focusedWindowId: windowId,
      };
    }

    case 'FOCUS_WINDOW': {
      const { windowId } = action.payload;
      const window = state.windows[windowId];
      if (!window || window.state === 'minimized') return state;

      // Move to end of order (topmost)
      const newOrder = [...state.windowOrder.filter((id) => id !== windowId), windowId];
      const updatedWindows = recalculateZIndices(state.windows, newOrder);

      return {
        ...state,
        windows: updatedWindows,
        windowOrder: newOrder,
        focusedWindowId: windowId,
      };
    }

    case 'UPDATE_POSITION': {
      const { windowId, position } = action.payload;
      const window = state.windows[windowId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            position,
          },
        },
      };
    }

    case 'UPDATE_SIZE': {
      const { windowId, size } = action.payload;
      const window = state.windows[windowId];
      if (!window) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [windowId]: {
            ...window,
            size,
          },
        },
      };
    }

    default:
      return state;
  }
}

const initialState: WindowManagerState = {
  windows: {},
  windowOrder: [],
  focusedWindowId: null,
};

interface WindowManagerProviderProps {
  children: ReactNode;
  apps: AppDefinition[];
}

export function WindowManagerProvider({ children, apps }: WindowManagerProviderProps) {
  const [state, dispatch] = useReducer(windowManagerReducer, initialState);
  const windowIdCounter = useRef(0);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getApp = useCallback((appId: string) => apps.find((app) => app.id === appId), [apps]);

  // Apps that should only have one window (focus existing instead of opening duplicate)
  const SINGLETON_APPS = useMemo(() => new Set(['terminal', 'finder']), []);

  const openApp = useCallback(
    (appId: string, options?: { title?: string; data?: Record<string, unknown> }): string => {
      const app = getApp(appId);
      if (!app) {
        console.warn(`App not found: ${appId}`);
        return '';
      }

      // For singleton apps without custom data, focus existing window instead of opening a new one
      if (SINGLETON_APPS.has(appId) && !options?.data) {
        const currentWindows = stateRef.current.windows;
        const existing = Object.values(currentWindows).find((w) => w.appId === appId);
        if (existing) {
          if (existing.state === 'minimized') {
            dispatch({ type: 'RESTORE_WINDOW', payload: { windowId: existing.id } });
          } else {
            dispatch({ type: 'FOCUS_WINDOW', payload: { windowId: existing.id } });
          }
          return existing.id;
        }
      }

      const windowId = `window-${++windowIdCounter.current}`;

      // Center the window if no default position is specified
      const position = app.defaultPosition || {
        x: Math.max(0, (window.innerWidth - app.defaultSize.width) / 2),
        y: Math.max(0, (window.innerHeight - app.defaultSize.height) / 2 - 35), // Account for dock
      };

      dispatch({
        type: 'OPEN_APP',
        payload: {
          appId,
          windowId,
          title: options?.title || app.name,
          position,
          size: app.defaultSize,
          data: options?.data,
        },
      });

      return windowId;
    },
    [getApp, SINGLETON_APPS]
  );

  const closeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'CLOSE_WINDOW', payload: { windowId } });
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'MINIMIZE_WINDOW', payload: { windowId } });
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'MAXIMIZE_WINDOW', payload: { windowId } });
  }, []);

  const restoreWindow = useCallback((windowId: string) => {
    dispatch({ type: 'RESTORE_WINDOW', payload: { windowId } });
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    dispatch({ type: 'FOCUS_WINDOW', payload: { windowId } });
  }, []);

  const updatePosition = useCallback((windowId: string, position: Position) => {
    dispatch({ type: 'UPDATE_POSITION', payload: { windowId, position } });
  }, []);

  const updateSize = useCallback((windowId: string, size: Size) => {
    dispatch({ type: 'UPDATE_SIZE', payload: { windowId, size } });
  }, []);

  const contextValue = useMemo<WindowManagerContextType>(
    () => ({
      ...state,
      apps,
      getApp,
      openApp,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      focusWindow,
      updatePosition,
      updateSize,
      hasMaximizedWindow: Object.values(state.windows).some((w) => w.state === 'maximized'),
    }),
    [
      state,
      apps,
      getApp,
      openApp,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      focusWindow,
      updatePosition,
      updateSize,
    ]
  );

  return (
    <WindowManagerContext.Provider value={contextValue}>{children}</WindowManagerContext.Provider>
  );
}

// useWindowManager hook is exported from src/hooks/useWindowManager.ts
