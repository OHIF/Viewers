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
  activeViewportIndex: 0,
  layout: {
    viewports: [
      {
        // plugin: 'cornerstone',
      },
    ],
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
  let viewportSpecificData;
  let useActiveViewport = false;
  switch (action.type) {
    case SET_VIEWPORT_ACTIVE:
      return Object.assign({}, state, {
        activeViewportIndex: action.viewportIndex,
      });
    case SET_VIEWPORT_LAYOUT: {
      const { numRows, numColumns, viewports } = action;
      const layout = {
        viewports: [...viewports],
      };

      return Object.assign({}, state, { numRows, numColumns, layout });
    }
    case SET_VIEWPORT_LAYOUT_AND_DATA: {
      const { numRows, numColumns, viewports, viewportSpecificData } = action;
      const layout = {
        viewports: [...viewports],
      };

      return Object.assign({}, state, {
        numRows,
        numColumns,
        layout,
        viewportSpecificData: cloneDeep(viewportSpecificData),
      });
    }
    case SET_VIEWPORT: {
      const layout = cloneDeep(state.layout);
      const hasPlugin = action.data && action.data.plugin;

      viewportSpecificData = cloneDeep(state.viewportSpecificData);
      viewportSpecificData[action.viewportIndex] = merge(
        {},
        viewportSpecificData[action.viewportIndex],
        action.data
      );

      if (hasPlugin) {
        layout.viewports[action.viewportIndex].plugin = action.data.plugin;
      }

      return Object.assign({}, state, { layout, viewportSpecificData });
    }
    case SET_ACTIVE_SPECIFIC_DATA:
      useActiveViewport = true;
    // Allow fall-through
    // eslint-disable-next-line
    case SET_SPECIFIC_DATA: {
      const layout = cloneDeep(state.layout);
      const hasPlugin = action.data && action.data.plugin;
      const viewportIndex = useActiveViewport
        ? state.activeViewportIndex
        : action.viewportIndex;
      const { dom } = state.viewportSpecificData[viewportIndex];

      viewportSpecificData = cloneDeep(state.viewportSpecificData);
      viewportSpecificData[viewportIndex] = {
        dom,
        ...action.data,
      };

      if (hasPlugin) {
        layout.viewports[viewportIndex].plugin = action.data.plugin;
      }

      return Object.assign({}, state, { layout, viewportSpecificData });
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
