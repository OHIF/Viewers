import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';

import viewportLabels from '../utils/viewportLabels';

const DEFAULT_STATE = {
  numRows: null,
  numCols: null,
  layoutType: 'grid',
  viewports: [
    {
      displaySetInstanceUIDs: [],
      viewportOptions: {},
      displaySetOptions: [{}],
      x: 0, // left
      y: 0, // top
      width: 100,
      height: 100,
      viewportLabel: null,
    },
  ],
  activeViewportIndex: 0,
};

export const ViewportGridContext = createContext(DEFAULT_STATE);

/**
 * Given the flatten index, and rows and column, it returns the
 * row and column index
 */
const unravelIndex = (index, numRows, numCols) => {
  const row = Math.floor(index / numCols);
  const col = index % numCols;
  return { row, col };
};

export function ViewportGridProvider({ children, service }) {
  const viewportGridReducer = (state, action) => {
    switch (action.type) {
      case 'SET_ACTIVE_VIEWPORT_INDEX': {
        return { ...state, ...{ activeViewportIndex: action.payload } };
      }
      case 'SET_DISPLAYSET_FOR_VIEWPORT': {
        const payload = action.payload;
        const { viewportIndex, displaySetInstanceUIDs } = payload;
        const viewport = state.viewports[viewportIndex];
        const viewportOptions =
          payload.viewportOptions || viewport.viewportOptions || {};
        const displaySetOptions = payload.displaySetOptions ||
          viewport.displaySetOptions || [{}];
        const viewports = state.viewports.slice();

        // merge the displaySetOptions and viewportOptions and displaySetInstanceUIDs
        // into the viewport object at the given index
        viewports[viewportIndex] = {
          ...viewports[viewportIndex],
          displaySetInstanceUIDs,
          viewportOptions,
          displaySetOptions,
          viewportLabel: viewportLabels[viewportIndex],
        };

        return { ...state, ...{ viewports }, cachedLayout: null };
      }
      case 'SET_LAYOUT': {
        const { numCols, numRows, layoutType, layoutOptions } = action.payload;

        // If empty viewportOptions, we use numRow and numCols to calculate number of viewports
        const numPanes = layoutOptions.length || numRows * numCols;
        const viewports = state.viewports.slice();
        const activeViewportIndex =
          state.activeViewportIndex >= numPanes ? 0 : state.activeViewportIndex;

        while (viewports.length < numPanes) {
          viewports.push({});
        }
        while (viewports.length > numPanes) {
          viewports.pop();
        }

        for (let i = 0; i < numPanes; i++) {
          let xPos, yPos, w, h;

          if (layoutOptions && layoutOptions[i]) {
            ({ x: xPos, y: yPos, width: w, height: h } = layoutOptions[i]);
          } else {
            const { row, col } = unravelIndex(i, numRows, numCols);
            w = 1 / numCols;
            h = 1 / numRows;
            xPos = col * w;
            yPos = row * h;
          }

          viewports[i].width = w;
          viewports[i].height = h;
          viewports[i].x = xPos;
          viewports[i].y = yPos;
        }

        return {
          ...state,
          ...{
            activeViewportIndex,
            numCols,
            numRows,
            layoutType,
            viewports,
          },
          cachedLayout: null,
        };
      }
      case 'RESET': {
        return {
          numCols: null,
          numRows: null,
          layoutType: 'grid',
          activeViewportIndex: 0,
          viewports: [
            {
              displaySetInstanceUIDs: [],
              displaySetOptions: [],
              viewportOptions: {},
              x: 0, // left
              y: 0, // top
              width: 100,
              height: 100,
            },
          ],
          cachedLayout: null,
        };
      }

      case 'SET_CACHED_LAYOUT': {
        return { ...state, cachedLayout: action.payload };
      }
      case 'SET': {
        return {
          ...state,
          ...action.payload,
        };
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

  const setDisplaySetsForViewport = useCallback(
    ({
      viewportIndex,
      displaySetInstanceUIDs,
      viewportOptions,
      displaySetOptions,
    }) =>
      dispatch({
        type: 'SET_DISPLAYSET_FOR_VIEWPORT',
        payload: {
          viewportIndex,
          displaySetInstanceUIDs,
          viewportOptions,
          displaySetOptions,
        },
      }),
    [dispatch]
  );

  const setLayout = useCallback(
    ({ layoutType, numRows, numCols, layoutOptions = [] }) =>
      dispatch({
        type: 'SET_LAYOUT',
        payload: {
          layoutType,
          numRows,
          numCols,
          layoutOptions,
        },
      }),
    [dispatch]
  );

  const reset = useCallback(
    () =>
      dispatch({
        type: 'RESET',
        payload: {},
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

  const set = useCallback(
    payload =>
      dispatch({
        type: 'SET',
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
        setDisplaySetsForViewport,
        setLayout,
        reset,
        setCachedLayout,
        set,
      });
    }
  }, [
    getState,
    service,
    setActiveViewportIndex,
    setDisplaySetsForViewport,
    setLayout,
    reset,
    setCachedLayout,
    set,
  ]);

  const api = {
    getState,
    setActiveViewportIndex,
    setDisplaySetsForViewport,
    setLayout,
    setCachedLayout,
    reset,
    set,
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
