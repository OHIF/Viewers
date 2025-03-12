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
      case 'ADD_ACTION_COMPONENT': {
        const { viewportId, id, component, location, indexPriority } = action.payload;
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
          let insertionIndex;
          const isRightSide =
            location === ViewportActionCornersLocations.topRight ||
            location === ViewportActionCornersLocations.bottomRight;

          if (indexPriority === undefined) {
            // If no indexPriority is provided, add it to the appropriate end
            insertionIndex = isRightSide ? 0 : locationComponents.length;
          } else {
            if (isRightSide) {
              insertionIndex = locationComponents.findIndex(
                component => indexPriority > component.indexPriority
              );
            } else {
              insertionIndex = locationComponents.findIndex(
                component => indexPriority <= component.indexPriority
              );
            }
            if (insertionIndex === -1) {
              // If no suitable position found, add to the appropriate end
              insertionIndex = isRightSide ? 0 : locationComponents.length;
            }
          }

          const defaultPriority = isRightSide ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;

          locationComponents = [
            ...locationComponents.slice(0, insertionIndex),
            {
              id,
              component,
              indexPriority: indexPriority ?? defaultPriority,
            },
            ...locationComponents.slice(insertionIndex),
          ];
        }

        return {
          ...state,
          [viewportId]: {
            ...state[viewportId],
            [location]: locationComponents,
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

  const addComponent = useCallback(
    (actionComponentInfo: ActionComponentInfo) => {
      dispatch({ type: 'ADD_ACTION_COMPONENT', payload: actionComponentInfo });
    },
    [dispatch]
  );

  const addComponents = useCallback(
    (actionComponentInfos: Array<ActionComponentInfo>) => {
      actionComponentInfos.forEach(actionComponentInfo =>
        dispatch({ type: 'ADD_ACTION_COMPONENT', payload: actionComponentInfo })
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
        addComponent,
        addComponents,
        clear,
      });
    }
  }, [getState, service, addComponent, addComponents, clear]);

  const viewportCornerActions = {
    getState,
    addComponent: props => service.addComponent(props),
    addComponents: props => service.addComponents(props),
    clear: props => service.clear(props),
  };

  const contextValue = useMemo(
    () => [viewportActionCornersState, viewportCornerActions],
    [viewportActionCornersState, viewportCornerActions]
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
