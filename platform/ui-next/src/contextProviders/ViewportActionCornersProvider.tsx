import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
  useMemo,
} from 'react';
import { ViewportActionCornersLocations } from '../components/Viewport/ViewportActionCorners';
import { ActionComponentInfo, AlignAndSide } from '../types';

// Define the default state
const DEFAULT_STATE = {
  viewports: {} as Record<string, Record<ViewportActionCornersLocations, ActionComponentInfo[]>>,
};

interface ViewportActionCornersApi {
  getState: () => typeof DEFAULT_STATE;
  addComponent: (component: ActionComponentInfo) => void;
  addComponents: (components: Array<ActionComponentInfo>) => void;
  clearViewport: (viewportId: string) => void;
  getAlignAndSide: (location: ViewportActionCornersLocations) => AlignAndSide;
  lockItem: (viewportId: string, itemId: string) => void;
  unlockItem: (viewportId: string, itemId: string) => void;
  toggleLock: (viewportId: string, itemId: string) => void;
  isItemLocked: (viewportId: string, itemId: string) => boolean;
  showItem: (viewportId: string, itemId: string) => void;
  hideItem: (viewportId: string, itemId: string) => void;
  toggleVisibility: (viewportId: string, itemId: string) => void;
  isItemVisible: (viewportId: string, itemId: string) => boolean;
  openItem: (viewportId: string, itemId: string) => void;
  closeItem: (viewportId: string, itemId: string) => void;
  closeAllItems: (viewportId: string) => void;
  isItemOpen: (viewportId: string, itemId: string) => boolean;
}

export const ViewportActionCornersContext = createContext<
  [typeof DEFAULT_STATE, ViewportActionCornersApi]
>([DEFAULT_STATE, {} as ViewportActionCornersApi]);

interface ViewportActionCornersProviderProps {
  children: ReactNode;
  service: any;
}

export function ViewportActionCornersProvider({
  children,
  service,
}: ViewportActionCornersProviderProps) {
  const viewportActionCornersReducer = (state = DEFAULT_STATE, action) => {
    switch (action.type) {
      case 'ADD_COMPONENT': {
        const { viewportId, id, component, location, indexPriority = 0 } = action.payload;

        const newState = { ...state };

        if (!newState.viewports[viewportId]) {
          newState.viewports[viewportId] = {
            [ViewportActionCornersLocations.topLeft]: [],
            [ViewportActionCornersLocations.topRight]: [],
            [ViewportActionCornersLocations.bottomLeft]: [],
            [ViewportActionCornersLocations.bottomRight]: [],
          };
        }

        if (!newState.viewports[viewportId][location]) {
          newState.viewports[viewportId][location] = [];
        }

        const componentInfo = {
          id,
          component,
          indexPriority,
          isOpen: false,
          isVisible: true,
          isLocked: false,
        };

        const components = [...newState.viewports[viewportId][location]];
        const index = components.findIndex(item => item.indexPriority > indexPriority);

        if (index === -1) {
          components.push(componentInfo);
        } else {
          components.splice(index, 0, componentInfo);
        }

        newState.viewports[viewportId][location] = components;

        return newState;
      }

      case 'ADD_COMPONENTS': {
        const components = action.payload;
        let newState = { ...state };

        components.forEach(component => {
          newState = viewportActionCornersReducer(newState, {
            type: 'ADD_COMPONENT',
            payload: component,
          });
        });

        return newState;
      }

      case 'CLEAR': {
        const viewportId = action.payload;
        const newState = { ...state };

        if (newState.viewports[viewportId]) {
          const newViewports = { ...newState.viewports };
          delete newViewports[viewportId];
          newState.viewports = newViewports;
        }

        return newState;
      }

      case 'SET_LOCKED': {
        const { viewportId, itemId, lockedStatus } = action.payload;
        const newState = { ...state };

        if (!newState.viewports[viewportId]) {
          return state;
        }

        const viewportCopy = { ...newState.viewports[viewportId] };

        Object.keys(viewportCopy).forEach(locationKey => {
          const location = Number(locationKey) as ViewportActionCornersLocations;
          const components = [...viewportCopy[location]];

          const itemIndex = components.findIndex(item => item.id === itemId);
          if (itemIndex !== -1) {
            const updatedItem = { ...components[itemIndex], isLocked: lockedStatus };
            components[itemIndex] = updatedItem;
            viewportCopy[location] = components;
          }
        });

        newState.viewports[viewportId] = viewportCopy;
        return newState;
      }

      case 'SET_VISIBLE': {
        const { viewportId, itemId, visibleStatus } = action.payload;
        const newState = { ...state };

        if (!newState.viewports[viewportId]) {
          return state;
        }

        const viewportCopy = { ...newState.viewports[viewportId] };

        Object.keys(viewportCopy).forEach(locationKey => {
          const location = Number(locationKey) as ViewportActionCornersLocations;
          const components = [...viewportCopy[location]];

          const itemIndex = components.findIndex(item => item.id === itemId);
          if (itemIndex !== -1) {
            const updatedItem = { ...components[itemIndex], isVisible: visibleStatus };
            components[itemIndex] = updatedItem;
            viewportCopy[location] = components;
          }
        });

        newState.viewports[viewportId] = viewportCopy;
        return newState;
      }

      case 'OPEN_ITEM': {
        const { viewportId, itemId } = action.payload;
        const newState = { ...state };

        if (!newState.viewports[viewportId]) {
          return state;
        }

        const viewportCopy = { ...newState.viewports[viewportId] };

        // Update isOpen flag for the component with matching id in any location
        Object.keys(viewportCopy).forEach(locationKey => {
          const location = Number(locationKey) as ViewportActionCornersLocations;
          const components = [...viewportCopy[location]];

          const itemIndex = components.findIndex(item => item.id === itemId);
          if (itemIndex !== -1) {
            const updatedItem = { ...components[itemIndex], isOpen: true };
            components[itemIndex] = updatedItem;
            viewportCopy[location] = components;
          }
        });

        newState.viewports[viewportId] = viewportCopy;
        return newState;
      }

      case 'CLOSE_ITEM': {
        const { viewportId, itemId } = action.payload;
        const newState = { ...state };

        if (!newState.viewports[viewportId]) {
          return state;
        }

        const viewportCopy = { ...newState.viewports[viewportId] };

        // Update isOpen flag for the component with matching id in any location
        Object.keys(viewportCopy).forEach(locationKey => {
          const location = Number(locationKey) as ViewportActionCornersLocations;
          const components = [...viewportCopy[location]];

          const itemIndex = components.findIndex(item => item.id === itemId);
          if (itemIndex !== -1) {
            const updatedItem = { ...components[itemIndex], isOpen: false };
            components[itemIndex] = updatedItem;
            viewportCopy[location] = components;
          }
        });

        newState.viewports[viewportId] = viewportCopy;
        return newState;
      }

      case 'CLOSE_ALL_ITEMS': {
        const viewportId = action.payload;
        const newState = { ...state };

        if (!newState.viewports[viewportId]) {
          return state;
        }

        const viewportCopy = { ...newState.viewports[viewportId] };

        // Set isOpen to false for all components in the viewport
        Object.keys(viewportCopy).forEach(locationKey => {
          const location = Number(locationKey) as ViewportActionCornersLocations;
          const components = viewportCopy[location].map(item => ({
            ...item,
            isOpen: false,
          }));

          viewportCopy[location] = components;
        });

        newState.viewports[viewportId] = viewportCopy;
        return newState;
      }

      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(viewportActionCornersReducer, DEFAULT_STATE);

  const getState = useCallback(() => {
    return state;
  }, [state]);

  const addComponent = useCallback(
    (component: ActionComponentInfo) => {
      dispatch({
        type: 'ADD_COMPONENT',
        payload: component,
      });
    },
    [dispatch]
  );

  const addComponents = useCallback(
    (components: Array<ActionComponentInfo>) => {
      dispatch({
        type: 'ADD_COMPONENTS',
        payload: components,
      });
    },
    [dispatch]
  );

  const clearViewport = useCallback(
    (viewportId: string) => {
      dispatch({
        type: 'CLEAR',
        payload: viewportId,
      });
    },
    [dispatch]
  );

  const lockItem = useCallback(
    (viewportId: string, itemId: string) => {
      dispatch({
        type: 'SET_LOCKED',
        payload: { viewportId, itemId, lockedStatus: true },
      });
    },
    [dispatch]
  );

  const unlockItem = useCallback(
    (viewportId: string, itemId: string) => {
      dispatch({
        type: 'SET_LOCKED',
        payload: { viewportId, itemId, lockedStatus: false },
      });
    },
    [dispatch]
  );

  const toggleLock = useCallback(
    (viewportId: string, itemId: string) => {
      const currentLocked = isItemLocked(viewportId, itemId);
      dispatch({
        type: 'SET_LOCKED',
        payload: { viewportId, itemId, lockedStatus: !currentLocked },
      });
    },
    [dispatch]
  );

  const isItemLocked = useCallback(
    (viewportId: string, itemId: string) => {
      if (!state.viewports[viewportId]) {
        return false; // Default to unlocked if viewport doesn't exist
      }

      for (const locationKey in state.viewports[viewportId]) {
        const location = Number(locationKey) as ViewportActionCornersLocations;
        const components = state.viewports[viewportId][location];
        const item = components.find(item => item.id === itemId);

        if (item && item.isLocked === true) {
          return true;
        }
      }

      return false; // Default to unlocked if item not found or isLocked is undefined
    },
    [state.viewports]
  );

  const showItem = useCallback(
    (viewportId: string, itemId: string) => {
      dispatch({
        type: 'SET_VISIBLE',
        payload: { viewportId, itemId, visibleStatus: true },
      });
    },
    [dispatch]
  );

  const hideItem = useCallback(
    (viewportId: string, itemId: string) => {
      dispatch({
        type: 'SET_VISIBLE',
        payload: { viewportId, itemId, visibleStatus: false },
      });
    },
    [dispatch]
  );

  const toggleVisibility = useCallback(
    (viewportId: string, itemId: string) => {
      const currentVisible = isItemVisible(viewportId, itemId);
      dispatch({
        type: 'SET_VISIBLE',
        payload: { viewportId, itemId, visibleStatus: !currentVisible },
      });
    },
    [dispatch]
  );

  const isItemVisible = useCallback(
    (viewportId: string, itemId: string) => {
      if (!state.viewports[viewportId]) {
        return true; // Default to visible if viewport doesn't exist
      }

      for (const locationKey in state.viewports[viewportId]) {
        const location = Number(locationKey) as ViewportActionCornersLocations;
        const components = state.viewports[viewportId][location];
        const item = components.find(item => item.id === itemId);

        if (item && item.isVisible === false) {
          return false;
        }
      }

      return true; // Default to visible if item not found or isVisible is undefined
    },
    [state.viewports]
  );

  const openItem = useCallback(
    (viewportId: string, itemId: string) => {
      dispatch({
        type: 'OPEN_ITEM',
        payload: { viewportId, itemId },
      });
    },
    [dispatch]
  );

  const closeItem = useCallback(
    (viewportId: string, itemId: string) => {
      dispatch({
        type: 'CLOSE_ITEM',
        payload: { viewportId, itemId },
      });
    },
    [dispatch]
  );

  const closeAllItems = useCallback(
    (viewportId: string) => {
      dispatch({
        type: 'CLOSE_ALL_ITEMS',
        payload: viewportId,
      });
    },
    [dispatch]
  );

  const isItemOpen = useCallback(
    (viewportId: string, itemId: string) => {
      if (!state.viewports[viewportId]) {
        return false;
      }

      for (const locationKey in state.viewports[viewportId]) {
        const location = Number(locationKey) as ViewportActionCornersLocations;
        const components = state.viewports[viewportId][location];
        const item = components.find(item => item.id === itemId);

        if (item && item.isOpen === true) {
          return true;
        }
      }

      return false;
    },
    [state.viewports]
  );

  const getAlignAndSide = useCallback(
    (location: ViewportActionCornersLocations) => {
      return service.getAlignAndSide(location);
    },
    [service]
  );

  const api = useMemo(() => {
    return {
      getState,
      addComponent,
      addComponents,
      clearViewport,
      getAlignAndSide,
      lockItem,
      unlockItem,
      toggleLock,
      isItemLocked,
      showItem,
      hideItem,
      toggleVisibility,
      isItemVisible,
      openItem,
      closeItem,
      closeAllItems,
      isItemOpen,
    };
  }, [
    getState,
    addComponent,
    addComponents,
    clearViewport,
    getAlignAndSide,
    lockItem,
    unlockItem,
    toggleLock,
    isItemLocked,
    showItem,
    hideItem,
    toggleVisibility,
    isItemVisible,
    openItem,
    closeItem,
    closeAllItems,
    isItemOpen,
  ]);

  useEffect(() => {
    if (service && service.setServiceImplementation) {
      const implementation = {
        getState,
        addComponent,
        addComponents,
        clearViewport,
        lockItem,
        unlockItem,
        toggleLock,
        isItemLocked,
        showItem,
        hideItem,
        toggleVisibility,
        isItemVisible,
        openItem,
        closeItem,
        closeAllItems,
        isItemOpen,
      };

      service.setServiceImplementation(implementation);
    }
  }, [
    service,
    getState,
    addComponent,
    addComponents,
    clearViewport,
    lockItem,
    unlockItem,
    toggleLock,
    isItemLocked,
    showItem,
    hideItem,
    toggleVisibility,
    isItemVisible,
    openItem,
    closeItem,
    closeAllItems,
    isItemOpen,
  ]);

  return (
    <ViewportActionCornersContext.Provider value={[state, api]}>
      {children}
    </ViewportActionCornersContext.Provider>
  );
}

// Custom hook to use the ViewportActionCorners context
export const useViewportActionCorners = () => useContext(ViewportActionCornersContext);
