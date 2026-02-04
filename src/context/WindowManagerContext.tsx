import { useReducer, useCallback, useMemo } from 'react';
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

function windowManagerReducer(
  state: WindowManagerState,
  action: WindowManagerAction
): WindowManagerState {
  switch (action.type) {
    case 'OPEN_APP': {
      const { windowId, appId, title, position, size } = action.payload;
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
          },
        },
        windowOrder: [...state.windowOrder, windowId],
        focusedWindowId: windowId,
      };
    }

    case 'CLOSE_WINDOW': {
      const { windowId } = action.payload;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [windowId]: removed, ...remainingWindows } = state.windows;
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

      // Recalculate z-indices
      const updatedWindows = { ...state.windows };
      newOrder.forEach((id, index) => {
        updatedWindows[id] = {
          ...updatedWindows[id],
          zIndex: BASE_Z_INDEX + index,
        };
      });

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

      // Recalculate z-indices
      const updatedWindows = { ...state.windows };
      newOrder.forEach((id, index) => {
        updatedWindows[id] = {
          ...updatedWindows[id],
          zIndex: BASE_Z_INDEX + index,
        };
      });

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

let windowIdCounter = 0;
function generateWindowId(): string {
  return `window-${++windowIdCounter}`;
}

export function WindowManagerProvider({ children, apps }: WindowManagerProviderProps) {
  const [state, dispatch] = useReducer(windowManagerReducer, initialState);

  const getApp = useCallback((appId: string) => apps.find((app) => app.id === appId), [apps]);

  const openApp = useCallback(
    (appId: string): string => {
      const app = getApp(appId);
      if (!app) {
        console.warn(`App not found: ${appId}`);
        return '';
      }

      const windowId = generateWindowId();

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
          title: app.name,
          position,
          size: app.defaultSize,
        },
      });

      return windowId;
    },
    [getApp]
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
