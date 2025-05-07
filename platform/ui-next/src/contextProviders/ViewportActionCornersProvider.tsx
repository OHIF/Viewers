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
  clear: (viewportId: string) => void;
  getAlignAndSide: (location: ViewportActionCornersLocations) => AlignAndSide;
  setMenuEnabled: (viewportId: string, itemId: string, enabledStatus: boolean) => void;
  isEnabled: (viewportId: string, itemId: string) => boolean;
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

        const componentInfo = { id, component, indexPriority };

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

      case 'SET_ENABLED': {
        const { viewportId, itemId, enabledStatus } = action.payload;
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
            const updatedItem = { ...components[itemIndex], enabled: enabledStatus };
            components[itemIndex] = updatedItem;
            viewportCopy[location] = components;
          }
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

  const clear = useCallback(
    (viewportId: string) => {
      dispatch({
        type: 'CLEAR',
        payload: viewportId,
      });
    },
    [dispatch]
  );

  const setMenuEnabled = useCallback(
    (viewportId: string, itemId: string, enabledStatus: boolean) => {
      dispatch({
        type: 'SET_ENABLED',
        payload: { viewportId, itemId, enabledStatus },
      });
    },
    [dispatch]
  );

  const isEnabled = useCallback(
    (viewportId: string, itemId: string) => {
      if (!state.viewports[viewportId]) {
        return true; // Default to enabled if viewport doesn't exist
      }

      for (const locationKey in state.viewports[viewportId]) {
        const location = Number(locationKey) as ViewportActionCornersLocations;
        const components = state.viewports[viewportId][location];
        const item = components.find(item => item.id === itemId);

        if (item && item.enabled === false) {
          return false;
        }
      }

      return true; // Default to enabled if item not found or enabled is undefined
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
      clear,
      getAlignAndSide,
      setMenuEnabled,
      isEnabled,
    };
  }, [getState, addComponent, addComponents, clear, getAlignAndSide, setMenuEnabled, isEnabled]);

  useEffect(() => {
    if (service && service.setServiceImplementation) {
      const implementation = {
        getState,
        addComponent,
        addComponents,
        clear,
        setMenuEnabled,
        isEnabled,
      };

      service.setServiceImplementation(implementation);
    }
  }, [service, getState, addComponent, addComponents, clear, setMenuEnabled, isEnabled]);

  return (
    <ViewportActionCornersContext.Provider value={[state, api]}>
      {children}
    </ViewportActionCornersContext.Provider>
  );
}

// Custom hook to use the ViewportActionCorners context
export const useViewportActionCorners = () => useContext(ViewportActionCornersContext);
