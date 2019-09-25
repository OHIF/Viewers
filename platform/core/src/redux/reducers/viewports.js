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
  activeViewportIndex: 0,
  layout: {
    viewports: [
      {
        // plugin: 'cornerstone',
        height: '100%',
        width: '100%',
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
    case SET_VIEWPORT_LAYOUT:
      return Object.assign({}, state, { layout: action.layout });
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
