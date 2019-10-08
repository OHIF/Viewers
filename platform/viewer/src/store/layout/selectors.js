import { createSelector } from 'reselect';

const getActiveViewportIndex = state => state.viewports.activeViewportIndex;
const getViewportPanes = state => state.viewports.viewportPanes;

/**
 * Think of this as a computed getter for our store. It lets us watch parts of
 * our redux state, and only update/recalculate when those values change.
 */
export const getActiveContexts = createSelector(
  [getActiveViewportIndex, getViewportPanes],
  (activeViewportIndex, viewportPanes) => {
    const activeContexts = ['VIEWER'];
    const activeViewportPane = viewportPanes[activeViewportIndex] || {};
    const activeViewportPluginName = activeViewportPane.plugin || '';

    if (activeViewportPluginName) {
      const activeViewportExtension = `ACTIVE_VIEWPORT::${activeViewportPluginName.toUpperCase()}`;
      activeContexts.push(activeViewportExtension);
    }

    return activeContexts;
  }
);
