import {
  getEnabledElement,
  StackViewport,
  VolumeViewport,
  utilities as csUtils,
  Types as CoreTypes,
  BaseVolumeViewport,
} from '@cornerstonejs/core';
import {
  ToolGroupManager,
  Enums,
  utilities as cstUtils,
  ReferenceLinesTool,
} from '@cornerstonejs/tools';
import { Types as OhifTypes } from '@ohif/core';
import { vec3, mat4 } from 'gl-matrix';

import CornerstoneViewportDownloadForm from './utils/CornerstoneViewportDownloadForm';
import callInputDialog from './utils/callInputDialog';
import toggleImageSliceSync from './utils/imageSliceSync/toggleImageSliceSync';
import { getFirstAnnotationSelected } from './utils/measurementServiceMappings/utils/selection';
import getActiveViewportEnabledElement from './utils/getActiveViewportEnabledElement';
import { CornerstoneServices } from './types';
import toggleVOISliceSync from './utils/toggleVOISliceSync';

const toggleSyncFunctions = {
  imageSlice: toggleImageSliceSync,
  voi: toggleVOISliceSync,
};

function commandsModule({
  servicesManager,
  commandsManager,
}: OhifTypes.Extensions.ExtensionParams): OhifTypes.Extensions.CommandsModule {
  const {
    viewportGridService,
    toolGroupService,
    cineService,
    uiDialogService,
    cornerstoneViewportService,
    uiNotificationService,
    measurementService,
    syncGroupService,
  } = servicesManager.services as CornerstoneServices;

  const { measurementServiceSource } = this;

  function _getActiveViewportEnabledElement() {
    return getActiveViewportEnabledElement(viewportGridService);
  }
  const actions = {
    /**
     * Generates the selector props for the context menu, specific to
     * the cornerstone viewport, and then runs the context menu.
     */
    showCornerstoneContextMenu: options => {
      const element = _getActiveViewportEnabledElement()?.viewport?.element;

      const optionsToUse = { ...options, element };
      const { useSelectedAnnotation, nearbyToolData, event } = optionsToUse;

      // This code is used to invoke the context menu via keyboard shortcuts
      if (useSelectedAnnotation && !nearbyToolData) {
        const firstAnnotationSelected = getFirstAnnotationSelected(element);
        // filter by allowed selected tools from config property (if there is any)
        const isToolAllowed =
          !optionsToUse.allowedSelectedTools ||
          optionsToUse.allowedSelectedTools.includes(firstAnnotationSelected?.metadata?.toolName);
        if (isToolAllowed) {
          optionsToUse.nearbyToolData = firstAnnotationSelected;
        } else {
          return;
        }
      }

      optionsToUse.defaultPointsPosition = [];
      // if (optionsToUse.nearbyToolData) {
      //   optionsToUse.defaultPointsPosition = commandsManager.runCommand(
      //     'getToolDataActiveCanvasPoints',
      //     { toolData: optionsToUse.nearbyToolData }
      //   );
      // }

      // TODO - make the selectorProps richer by including the study metadata and display set.
      optionsToUse.selectorProps = {
        toolName: optionsToUse.nearbyToolData?.metadata?.toolName,
        value: optionsToUse.nearbyToolData,
        uid: optionsToUse.nearbyToolData?.annotationUID,
        nearbyToolData: optionsToUse.nearbyToolData,
        event,
        ...optionsToUse.selectorProps,
      };

      commandsManager.run(options, optionsToUse);
    },

    getNearbyToolData({ nearbyToolData, element, canvasCoordinates }) {
      return nearbyToolData ?? cstUtils.getAnnotationNearPoint(element, canvasCoordinates);
    },
    getNearbyAnnotation({ element, canvasCoordinates }) {
      const nearbyToolData = actions.getNearbyToolData({
        nearbyToolData: null,
        element,
        canvasCoordinates,
      });

      const isAnnotation = toolName => {
        const enabledElement = getEnabledElement(element);

        if (!enabledElement) {
          return;
        }

        const { renderingEngineId, viewportId } = enabledElement;
        const toolGroup = ToolGroupManager.getToolGroupForViewport(viewportId, renderingEngineId);

        const toolInstance = toolGroup.getToolInstance(toolName);

        return toolInstance?.constructor?.isAnnotation ?? true;
      };

      return nearbyToolData?.metadata?.toolName && isAnnotation(nearbyToolData.metadata.toolName)
        ? nearbyToolData
        : null;
    },

    // Measurement tool commands:

    /** Delete the given measurement */
    deleteMeasurement: ({ uid }) => {
      if (uid) {
        measurementServiceSource.remove(uid);
      }
    },

    /**
     * Show the measurement labelling input dialog and update the label
     * on the measurement with a response if not cancelled.
     */
    setMeasurementLabel: ({ uid }) => {
      const measurement = measurementService.getMeasurement(uid);

      callInputDialog(
        uiDialogService,
        measurement,
        (label, actionId) => {
          if (actionId === 'cancel') {
            return;
          }

          const updatedMeasurement = Object.assign({}, measurement, {
            label,
          });

          measurementService.update(updatedMeasurement.uid, updatedMeasurement, true);
        },
        false
      );
    },

    /**
     *
     * @param props - containing the updates to apply
     * @param props.measurementKey - chooses the measurement key to apply the
     *        code to.  This will typically be finding or site to apply a
     *        finding code or a findingSites code.
     * @param props.code - A coding scheme value from DICOM, including:
     *       * CodeValue - the language independent code, for example '1234'
     *       * CodingSchemeDesignator - the issue of the code value
     *       * CodeMeaning - the text value shown to the user
     *       * ref - a string reference in the form `<designator>:<codeValue>`
     *       * Other fields
     *     Note it is a valid option to remove the finding or site values by
     *     supplying null for the code.
     * @param props.uid - the measurement UID to find it with
     * @param props.label - the text value for the code.  Has NOTHING to do with
     *        the measurement label, which can be set with textLabel
     * @param props.textLabel is the measurement label to apply.  Set to null to
     *            delete.
     *
     * If the measurementKey is `site`, then the code will also be added/replace
     * the 0 element of findingSites.  This behaviour is expected to be enhanced
     * in the future with ability to set other site information.
     */
    updateMeasurement: props => {
      const { code, uid, textLabel, label } = props;
      const measurement = measurementService.getMeasurement(uid);
      const updatedMeasurement = {
        ...measurement,
      };
      // Call it textLabel as the label value
      // TODO - remove the label setting when direct rendering of findingSites is enabled
      if (textLabel !== undefined) {
        updatedMeasurement.label = textLabel;
      }
      if (code !== undefined) {
        const measurementKey = code.type || 'finding';

        if (code.ref && !code.CodeValue) {
          const split = code.ref.indexOf(':');
          code.CodeValue = code.ref.substring(split + 1);
          code.CodeMeaning = code.text || label;
          code.CodingSchemeDesignator = code.ref.substring(0, split);
        }
        updatedMeasurement[measurementKey] = code;
        // TODO - remove this line once the measurements table customizations are in
        if (measurementKey !== 'finding') {
          if (updatedMeasurement.findingSites) {
            updatedMeasurement.findingSites = updatedMeasurement.findingSites.filter(
              it => it.type !== measurementKey
            );
            updatedMeasurement.findingSites.push(code);
          } else {
            updatedMeasurement.findingSites = [code];
          }
        }
      }
      measurementService.update(updatedMeasurement.uid, updatedMeasurement, true);
    },

    // Retrieve value commands
    getActiveViewportEnabledElement: _getActiveViewportEnabledElement,

    setViewportActive: ({ viewportId }) => {
      const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
      if (!viewportInfo) {
        console.warn('No viewport found for viewportId:', viewportId);
        return;
      }

      viewportGridService.setActiveViewportId(viewportId);
    },
    arrowTextCallback: ({ callback, data }) => {
      callInputDialog(uiDialogService, data, callback);
    },
    toggleCine: () => {
      const { viewports } = viewportGridService.getState();
      const { isCineEnabled } = cineService.getState();
      cineService.setIsCineEnabled(!isCineEnabled);
      viewports.forEach((_, index) => cineService.setCine({ id: index, isPlaying: false }));
    },
    setWindowLevel({ window, level, toolGroupId }) {
      // convert to numbers
      const windowWidthNum = Number(window);
      const windowCenterNum = Number(level);

      const { viewportId } = _getActiveViewportEnabledElement();
      const viewportToolGroupId = toolGroupService.getToolGroupForViewport(viewportId);

      if (toolGroupId && toolGroupId !== viewportToolGroupId) {
        return;
      }

      // get actor from the viewport
      const renderingEngine = cornerstoneViewportService.getRenderingEngine();
      const viewport = renderingEngine.getViewport(viewportId);

      const { lower, upper } = csUtils.windowLevel.toLowHighRange(windowWidthNum, windowCenterNum);

      viewport.setProperties({
        voiRange: {
          upper,
          lower,
        },
      });
      viewport.render();
    },
    setToolEnabled: ({ toolName, toggle }) => {
      const { viewports } = viewportGridService.getState();

      if (!viewports.size) {
        return;
      }

      const toolGroup = toolGroupService.getToolGroup(null);

      if (!toolGroup) {
        return;
      }

      const toolIsEnabled = toolGroup.getToolOptions(toolName).mode === Enums.ToolModes.Enabled;

      // Toggle the tool's state only if the toggle is true
      if (toggle) {
        toolIsEnabled ? toolGroup.setToolDisabled(toolName) : toolGroup.setToolEnabled(toolName);
      }

      const renderingEngine = cornerstoneViewportService.getRenderingEngine();
      renderingEngine.render();
    },
    setToolActiveToolbar: ({ value, itemId, toolGroupIds = [] }) => {
      // Sometimes it is passed as value (tools with options), sometimes as itemId (toolbar buttons)
      const toolName = itemId || value;

      toolGroupIds = toolGroupIds.length ? toolGroupIds : toolGroupService.getToolGroupIds();

      toolGroupIds.forEach(toolGroupId => {
        actions.setToolActive({ toolName, toolGroupId });
      });
    },
    setToolActive: ({ toolName, toolGroupId = null }) => {
      const { viewports } = viewportGridService.getState();

      if (!viewports.size) {
        return;
      }

      const toolGroup = toolGroupService.getToolGroup(toolGroupId);

      if (!toolGroup) {
        return;
      }

      if (!toolGroup.hasTool(toolName)) {
        return;
      }

      const activeToolName = toolGroup.getActivePrimaryMouseButtonTool();

      if (activeToolName) {
        const activeToolOptions = toolGroup.getToolConfiguration(activeToolName);
        activeToolOptions?.disableOnPassive
          ? toolGroup.setToolDisabled(activeToolName)
          : toolGroup.setToolPassive(activeToolName);
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
      const { activeViewportId } = viewportGridService.getState();

      if (!cornerstoneViewportService.getCornerstoneViewport(activeViewportId)) {
        // Cannot download a non-cornerstone viewport (image).
        uiNotificationService.show({
          title: 'Download Image',
          message: 'Image cannot be downloaded',
          type: 'error',
        });
        return;
      }

      const { uiModalService } = servicesManager.services;

      if (uiModalService) {
        uiModalService.show({
          content: CornerstoneViewportDownloadForm,
          title: 'Download High Quality Image',
          contentProps: {
            activeViewportId,
            onClose: uiModalService.hide,
            cornerstoneViewportService,
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

      if (viewport instanceof BaseVolumeViewport) {
        const camera = viewport.getCamera();
        const rotAngle = (rotation * Math.PI) / 180;
        const rotMat = mat4.identity(new Float32Array(16));
        mat4.rotate(rotMat, rotMat, rotAngle, camera.viewPlaneNormal);
        const rotatedViewUp = vec3.transformMat4(vec3.create(), camera.viewUp, rotMat);
        viewport.setCamera({ viewUp: rotatedViewUp as CoreTypes.Point3 });
        viewport.render();
      } else if (viewport.getRotation !== undefined) {
        const currentRotation = viewport.getRotation();
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

      const { invert } = viewport.getProperties();
      viewport.setProperties({ invert: !invert });
      viewport.render();
    },
    resetViewport: () => {
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      viewport.resetProperties?.();
      viewport.resetCamera();

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

    /** Jumps the active viewport or the specified one to the given slice index */
    jumpToImage: ({ imageIndex, viewport: gridViewport }): void => {
      // Get current active viewport (return if none active)
      let viewport;
      if (!gridViewport) {
        const enabledElement = _getActiveViewportEnabledElement();
        if (!enabledElement) {
          return;
        }
        viewport = enabledElement.viewport;
      } else {
        viewport = cornerstoneViewportService.getCornerstoneViewport(gridViewport.id);
      }

      // Get number of slices
      // -> Copied from cornerstone3D jumpToSlice\_getImageSliceData()
      let numberOfSlices = 0;

      if (viewport instanceof StackViewport) {
        numberOfSlices = viewport.getImageIds().length;
      } else if (viewport instanceof VolumeViewport) {
        numberOfSlices = csUtils.getImageSliceDataForVolumeViewport(viewport).numberOfSlices;
      } else {
        throw new Error('Unsupported viewport type');
      }

      const jumpIndex = imageIndex < 0 ? numberOfSlices + imageIndex : imageIndex;
      if (jumpIndex >= numberOfSlices || jumpIndex < 0) {
        throw new Error(`Can't jump to ${imageIndex}`);
      }

      // Set slice to last slice
      const options = { imageIndex: jumpIndex };
      cstUtils.jumpToSlice(viewport.element, options);
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
    setViewportColormap: ({ viewportId, displaySetInstanceUID, colormap, immediate = false }) => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

      const actorEntries = viewport.getActors();

      const actorEntry = actorEntries.find(actorEntry => {
        return actorEntry.uid.includes(displaySetInstanceUID);
      });

      const { actor: volumeActor, uid: volumeId } = actorEntry;

      viewport.setProperties({ colormap, volumeActor }, volumeId);

      if (immediate) {
        viewport.render();
      }
    },
    changeActiveViewport: ({ direction = 1 }) => {
      const { activeViewportId, viewports } = viewportGridService.getState();
      const viewportIds = Array.from(viewports.keys());
      const currentIndex = viewportIds.indexOf(activeViewportId);
      const nextViewportIndex =
        (currentIndex + direction + viewportIds.length) % viewportIds.length;
      viewportGridService.setActiveViewportId(viewportIds[nextViewportIndex] as string);
    },
    /**
     * If the syncId is given and a synchronizer with that ID already exists, it will
     * toggle it on/off for the provided viewports. If not, it will attempt to create
     * a new synchronizer using the given syncId and type for the specified viewports.
     * If no viewports are provided, you may notice some default behavior.
     * - 'voi' type, we will aim to synchronize all viewports with the same modality
     * -'imageSlice' type, we will aim to synchronize all viewports with the same orientation.
     *
     * @param options
     * @param options.viewports - The viewports to synchronize
     * @param options.syncId - The synchronization group ID
     * @param options.type - The type of synchronization to perform
     */
    toggleSynchronizer: ({ type, viewports, syncId }) => {
      const synchronizer = syncGroupService.getSynchronizer(syncId);

      if (synchronizer) {
        synchronizer.isDisabled() ? synchronizer.setEnabled(true) : synchronizer.setEnabled(false);
        return;
      }

      const fn = toggleSyncFunctions[type];

      if (fn) {
        fn({
          servicesManager,
          viewports,
          syncId,
        });
      }
    },
    setSourceViewportForReferenceLinesTool: ({ viewportId }) => {
      if (!viewportId) {
        const { activeViewportId } = viewportGridService.getState();
        viewportId = activeViewportId ?? 'default';
      }

      const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

      toolGroup?.setToolConfiguration(
        ReferenceLinesTool.toolName,
        {
          sourceViewportId: viewportId,
        },
        true // overwrite
      );

      const renderingEngine = cornerstoneViewportService.getRenderingEngine();
      renderingEngine.render();
    },
    storePresentation: ({ viewportId }) => {
      cornerstoneViewportService.storePresentation({ viewportId });
    },
    attachProtocolViewportDataListener: ({ protocol, stageIndex }) => {
      const EVENT = cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED;
      const command = protocol.callbacks.onViewportDataInitialized;
      const numPanes = protocol.stages?.[stageIndex]?.viewports.length ?? 1;
      let numPanesWithData = 0;
      const { unsubscribe } = cornerstoneViewportService.subscribe(EVENT, evt => {
        numPanesWithData++;

        if (numPanesWithData === numPanes) {
          commandsManager.run(...command);

          // Unsubscribe from the event
          unsubscribe(EVENT);
        }
      });
    },
    resetCrosshairs: ({ viewportId }) => {
      const crosshairInstances = [];

      const getCrosshairInstances = toolGroupId => {
        const toolGroup = toolGroupService.getToolGroup(toolGroupId);
        crosshairInstances.push(toolGroup.getToolInstance('Crosshairs'));
      };

      if (!viewportId) {
        const toolGroupIds = toolGroupService.getToolGroupIds();
        toolGroupIds.forEach(getCrosshairInstances);
      } else {
        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
        getCrosshairInstances(toolGroup.id);
      }

      crosshairInstances.forEach(ins => {
        ins.resetCrosshairs();
      });
    },
  };

  const definitions = {
    // The command here is to show the viewer context menu, as being the
    // context menu
    showCornerstoneContextMenu: {
      commandFn: actions.showCornerstoneContextMenu,
      options: {
        menuCustomizationId: 'measurementsContextMenu',
        commands: [
          {
            commandName: 'showContextMenu',
          },
        ],
      },
    },

    getNearbyToolData: {
      commandFn: actions.getNearbyToolData,
    },
    getNearbyAnnotation: {
      commandFn: actions.getNearbyAnnotation,
    },
    deleteMeasurement: {
      commandFn: actions.deleteMeasurement,
    },
    setMeasurementLabel: {
      commandFn: actions.setMeasurementLabel,
    },
    updateMeasurement: {
      commandFn: actions.updateMeasurement,
    },
    setWindowLevel: {
      commandFn: actions.setWindowLevel,
    },
    setToolActive: {
      commandFn: actions.setToolActive,
    },
    setToolActiveToolbar: {
      commandFn: actions.setToolActiveToolbar,
    },
    setToolEnabled: {
      commandFn: actions.setToolEnabled,
    },
    rotateViewportCW: {
      commandFn: actions.rotateViewport,
      options: { rotation: 90 },
    },
    rotateViewportCCW: {
      commandFn: actions.rotateViewport,
      options: { rotation: -90 },
    },
    incrementActiveViewport: {
      commandFn: actions.changeActiveViewport,
    },
    decrementActiveViewport: {
      commandFn: actions.changeActiveViewport,
      options: { direction: -1 },
    },
    flipViewportHorizontal: {
      commandFn: actions.flipViewportHorizontal,
    },
    flipViewportVertical: {
      commandFn: actions.flipViewportVertical,
    },
    invertViewport: {
      commandFn: actions.invertViewport,
    },
    resetViewport: {
      commandFn: actions.resetViewport,
    },
    scaleUpViewport: {
      commandFn: actions.scaleViewport,
      options: { direction: 1 },
    },
    scaleDownViewport: {
      commandFn: actions.scaleViewport,
      options: { direction: -1 },
    },
    fitViewportToWindow: {
      commandFn: actions.scaleViewport,
      options: { direction: 0 },
    },
    nextImage: {
      commandFn: actions.scroll,
      options: { direction: 1 },
    },
    previousImage: {
      commandFn: actions.scroll,
      options: { direction: -1 },
    },
    firstImage: {
      commandFn: actions.jumpToImage,
      options: { imageIndex: 0 },
    },
    lastImage: {
      commandFn: actions.jumpToImage,
      options: { imageIndex: -1 },
    },
    jumpToImage: {
      commandFn: actions.jumpToImage,
    },
    showDownloadViewportModal: {
      commandFn: actions.showDownloadViewportModal,
    },
    toggleCine: {
      commandFn: actions.toggleCine,
    },
    arrowTextCallback: {
      commandFn: actions.arrowTextCallback,
    },
    setViewportActive: {
      commandFn: actions.setViewportActive,
    },
    setViewportColormap: {
      commandFn: actions.setViewportColormap,
    },
    setSourceViewportForReferenceLinesTool: {
      commandFn: actions.setSourceViewportForReferenceLinesTool,
    },
    storePresentation: {
      commandFn: actions.storePresentation,
    },
    attachProtocolViewportDataListener: {
      commandFn: actions.attachProtocolViewportDataListener,
    },
    resetCrosshairs: {
      commandFn: actions.resetCrosshairs,
    },
    toggleSynchronizer: {
      commandFn: actions.toggleSynchronizer,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE',
  };
}

export default commandsModule;
