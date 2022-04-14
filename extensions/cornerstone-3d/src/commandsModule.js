import * as cornerstone3D from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';

import { getEnabledElement } from './state';

const commandsModule = ({ servicesManager }) => {
  const {
    ViewportGridService,
    ToolGroupService,
    ViewportService,
  } = servicesManager.services;

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
      const renderingEngine = ViewportService.getRenderingEngine();
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
        const toolGroupIds = ToolGroupService.getToolGroupIds();

        if (toolGroupIds.length !== 1) {
          throw new Error(
            'setToolActive requires a toolGroupId if there are multiple tool groups'
          );
        }

        toolGroupIdToUse = toolGroupIds[0];
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
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE3D',
  };
};

export default commandsModule;
