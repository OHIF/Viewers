import {
  getEnabledElement,
  StackViewport,
  utilities as csUtils,
} from '@cornerstonejs/core';
import {
  ToolGroupManager,
  Enums,
  utilities as cstUtils,
  ReferenceLinesTool,
} from '@cornerstonejs/tools';

import { getEnabledElement as OHIFgetEnabledElement } from './state';
import CornerstoneViewportDownloadForm from './utils/CornerstoneViewportDownloadForm';
import callInputDialog from './utils/callInputDialog';
import { setColormap } from './utils/colormap/transferFunctionHelpers';
import toggleMPRHangingProtocol from './utils/mpr/toggleMPRHangingProtocol';
import toggleStackImageSync from './utils/stackSync/toggleStackImageSync';

const commandsModule = ({ servicesManager }) => {
  const {
    ViewportGridService,
    ToolGroupService,
    CineService,
    ToolBarService,
    UIDialogService,
    CornerstoneViewportService,
    HangingProtocolService,
    UINotificationService,
  } = servicesManager.services;

  function _getActiveViewportEnabledElement() {
    const { activeViewportIndex } = ViewportGridService.getState();
    const { element } = OHIFgetEnabledElement(activeViewportIndex) || {};
    const enabledElement = getEnabledElement(element);
    return enabledElement;
  }

  function _getToolGroup(toolGroupId) {
    let toolGroupIdToUse = toolGroupId;

    if (!toolGroupIdToUse) {
      // Use the active viewport's tool group if no tool group id is provided
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { renderingEngineId, viewportId } = enabledElement;
      const toolGroup = ToolGroupManager.getToolGroupForViewport(
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
        return;
      }

      toolGroupIdToUse = toolGroup.id;
    }

    const toolGroup = ToolGroupService.getToolGroup(toolGroupIdToUse);
    return toolGroup;
  }

  const actions = {
    getActiveViewportEnabledElement: () => {
      return _getActiveViewportEnabledElement();
    },
    setViewportActive: ({ viewportId }) => {
      const viewportInfo = CornerstoneViewportService.getViewportInfo(
        viewportId
      );
      if (!viewportInfo) {
        console.warn('No viewport found for viewportId:', viewportId);
        return;
      }

      const viewportIndex = viewportInfo.getViewportIndex();
      ViewportGridService.setActiveViewportIndex(viewportIndex);
    },
    arrowTextCallback: ({ callback, data }) => {
      callInputDialog(UIDialogService, data, callback);
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
    setWindowLevel({ window, level, toolGroupId }) {
      // convert to numbers
      const windowWidthNum = Number(window);
      const windowCenterNum = Number(level);

      const { viewportId } = _getActiveViewportEnabledElement();
      const viewportToolGroupId = ToolGroupService.getToolGroupForViewport(
        viewportId
      );

      if (toolGroupId && toolGroupId !== viewportToolGroupId) {
        return;
      }

      // get actor from the viewport
      const renderingEngine = CornerstoneViewportService.getRenderingEngine();
      const viewport = renderingEngine.getViewport(viewportId);

      const { lower, upper } = csUtils.windowLevel.toLowHighRange(
        windowWidthNum,
        windowCenterNum
      );

      viewport.setProperties({
        voiRange: {
          upper,
          lower,
        },
      });
      viewport.render();
    },
    setToolActive: ({ toolName, toolGroupId = null }) => {
      if (toolName === 'Crosshairs') {
        const activeViewportToolGroup = _getToolGroup(null);

        if (!activeViewportToolGroup._toolInstances.Crosshairs) {
          UINotificationService.show({
            title: 'Crosshairs',
            message:
              'You need to be in a MPR view to use Crosshairs. Click on MPR button in the toolbar to activate it.',
            type: 'info',
            duration: 3000,
          });

          throw new Error('Crosshairs tool is not available in this viewport');
        }
      }

      const { viewports } = ViewportGridService.getState() || {
        viewports: [],
      };

      const toolGroup = _getToolGroup(toolGroupId);
      const toolGroupViewportIds = toolGroup.getViewportIds();

      // if toolGroup has been destroyed, or its viewports have been removed
      if (!toolGroupViewportIds || !toolGroupViewportIds.length) {
        return;
      }

      const filteredViewports = viewports.filter(viewport => {
        if (!viewport.viewportOptions) {
          return false;
        }

        return toolGroupViewportIds.includes(
          viewport.viewportOptions.viewportId
        );
      });

      if (!filteredViewports.length) {
        return;
      }

      const activeToolName = toolGroup.getActivePrimaryMouseButtonTool();

      if (activeToolName) {
        // Todo: this is a hack to prevent the crosshairs to stick around
        // after another tool is selected. We should find a better way to do this
        if (activeToolName === 'Crosshairs') {
          toolGroup.setToolDisabled(activeToolName);
        } else {
          toolGroup.setToolPassive(activeToolName);
        }
      }
      // Set the new toolName to be active
      toolGroup.setToolActive(toolName, {
        bindings: [
          {
            mouseButton: Enums.MouseBindings.Primary,
          },
        ],
      });
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
            CornerstoneViewportService,
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

      if (viewport instanceof StackViewport) {
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

      if (viewport instanceof StackViewport) {
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

      if (viewport instanceof StackViewport) {
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

      if (viewport instanceof StackViewport) {
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

      if (viewport instanceof StackViewport) {
        viewport.resetProperties();
        viewport.resetCamera();
      } else {
        // Todo: add reset properties for volume viewport
        viewport.resetCamera();
      }

      viewport.render();
    },
    scaleViewport: ({ direction }) => {
      const enabledElement = _getActiveViewportEnabledElement();
      const scaleFactor = direction > 0 ? 0.9 : 1.1;

      if (!enabledElement) {
        return;
      }
      const { viewport } = enabledElement;

      if (viewport instanceof StackViewport) {
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

      cstUtils.scroll(viewport, options);
    },
    setViewportColormap: ({
      viewportIndex,
      displaySetInstanceUID,
      colormap,
      immediate = false,
    }) => {
      const viewport = CornerstoneViewportService.getCornerstoneViewportByIndex(
        viewportIndex
      );

      const actorEntries = viewport.getActors();

      const actorEntry = actorEntries.find(actorEntry => {
        return actorEntry.uid.includes(displaySetInstanceUID);
      });

      const { actor: volumeActor } = actorEntry;

      setColormap(volumeActor, colormap);

      if (immediate) {
        viewport.render();
      }
    },
    incrementActiveViewport: () => {
      const { activeViewportIndex, viewports } = ViewportGridService.getState();
      const nextViewportIndex = (activeViewportIndex + 1) % viewports.length;
      ViewportGridService.setActiveViewportIndex(nextViewportIndex);
    },
    decrementActiveViewport: () => {
      const { activeViewportIndex, viewports } = ViewportGridService.getState();
      const nextViewportIndex =
        (activeViewportIndex - 1 + viewports.length) % viewports.length;
      ViewportGridService.setActiveViewportIndex(nextViewportIndex);
    },
    setHangingProtocol: ({ protocolId }) => {
      HangingProtocolService.setProtocol(protocolId);
    },
    toggleMPR: ({ toggledState }) => {
      toggleMPRHangingProtocol({
        toggledState,
        servicesManager,
        getToolGroup: _getToolGroup,
      });
    },
    toggleStackImageSync: ({ toggledState }) => {
      toggleStackImageSync({
        getEnabledElement,
        servicesManager,
        toggledState,
      });
    },
    toggleReferenceLines: ({ toggledState }) => {
      const { activeViewportIndex } = ViewportGridService.getState();
      const viewportInfo = CornerstoneViewportService.getViewportInfoByIndex(
        activeViewportIndex
      );

      const viewportId = viewportInfo.getViewportId();
      const toolGroup = ToolGroupService.getToolGroupForViewport(viewportId);

      if (!toggledState) {
        toolGroup.setToolDisabled(ReferenceLinesTool.toolName);
      }

      toolGroup.setToolConfiguration(
        ReferenceLinesTool.toolName,
        {
          sourceViewportId: viewportId,
        },
        true // overwrite
      );
      toolGroup.setToolEnabled(ReferenceLinesTool.toolName);
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
    incrementActiveViewport: {
      commandFn: actions.incrementActiveViewport,
      storeContexts: [],
    },
    decrementActiveViewport: {
      commandFn: actions.decrementActiveViewport,
      storeContexts: [],
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
    arrowTextCallback: {
      commandFn: actions.arrowTextCallback,
      storeContexts: [],
      options: {},
    },
    setViewportActive: {
      commandFn: actions.setViewportActive,
      storeContexts: [],
      options: {},
    },
    setViewportColormap: {
      commandFn: actions.setViewportColormap,
      storeContexts: [],
      options: {},
    },
    setHangingProtocol: {
      commandFn: actions.setHangingProtocol,
      storeContexts: [],
      options: {},
    },
    toggleMPR: {
      commandFn: actions.toggleMPR,
      storeContexts: [],
      options: {},
    },
    toggleStackImageSync: {
      commandFn: actions.toggleStackImageSync,
      storeContexts: [],
      options: {},
    },
    toggleReferenceLines: {
      commandFn: actions.toggleReferenceLines,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE',
  };
};

export default commandsModule;
