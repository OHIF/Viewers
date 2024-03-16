import { Types, getRenderingEngine, utilities } from '@cornerstonejs/core';

export default function calculateViewportRegistrations(viewports: Types.IViewportId[]) {
  const viewportPairs = _getViewportPairs(viewports);

  for (const [viewport, nextViewport] of viewportPairs) {
    // check if they are in the same Frame of Reference
    const renderingEngine1 = getRenderingEngine(viewport.renderingEngineId);
    const renderingEngine2 = getRenderingEngine(nextViewport.renderingEngineId);

    const csViewport1 = renderingEngine1.getViewport(viewport.viewportId);
    const csViewport2 = renderingEngine2.getViewport(nextViewport.viewportId);

    utilities.calculateViewportsSpatialRegistration(csViewport1, csViewport2);
  }
}

const _getViewportPairs = (viewports: Types.IViewportId[]) => {
  const viewportPairs = [];

  for (let i = 0; i < viewports.length; i++) {
    for (let j = i + 1; j < viewports.length; j++) {
      viewportPairs.push([viewports[i], viewports[j]]);
    }
  }

  return viewportPairs;
};
