import * as cornerstone from '@cornerstonejs/core'
import * as csTools from '@cornerstonejs/tools';
import { stackSynchronizer } from './synchronizers';
import { XNAT_TOOL_NAMES } from '../index';

const {
  setToolActiveForElement,
  setToolPassiveForElement,
  setToolEnabledForElement,
  setToolDisabledForElement,
  setInactiveCursor,
} = csTools;

const defaultSate = {
  smooth: true,
  sync: false,
  overlay: true,
  annotate: true,
};

class ViewportOptionsManager {
  constructor() {
    this._viewportOptionsMap = new Map();

    this._elementDisabledHandler = this._elementDisabledHandler.bind(this);
    this._elementEnabledHandler = this._elementEnabledHandler.bind(this);

    this._addEventListeners();
  }

  getViewportOptions(element) {
    if (!element) {
      return { ...defaultSate };
    }

    const enabledElement = cornerstone.getEnabledElement(element);
    const { uuid } = enabledElement;

    const viewportOptions = this._viewportOptionsMap.get(uuid) || {
      ...defaultSate,
    };

    return viewportOptions;
  }

  updateViewportOptions(element, updatedOptions) {
    if (!element) {
      return;
    }

    const enabledElement = cornerstone.getEnabledElement(element);
    const { uuid, viewport } = enabledElement;

    const state = this._viewportOptionsMap.get(uuid);

    if (updatedOptions.smooth !== state.smooth) {
      viewport.pixelReplication = !updatedOptions.smooth;
      cornerstone.updateImage(element);
    }

    if (updatedOptions.sync !== state.sync) {
      if (updatedOptions.sync) {
        stackSynchronizer.add(element);
      } else {
        stackSynchronizer.remove(element);
      }
    }

    if (updatedOptions.annotate !== state.annotate) {
      const showAnnotations = updatedOptions.annotate;
      viewport.showAnnotations = showAnnotations;
      const currentToolName = window.store.getState().activeTool;

      if (showAnnotations) {
        // Set measurement tools to passive state
        XNAT_TOOL_NAMES.MEASUREMENT_TOOL_NAMES.forEach(toolName =>
          setToolPassiveForElement(element, toolName)
        );
        // Set contour & mask tools to enabled state
        XNAT_TOOL_NAMES.ROI_TOOL_NAMES.forEach(toolName => {
          // Exclude 'FreehandRoi3DSculptorTool' because it has
          // activeOrDisabledBinaryTool mixin
          if (toolName === 'FreehandRoi3DSculptorTool') {
            return;
          }
          setToolEnabledForElement(element, toolName);
        });
        // Set tool as active if it is the current global tool
        if (
          XNAT_TOOL_NAMES.ALL_ANNOTAION_TOOL_NAMES.includes(currentToolName)
        ) {
          setToolActiveForElement(element, currentToolName, {
            mouseButtonMask: 1,
          });
        }
      } else {
        // Deactivate all annotation tools for element
        XNAT_TOOL_NAMES.ALL_ANNOTAION_TOOL_NAMES.forEach(toolName => {
          setToolDisabledForElement(element, toolName);
        });
        if (
          XNAT_TOOL_NAMES.ALL_ANNOTAION_TOOL_NAMES.includes(currentToolName)
        ) {
          setInactiveCursor(element);
        }
      }

      cornerstone.updateImage(element);
    }

    state.smooth = updatedOptions.smooth;
    state.sync = updatedOptions.sync;
    state.overlay = updatedOptions.overlay;
    state.annotate = updatedOptions.annotate;

    return updatedOptions;
  }

  _addEventListeners() {
    cornerstone.events.addEventListener(
      cornerstone.EVENTS.ELEMENT_ENABLED,
      this._elementEnabledHandler
    );
    cornerstone.events.addEventListener(
      cornerstone.EVENTS.ELEMENT_DISABLED,
      this._elementDisabledHandler
    );
  }

  _elementDisabledHandler(evt) {
    const element = evt.detail.element;
    const enabledElement = cornerstone.getEnabledElement(element);
    this._viewportOptionsMap.delete(enabledElement.uuid);
  }

  _elementEnabledHandler(evt) {
    const element = evt.detail.element;
    const enabledElement = cornerstone.getEnabledElement(element);
    this._viewportOptionsMap.set(enabledElement.uuid, { ...defaultSate });
  }
}

const viewportOptionsManager = new ViewportOptionsManager();

export default viewportOptionsManager;
