import {
  CLEAR_VIEWPORT,
  SET_VIEWPORT_ACTIVE,
  SET_VIEWPORT_LAYOUT,
  UPDATE_VIEWPORT,
  SET_VIEWPORT_LAYOUT_AND_VIEWPORT_PANES,
} from './../constants/ActionTypes.js';

import cloneDeep from 'lodash.clonedeep';

const defaultState = {
  numRows: 1,
  numColumns: 1,
  viewportPanes: [
    // Initial layout is one empty viewport
    {
      // authorizationHeaders: object
      // plugin: string
      // wadoUri: string
    },
  ],
  activeViewportIndex: 0,
};

/**
 * @param {Object} [state=defaultState]
 * @param {Object} action
 * @param {string} [action.type]
 * @param {number} [action.viewportIndex]

 */
const viewports = (state = defaultState, action) => {
  // console.log(`~~~~ VIEWPORTS REDUCER: ${action.type}`);
  // console.warn('STATE', state);
  // console.warn('ACTION:', action);
  switch (action.type) {
    case CLEAR_VIEWPORT:
      const { viewportIndex } = action;
      const viewportPanes = cloneDeep(state.viewportPanes);

      // Clear Viewport
      if (viewportIndex) {
        viewportPanes[viewportIndex] = {};
        return Object.assign({}, state, { viewportPanes });
      }
      // Clear ALL Viewports
      else {
        return defaultState;
      }
    // Update active viewport
    case SET_VIEWPORT_ACTIVE:
      return Object.assign({}, state, {
        activeViewportIndex: action.viewportIndex,
      });

    // Currently, our layout supports a grid defined by number of rows,
    // and number of columns. This creates a grid that our viewport panes
    // snap to. In a future iteration, viewport panes could be updated to
    // span multiple rows and/or columns.
    //
    // Number of rows, columns, and viewport panes
    case SET_VIEWPORT_LAYOUT: {
      const { numRows, numColumns } = action;
      const numViewportPanes = numRows * numColumns;
      const viewportPanes = cloneDeep(state.viewportPanes);

      // Add or Remove until correct length
      while (viewportPanes.length < numViewportPanes) {
        viewportPanes.push({});
      }
      while (viewportPanes.length > numViewportPanes) {
        viewportPanes.pop();
      }

      return Object.assign({}, state, { numRows, numColumns, viewportPanes });
    }
    // set single viewport
    case UPDATE_VIEWPORT: {
      const { viewportIndex, viewport } = action;
      const {
        // Ids
        studyInstanceUid,
        seriesInstanceUid,
        displaySetInstanceUid,
        sopInstanceUid,
        sopClassUids,
        // Request
        authorizationHeaders,
        wadoRoot,
        wadoUri,
        // Viewport
        plugin,
        frameIndex,
      } = viewport;

      // Updating
      const viewportPanes = cloneDeep(state.viewportPanes);
      viewportPanes[viewportIndex] = Object.assign(
        {},
        viewportPanes[viewportIndex],
        {
          studyInstanceUid,
          seriesInstanceUid,
          displaySetInstanceUid,
          sopInstanceUid,
          sopClassUids,
          //Request
          authorizationHeaders,
          wadoRoot,
          wadoUri,
          //
          plugin,
          frameIndex,
        }
      );

      return Object.assign({}, state, { viewportPanes });
    }
    case SET_VIEWPORT_LAYOUT_AND_VIEWPORT_PANES: {
      const {
        numRows,
        numColumns,
        viewportPanes: updatedViewportPanes,
      } = action;

      const viewportPanes = cloneDeep(updatedViewportPanes);

      return Object.assign({}, state, { numRows, numColumns, viewportPanes });
    }
    default:
      return state;
  }
};

export default viewports;
