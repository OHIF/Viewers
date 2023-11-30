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
    const { viewportId, id, component, location, indexPriority = 0 } = action.payload;

    switch (action.type) {
      case 'SET_ACTION_COMPONENT': {
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

        // Insert the component from the payload.
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

  const setActionComponent = useCallback(
    (component: ActionComponentInfo) => {
      dispatch({ type: 'SET_ACTION_COMPONENT', payload: component });
    },
    [dispatch]
  );

  const setActionComponents = useCallback(
    (components: Array<ActionComponentInfo>) => {
      components.forEach(component =>
        dispatch({ type: 'SET_ACTION_COMPONENT', payload: component })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        getState,
        setActionComponent,
        setActionComponents,
      });
    }
  }, [getState, service, setActionComponent, setActionComponents]);

  // run many of the calls through the service itself since we want to publish events
  const api = {
    getState,
    setActionComponent: props => service.setActionComponent(props),
    setActionComponents: props => service.setActionComponents(props),
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
