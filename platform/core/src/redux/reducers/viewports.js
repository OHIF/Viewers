import {
  CLEAR_VIEWPORT,
  INIT_VIEWPORTS_LAYOUT,
  SET_ACTIVE_SPECIFIC_DATA,
  SET_VIEWPORT,
  SET_VIEWPORT_ACTIVE,
  SET_VIEWPORT_LAYOUT,
  SET_VIEWPORT_LAYOUT_AND_DATA,
} from './../constants/ActionTypes.js';
import * as viewportState from '../../utils/viewportState';

/**
 * Constants
 */

export const DEFAULT_STATE = viewportState.createState({
  custom: { initialized: false },
});

/**
 * @param {Object} [state=DEFAULT_STATE] The current viewport state.
 * @param {ViewportAction} action A viewport action.
 */
const viewports = (state = DEFAULT_STATE, action) => {
  switch (action.type) {
    /**
     * Init Viewports State
     */

    case INIT_VIEWPORTS_LAYOUT: {
      if (state.custom && !state.custom.initialized) {
        const { model, groups } = action;
        return viewportState.createState({
          layout: viewportState.createCustomLayout(model, {}, groups),
          custom: { initialized: true },
        });
      }
      return state;
    }

    /**
     * Sets the active viewport index.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT_ACTIVE: {
      const { layout, viewportSpecificData, custom } = state;
      return viewportState.createState({
        layout,
        activeViewportIndex: action.viewportIndex,
        viewportSpecificData,
        custom,
      });
    }

    /**
     * Sets viewport layout.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT_LAYOUT: {
      const { activeViewportIndex, viewportSpecificData, custom } = state;
      const layout = viewportState.createStandardLayout(
        action.numRows,
        action.numColumns,
        action.viewports
      );
      const data = viewportState.buildViewportDataList(
        viewportSpecificData,
        viewportState.getViewportCount(layout)
      );
      return viewportState.createState({
        data,
        layout,
        activeViewportIndex,
        custom,
      });
    }

    /**
     * Sets viewport layout and data.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT_LAYOUT_AND_DATA: {
      const { activeViewportIndex, custom } = state;
      const layout = viewportState.createStandardLayout(
        action.numRows,
        action.numColumns,
        action.viewports
      );
      const data = viewportState.buildViewportDataList(
        copy(action.viewportSpecificData),
        viewportState.getViewportCount(layout)
      );
      return viewportState.createState({
        data,
        layout,
        activeViewportIndex,
        custom,
      });
    }

    /**
     * Sets viewport specific data of active viewport.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT: {
      let { viewportIndex, viewportSpecificData, options } = action;
      let { layout, activeViewportIndex, custom } = state;

      const data = viewportState.buildViewportDataList(
        state.viewportSpecificData,
        viewportState.getViewportCount(layout)
      );

      options = Object(options);
      viewportIndex = viewportState.getViewportIndex(
        layout,
        Math.trunc(viewportIndex),
        Math.trunc(options.viewportGroup)
      );

      if (data && viewportIndex >= 0 && viewportIndex < data.length) {
        let viewportSpecificDataCopy = copy(viewportSpecificData);
        if (options.merge) {
          viewportSpecificDataCopy = Object.assign(
            copy(data[viewportIndex]),
            viewportSpecificDataCopy
          );
        }
        data[viewportIndex] = viewportSpecificDataCopy;
      }

      if (viewportSpecificData && viewportSpecificData.plugin) {
        layout = viewportState.setViewportSpecificAttributes(
          layout,
          viewportIndex,
          { plugin: viewportSpecificData.plugin }
        );
      }

      return viewportState.createState({
        data,
        layout,
        activeViewportIndex,
        custom,
      });
    }

    /**
     * Sets viewport specific data for active viewport.
     *
     * @return {Object} New state.
     */
    case SET_ACTIVE_SPECIFIC_DATA: {
      const { viewportSpecificData } = action;
      let { layout, activeViewportIndex, custom } = state;

      const data = viewportState.buildViewportDataList(
        state.viewportSpecificData,
        viewportState.getViewportCount(layout)
      );

      if (
        data &&
        activeViewportIndex >= 0 &&
        activeViewportIndex < data.length
      ) {
        data[activeViewportIndex] = copy(viewportSpecificData);
      }

      if (viewportSpecificData && viewportSpecificData.plugin) {
        layout = viewportState.setViewportSpecificAttributes(
          layout,
          activeViewportIndex,
          { plugin: viewportSpecificData.plugin }
        );
      }

      return viewportState.createState({
        data,
        layout,
        activeViewportIndex,
        custom,
      });
    }

    /**
     * Clears viewport specific data of any viewport.
     *
     * @return {Object} New state.
     */
    case CLEAR_VIEWPORT: {
      let { viewportIndex } = action;
      let { layout } = state;
      const viewportCount = viewportState.getViewportCount(layout);

      // Make sure viewport index is a proper integer
      viewportIndex = Math.trunc(viewportIndex);

      if (viewportIndex >= 0 && viewportIndex < viewportCount) {
        const { activeViewportIndex, custom } = state;
        const data = viewportState.buildViewportDataList(
          state.viewportSpecificData,
          viewportCount
        );
        data[viewportIndex] = undefined;
        return viewportState.createState({
          data,
          layout,
          activeViewportIndex,
          custom,
        });
      }

      return DEFAULT_STATE;
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

/**
 * Utils
 */

function copy(subject) {
  if (subject !== undefined) {
    return JSON.parse(JSON.stringify(subject));
  }
}

/**
 * Exports
 */

export default viewports;
