import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from 'react';
import merge from 'lodash.merge';

import PropTypes from 'prop-types';
import { ViewportGridService, utils } from '@ohif/core';

const DEFAULT_STATE: AppTypes.ViewportGrid.State = {
  activeViewportId: null,
  layout: {
    numRows: 0,
    numCols: 0,
    layoutType: 'grid',
  },
  // this flag is used to determine if the hanging protocol layout is active
  // so that we can inherit the viewport options from the previous state
  // otherwise we will not allow that. Basically the issue is that we need
  // to be able to come out of the hanging protocol layout and go back to the
  // regular layout e.g., if we are in the MPR hanging protocol, and someone use
  // 1x1 layout by custom layout selector, there is no way to drag and drop
  // a non-reconstructible series to the viewport since it will always
  // inherit the hanging protocol layout options (volume viewport),
  // so we need to be able to switch back to the regular layout.
  isHangingProtocolLayout: false,
  // Viewports structure has been changed to Map (previously it was
  // tied to the viewportIndex which caused multiple issues. Now we have
  // moved completely to viewportId which is unique for each viewport.
  viewports: new Map(
    Object.entries({
      default: {
        viewportId: 'default',
        displaySetInstanceUIDs: [],
        isReady: false,
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

const determineActiveViewportId = (
  state: AppTypes.ViewportGrid.State,
  newViewports: Map<string, AppTypes.ViewportGrid.Viewport>
) => {
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

  const filteredNewViewports = Array.from(newViewports.values()).filter(
    viewport => viewport.displaySetInstanceUIDs?.length > 0
  );

  const sortedViewports = Array.from(filteredNewViewports.values()).sort((a, b) => {
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

// Define the API interface
interface ViewportGridApi {
  getState: () => AppTypes.ViewportGrid.State;
  setActiveViewportId: (index: string) => void;
  setDisplaySetsForViewport: (props: any) => void;
  setDisplaySetsForViewports: (props: any[]) => void;
  setLayout: (layout: AppTypes.ViewportGrid.Layout) => void;
  reset: () => void;
  set: (gridLayoutState: Partial<AppTypes.ViewportGrid.State>) => void;
  getNumViewportPanes: () => number;
  setViewportIsReady: (viewportId: string, isReady: boolean) => void;
  getGridViewportsReady: () => boolean;
  getActiveViewportOptionByKey: (key: string) => any;
  setViewportGridSizeChanged: (props: any) => void;
  publishViewportsReady: () => void;
  getDisplaySetsUIDsForViewport: (viewportId: string) => string[];
  isReferenceViewable: (viewportId: string, viewRef, options?) => boolean;
}

// Update the context type
export const ViewportGridContext = createContext<[AppTypes.ViewportGrid.State, ViewportGridApi]>([
  DEFAULT_STATE,
  {} as ViewportGridApi,
]);

// Update the provider props type
interface ViewportGridProviderProps {
  children: ReactNode;
  service: ViewportGridService;
}

export function ViewportGridProvider({ children, service }: ViewportGridProviderProps) {
  const viewportGridReducer = (state: AppTypes.ViewportGrid.State, action) => {
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

          // remove options that were meant for one time usage
          if (previousViewport?.viewportOptions?.initialImageOptions) {
            const { useOnce } = previousViewport.viewportOptions.initialImageOptions;
            if (useOnce) {
              previousViewport.viewportOptions.initialImageOptions = null;
            }
          }

          // Use the newly provide viewportOptions and display set options
          // when provided, and otherwise fall back to the previous ones.
          // That allows for easy updates of just the display set.
          let viewportOptions = merge(
            {},
            previousViewport?.viewportOptions,
            updatedViewport?.viewportOptions
          );

          const displaySetOptions = updatedViewport?.displaySetOptions || [];
          if (!displaySetOptions.length) {
            // Copy all the display set options, assuming a full set of displaySet UID's is provided.
            if (state.isHangingProtocolLayout) {
              displaySetOptions.push(...(previousViewport.displaySetOptions || []));
            }
            if (!displaySetOptions.length) {
              displaySetOptions.push({});
            }
          }

          // if it is not part of the hanging protocol layout, we should remove the toolGroupId
          // and viewportType from the viewportOptions so that it doesn't
          // inherit the hanging protocol layout options, only when
          // the viewport options is not provided (e.g., when drag and drop)
          // otherwise, programmatically set options should be preserved
          if (!updatedViewport.viewportOptions && !state.isHangingProtocolLayout) {
            viewportOptions = {
              viewportId: viewportOptions.viewportId,
            };
          }

          const newViewport = {
            ...previousViewport,
            displaySetInstanceUIDs,
            viewportOptions,
            displaySetOptions,
            // viewportLabel: getViewportLabel(viewports, viewportId),
          };

          viewportOptions.presentationIds = service.getPresentationIds({
            viewport: newViewport,
            viewports,
          });

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
          isHangingProtocolLayout,
        } = action.payload;

        // If empty viewportOptions, we use numRow and numCols to calculate number of viewports
        const hasOptions = layoutOptions?.length;
        const viewports = new Map<string, AppTypes.ViewportGrid.Viewport>();
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

            let xPos, yPos, w, h;
            if (layoutOptions && layoutOptions[position]) {
              ({ x: xPos, y: yPos, width: w, height: h } = layoutOptions[position]);
            } else {
              w = 1 / numCols;
              h = 1 / numRows;
              xPos = col * w;
              yPos = row * h;
            }

            const colIndex = Math.round(xPos * numCols);
            const rowIndex = Math.round(yPos * numRows);

            const positionId = layoutOption?.positionId || `${colIndex}-${rowIndex}`;

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
              viewport.viewportOptions = viewport.viewportOptions || {};
              viewport.viewportOptions.viewportId = `viewport-${randomUID}`;
            }

            viewport.viewportId = viewport.viewportOptions.viewportId;

            // Create a new viewport object as it is getting updated here
            // and it is part of the read only state
            viewports.set(viewport.viewportId, viewport);

            Object.assign(viewport, {
              width: w,
              height: h,
              x: xPos,
              y: yPos,
            });

            viewport.isReady = false;

            if (!viewport.viewportOptions.presentationIds) {
              const presentationIds = service.getPresentationIds({
                viewport,
                viewports,
              });
              viewport.viewportOptions.presentationIds = presentationIds;
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
          isHangingProtocolLayout,
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

      case 'VIEWPORT_IS_READY': {
        const { viewportId, isReady } = action.payload;
        const viewports = new Map(state.viewports);
        const viewport = viewports.get(viewportId);
        if (!viewport) {
          return;
        }

        viewports.set(viewportId, {
          ...viewport,
          isReady,
        });

        return {
          ...state,
          viewports,
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

  const setViewportIsReady = useCallback(
    (viewportId, isReady) => {
      dispatch({
        type: 'VIEWPORT_IS_READY',
        payload: {
          viewportId,
          isReady,
        },
      });
    },
    [dispatch, viewportGridState]
  );

  const getGridViewportsReady = useCallback(() => {
    const { viewports } = viewportGridState;
    const readyViewports = Array.from(viewports.values()).filter(viewport => viewport.isReady);
    return readyViewports.length === viewports.size;
  }, [viewportGridState]);

  const setLayout = useCallback(
    ({
      layoutType,
      numRows,
      numCols,
      layoutOptions = [],
      activeViewportId,
      findOrCreateViewport,
      isHangingProtocolLayout,
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
          isHangingProtocolLayout,
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

  const getViewportState = useCallback(
    viewportId => {
      const { viewports } = viewportGridState;
      return viewports.get(viewportId);
    },
    [viewportGridState]
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
        isReferenceViewable: () => false,
        setLayout,
        reset,
        onModeExit: reset,
        set,
        getNumViewportPanes,
        setViewportIsReady,
        getViewportState,
        getGridViewportsReady,
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
    setViewportIsReady,
    getGridViewportsReady,
    getViewportState,
  ]);

  // run many of the calls through the service itself since we want to publish events
  const api = {
    getState,
    setActiveViewportId: index => service.setActiveViewportId(index),
    setDisplaySetsForViewport: props => service.setDisplaySetsForViewports([props]),
    setDisplaySetsForViewports: props => service.setDisplaySetsForViewports(props),
    isReferenceViewable: (viewportId, isReferenceViewable, options) =>
      service.isReferenceViewable(viewportId, isReferenceViewable, options),
    setLayout: layout => service.setLayout(layout),
    getViewportState: viewportId => service.getViewportState(viewportId),
    reset: () => service.reset(),
    set: gridLayoutState => service.setState(gridLayoutState), // run it through the service itself since we want to publish events
    getNumViewportPanes,
    setViewportIsReady,
    getGridViewportsReady,
    getActiveViewportOptionByKey,
    setViewportGridSizeChanged: props => service.setViewportGridSizeChanged(props),
    publishViewportsReady: () => service.publishViewportsReady(),
    getLayoutOptionsFromState: state => service.getLayoutOptionsFromState(state),
    getDisplaySetsUIDsForViewport: viewportId => service.getDisplaySetsUIDsForViewport(viewportId),
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

// Update the useViewportGrid hook
export const useViewportGrid = (): [AppTypes.ViewportGrid.State, ViewportGridApi] =>
  useContext(ViewportGridContext);
