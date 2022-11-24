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
  cachedLayout: {},
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

        // Note: there should be no inheritance happening at this level,
        // we can't assume the new displaySet can inherit the previous
        // displaySet's or viewportOptions at all. For instance, dragging
        // and dropping a SEG/RT displaySet without any viewportOptions
        // or displaySetOptions should not inherit the previous displaySet's
        // which might have been a PDF Viewport. The viewport itself
        // will deal with inheritance if required. Here is just a simple
        // provider.
        const viewportOptions = payload.viewportOptions || {};
        const displaySetOptions = payload.displaySetOptions || [{}];

        const viewports = state.viewports.slice();

        if (!viewportOptions.viewportId) {
          viewportOptions.viewportId = `viewport-${viewportIndex}`;
        }

        // merge the displaySetOptions and viewportOptions and displaySetInstanceUIDs
        // into the viewport object at the given index
        viewports[viewportIndex] = {
          ...viewports[viewportIndex],
          displaySetInstanceUIDs,
          viewportOptions,
          displaySetOptions,
          viewportLabel: viewportLabels[viewportIndex],
        };

        return { ...state, ...{ viewports } };
      }
      case 'SET_LAYOUT': {
        const {
          numCols,
          numRows,
          layoutOptions,
          layoutType = 'grid',
        } = action.payload;

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
          cachedLayout: {},
        };
      }

      // The SET_CACHE_LAYOUT action can be used for caching a layout
      // for instance double clicking a viewport to maximize it.
      // and then restoring the previous layout when the viewport is
      // double clicked again.
      case 'SET_CACHED_LAYOUT': {
        const { cacheId, cachedLayout } = action.payload;

        // deep copy the cachedLayout into the state
        return {
          ...state,
          cachedLayout: {
            ...state.cachedLayout,
            [cacheId]: JSON.parse(JSON.stringify(cachedLayout)),
          },
        };
      }

      case 'RESTORE_CACHED_LAYOUT': {
        const cacheId = action.payload;

        if (!state.cachedLayout[cacheId]) {
          console.warn(
            `No cached layout found for cacheId: ${cacheId}. Ignoring...`
          );
          return state;
        }

        const cachedLayout = state.cachedLayout;
        return { ...state.cachedLayout[cacheId], cachedLayout };
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

  const getState = useCallback(() => {
    return viewportGridState;
  }, [viewportGridState]);

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

  const setDisplaySetsForViewports = useCallback(
    viewports => {
      viewports.forEach(data => {
        setDisplaySetsForViewport(data);
      });
    },
    [setDisplaySetsForViewport]
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

  const restoreCachedLayout = useCallback(
    cacheId => {
      dispatch({
        type: 'RESTORE_CACHED_LAYOUT',
        payload: cacheId,
      });
    },
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
   * Sets the implementation of ViewportGridService that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        getState,
        setActiveViewportIndex,
        setDisplaySetsForViewport,
        setDisplaySetsForViewports,
        setLayout,
        reset,
        onModeExit: reset,
        setCachedLayout,
        restoreCachedLayout,
        set,
      });
    }
  }, [
    getState,
    service,
    setActiveViewportIndex,
    setDisplaySetsForViewport,
    setDisplaySetsForViewports,
    setLayout,
    reset,
    setCachedLayout,
    restoreCachedLayout,
    set,
  ]);

  const api = {
    getState,
    setActiveViewportIndex: index => service.setActiveViewportIndex(index), // run it through the service itself since we want to publish events
    setDisplaySetsForViewport,
    setDisplaySetsForViewports,
    setLayout,
    setCachedLayout,
    restoreCachedLayout,
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
