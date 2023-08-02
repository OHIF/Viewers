import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import { ViewportGridService } from '@ohif/core';
import viewportLabels from '../utils/viewportLabels';

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

export function ViewportGridProvider({ children, service }) {
  const viewportGridReducer = (state, action) => {
    switch (action.type) {
      case 'SET_ACTIVE_VIEWPORT_INDEX': {
        return { ...state, ...{ activeViewportIndex: action.payload } };
      }

      /**
       * Sets the display sets for multiple viewports.
       * This is a replacement for the older set display set for viewport (single)
       * because the old one had race conditions wherein the viewports could
       * render partially in various ways causing exceptions.
       */
      case 'SET_DISPLAYSETS_FOR_VIEWPORTS': {
        const { payload } = action;
        const viewports = state.viewports.slice();

        for (const updatedViewport of payload) {
          // Use the newly provide viewportOptions and display set options
          // when provided, and otherwise fall back to the previous ones.
          // That allows for easy updates of just the display set.
          const { viewportIndex, displaySetInstanceUIDs } = updatedViewport;
          const previousViewport = viewports[viewportIndex] || {};
          const viewportOptions = {
            ...(updatedViewport.viewportOptions ||
              previousViewport.viewportOptions),
          };

          const displaySetOptions = updatedViewport.displaySetOptions || [];
          if (!displaySetOptions.length) {
            // Copy all the display set options, assuming a full set of displayset UID's is provided.
            displaySetOptions.push(...previousViewport.displaySetOptions);
            if (!displaySetOptions.length) {
              displaySetOptions.push({});
            }
          }

          const newViewport = {
            ...previousViewport,
            displaySetInstanceUIDs,
            viewportOptions,
            displaySetOptions,
            viewportLabel: viewportLabels[viewportIndex],
          };

          viewportOptions.presentationIds = ViewportGridService.getPresentationIds(
            newViewport,
            viewports
          );

          if (!newViewport.viewportOptions?.viewportId) {
            newViewport.viewportOptions.viewportId = `viewport-${viewportIndex}`;
          }

          newViewport.viewportIndex = previousViewport.viewportIndex;

          viewports[viewportIndex] = {
            ...viewports[viewportIndex],
            ...newViewport,
          };
        }

        return { ...state, viewports };
      }
      case 'SET_LAYOUT': {
        const {
          numCols,
          numRows,
          layoutOptions,
          layoutType = 'grid',
          activeViewportIndex,
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

        let activeViewportIndexToSet = activeViewportIndex;
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            const pos = col + row * numCols;
            const layoutOption = layoutOptions[pos];
            const positionId = layoutOption?.positionId || `${col}-${row}`;
            if (hasOptions && pos >= layoutOptions.length) {
              continue;
            }
            if (
              activeViewportIndexToSet == null &&
              state.viewports[state.activeViewportIndex]?.positionId ===
                positionId
            ) {
              activeViewportIndexToSet = pos;
            }
            const viewport = findOrCreateViewport(pos, positionId, options);
            if (!viewport) continue;
            viewport.positionId = positionId;

            // If the viewport doesn't have a viewportId, we create one
            if (!viewport.viewportOptions?.viewportId) {
              viewport.viewportOptions.viewportId = `viewport-${pos}`;
            }

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

            Object.assign(viewport, {
              width: w,
              height: h,
              x: xPos,
              y: yPos,
            });

            //     if (!viewport.viewportOptions.presentationIds) {
            //     viewport.viewportOptions.presentationIds = ViewportGridService.getPresentationIds(
            //       viewport,
            //       viewports
            //     );
            //   }
          }
        }

        activeViewportIndexToSet = activeViewportIndexToSet ?? 0;

        const ret = {
          ...state,
          activeViewportIndex: activeViewportIndexToSet,
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

  const setDisplaySetsForViewports = useCallback(
    viewports =>
      dispatch({
        type: 'SET_DISPLAYSETS_FOR_VIEWPORTS',
        payload: viewports,
      }),
    [dispatch]
  );

  const setLayout = useCallback(
    ({
      layoutType,
      numRows,
      numCols,
      layoutOptions = [],
      activeViewportIndex,
      findOrCreateViewport,
    }) =>
      dispatch({
        type: 'SET_LAYOUT',
        payload: {
          layoutType,
          numRows,
          numCols,
          layoutOptions,
          activeViewportIndex,
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
    setDisplaySetsForViewports,
    setLayout,
    reset,
    set,
    getNumViewportPanes,
  ]);

  // run many of the calls through the service itself since we want to publish events
  const api = {
    getState,
    setActiveViewportIndex: index => service.setActiveViewportIndex(index),
    setDisplaySetsForViewport: props =>
      service.setDisplaySetsForViewports([props]),
    setDisplaySetsForViewports: props =>
      service.setDisplaySetsForViewports(props),
    setLayout: layout => service.setLayout(layout),
    reset: () => service.reset(),
    set: gridLayoutState => service.setState(gridLayoutState), // run it through the service itself since we want to publish events
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
  service: PropTypes.instanceOf(ViewportGridService).isRequired,
};

export const useViewportGrid = () => useContext(ViewportGridContext);
