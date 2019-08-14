import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import OHIF from '@ohif/core';
const scroll = cornerstoneTools.import('util/scroll');

const actions = {
  rotateViewport: ({ viewports, rotation }) => {
    const enabledElement = _getActiveViewportEnabledElement(
      viewports.viewportSpecificData,
      viewports.activeViewportIndex
    );

    if (enabledElement) {
      let viewport = cornerstone.getViewport(enabledElement);
      viewport.rotation += rotation;
      cornerstone.setViewport(enabledElement, viewport);
    }
  },
  flipViewportHorizontal: ({ viewports }) => {
    const enabledElement = _getActiveViewportEnabledElement(
      viewports.viewportSpecificData,
      viewports.activeViewportIndex
    );

    if (enabledElement) {
      let viewport = cornerstone.getViewport(enabledElement);
      viewport.hflip = !viewport.hflip;
      cornerstone.setViewport(enabledElement, viewport);
    }
  },
  flipViewportVertical: ({ viewports }) => {
    const enabledElement = _getActiveViewportEnabledElement(
      viewports.viewportSpecificData,
      viewports.activeViewportIndex
    );

    if (enabledElement) {
      let viewport = cornerstone.getViewport(enabledElement);
      viewport.vflip = !viewport.vflip;
      cornerstone.setViewport(enabledElement, viewport);
    }
  },
  scaleViewport: ({ viewports, direction }) => {
    const enabledElement = _getActiveViewportEnabledElement(
      viewports.viewportSpecificData,
      viewports.activeViewportIndex
    );
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
  resetViewport: ({ viewports }) => {
    const enabledElement = _getActiveViewportEnabledElement(
      viewports.viewportSpecificData,
      viewports.activeViewportIndex
    );

    if (enabledElement) {
      cornerstone.reset(enabledElement);
    }
  },
  invertViewport: ({ viewports }) => {
    const enabledElement = _getActiveViewportEnabledElement(
      viewports.viewportSpecificData,
      viewports.activeViewportIndex
    );

    if (enabledElement) {
      let viewport = cornerstone.getViewport(enabledElement);
      viewport.invert = !viewport.invert;
      cornerstone.setViewport(enabledElement, viewport);
    }
  },
  // TODO: this is receiving `evt` from `ToolbarRow`. We could use it to have
  //       better mouseButtonMask sets.
  setToolActive: ({ toolName }) => {
    if (!toolName) {
      console.warn('No toolname provided to setToolActive command');
    }
    cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
  },
  updateViewportDisplaySet: ({ direction }) => {
    // TODO
    console.warn('updateDisplaySet: ', direction);
  },
  clearAnnotations: ({ viewports }) => {
    const element = _getActiveViewportEnabledElement(
      viewports.viewportSpecificData,
      viewports.activeViewportIndex
    );
    if (!element) {
      return;
    }

    const enabledElement = cornerstone.getEnabledElement(element);
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
        const { _id, lesionNamingNumber, measurementNumber } = measurementData;
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
  nextImage: ({ viewports }) => {
    const enabledElement = _getActiveViewportEnabledElement(
      viewports.viewportSpecificData,
      viewports.activeViewportIndex
    );

    scroll(enabledElement, 1);
  },
  previousImage: ({ viewports }) => {
    const enabledElement = _getActiveViewportEnabledElement(
      viewports.viewportSpecificData,
      viewports.activeViewportIndex
    );

    scroll(enabledElement, -1);
  },
};

const definitions = {
  rotateViewportCW: {
    commandFn: actions.rotateViewport,
    storeContexts: ['viewports'],
    options: { rotation: 90 },
  },
  rotateViewportCCW: {
    commandFn: actions.rotateViewport,
    storeContexts: ['viewports'],
    options: { rotation: -90 },
  },
  invertViewport: {
    commandFn: actions.invertViewport,
    storeContexts: ['viewports'],
    options: {},
  },
  flipViewportVertical: {
    commandFn: actions.flipViewportVertical,
    storeContexts: ['viewports'],
    options: {},
  },
  flipViewportHorizontal: {
    commandFn: actions.flipViewportHorizontal,
    storeContexts: ['viewports'],
    options: {},
  },
  scaleUpViewport: {
    commandFn: actions.scaleViewport,
    storeContexts: ['viewports'],
    options: { direction: 1 },
  },
  scaleDownViewport: {
    commandFn: actions.scaleViewport,
    storeContexts: ['viewports'],
    options: { direction: -1 },
  },
  fitViewportToWindow: {
    commandFn: actions.scaleViewport,
    storeContexts: ['viewports'],
    options: { direction: 0 },
  },
  resetViewport: {
    commandFn: actions.resetViewport,
    storeContexts: ['viewports'],
    options: {},
  },
  clearAnnotations: {
    commandFn: actions.clearAnnotations,
    storeContexts: ['viewports'],
    options: {},
  },
  nextImage: {
    commandFn: actions.nextImage,
    storeContexts: ['viewports'],
    options: {},
  },
  previousImage: {
    commandFn: actions.previousImage,
    storeContexts: ['viewports'],
    options: {},
  },
  // TODO: First/Last image
  // Next/Previous series/DisplaySet
  nextViewportDisplaySet: {
    commandFn: actions.updateViewportDisplaySet,
    storeContexts: [],
    options: { direction: 1 },
  },
  previousViewportDisplaySet: {
    commandFn: actions.updateViewportDisplaySet,
    storeContexts: [],
    options: { direction: -1 },
  },
  // TOOLS
  setToolActive: {
    commandFn: actions.setToolActive,
    storeContexts: [],
    options: {},
  },
};

/**
 * Grabs `dom` reference for the enabledElement of
 * the active viewport
 */
function _getActiveViewportEnabledElement(viewports, activeIndex) {
  const activeViewport = viewports[activeIndex] || {};
  return activeViewport.dom;
}

export default {
  actions,
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
