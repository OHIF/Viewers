import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import merge from 'lodash.merge';

import PropTypes from 'prop-types';
import { ViewportGridService, utils } from '@ohif/core';
import viewportLabels from '../utils/viewportLabels';

interface Viewport {
  viewportId: string;
  displaySetInstanceUIDs: string[];
  viewportOptions: any;
  displaySetSelectors: any[];
  displaySetOptions: any[];
  x: number;
  y: number;
  width: number;
  height: number;
  viewportLabel: any;
}

interface Layout {
  numRows: number;
  numCols: number;
  layoutType: string;
}

interface DefaultState {
  activeViewportId: string | null;
  layout: Layout;
  viewports: Map<string, Viewport>;
}

const DEFAULT_STATE: DefaultState = {
  activeViewportId: null,
  layout: {
    numRows: 0,
    numCols: 0,
    layoutType: 'grid',
  },
  // Viewports structure has been changed to Map (previously it was
  // tied to the viewportIndex which caused multiple issues. Now we have
  // moved completely to viewportId which is unique for each viewport.
  viewports: new Map(
    Object.entries({
      default: {
        viewportId: 'default',
        displaySetInstanceUIDs: [],
        viewportOptions: {
          viewportId: 'default',
        },
        displaySetSelectors: [],
        displaySetOptions: [{}],
        x: 0, // left
        y: 0, // top
        width: 100,
        height: 100,
        viewportLabel: null,
      },
    })
  ),
};

const getViewportLabel = (viewports, viewportId) => {
  const viewportIds = Array.from(viewports.keys());
  return viewportLabels[viewportIds.indexOf(viewportId)];
};

const determineActiveViewportId = (state: DefaultState, newViewports: Map) => {
  const { activeViewportId } = state;
  const currentActiveViewport = state.viewports.get(activeViewportId);

  if (!currentActiveViewport) {
    // if there is no active viewport, we should just return the first viewport
    const firstViewport = newViewports.values().next().value;
    return firstViewport.viewportOptions.viewportId;
  }

  // for the new viewports, we should rank them by the displaySetInstanceUIDs
  // they are displaying and the orientation then we can find the active viewport
  const currentActiveDisplaySetInstanceUIDs = currentActiveViewport.displaySetInstanceUIDs;

  // This doesn't take into account where stack viewport is converting to volumeViewport
  // since in stack viewport we don't have a concept of "orientation" as a string
  // maybe we should calculate the orientation based on the active imageId
  // so that we can compare it with the new viewports (which might be volume viewports)
  // and find the best match
  const currentOrientation = currentActiveViewport.viewportOptions.orientation;

  const sortedViewports = Array.from(newViewports.values()).sort((a, b) => {
    // Compare orientations
    const aOrientationMatch = a.viewportOptions.orientation === currentOrientation;
    const bOrientationMatch = b.viewportOptions.orientation === currentOrientation;
    if (aOrientationMatch !== bOrientationMatch) {
      return bOrientationMatch - aOrientationMatch;
    }

    // Compare displaySetInstanceUIDs
    const aMatch = a.displaySetInstanceUIDs.some(uid =>
      currentActiveDisplaySetInstanceUIDs.includes(uid)
    );
    const bMatch = b.displaySetInstanceUIDs.some(uid =>
      currentActiveDisplaySetInstanceUIDs.includes(uid)
    );
    if (aMatch !== bMatch) {
      return bMatch - aMatch;
    }

    return 0; // Return 0 if no differences found
  });

  if (!sortedViewports?.length) {
    return null;
  }

  return sortedViewports[0].viewportId;
};

export const ViewportGridContext = createContext(DEFAULT_STATE);

export function ViewportGridProvider({ children, service }) {
  const viewportGridReducer = (state: DefaultState, action) => {
    switch (action.type) {
      case 'SET_ACTIVE_VIEWPORT_ID': {
        return { ...state, ...{ activeViewportId: action.payload } };
      }

      /**
       * Sets the display sets for multiple viewports.
       * This is a replacement for the older set display set for viewport (single)
       * because the old one had race conditions wherein the viewports could
       * render partially in various ways causing exceptions.
       */
      case 'SET_DISPLAYSETS_FOR_VIEWPORTS': {
        const { payload } = action;
        const viewports = new Map(state.viewports);

        payload.forEach(updatedViewport => {
          const { viewportId, displaySetInstanceUIDs } = updatedViewport;

          if (!viewportId) {
            throw new Error('ViewportId is required to set display sets for viewport');
          }

          const previousViewport = viewports.get(viewportId);

          // Use the newly provide viewportOptions and display set options
          // when provided, and otherwise fall back to the previous ones.
          // That allows for easy updates of just the display set.
          const viewportOptions = merge(
            {},
            previousViewport?.viewportOptions,
            updatedViewport?.viewportOptions
          );

          const displaySetOptions = updatedViewport.displaySetOptions || [];
          if (!displaySetOptions.length) {
            // Copy all the display set options, assuming a full set of displaySet UID's is provided.
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
            viewportLabel: getViewportLabel(viewports, viewportId),
          };

          viewportOptions.presentationIds = ViewportGridService.getPresentationIds(
            newViewport,
            viewports
          );

          viewports.set(viewportId, {
            ...viewports.get(viewportId),
            ...newViewport,
          });
        });

        return { ...state, viewports };
      }
      case 'SET_LAYOUT': {
        const {
          numCols,
          numRows,
          layoutOptions,
          layoutType = 'grid',
          activeViewportId,
          findOrCreateViewport,
        } = action.payload;

        // If empty viewportOptions, we use numRow and numCols to calculate number of viewports
        const hasOptions = layoutOptions?.length;
        const viewports = new Map<string, Viewport>();

        // Options is a temporary state store which can be used by the
        // findOrCreate to store state about already found viewports.  Typically,
        // it will be used to store the display set UID's which are already
        // in view so that the find or create can decide which display sets
        // haven't been viewed yet, and add them in the appropriate order.
        const options = {};

        let activeViewportIdToSet = activeViewportId;
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            const position = col + row * numCols;
            const layoutOption = layoutOptions[position];
            const positionId = layoutOption?.positionId || `${col}-${row}`;

            if (hasOptions && position >= layoutOptions.length) {
              continue;
            }

            const viewport = findOrCreateViewport(position, positionId, options);

            if (!viewport) {
              continue;
            }

            viewport.positionId = positionId;

            // If the viewport doesn't have a viewportId, we create one
            if (!viewport.viewportOptions?.viewportId) {
              const randomUID = utils.uuidv4().substring(0, 8);
              viewport.viewportOptions.viewportId = `viewport-${randomUID}`;
            }

            viewport.viewportId = viewport.viewportOptions.viewportId;

            // Create a new viewport object as it is getting updated here
            // and it is part of the read only state
            viewports.set(viewport.viewportId, viewport);

            let xPos, yPos, w, h;
            if (layoutOptions && layoutOptions[position]) {
              ({ x: xPos, y: yPos, width: w, height: h } = layoutOptions[position]);
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

            viewport.viewportLabel = getViewportLabel(viewports, viewport.viewportId);

            if (!viewport.viewportOptions.presentationIds) {
              viewport.viewportOptions.presentationIds = ViewportGridService.getPresentationIds(
                viewport,
                viewports
              );
            }
          }
        }

        activeViewportIdToSet =
          activeViewportIdToSet ?? determineActiveViewportId(state, viewports);

        const ret = {
          ...state,
          activeViewportId: activeViewportIdToSet,
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

  const [viewportGridState, dispatch] = useReducer(viewportGridReducer, DEFAULT_STATE);

  const getState = useCallback(() => {
    return viewportGridState;
  }, [viewportGridState]);

  const getActiveViewportOptionByKey = (key: string) => {
    const { viewports, activeViewportId } = viewportGridState;
    return viewports.get(activeViewportId)?.viewportOptions?.[key];
  };

  const setActiveViewportId = useCallback(
    index => dispatch({ type: 'SET_ACTIVE_VIEWPORT_ID', payload: index }),
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
      activeViewportId,
      findOrCreateViewport,
    }) =>
      dispatch({
        type: 'SET_LAYOUT',
        payload: {
          layoutType,
          numRows,
          numCols,
          layoutOptions,
          activeViewportId,
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
    return Math.min(viewports.size, numCols * numRows);
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
        setActiveViewportId,
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
    setActiveViewportId,
    setDisplaySetsForViewports,
    setLayout,
    reset,
    set,
    getNumViewportPanes,
  ]);

  // run many of the calls through the service itself since we want to publish events
  const api = {
    getState,
    setActiveViewportId: index => service.setActiveViewportId(index),
    setDisplaySetsForViewport: props => service.setDisplaySetsForViewports([props]),
    setDisplaySetsForViewports: props => service.setDisplaySetsForViewports(props),
    setLayout: layout => service.setLayout(layout),
    reset: () => service.reset(),
    set: gridLayoutState => service.setState(gridLayoutState), // run it through the service itself since we want to publish events
    getNumViewportPanes,
    getActiveViewportOptionByKey,
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
