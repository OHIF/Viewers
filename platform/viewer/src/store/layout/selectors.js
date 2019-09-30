import { createSelector } from 'reselect';

const getActiveViewportIndex = state => state.viewports.activeViewportIndex;
const getViewportPanes = state => state.viewports.viewportPanes;
const getViewportSpecificData = state => state.viewports.viewportSpecificData;

/**
 * Think of this as a computed getter for our store. It lets us watch parts of
 * our redux state, and only update/recalculate when those values change.
 */
export const getActiveContexts = createSelector(
  [getActiveViewportIndex, getViewportPanes, getViewportSpecificData],
  (activeViewportIndex, viewportPanes, viewportSpecificData) => {
    const activeContexts = ['VIEWER'];
    const activeLayoutViewport = viewportPanes[activeViewportIndex] || {};
    const activeViewportSpecificData =
      viewportSpecificData[activeViewportIndex] || {};
    const activeViewportPluginName =
      activeLayoutViewport.plugin || activeViewportSpecificData.plugin;

    if (activeViewportPluginName) {
      const activeViewportExtension = `ACTIVE_VIEWPORT::${activeViewportPluginName.toUpperCase()}`;
      activeContexts.push(activeViewportExtension);
    }

    return activeContexts;
  }
);
