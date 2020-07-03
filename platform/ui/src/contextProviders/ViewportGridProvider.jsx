import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';

const DEFAULT_STATE = {
  numRows: 1,
  numCols: 1,
  viewports: [
    // {
    //    displaySetInstanceUID: string,
    // }
  ],
  activeViewportIndex: 0,
};

export const ViewportGridContext = createContext(DEFAULT_STATE);

export function ViewportGridProvider({ children, service }) {
  const viewportGridReducer = (state, action) => {
    switch (action.type) {
      case 'SET_ACTIVE_VIEWPORT_INDEX': {
        return { ...state, ...{ activeViewportIndex: action.payload } };
      }
      case 'SET_DISPLAYSET_FOR_VIEWPORT': {
        const { viewportIndex, displaySetInstanceUID, imageIndex } = action.payload;
        const viewports = state.viewports.slice();

        viewports[viewportIndex] = { displaySetInstanceUID, imageIndex };

        return { ...state, ...{ viewports }, cachedLayout: undefined };
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
          cachedLayout: undefined,
        };
      }
      case 'SET_CACHED_LAYOUT': {
        return { ...state, cachedLayout: action.payload };
      }
      default:
        return action.payload;
    }
  };

  const [viewportGridState, dispatch] = useReducer(
    viewportGridReducer,
    DEFAULT_STATE
  );

  const getState = useCallback(() => viewportGridState, [viewportGridState]);
  const setActiveViewportIndex = useCallback(
    index => dispatch({ type: 'SET_ACTIVE_VIEWPORT_INDEX', payload: index }),
    [dispatch]
  );
  const setDisplaysetForViewport = useCallback(
    ({ viewportIndex, displaySetInstanceUID, imageIndex }) =>
      dispatch({
        type: 'SET_DISPLAYSET_FOR_VIEWPORT',
        payload: {
          viewportIndex,
          displaySetInstanceUID,
          imageIndex
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

  const setCachedLayout = useCallback(
    payload =>
      dispatch({
        type: 'SET_CACHED_LAYOUT',
        payload,
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
        setCachedLayout,
      });
    }
  }, [
    getState,
    service,
    setActiveViewportIndex,
    setDisplaysetForViewport,
    setLayout,
    setCachedLayout,
  ]);

  const api = {
    // getState,
    setActiveViewportIndex,
    setDisplaysetForViewport,
    setLayout,
    setCachedLayout,
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
