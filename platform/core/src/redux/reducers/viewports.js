import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';

import {
  CLEAR_VIEWPORT,
  SET_ACTIVE_SPECIFIC_DATA,
  SET_SPECIFIC_DATA,
  SET_VIEWPORT,
  SET_VIEWPORT_ACTIVE,
  SET_VIEWPORT_LAYOUT,
  SET_VIEWPORT_LAYOUT_AND_DATA,
} from './../constants/ActionTypes.js';

const DEFAULT_STATE = {
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
 * The definition of a viewport action.
 *
 * @typedef {Object} ViewportAction
 * @property {string} type -
 * @property {Object} data -
 * @property {Object} layout -
 * @property {number} viewportIndex -
 * @property {Object} viewportSpecificData -
 */

/**
 * @param {Object} [state=DEFAULT_STATE] The current viewport state.
 * @param {ViewportAction} action A viewport action.
 */
const viewports = (state = DEFAULT_STATE, action) => {
  let useActiveViewport = false;

  switch (action.type) {
    /**
     * Sets the active viewport index.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT_ACTIVE: {
      return { ...state, activeViewportIndex: action.viewportIndex };
    }

    /**
     * Sets viewport layout.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT_LAYOUT: {
      return {
        ...state,
        numRows: action.numRows,
        numColumns: action.numColumns,
        layout: { viewports: [...action.viewports] },
      };
    }

    /**
     * Sets viewport layout and data.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT_LAYOUT_AND_DATA: {
      return {
        ...state,
        numRows: action.numRows,
        numColumns: action.numColumns,
        layout: { viewports: [...action.viewports] },
        viewportSpecificData: cloneDeep(action.viewportSpecificData),
      };
    }

    /**
     * Sets viewport specific data of active viewport.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT: {
      const layout = cloneDeep(state.layout);

      let viewportSpecificData = cloneDeep(state.viewportSpecificData);
      viewportSpecificData[action.viewportIndex] = merge(
        {},
        viewportSpecificData[action.viewportIndex],
        action.viewportSpecificData
      );

      if (action.viewportSpecificData && action.viewportSpecificData.plugin) {
        layout.viewports[action.viewportIndex].plugin =
          action.viewportSpecificData.plugin;
      }

      return { ...state, layout, viewportSpecificData };
    }

    /**
     * Sets viewport specific data of active/any viewport.
     *
     * @return {Object} New state.
     */
    case SET_ACTIVE_SPECIFIC_DATA:
      useActiveViewport = true;
    // Allow fall-through
    // eslint-disable-next-line
    case SET_SPECIFIC_DATA: {
      const layout = cloneDeep(state.layout);
      const viewportIndex = useActiveViewport
        ? state.activeViewportIndex
        : action.viewportIndex;

      let viewportSpecificData = cloneDeep(state.viewportSpecificData);
      viewportSpecificData[viewportIndex] = {
        ...action.viewportSpecificData,
      };

      if (action.viewportSpecificData && action.viewportSpecificData.plugin) {
        layout.viewports[viewportIndex].plugin =
          action.viewportSpecificData.plugin;
      }

      return { ...state, layout, viewportSpecificData };
    }

    /**
     * Clears viewport specific data of any viewport.
     *
     * @return {Object} New state.
     */
    case CLEAR_VIEWPORT: {
      let viewportSpecificData = cloneDeep(state.viewportSpecificData);

      if (action.viewportIndex) {
        viewportSpecificData[action.viewportIndex] = {};
        return { ...state, viewportSpecificData };
      } else {
        return DEFAULT_STATE;
      }
    }

    /**
     * Returns the current application state.
     *
     * @return {Object} The current state.
     */
    default: {
      return state;
    }
  }
};

export default viewports;
