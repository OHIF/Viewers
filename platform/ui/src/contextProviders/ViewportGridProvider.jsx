import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';

export const ViewportGridContext = createContext();

// export function ViewportGridProvider({ reducer, initialState, children }) {
//   return (
//     <ViewportGridContext.Provider value={useReducer(reducer, initialState)}>
//       {children}
//     </ViewportGridContext.Provider>
//   );
// }

export function ViewportGridProvider({ children, service }) {
  const DEFAULT_STATE = {
    numRows: 1,
    numCols: 1,
    viewports: [],
    activeViewportIndex: 0,
  };

  const viewportGridReducer = (state, action) => {
    switch (action.type) {
      case 'SET_ACTIVE_VIEWPORT_INDEX':
        return { ...state, ...{ activeViewportIndex: action.payload } };
      case 'SET_DISPLAYSET_FOR_VIEWPORT': {
        const { viewportIndex, displaySetInstanceUID } = action.payload;
        const viewports = state.viewports.slice();

        viewports[viewportIndex] = { displaySetInstanceUID };

        return { ...state, ...{ viewports } };
      }
      case 'SET_LAYOUT': {
        const { numCols, numRows } = action.payload;
        const numPanes = numCols * numRows;
        const viewports = state.viewports.slice();
        const activeViewportIndex =
          state.activeViewportIndex >= numPanes ? 0 : state.activeViewportIndex;

        while (viewports.length < numPanes) {
          viewports.push({});
        }
        while (viewports.length > numPanes) {
          viewports.pop();
        }

        return {
          ...state,
          ...{ activeViewportIndex, numCols, numRows, viewports },
        };
      }
      default:
        return action.payload;
    }
  };

  const [viewportGridState, dispatch] = useReducer(
    DEFAULT_STATE,
    viewportGridReducer
  );

  const getState = useCallback(() => viewportGridState, [viewportGridState]);
  const setActiveViewportIndex = useCallback(
    index => dispatch({ type: 'SET_ACTIVE_VIEWPORT_INDEX', payload: index }),
    [dispatch]
  );
  const setDisplaysetForViewport = useCallback(
    ({ viewportIndex, displaySetInstanceUID }) =>
      dispatch({
        type: 'SET_DISPLAYSET_FOR_VIEWPORT',
        payload: {
          viewportIndex,
          displaySetInstanceUID,
        },
      }),
    [dispatch]
  );

  const setLayout = useCallback(
    ({ numCols, numRows }) =>
      dispatch({
        type: 'SET_LAYOUT',
        payload: {
          numCols,
          numRows,
        },
      }),
    [dispatch]
  );

  /**
   * Sets the implementation of a modal service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        getState,
        setActiveViewportIndex,
        setDisplaysetForViewport,
        setLayout,
      });
    }
  }, [
    getState,
    service,
    setActiveViewportIndex,
    setDisplaysetForViewport,
    setLayout,
  ]);

  const api = {
    // getState,
    setActiveViewportIndex,
    setDisplaysetForViewport,
    setLayout,
  };

  return (
    <ViewportGridContext.Provider value={[viewportGridState, api]}>
      {children}
    </ViewportGridContext.Provider>
  );
}

ViewportGridProvider.propTypes = {
  children: PropTypes.any,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }).isRequired,
};

export const useViewportGrid = () => useContext(ViewportGridContext);

// TODO:
// - Update dependents of `useViewportGrid` to use new API instead of generic `dispatch`
// - Update `@ohif/core` interface `setServiceImplementation` to accomodate defined API methods
// - Update `@ohif/ext-cornerstone` commands to use new service to get the activeViewportIndex and restore command functionality
