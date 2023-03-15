import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import viewportLabels from '../utils/viewportLabels';
import getPresentationId from './getPresentationId';

const DEFAULT_STATE = {
  activeViewportIndex: 0,
  layout: {
    numRows: 0,
    numCols: 0,
    layoutType: 'grid',
  },
  viewports: [
    {
      displaySetInstanceUIDs: [],
      viewportOptions: {},
      displaySetSelectors: [],
      displaySetOptions: [{}],
      x: 0, // left
      y: 0, // top
      width: 100,
      height: 100,
      viewportLabel: null,
    },
  ],
};

export const ViewportGridContext = createContext(DEFAULT_STATE);

/**
 * Find a viewport to re-use, and then set the viewportId
 *
 * @param idSet
 * @param viewport
 * @param stateViewports
 * @returns
 */
const reuseViewport = (idSet, viewport, stateViewports) => {
  const oldIds = {};
  for (const oldViewport of stateViewports) {
    const { viewportId: oldId } = oldViewport;
    oldIds[oldId] = true;
    if (!oldId || idSet[oldId]) continue;
    if (
      !isEqual(
        oldViewport.displaySetInstanceUIDs,
        viewport.displaySetInstanceUIDs
      )
    ) {
      continue;
    }
    idSet[oldId] = true;
    // TODO re-use viewports once the flickering/wrong size redraw is fixed
    // return {
    //   ...oldViewport,
    //   ...viewport,
    //   viewportOptions: {
    //     ...oldViewport.viewportOptions,

    //     viewportId: oldViewport.viewportId,
    //   },
    // };
  }
  // Find a viewport instance number different from earlier viewports having
  // the same presentationId as this one would - will be less than 10k
  // viewports hopefully :-)
  for (let i = 0; i < 10000; i++) {
    const viewportId = 'viewport-' + i;
    if (idSet[viewportId] || oldIds[viewportId]) continue;
    idSet[viewportId] = true;
    return {
      ...viewport,
      viewportId,
      viewportOptions: { ...viewport.viewportOptions, viewportId },
    };
  }
  throw new Error('No ID found');
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
        const viewport = state.viewports[viewportIndex] || {};
        const viewportOptions = { ...payload.viewportOptions };

        const displaySetOptions = payload.displaySetOptions || [];
        if (displaySetOptions.length === 0) {
          // Only copy index 0, as that is all that is currently supported by this
          // method call.
          displaySetOptions.push({ ...viewport.displaySetOptions?.[0] });
        }

        const viewports = state.viewports.slice();

        let newView = {
          ...viewport,
          displaySetInstanceUIDs,
          viewportOptions,
          displaySetOptions,
          viewportLabel: viewportLabels[viewportIndex],
        };
        viewportOptions.presentationId = getPresentationId(newView, viewports);

        // Make sure we assign a viewport id
        newView = reuseViewport({}, newView, state.viewports);
        console.log(
          'Creating new viewport',
          viewportIndex,
          newView.viewportOptions.viewportId,
          displaySetInstanceUIDs,
          displaySetOptions
        );

        viewports[viewportIndex] = newView;

        return { ...state, viewports };
      }
      case 'SET_LAYOUT': {
        const {
          numCols,
          numRows,
          layoutOptions,
          layoutType = 'grid',
          findOrCreateViewport,
        } = action.payload;

        // If empty viewportOptions, we use numRow and numCols to calculate number of viewports
        const hasOptions = layoutOptions?.length;
        const viewports = [];

        // Options is a temporary state store which can be used by the
        // findOrCreate to store state about already found viewports.  Typically,
        // it will be used to store the display set UID's which are already
        // in view so that the find or create can decide which display sets
        // haven't been viewed yet, and add them in the appropriate order.
        const options = {};

        let activeViewportIndex;
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            const pos = col + row * numCols;
            const layoutOption = layoutOptions[pos];
            const positionId = layoutOption?.positionId || `${col}-${row}`;
            if (hasOptions && pos >= layoutOptions.length) {
              continue;
            }
            if (
              !activeViewportIndex ||
              state.viewports[pos]?.positionId === positionId
            ) {
              activeViewportIndex = pos;
            }
            const viewport = findOrCreateViewport(pos, positionId, options);
            if (!viewport) continue;
            viewport.positionId = positionId;
            // Create a new viewport object as it is getting updated here
            // and it is part of the read only state
            viewports.push(viewport);
            let xPos, yPos, w, h;

            if (layoutOptions && layoutOptions[pos]) {
              ({ x: xPos, y: yPos, width: w, height: h } = layoutOptions[pos]);
            } else {
              w = 1 / numCols;
              h = 1 / numRows;
              xPos = col * w;
              yPos = row * h;
            }

            viewport.width = w;
            viewport.height = h;
            viewport.x = xPos;
            viewport.y = yPos;
          }
        }

        const viewportIdSet = {};
        for (
          let viewportIndex = 0;
          viewportIndex < viewports.length;
          viewportIndex++
        ) {
          const viewport = reuseViewport(
            viewportIdSet,
            viewports[viewportIndex],
            state.viewports
          );
          if (!viewport.viewportOptions.presentationId) {
            viewport.viewportOptions.presentationId = getPresentationId(
              viewport,
              viewports
            );
          }
          viewport.viewportIndex = viewportIndex;
          viewport.viewportLabel = viewportLabels[viewportIndex];
          viewports[viewportIndex] = viewport;
        }

        const ret = {
          ...state,
          activeViewportIndex,
          layout: {
            ...state.layout,
            numCols,
            numRows,
            layoutType,
          },
          viewports,
        };
        return ret;
      }
      case 'RESET': {
        return DEFAULT_STATE;
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
      displaySetSelectors,
      displaySetOptions,
    }) =>
      dispatch({
        type: 'SET_DISPLAYSET_FOR_VIEWPORT',
        payload: {
          viewportIndex,
          displaySetInstanceUIDs,
          viewportOptions,
          displaySetSelectors,
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
    ({
      layoutType,
      numRows,
      numCols,
      layoutOptions = [],
      findOrCreateViewport,
    }) =>
      dispatch({
        type: 'SET_LAYOUT',
        payload: {
          layoutType,
          numRows,
          numCols,
          layoutOptions,
          findOrCreateViewport,
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

  const set = useCallback(
    payload =>
      dispatch({
        type: 'SET',
        payload,
      }),
    [dispatch]
  );

  const getNumViewportPanes = useCallback(() => {
    const { layout, viewports } = viewportGridState;
    const { numRows, numCols } = layout;
    return Math.min(viewports.length, numCols * numRows);
  }, [viewportGridState]);

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
        set,
        getNumViewportPanes,
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
    set,
    getNumViewportPanes,
  ]);

  const api = {
    getState,
    setActiveViewportIndex: index => service.setActiveViewportIndex(index), // run it through the service itself since we want to publish events
    setDisplaySetsForViewport,
    setDisplaySetsForViewports,
    setLayout,
    reset,
    set,
    getNumViewportPanes,
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
