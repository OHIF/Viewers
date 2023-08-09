import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';
import { ViewportGridService } from '@ohif/core';
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
  viewports: new Map(
    Object.entries({
      default: {
        viewportId: 'default',
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
    })
  ),
};

export const ViewportGridContext = createContext(DEFAULT_STATE);

export function ViewportGridProvider({ children, service }) {
  const viewportGridReducer = (state: DefaultState, action) => {
    switch (action.type) {
      case 'SET_ACTIVE_VIEWPORT_INDEX': {
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
        for (const updatedViewport of payload) {
          // Use the newly provide viewportOptions and display set options
          // when provided, and otherwise fall back to the previous ones.
          // That allows for easy updates of just the display set.
          const { viewportId, displaySetInstanceUIDs } = updatedViewport;

          // create a copy of state.viewports
          const viewports = new Map(state.viewports);

          const previousViewport = viewports.get(viewportId);
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
            // Todo-rename: fix label
            viewportLabel: viewportLabels[0],
          };

          viewportOptions.presentationIds = ViewportGridService.getPresentationIds(
            newViewport,
            viewports
          );

          if (!newViewport.viewportOptions?.viewportId) {
            // Todo-rename: fix
            newViewport.viewportOptions.viewportId = `viewport-${1}`;
            newViewport.viewportId = `viewport-${1}`;
          }

          viewports[viewportId] = {
            ...viewports[viewportId],
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
          activeViewportId,
          findOrCreateViewport,
        } = action.payload;

        // If empty viewportOptions, we use numRow and numCols to calculate number of viewports
        const hasOptions = layoutOptions?.length;
        const viewports = new Map() as Map<string, Viewport>;

        // Options is a temporary state store which can be used by the
        // findOrCreate to store state about already found viewports.  Typically,
        // it will be used to store the display set UID's which are already
        // in view so that the find or create can decide which display sets
        // haven't been viewed yet, and add them in the appropriate order.
        const options = {};

        let activeViewportIdToSet = activeViewportId;
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            const pos = col + row * numCols;
            const layoutOption = layoutOptions[pos];
            const positionId = layoutOption?.positionId || `${col}-${row}`;
            if (hasOptions && pos >= layoutOptions.length) {
              continue;
            }
            if (
              activeViewportIdToSet == null &&
              state.viewports.get(state.activeViewportId)?.positionId ===
                positionId
            ) {
              activeViewportIdToSet = pos;
            }
            const viewport = findOrCreateViewport(pos, positionId, options);
            if (!viewport) {
              continue;
            }
            viewport.positionId = positionId;

            // If the viewport doesn't have a viewportId, we create one
            if (!viewport.viewportOptions?.viewportId) {
              viewport.viewportOptions.viewportId = `viewport-${pos}`;
              viewport.viewportId = `viewport-${pos}`;
            }

            // Create a new viewport object as it is getting updated here
            // and it is part of the read only state
            viewports.set(viewport.viewportId, viewport);

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

        activeViewportIdToSet = activeViewportIdToSet ?? 0;

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

  const [viewportGridState, dispatch] = useReducer(
    viewportGridReducer,
    DEFAULT_STATE
  );

  const getState = useCallback(() => {
    return viewportGridState;
  }, [viewportGridState]);

  const setActiveViewportId = useCallback(
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
