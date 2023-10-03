import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import { ViewportActionCornersLocations } from '@ohif/ui';
import ViewportActionCornersService, {
  VIEWPORT_ACTION_ARROWS_COMPONENT_ID,
  VIEWPORT_STATUS_COMPONENT_ID,
} from '../services/ViewportActionCornersService/ViewportActionCornersService';

const DEFAULT_STATE = {
  default: {
    actionComponents: {},
    cornerComponents: {
      [ViewportActionCornersLocations.topLeft]: [],
      [ViewportActionCornersLocations.topRight]: [],
      [ViewportActionCornersLocations.bottomLeft]: [],
      [ViewportActionCornersLocations.bottomRight]: [],
    },
  },
};

export const ViewportActionCornersContext = createContext(DEFAULT_STATE);

export function ViewportActionCornersProvider({ children, service }) {
  const viewportActionCornersReducer = (state, action) => {
    const { viewportId, componentId, component } = action.payload;

    switch (action.type) {
      case 'SET_ACTION_COMPONENT': {
        const updatedViewportActionComponents = { ...(state[viewportId]?.actionComponents || {}) };
        updatedViewportActionComponents[componentId] = component;

        const updatedViewportComponents = {
          [viewportId]: {
            actionComponents: {
              ...updatedViewportActionComponents,
            },
            cornerComponents: {
              [ViewportActionCornersLocations.topLeft]: updatedViewportActionComponents[
                VIEWPORT_STATUS_COMPONENT_ID
              ]
                ? [updatedViewportActionComponents[VIEWPORT_STATUS_COMPONENT_ID]]
                : [],
              [ViewportActionCornersLocations.topRight]: updatedViewportActionComponents[
                VIEWPORT_ACTION_ARROWS_COMPONENT_ID
              ]
                ? [updatedViewportActionComponents[VIEWPORT_ACTION_ARROWS_COMPONENT_ID]]
                : [],
              [ViewportActionCornersLocations.bottomLeft]: [],
              [ViewportActionCornersLocations.bottomRight]: [],
            },
          },
        };

        return {
          ...state,
          ...updatedViewportComponents,
        };
      }
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
    props => {
      dispatch({ type: 'SET_ACTION_COMPONENT', payload: props });
    },
    [dispatch]
  );

  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        getState,
        setActionComponent,
      });
    }
  }, [getState, service, setActionComponent]);

  // run many of the calls through the service itself since we want to publish events
  const api = {
    getState,
    setActionComponent: props => service.setActionComponent(props),
  };

  return (
    <ViewportActionCornersContext.Provider value={[viewportActionCornersState, api]}>
      {children}
    </ViewportActionCornersContext.Provider>
  );
}

ViewportActionCornersProvider.propTypes = {
  children: PropTypes.node,
  service: PropTypes.instanceOf(ViewportActionCornersService).isRequired,
};

export const useViewportActionCornersContext = () => useContext(ViewportActionCornersContext);
