import * as cornerstone3D from '@cornerstonejs/core';
import * as cornerstone3DTools from '@cornerstonejs/tools';
import CornerstoneViewportDownloadForm from './utils/CornerstoneViewportDownloadForm';

import { Enums } from '@cornerstonejs/tools';

import { getEnabledElement } from './state';

const commandsModule = ({ servicesManager }) => {
  const {
    ViewportGridService,
    ToolGroupService,
    CineService,
    ToolBarService,
    Cornerstone3DViewportService,
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
    toggleCine: () => {
      const { viewports } = ViewportGridService.getState();
      const { isCineEnabled } = CineService.getState();
      CineService.setIsCineEnabled(!isCineEnabled);
      ToolBarService.setButton('Cine', { props: { isActive: !isCineEnabled } });
      viewports.forEach((_, index) =>
        CineService.setCine({ id: index, isPlaying: false })
      );
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

      if (toolGroupId && toolGroupId !== viewportToolGroupId) {
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
        console.warn('No tool group found for toolGroupId:', toolGroupId);
        return;
      }
      // Todo: we need to check if the viewports of the toolGroup is actually
      // parts of the ViewportGrid's viewports, if not we return

      const { viewports } = ViewportGridService.getState() || {
        viewports: [],
      };

      const toolGroupViewportIds = toolGroup.getViewportIds();

      // iterate over all viewports and set the tool active for the
      // viewports that belong to the toolGroup
      for (let index = 0; index < viewports.length; index++) {
        const ohifEnabledElement = getEnabledElement(index);

        if (!ohifEnabledElement) {
          continue;
        }

        const viewport = cornerstone3D.getEnabledElement(
          ohifEnabledElement.element
        );

        if (!viewport) {
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
    showDownloadViewportModal: () => {
      const { activeViewportIndex } = ViewportGridService.getState();
      const { UIModalService } = servicesManager.services;

      if (UIModalService) {
        UIModalService.show({
          content: CornerstoneViewportDownloadForm,
          title: 'Download High Quality Image',
          contentProps: {
            activeViewportIndex,
            onClose: UIModalService.hide,
            Cornerstone3DViewportService,
          },
        });
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
        const newRotation = (currentRotation + rotation) % 360;
        viewport.setProperties({ rotation: newRotation });
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
        const { flipHorizontal } = viewport.getCamera();
        viewport.setCamera({ flipHorizontal: !flipHorizontal });
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
        const { flipVertical } = viewport.getCamera();
        viewport.setCamera({ flipVertical: !flipVertical });
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
      const options = { delta: direction };

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
    showDownloadViewportModal: {
      commandFn: actions.showDownloadViewportModal,
      storeContexts: [],
      options: {},
    },
    toggleCine: {
      commandFn: actions.toggleCine,
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
