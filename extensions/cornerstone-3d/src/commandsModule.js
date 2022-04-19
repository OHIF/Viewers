import * as cornerstone3D from '@cornerstonejs/core';
import * as cornerstone3DTools from '@cornerstonejs/tools';
import Cornerstone3DViewportService from './services/ViewportService/Cornerstone3DViewportService';
import { Enums } from '@cornerstonejs/tools';

import { getEnabledElement } from './state';

const commandsModule = ({ servicesManager }) => {
  const { ViewportGridService, ToolGroupService } = servicesManager.services;

  function _getActiveViewportEnabledElement() {
    const { activeViewportIndex } = ViewportGridService.getState();
    const { element } = getEnabledElement(activeViewportIndex) || {};
    const enabledElement = cornerstone3D.getEnabledElement(element);
    return enabledElement;
  }

  const actions = {
    getActiveViewportEnabledElement: () => {
      return _getActiveViewportEnabledElement();
    },
    setWindowLevel({ windowLevel, toolGroupId }) {
      const { window: windowWidth, level: windowCenter } = windowLevel;
      // convert to numbers
      const windowWidthNum = Number(windowWidth);
      const windowCenterNum = Number(windowCenter);

      const { viewportId } = _getActiveViewportEnabledElement();
      const viewportToolGroupId = ToolGroupService.getToolGroupForViewport(
        viewportId
      );

      if (toolGroupId !== viewportToolGroupId) {
        return;
      }

      // get actor from the viewport
      const renderingEngine = Cornerstone3DViewportService.getRenderingEngine();
      const viewport = renderingEngine.getViewport(viewportId);

      const lower = windowCenterNum - windowWidthNum / 2.0;
      const upper = windowCenterNum + windowWidthNum / 2.0;

      if (viewport instanceof cornerstone3D.StackViewport) {
        viewport.setProperties({
          voiRange: {
            upper,
            lower,
          },
        });

        viewport.render();
      }
    },
    setToolActive: ({ toolName, toolGroupId = null }) => {
      let toolGroupIdToUse = toolGroupId;

      if (!toolGroupIdToUse) {
        // Use the active viewport's tool group if no tool group id is provided
        const enabledElement = _getActiveViewportEnabledElement();

        if (!enabledElement) {
          return;
        }

        const { renderingEngineId, viewportId } = enabledElement;
        const toolGroup = cornerstone3DTools.ToolGroupManager.getToolGroupForViewport(
          viewportId,
          renderingEngineId
        );

        if (!toolGroup) {
          console.warn(
            'No tool group found for viewportId:',
            viewportId,
            'and renderingEngineId:',
            renderingEngineId
          );
        }

        toolGroupIdToUse = toolGroup.id;
      }

      const toolGroup = ToolGroupService.getToolGroup(toolGroupIdToUse);

      if (!toolGroup) {
        throw new Error(
          `setToolActive: toolGroup with id ${toolGroupIdToUse} does not exist`
        );
      }

      const { viewports } = ViewportGridService.getState() || {
        viewports: [],
      };

      const toolGroupViewportIds = toolGroup.getViewportIds();

      // iterate over all viewports and set the tool active for the
      // viewports that belong to the toolGroup
      for (let index = 0; index < viewports.length; index++) {
        const { element } = getEnabledElement(index);

        const viewport = cornerstone3D.getEnabledElement(element);

        if (!viewport) {
          continue;
        }

        // only use the toolGroup viewport
        if (!toolGroupViewportIds.includes(viewport.viewportId)) {
          continue;
        }

        // Find the current active tool and set it to be passive
        const activeTool = toolGroup.getActivePrimaryMouseButtonTool();

        if (activeTool) {
          toolGroup.setToolPassive(activeTool);
        }

        // Set the new toolName to be active
        toolGroup.setToolActive(toolName, {
          bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
        });

        return;
      }
    },
    rotateViewport: ({ rotation }) => {
      const enabledElement = _getActiveViewportEnabledElement();
      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      if (viewport instanceof cornerstone3D.StackViewport) {
        const { rotation: currentRotation } = viewport.getProperties();

        viewport.setProperties({ rotation: currentRotation + rotation });
        viewport.render();
      }
    },
    flipViewportHorizontal: () => {
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      if (viewport instanceof cornerstone3D.StackViewport) {
        const { flipHorizontal } = viewport.getProperties();
        viewport.setProperties({ flipHorizontal: !flipHorizontal });
        viewport.render();
      }
    },
    flipViewportVertical: () => {
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      if (viewport instanceof cornerstone3D.StackViewport) {
        const { flipVertical } = viewport.getProperties();
        viewport.setProperties({ flipVertical: !flipVertical });
        viewport.render();
      }
    },
    invertViewport: ({ element }) => {
      let enabledElement;

      if (element === undefined) {
        enabledElement = _getActiveViewportEnabledElement();
      } else {
        enabledElement = element;
      }

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      if (viewport instanceof cornerstone3D.StackViewport) {
        const { invert } = viewport.getProperties();
        viewport.setProperties({ invert: !invert });
        viewport.render();
      }
    },
    resetViewport: () => {
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      if (viewport instanceof cornerstone3D.StackViewport) {
        viewport.resetProperties();
        viewport.resetCamera();
        viewport.render();
      }
    },
    scaleViewport: ({ direction }) => {
      const enabledElement = _getActiveViewportEnabledElement();
      const scaleFactor = direction > 0 ? 0.9 : 1.1;

      if (!enabledElement) {
        return;
      }
      const { viewport } = enabledElement;

      if (viewport instanceof cornerstone3D.StackViewport) {
        if (direction) {
          const { parallelScale } = viewport.getCamera();
          viewport.setCamera({ parallelScale: parallelScale * scaleFactor });
          viewport.render();
        } else {
          viewport.resetCamera();
          viewport.render();
        }
      }
    },
    scroll: ({ direction }) => {
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      let options = {};
      if (viewport instanceof cornerstone3D.StackViewport) {
        options = { direction };
      } else {
        throw new Error('scroll: volume viewport is not supported yet');
      }

      cornerstone3DTools.utilities.stackScrollTool.scrollThroughStack(
        viewport,
        options
      );
    },
  };

  const definitions = {
    setWindowLevel: {
      commandFn: actions.setWindowLevel,
      storeContexts: [],
      options: {},
    },
    setToolActive: {
      commandFn: actions.setToolActive,
      storeContexts: [],
      options: {},
    },
    rotateViewportCW: {
      commandFn: actions.rotateViewport,
      storeContexts: [],
      options: { rotation: 90 },
    },
    rotateViewportCCW: {
      commandFn: actions.rotateViewport,
      storeContexts: [],
      options: { rotation: -90 },
    },
    flipViewportHorizontal: {
      commandFn: actions.flipViewportHorizontal,
      storeContexts: [],
      options: {},
    },
    flipViewportVertical: {
      commandFn: actions.flipViewportVertical,
      storeContexts: [],
      options: {},
    },
    invertViewport: {
      commandFn: actions.invertViewport,
      storeContexts: [],
      options: {},
    },
    resetViewport: {
      commandFn: actions.resetViewport,
      storeContexts: [],
      options: {},
    },
    scaleUpViewport: {
      commandFn: actions.scaleViewport,
      storeContexts: [],
      options: { direction: 1 },
    },
    scaleDownViewport: {
      commandFn: actions.scaleViewport,
      storeContexts: [],
      options: { direction: -1 },
    },
    fitViewportToWindow: {
      commandFn: actions.scaleViewport,
      storeContexts: [],
      options: { direction: 0 },
    },
    nextImage: {
      commandFn: actions.scroll,
      storeContexts: [],
      options: { direction: 1 },
    },
    previousImage: {
      commandFn: actions.scroll,
      storeContexts: [],
      options: { direction: -1 },
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE3D',
  };
};

export default commandsModule;
