import cornerstone from 'cornerstone-core';
import { redux } from 'ohif-core';
import store from './../store/';

const { setToolActive } = redux.actions;

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
  // This has a weird hard dependency on the tools that are available as toolbar
  // buttons. You can see this in `ohif-core/src/redux/reducers/tools.js`
  // the `toolName` needs to equal the button's `command` property.
  // NOTE: It would be nice if `hotkeys` could set this, instead of creating a command per tool
  setCornerstoneToolActive: ({ toolName }) => {
    store.dispatch(setToolActive(toolName));
  },
  updateViewportDisplaySet: ({ direction }) => {
    // TODO
    console.warn('updateDisplaySet: ', direction);
  },
  clearAnnotations: () => {
    console.warn('clearAnnotations: not yet implemented');
    // const toolState =
    //   cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;
    // if (!toolState) return;
    // Object.keys(toolState).forEach(imageId => {
    //   if (!cornerstoneImageId || cornerstoneImageId === imageId)
    //     delete toolState[imageId];
    // });
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
    keys: '',
    commandFn: actions.scaleViewport,
    storeContexts: ['viewports'],
    options: { direction: 1 },
  },
  scaleDownViewport: {
    keys: '',
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
  // TODO: Clear Annotations
  // TODO: Next/Previous image
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
  setZoomTool: {
    commandFn: actions.setCornerstoneToolActive,
    storeContexts: [],
    options: { toolName: 'Zoom' },
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

export default definitions;
