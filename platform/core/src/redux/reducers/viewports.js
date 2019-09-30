import {
  CLEAR_VIEWPORT,
  SET_ACTIVE_SPECIFIC_DATA,
  SET_SPECIFIC_DATA,
  SET_VIEWPORT,
  SET_VIEWPORT_ACTIVE,
  SET_VIEWPORT_LAYOUT,
  SET_VIEWPORT_LAYOUT_AND_DATA,
} from './../constants/ActionTypes.js';

import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';

const defaultState = {
  numRows: 1,
  numColumns: 1,
  viewportPanes: [
    // Initial layout is one empty viewport
    {},
  ],
  activeViewportIndex: 0,
  },
  viewportSpecificData: {},
};

/**
 * @param {Object} [state=defaultState]
 * @param {Object} action
 * @param {string} [action.type]
 * @param {number} [action.viewportIndex]
 * @param {Object} [action.layout]
 * @param {Object} [action.viewportSpecificData]
 */
const viewports = (state = defaultState, action) => {
  console.log('~~~~ VIEWPORTS REDUCER');
  let currentData;
  let viewportSpecificData;
  let useActiveViewport = false;
  switch (action.type) {
    case SET_VIEWPORT_LAYOUT_AND_DATA:
      return Object.assign({}, state, {
        viewportSpecificData: action.viewportSpecificData,
        layout: action.layout,
      });
    case SET_VIEWPORT_ACTIVE:
      return Object.assign({}, state, {
        activeViewportIndex: action.viewportIndex,
      });

    // Currently, our layout supports a grid defined by number of rows,
    // and number of columns. This creates a grid that our viewport panes
    // snap to. In a future iteration, viewport panes could be updated to
    // span multiple rows and/or columns.
    case SET_VIEWPORT_LAYOUT:
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
    case SET_VIEWPORT: {
      const { viewportIndex, data: updatedViewportSpecificData } = action;
      const plugin = updatedViewportSpecificData.plugin;

      // Updating
      const viewportSpecificData = cloneDeep(state.viewportSpecificData);
      const viewportPanes = cloneDeep(state.viewportPanes);

      // Update specific instance of ViewportSpecificData
      viewportSpecificData[viewportIndex] = merge(
        {},
        viewportSpecificData[viewportIndex],
        updatedViewportSpecificData // dom, plugin
      );

      if (plugin) {
        viewportPanes[viewportIndex].plugin = plugin;
      }

      return Object.assign({}, state, { viewportPanes, viewportSpecificData });
    }
    case SET_ACTIVE_SPECIFIC_DATA:
      useActiveViewport = true;
    // Allow fall-through
    // eslint-disable-next-line
    case SET_SPECIFIC_DATA: {
      const viewportIndex = useActiveViewport
        ? state.activeViewportIndex
        : action.viewportIndex;
      currentData = cloneDeep(state.viewportSpecificData[viewportIndex]) || {};
      viewportSpecificData = cloneDeep(state.viewportSpecificData);
      viewportSpecificData[viewportIndex] = merge({}, currentData, action.data);

      return Object.assign({}, state, { viewportSpecificData });
    }
    case CLEAR_VIEWPORT:
      viewportSpecificData = cloneDeep(state.viewportSpecificData);
      if (action.viewportIndex) {
        viewportSpecificData[action.viewportIndex] = {};
        return Object.assign({}, state, { viewportSpecificData });
      } else {
        return defaultState;
      }

    default:
      return state;
  }
};

export default viewports;
