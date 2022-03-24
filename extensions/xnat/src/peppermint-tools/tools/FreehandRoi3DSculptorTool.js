import {
  FreehandRoiSculptorTool,
  toolColors,
  store,
  getToolState,
} from 'cornerstone-tools';
import { updateImage } from 'cornerstone-core';
import interpolate from '../utils/freehandInterpolate/interpolate.js';
import TOOL_NAMES from '../toolNames';

const { modules, state } = store;

export default class FreehandRoi3DSculptorTool extends FreehandRoiSculptorTool {
  constructor(props = {}) {
    const defaultProps = {
      configuration: getDefaultFreehandSculptorMouseToolConfiguration(),
      referencedToolName: TOOL_NAMES.FREEHAND_ROI_3D_TOOL,
      name: TOOL_NAMES.FREEHAND_ROI_3D_SCULPTOR_TOOL,
    };
    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);

    // Create bound functions for private event loop.
    this.activeMouseUpCallback = this.activeMouseUpCallback.bind(this);
  }

  /**
   * Select the freehand tool to be edited. Don't allow selecting of locked
   * ROIContours.
   *
   * @private
   * @param {Object} eventData - Data object associated with the event.
   */
  _selectFreehandTool(eventData) {
    const config = this.configuration;
    const element = eventData.element;
    const closestToolIndex = this._getClosestFreehandToolOnElement(
      element,
      eventData
    );

    if (closestToolIndex === undefined) {
      return;
    }

    const toolState = getToolState(element, this.referencedToolName);
    const toolData = toolState.data[closestToolIndex];
    const isLocked = toolData.referencedStructureSet.isLocked;

    if (isLocked) {
      return;
    }

    config.hoverColor = toolData.referencedROIContour.color;

    config.currentTool = closestToolIndex;
  }

  /**
   * Event handler for MOUSE_UP during the active loop.
   *
   * @param {Object} evt - The event.
   */
  _activeEnd(evt) {
    const eventData = evt.detail;
    const element = eventData.element;
    const config = this.configuration;

    this._active = false;

    state.isMultiPartToolActive = false;

    this._getMouseLocation(eventData);
    this._invalidateToolData(eventData);

    config.mouseUpRender = true;

    this._deactivateSculpt(element);

    const toolData = getToolState(element, this.referencedToolName);
    const data = toolData.data[config.currentTool];

    if (modules.freehand3D.state.interpolate) {
      interpolate(data, element);
    }

    // Update the image
    updateImage(eventData.element);

    preventPropagation(evt);
  }

  /**
   * Invalidate the freehand tool data, tirggering re-calculation of statistics.
   *
   * @private @override
   * @param {Object} eventData - Data object associated with the event.
   */
  _invalidateToolData(eventData) {
    const config = this.configuration;
    const element = eventData.element;
    const toolData = getToolState(element, this.referencedToolName);
    const data = toolData.data[config.currentTool];

    data.invalidated = true;
    data.interpolated = false;
  }
}

/**
 * Returns the default freehandSculpterMouseTool configuration.
 *
 * @return {Object} The default configuration object.
 */
function getDefaultFreehandSculptorMouseToolConfiguration() {
  return {
    mouseLocation: {
      handles: {
        start: {
          highlight: true,
          active: true,
        },
      },
    },
    minSpacing: 1,
    currentTool: null,
    dragColor: toolColors.getActiveColor(),
    hoverColor: toolColors.getToolColor(),

    /* --- Hover options ---
    showCursorOnHover:        Shows a preview of the sculpting radius on hover.
    limitRadiusOutsideRegion: Limit max toolsize outside the subject ROI based
                              on subject ROI area.
    hoverCursorFadeAlpha:     Alpha to fade to when tool very distant from
                              subject ROI.
    hoverCursorFadeDistance:  Distance from ROI in which to fade the hoverCursor
                              (in units of radii).
    */
    showCursorOnHover: true,
    limitRadiusOutsideRegion: true,
    hoverCursorFadeAlpha: 0.5,
    hoverCursorFadeDistance: 1.2,
  };
}

function preventPropagation(evt) {
  evt.stopImmediatePropagation();
  evt.stopPropagation();
  evt.preventDefault();
}
