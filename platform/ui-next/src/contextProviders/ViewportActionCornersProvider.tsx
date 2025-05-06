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
  components: {} as Record<string, Record<ViewportActionCornersLocations, ActionComponentInfo[]>>,
};

interface ViewportActionCornersApi {
  getState: () => typeof DEFAULT_STATE;
  addComponent: (component: ActionComponentInfo) => void;
  addComponents: (components: Array<ActionComponentInfo>) => void;
  clear: (viewportId: string) => void;
  getAlignAndSide: (location: ViewportActionCornersLocations) => AlignAndSide;
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

        if (!newState.components[viewportId]) {
          newState.components[viewportId] = {
            [ViewportActionCornersLocations.topLeft]: [],
            [ViewportActionCornersLocations.topRight]: [],
            [ViewportActionCornersLocations.bottomLeft]: [],
            [ViewportActionCornersLocations.bottomRight]: [],
          };
        }

        if (!newState.components[viewportId][location]) {
          newState.components[viewportId][location] = [];
        }

        const componentInfo = { id, component, indexPriority };

        const components = [...newState.components[viewportId][location]];
        const index = components.findIndex(item => item.indexPriority > indexPriority);

        if (index === -1) {
          components.push(componentInfo);
        } else {
          components.splice(index, 0, componentInfo);
        }

        newState.components[viewportId][location] = components;

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

        if (newState.components[viewportId]) {
          const newComponents = { ...newState.components };
          delete newComponents[viewportId];
          newState.components = newComponents;
        }

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
    };
  }, [getState, addComponent, addComponents, clear, getAlignAndSide]);

  useEffect(() => {
    if (service && service.setServiceImplementation) {
      const implementation = {
        getState,
        addComponent,
        addComponents,
        clear,
      };

      service.setServiceImplementation(implementation);
    }
  }, [service]);

  return (
    <ViewportActionCornersContext.Provider value={[state, api]}>
      {children}
    </ViewportActionCornersContext.Provider>
  );
}

// Custom hook to use the ViewportActionCorners context
export const useViewportActionCorners = () => useContext(ViewportActionCornersContext);
