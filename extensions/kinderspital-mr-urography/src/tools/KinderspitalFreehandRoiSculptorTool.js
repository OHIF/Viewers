import {
  FreehandRoiSculptorTool,
  toolColors,
  store,
  getToolState,
  getToolForElement,
  importInternal,
} from 'cornerstone-tools';
import TOOL_NAMES from './toolNames';

const drawHandles = importInternal('drawing/drawHandles');

const state = store.state;

export default class KinderspitalFreehandRoiSculptorTool extends FreehandRoiSculptorTool {
  constructor(props = {}) {
    const defaultProps = {
      configuration: getDefaultFreehandSculptorMouseToolConfiguration(),
      referencedToolName: TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL,
      name: TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_SCULPTOR_TOOL,
    };
    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);

    // Create bound functions for private event loop.
    this.activeMouseUpCallback = this.activeMouseUpCallback.bind(this);
  }

  renderToolData(evt) {
    const eventData = evt.detail;

    if (this.configuration.currentTool === null) {
      return false;
    }

    const element = eventData.element;
    const config = this.configuration;

    const toolState = getToolState(element, this.referencedToolName);
    const data = toolState.data[config.currentTool];

    if (!data) {
      return false;
    }

    if (this._active) {
      const context = eventData.canvasContext.canvas.getContext('2d');
      const options = {
        color: this.configuration.dragColor,
        fill: null,
        handleRadius: this._toolSizeCanvas,
      };

      drawHandles(
        context,
        eventData,
        this.configuration.mouseLocation.handles,
        options
      );
    } else if (this.configuration.showCursorOnHover && !this._recentTouchEnd) {
      this._renderHoverCursor(evt);
    }
  }

  /**
   * Renders the cursor
   *
   * @private
   * @param  {type} evt description
   * @returns {void}
   */
  _renderHoverCursor(evt) {
    if (this.options && this.options.isMouseActive === false) {
      return;
    }
    const eventData = evt.detail;
    const element = eventData.element;
    const context = eventData.canvasContext.canvas.getContext('2d');

    const toolState = getToolState(element, this.referencedToolName);
    const data = toolState.data[this.configuration.currentTool];

    this._recentTouchEnd = false;

    let coords;

    if (this.configuration.mouseUpRender) {
      coords = this.configuration.mouseLocation.handles.start;
      this.configuration.mouseUpRender = false;
    } else {
      coords = state.mousePositionImage;
    }

    const freehandRoiTool = getToolForElement(element, this.referencedToolName);
    let radiusCanvas = freehandRoiTool.distanceFromPointCanvas(
      element,
      data,
      coords
    );

    this.configuration.mouseLocation.handles.start.x = coords.x;
    this.configuration.mouseLocation.handles.start.y = coords.y;

    if (this.configuration.limitRadiusOutsideRegion) {
      const unlimitedRadius = radiusCanvas;

      radiusCanvas = this._limitCursorRadiusCanvas(eventData, radiusCanvas);

      // Fade if distant
      if (
        unlimitedRadius >
        this.configuration.hoverCursorFadeDistance * radiusCanvas
      ) {
        context.globalAlpha = this.configuration.hoverCursorFadeAlpha;
      }
    }

    const options = {
      fill: null,
      color: this.configuration.hoverColor,
      handleRadius: radiusCanvas,
    };

    drawHandles(
      context,
      eventData,
      this.configuration.mouseLocation.handles,
      options
    );

    if (this.configuration.limitRadiusOutsideRegion) {
      context.globalAlpha = 1.0; // Reset drawing alpha for other draw calls.
    }
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
    limitRadiusOutsideRegion: false,
    hoverCursorFadeAlpha: 0.5,
    hoverCursorFadeDistance: 1.2,
  };
}
