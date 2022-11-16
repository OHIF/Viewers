import {
  getEnabledElement,
  StackViewport,
  utilities as csUtils,
} from '@cornerstonejs/core';
import {
  ToolGroupManager,
  Enums,
  utilities as cstUtils,
  segmentation as cstSegmentation,
  ReferenceLinesTool,
  synchronizers as cstSynchronizers,
} from '@cornerstonejs/tools';

import CornerstoneViewportDownloadForm from './utils/CornerstoneViewportDownloadForm';

import { getEnabledElement as OHIFgetEnabledElement } from './state';
import callInputDialog from './utils/callInputDialog';
import { setColormap } from './utils/colormap/transferFunctionHelpers';
import getProtocolViewportStructureFromGridViewports from './utils/getProtocolViewportStructureFromGridViewports';
import removeToolGroupSegmentationRepresentations from './utils/removeToolGroupSegmentationRepresentations';
import calculateViewportRegistrations from './utils/calculateViewportRegistrations';

const MPR_TOOLGROUP_ID = 'mpr';

// [ {
//   synchronizerId: string,
//   viewports: [ { viewportId: number, renderingEngineId: string, index: number } , ...]
// ]}
let STACK_IMAGE_SYNC_GROUPS_INFO = [];

const commandsModule = ({ servicesManager }) => {
  const {
    ViewportGridService,
    ToolGroupService,
    DisplaySetService,
    SyncGroupService,
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

      const toolGroup = _getToolGroup(toolGroupId);

      if (!toolGroup) {
        console.warn('No tool group found for toolGroupId:', toolGroupId);
        return;
      }
      // Todo: we need to check if the viewports of the toolGroup is actually
      // parts of the ViewportGrid's viewports, if not we return

      const { viewports } = ViewportGridService.getState() || {
        viewports: [],
      };

      // iterate over all viewports and set the tool active for the
      // viewports that belong to the toolGroup
      for (let index = 0; index < viewports.length; index++) {
        const ohifEnabledElement = OHIFgetEnabledElement(index);

        if (!ohifEnabledElement) {
          continue;
        }

        const viewport = getEnabledElement(ohifEnabledElement.element);

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
      const { activeViewportIndex, viewports } = ViewportGridService.getState();
      const viewportDisplaySetInstanceUIDs =
        viewports[activeViewportIndex].displaySetInstanceUIDs;

      const errorCallback = error => {
        UINotificationService.show({
          title: 'Multiplanar reconstruction (MPR) ',
          message:
            'Cannot create MPR for this DisplaySet since it is not reconstructable.',
          type: 'info',
          duration: 3000,
        });
      };

      const cacheId = 'beforeMPR';
      if (toggledState) {
        ViewportGridService.setCachedLayout({
          cacheId,
          cachedLayout: ViewportGridService.getState(),
        });

        const matchDetails = {
          displaySetInstanceUIDs: viewportDisplaySetInstanceUIDs,
        };

        HangingProtocolService.setProtocol(
          MPR_TOOLGROUP_ID,
          matchDetails,
          errorCallback
        );
        return;
      }

      const { cachedLayout } = ViewportGridService.getState();

      if (!cachedLayout || !cachedLayout[cacheId]) {
        return;
      }

      const { viewports: cachedViewports, numRows, numCols } = cachedLayout[
        cacheId
      ];

      // Todo: The following assumes that when turning off MPR we are applying the default
      //  protocol which might not be the one that was used before MPR was turned on
      // In order to properly implement this logic, we should modify the hanging protocol
      // upon layout change with layout selector, and cache and restore it when turning
      // MPR on and off
      const viewportStructure = getProtocolViewportStructureFromGridViewports({
        viewports: cachedViewports,
        numRows,
        numCols,
      });

      const viewportSpecificMatch = cachedViewports.reduce(
        (acc, viewport, index) => {
          const {
            displaySetInstanceUIDs,
            viewportOptions,
            displaySetOptions,
          } = viewport;

          acc[index] = {
            displaySetInstanceUIDs,
            viewportOptions,
            displaySetOptions,
          };

          return acc;
        },
        {}
      );

      const defaultProtocol = HangingProtocolService.getProtocolById('default');

      // Todo: this assumes there is only one stage in the default protocol
      const defaultProtocolStage = defaultProtocol.stages[0];
      defaultProtocolStage.viewportStructure = viewportStructure;

      const { primaryToolId } = ToolBarService.state;
      const mprToolGroup = _getToolGroup(MPR_TOOLGROUP_ID);
      // turn off crosshairs if it is on
      if (
        primaryToolId === 'Crosshairs' ||
        mprToolGroup.getToolInstance('Crosshairs')?.mode ===
          Enums.ToolModes.Active
      ) {
        const toolGroup = _getToolGroup(MPR_TOOLGROUP_ID);
        toolGroup.setToolDisabled('Crosshairs');
        ToolBarService.recordInteraction({
          groupId: 'WindowLevel',
          itemId: 'WindowLevel',
          interactionType: 'tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'WindowLevel',
              },
              context: 'CORNERSTONE',
            },
          ],
        });
      }

      // clear segmentations if they exist
      removeToolGroupSegmentationRepresentations(MPR_TOOLGROUP_ID);

      HangingProtocolService.setProtocol(
        'default',
        viewportSpecificMatch,
        error => {
          UINotificationService.show({
            title: 'Multiplanar reconstruction (MPR) ',
            message:
              'Something went wrong while trying to restore the previous layout.',
            type: 'info',
            duration: 3000,
          });
        }
      );
    },
    toggleStackImageSync: ({ toggledState }) => {
      if (!toggledState) {
        STACK_IMAGE_SYNC_GROUPS_INFO.forEach(syncGroupInfo => {
          const { viewports, synchronizerId } = syncGroupInfo;

          viewports.forEach(({ viewportId, renderingEngineId }) => {
            SyncGroupService.removeViewportFromSyncGroup(
              viewportId,
              renderingEngineId,
              synchronizerId
            );
          });
        });

        return;
      }

      STACK_IMAGE_SYNC_GROUPS_INFO = [];

      // create synchronization groups and add viewports
      let { viewports } = ViewportGridService.getState();

      // filter empty viewports
      viewports = viewports.filter(
        viewport =>
          viewport.displaySetInstanceUIDs &&
          viewport.displaySetInstanceUIDs.length
      );

      // filter reconstructable viewports
      viewports = viewports.filter(viewport => {
        const { displaySetInstanceUIDs } = viewport;

        for (const displaySetInstanceUID of displaySetInstanceUIDs) {
          const displaySet = DisplaySetService.getDisplaySetByUID(
            displaySetInstanceUID
          );

          if (displaySet && displaySet.isReconstructable) {
            return true;
          }

          return false;
        }
      });

      const viewportsByOrientation = viewports.reduce((acc, viewport) => {
        const { viewportId, viewportType } = viewport.viewportOptions;

        if (viewportType !== 'stack') {
          console.warn('Viewport is not a stack, cannot sync images yet');
          return acc;
        }

        const { element } = CornerstoneViewportService.getViewportInfo(
          viewportId
        );
        const { viewport: csViewport, renderingEngineId } = getEnabledElement(
          element
        );
        const { viewPlaneNormal } = csViewport.getCamera();

        // Should we round here? I guess so, but not sure how much precision we need
        const orientation = viewPlaneNormal.map(v => Math.round(v)).join(',');

        if (!acc[orientation]) {
          acc[orientation] = [];
        }

        acc[orientation].push({ viewportId, renderingEngineId });

        return acc;
      }, {});

      // create synchronizer for each group
      Object.values(viewportsByOrientation).map(viewports => {
        let synchronizerId = viewports
          .map(({ viewportId }) => viewportId)
          .join(',');

        synchronizerId = `imageSync_${synchronizerId}`;

        calculateViewportRegistrations(viewports);

        viewports.forEach(({ viewportId, renderingEngineId }) => {
          SyncGroupService.addViewportToSyncGroup(
            viewportId,
            renderingEngineId,
            {
              type: 'stackimage',
              id: synchronizerId,
              source: true,
              target: true,
            }
          );
        });

        STACK_IMAGE_SYNC_GROUPS_INFO.push({
          synchronizerId,
          viewports,
        });
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
    toggleCrosshairs: {
      commandFn: actions.toggleCrosshairs,
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
