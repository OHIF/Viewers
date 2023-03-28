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
import getPresentationIds from './getPresentationIds';

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

const isReuseableViewport = (oldViewport, newViewport) => {
  return (
    oldViewport.height === newViewport.height &&
    oldViewport.width === newViewport.width
  );
};

// Holds a global viewport counter - used to assign new id's to viewports
let viewportCounter = 5000;

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
    if (!oldId) continue;
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
    if (idSet[oldId]) continue;
    idSet[oldId] = true;
    if (isReuseableViewport(oldViewport, viewport)) {
      return {
        ...oldViewport,
        ...viewport,
        id: oldViewport.viewportId,
        viewportOptions: {
          ...oldViewport.viewportOptions,

          viewportId: oldViewport.viewportId,
        },
      };
    }
  }
  // Find a viewport instance number different from earlier viewports
  const viewportId = 'viewport-' + viewportCounter;
  // Loop over viewport counters in case of a really long lived display
  viewportCounter = (viewportCounter + 1) % 100000;

  return {
    ...viewport,
    viewportId,
    id: viewportId,
    viewportOptions: { ...viewport.viewportOptions, viewportId },
  };
};

export function ViewportGridProvider({ children, service }) {
  const viewportGridReducer = (state, action) => {
    switch (action.type) {
      case 'SET_ACTIVE_VIEWPORT_INDEX': {
        return { ...state, ...{ activeViewportIndex: action.payload } };
      }

      /**
       * Sets the display sets for multiple viewports.
       * This is a replacement for the older set display set for viewport (single)
       * because the old one had a race conditions wherein the viewports could
       * render partially in various ways causing exceptions.
       */
      case 'SET_DISPLAYSETS_FOR_VIEWPORTS': {
        const { payload } = action;
        const viewports = state.viewports.slice();

        // Don't reuse any viewports here.
        const idSet = state.viewports.reduce((accumulator, viewport) => {
          accumulator[viewport.viewportOptions.viewportId] = true;
          return accumulator;
        }, {});

        for (const updatedViewport of payload) {
          // Note: there should be no inheritance happening at this level,
          // we can't assume the new displaySet can inherit the previous
          // displaySet's or viewportOptions at all. For instance, dragging
          // and dropping a SEG/RT displaySet without any viewportOptions
          // or displaySetOptions should not inherit the previous displaySet's
          // which might have been a PDF Viewport. The viewport itself
          // will deal with inheritance if required. Here is just a simple
          // provider.
          const { viewportIndex, displaySetInstanceUIDs } = updatedViewport;
          const previousViewport = viewports[viewportIndex] || {};
          const viewportOptions = { ...updatedViewport.viewportOptions };

          const displaySetOptions = updatedViewport.displaySetOptions || [];
          if (displaySetOptions.length === 0) {
            // Only copy index 0, as that is all that is currently supported by this
            // method call.
            displaySetOptions.push({
              ...previousViewport.displaySetOptions?.[0],
            });
          }

          let newView = {
            ...previousViewport,
            displaySetInstanceUIDs,
            viewportOptions,
            displaySetOptions,
            viewportLabel: viewportLabels[viewportIndex],
          };
          viewportOptions.presentationIds = getPresentationIds(
            newView,
            viewports
          );

          newView = reuseViewport(idSet, newView, state.viewports);

          viewports[viewportIndex] = newView;
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

        activeViewportIndexToSet = activeViewportIndexToSet ?? 0;

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
          if (!viewport.viewportOptions.presentationIds) {
            viewport.viewportOptions.presentationIds = getPresentationIds(
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

  const api = {
    getState,
    setActiveViewportIndex: index => service.setActiveViewportIndex(index), // run it through the service itself since we want to publish events
    setDisplaySetsForViewports,
    setLayout: layout => service.setLayout(layout), // run it through the service itself since we want to publish events
    reset,
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
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }).isRequired,
};

export const useViewportGrid = () => useContext(ViewportGridContext);
