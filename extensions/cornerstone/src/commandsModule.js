import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import OHIF from '@ohif/core';

//import setCornerstoneLayout from './utils/setCornerstoneLayout.js';
import { getEnabledElement } from './state';
import CornerstoneViewportDownloadForm from './CornerstoneViewportDownloadForm';
const scroll = cornerstoneTools.import('util/scroll');

const { studyMetadataManager } = OHIF.utils;

const commandsModule = ({ servicesManager, commandsManager }) => {
  const { ViewportGridService } = servicesManager.services;

  function _getActiveViewportsEnabledElement() {
    const { activeViewportIndex } = ViewportGridService.getState();
    const { element } = getEnabledElement(activeViewportIndex) || {};
    return element;
  }

  const actions = {
    getCornerstoneLibraries: () => {
      return { cornerstone, cornerstoneTools };
    },
    rotateViewport: ({ rotation }) => {
      const enabledElement = _getActiveViewportsEnabledElement();

      if (enabledElement) {
        let viewport = cornerstone.getViewport(enabledElement);
        viewport.rotation += rotation;
        cornerstone.setViewport(enabledElement, viewport);
      }
    },
    flipViewportHorizontal: () => {
      const enabledElement = _getActiveViewportsEnabledElement();

      if (enabledElement) {
        let viewport = cornerstone.getViewport(enabledElement);
        viewport.hflip = !viewport.hflip;
        cornerstone.setViewport(enabledElement, viewport);
      }
    },
    flipViewportVertical: () => {
      const enabledElement = _getActiveViewportsEnabledElement();

      if (enabledElement) {
        let viewport = cornerstone.getViewport(enabledElement);
        viewport.vflip = !viewport.vflip;
        cornerstone.setViewport(enabledElement, viewport);
      }
    },
    scaleViewport: ({ direction }) => {
      const enabledElement = _getActiveViewportsEnabledElement();
      const step = direction * 0.15;

      if (enabledElement) {
        if (step) {
          let viewport = cornerstone.getViewport(enabledElement);
          viewport.scale += step;
          cornerstone.setViewport(enabledElement, viewport);
        } else {
          cornerstone.fitToWindow(enabledElement);
        }
      }
    },
    resetViewport: () => {
      const enabledElement = _getActiveViewportsEnabledElement();

      if (enabledElement) {
        cornerstone.reset(enabledElement);
      }
    },
    invertViewport: () => {
      const enabledElement = _getActiveViewportsEnabledElement();

      if (enabledElement) {
        let viewport = cornerstone.getViewport(enabledElement);
        viewport.invert = !viewport.invert;
        cornerstone.setViewport(enabledElement, viewport);
      }
    },
    cancelMeasurement: () => {
      const enabledElement = _getActiveViewportsEnabledElement();

      if (enabledElement) {
        const cancelActiveManipulatorsForElement = cornerstoneTools.getModule(
          'manipulatorState'
        ).setters.cancelActiveManipulatorsForElement;

        cancelActiveManipulatorsForElement(enabledElement);

        cornerstone.updateImage(enabledElement);
      }
    },
    // TODO: this is receiving `evt` from `ToolbarRow`. We could use it to have
    //       better mouseButtonMask sets.
    setToolActive: ({ toolName }) => {
      if (!toolName) {
        console.warn('No toolname provided to setToolActive command');
      }

      // Find total number of tool indexes
      const { viewports } = ViewportGridService.getState() || { viewports: [] };
      for (let i = 0; i < viewports.length; i++) {
        const viewport = viewports[i];
        const hasDisplaySet = viewport.displaySetInstanceUID !== undefined;

        if (!hasDisplaySet) {
          continue;
        }

        const viewportInfo = getEnabledElement(i);
        const hasCornerstoneContext =
          viewportInfo.context == 'ACTIVE_VIEWPORT::CORNERSTONE';

        if (hasCornerstoneContext) {
          cornerstoneTools.setToolActiveForElement(
            viewportInfo.enabledElement,
            toolName,
            { mouseButtonMask: 1 }
          );
        } else {
          commandsManager.runCommand(
            'setToolActive',
            {
              element: viewportInfo.element,
              toolName,
            },
            viewportInfo.context
          );
        }
      }
    },
    clearAnnotations: () => {
      const element = _getActiveViewportsEnabledElement();
      if (!element) {
        return;
      }

      const { enabledElement } = cornerstone.getEnabledElement(element) || {};
      if (!enabledElement || !enabledElement.image) {
        return;
      }

      const {
        toolState,
      } = cornerstoneTools.globalImageIdSpecificToolStateManager;
      if (
        !toolState ||
        toolState.hasOwnProperty(enabledElement.image.imageId) === false
      ) {
        return;
      }

      const imageIdToolState = toolState[enabledElement.image.imageId];

      const measurementsToRemove = [];

      Object.keys(imageIdToolState).forEach(toolType => {
        const { data } = imageIdToolState[toolType];

        data.forEach(measurementData => {
          const {
            _id,
            lesionNamingNumber,
            measurementNumber,
          } = measurementData;

          if (!_id) {
            return;
          }

          measurementsToRemove.push({
            toolType,
            _id,
            lesionNamingNumber,
            measurementNumber,
          });
        });
      });

      measurementsToRemove.forEach(measurementData => {
        OHIF.measurements.MeasurementHandlers.onRemoved({
          detail: {
            toolType: measurementData.toolType,
            measurementData,
          },
        });
      });
    },
    nextImage: () => {
      const enabledElement = _getActiveViewportsEnabledElement();
      scroll(enabledElement, 1);
    },
    previousImage: () => {
      const enabledElement = _getActiveViewportsEnabledElement();
      scroll(enabledElement, -1);
    },
    getActiveViewportEnabledElement: () => {
      const enabledElement = _getActiveViewportsEnabledElement();
      return enabledElement;
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
          },
        });
      }
    },
    updateTableWithNewMeasurementData({
      toolType,
      measurementNumber,
      location,
      description,
    }) {
      // Update all measurements by measurement number
      const measurementApi = OHIF.measurements.MeasurementApi.Instance;
      const measurements = measurementApi.tools[toolType].filter(
        m => m.measurementNumber === measurementNumber
      );

      measurements.forEach(measurement => {
        measurement.location = location;
        measurement.description = description;

        measurementApi.updateMeasurement(measurement.toolType, measurement);
      });

      measurementApi.syncMeasurementsAndToolData();

      // Update images in all active viewports
      cornerstone.getEnabledElements().forEach(enabledElement => {
        cornerstone.updateImage(enabledElement.element);
      });
    },
    getNearbyToolData({ element, canvasCoordinates, availableToolTypes }) {
      const nearbyTool = {};
      let pointNearTool = false;

      availableToolTypes.forEach(toolType => {
        const elementToolData = cornerstoneTools.getToolState(
          element,
          toolType
        );

        if (!elementToolData) {
          return;
        }

        elementToolData.data.forEach((toolData, index) => {
          let elementToolInstance = cornerstoneTools.getToolForElement(
            element,
            toolType
          );

          if (!elementToolInstance) {
            elementToolInstance = cornerstoneTools.getToolForElement(
              element,
              `${toolType}Tool`
            );
          }

          if (!elementToolInstance) {
            console.warn('Tool not found.');
            return undefined;
          }

          if (
            elementToolInstance.pointNearTool(
              element,
              toolData,
              canvasCoordinates
            )
          ) {
            pointNearTool = true;
            nearbyTool.tool = toolData;
            nearbyTool.index = index;
            nearbyTool.toolType = toolType;
          }
        });

        if (pointNearTool) {
          return false;
        }
      });

      return pointNearTool ? nearbyTool : undefined;
    },
    removeToolState: ({ element, toolType, tool }) => {
      cornerstoneTools.removeToolState(element, toolType, tool);
      cornerstone.updateImage(element);
    },
    // setCornerstoneLayout: () => {
    //   setCornerstoneLayout();
    // },
    setWindowLevel: ({ window, level }) => {
      const enabledElement = _getActiveViewportsEnabledElement();

      if (enabledElement) {
        let viewport = cornerstone.getViewport(enabledElement);

        viewport.voi = {
          windowWidth: Number(window),
          windowCenter: Number(level),
        };
        cornerstone.setViewport(enabledElement, viewport);
      }
    },
  };

  const definitions = {
    jumpToImage: {
      commandFn: actions.jumpToImage,
      storeContexts: [],
      options: {},
    },
    getCornerstoneLibraries: {
      commandFn: actions.getCornerstoneLibraries,
      storeContexts: [],
      options: {},
      context: 'VIEWER',
    },
    getNearbyToolData: {
      commandFn: actions.getNearbyToolData,
      storeContexts: [],
      options: {},
    },
    removeToolState: {
      commandFn: actions.removeToolState,
      storeContexts: [],
      options: {},
    },
    updateTableWithNewMeasurementData: {
      commandFn: actions.updateTableWithNewMeasurementData,
      storeContexts: [],
      options: {},
    },
    showDownloadViewportModal: {
      commandFn: actions.showDownloadViewportModal,
      storeContexts: [],
      options: {},
    },
    getActiveViewportEnabledElement: {
      commandFn: actions.getActiveViewportEnabledElement,
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
    invertViewport: {
      commandFn: actions.invertViewport,
      storeContexts: [],
      options: {},
    },
    cancelMeasurement: {
      commandFn: actions.cancelMeasurement,
      storeContexts: [],
      options: {},
    },
    flipViewportVertical: {
      commandFn: actions.flipViewportVertical,
      storeContexts: [],
      options: {},
    },
    flipViewportHorizontal: {
      commandFn: actions.flipViewportHorizontal,
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
    resetViewport: {
      commandFn: actions.resetViewport,
      storeContexts: [],
      options: {},
    },
    clearAnnotations: {
      commandFn: actions.clearAnnotations,
      storeContexts: [],
      options: {},
    },
    nextImage: {
      commandFn: actions.nextImage,
      storeContexts: [],
      options: {},
    },
    previousImage: {
      commandFn: actions.previousImage,
      storeContexts: [],
      options: {},
    },
    // TOOLS
    setToolActive: {
      commandFn: actions.setToolActive,
      storeContexts: [],
      options: {},
    },
    setZoomTool: {
      commandFn: actions.setToolActive,
      storeContexts: [],
      options: { toolName: 'Zoom' },
    },
    // setCornerstoneLayout: {
    //   commandFn: actions.setCornerstoneLayout,
    //   storeContexts: [],
    //   options: {},
    //   context: 'VIEWER',
    // },
    setWindowLevel: {
      commandFn: actions.setWindowLevel,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
  };
};

export default commandsModule;
