import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';

import { Types, ViewportActionCornersLocations } from '@ohif/ui';
import ViewportActionCornersService, {
  ActionComponentInfo,
} from '../services/ViewportActionCornersService/ViewportActionCornersService';

interface StateComponentInfo extends Types.ViewportActionCornersComponentInfo {
  indexPriority: number;
}

type State = Record<string, Record<ViewportActionCornersLocations, Array<StateComponentInfo>>>;

const DEFAULT_STATE: State = {
  // default here is the viewportId of the default viewport
  default: {
    [ViewportActionCornersLocations.topLeft]: [],
    [ViewportActionCornersLocations.topRight]: [],
    [ViewportActionCornersLocations.bottomLeft]: [],
    [ViewportActionCornersLocations.bottomRight]: [],
  },
  // [anotherViewportId]: { ..... }
};

export const ViewportActionCornersContext = createContext(DEFAULT_STATE);

export function ViewportActionCornersProvider({ children, service }) {
  const viewportActionCornersReducer = (state, action) => {
    switch (action.type) {
      case 'SET_ACTION_COMPONENT': {
        const { viewportId, id, component, location, indexPriority = 0 } = action.payload;
        // Get the components at the specified location of the specified viewport.
        let locationComponents = state?.[viewportId]?.[location]
          ? [...state[viewportId][location]]
          : [];

        // If the component (id) already exists at the location specified in the payload,
        // then it must be replaced with the component in the payload so first
        // remove it from that location.
        const deletionIndex = locationComponents.findIndex(component => component.id === id);
        if (deletionIndex !== -1) {
          locationComponents = [
            ...locationComponents.slice(0, deletionIndex),
            ...locationComponents.slice(deletionIndex + 1),
          ];
        }

        // Insert the component from the payload but
        // do not insert an undefined or null component.
        if (component) {
          const insertionIndex = locationComponents.findIndex(
            component => indexPriority <= component.indexPriority
          );
          locationComponents = [
            ...locationComponents.slice(0, insertionIndex),
            {
              id,
              component,
              indexPriority,
            },
            ...locationComponents.slice(insertionIndex + 1),
          ];
        }

        return {
          ...state,
          ...{
            [viewportId]: {
              ...state[viewportId],
              [location]: locationComponents,
            },
          },
        };
      }
      case 'CLEAR_ACTION_COMPONENTS': {
        const viewportId = action.payload;
        const nextState = { ...state };
        delete nextState[viewportId];
        return nextState;
      }
      default:
        return { ...state };
    }
  };

  const [viewportActionCornersState, dispatch] = useReducer(
    viewportActionCornersReducer,
    DEFAULT_STATE
  );

  const getState = useCallback(() => {
    return viewportActionCornersState;
  }, [viewportActionCornersState]);

  const setComponent = useCallback(
    (actionComponentInfo: ActionComponentInfo) => {
      dispatch({ type: 'SET_ACTION_COMPONENT', payload: actionComponentInfo });
    },
    [dispatch]
  );

  const setComponents = useCallback(
    (actionComponentInfos: Array<ActionComponentInfo>) => {
      actionComponentInfos.forEach(actionComponentInfo =>
        dispatch({ type: 'SET_ACTION_COMPONENT', payload: actionComponentInfo })
      );
    },
    [dispatch]
  );

  const clear = useCallback(
    (viewportId: string) => dispatch({ type: 'CLEAR_ACTION_COMPONENTS', payload: viewportId }),
    [dispatch]
  );
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        getState,
        setComponent,
        setComponents,
        clear,
      });
    }
  }, [getState, service, setComponent, setComponents]);

  // run many of the calls through the service itself since we want to publish events
  const api = {
    getState,
    setComponent: props => service.setComponent(props),
    setComponents: props => service.setComponents(props),
    clear: props => service.clear(props),
  };

  const contextValue = useMemo(
    () => [viewportActionCornersState, api],
    [viewportActionCornersState, api]
  );

  return (
    <ViewportActionCornersContext.Provider value={contextValue}>
      {children}
    </ViewportActionCornersContext.Provider>
  );
}

ViewportActionCornersProvider.propTypes = {
  children: PropTypes.node,
  service: PropTypes.instanceOf(ViewportActionCornersService).isRequired,
};

export const useViewportActionCornersContext = () => useContext(ViewportActionCornersContext);
