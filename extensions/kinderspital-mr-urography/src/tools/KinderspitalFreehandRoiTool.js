import cornerstoneTools, {
  importInternal,
  FreehandRoiTool,
  getToolState,
  store,
  toolStyle,
  toolColors,
  EVENTS,
} from 'cornerstone-tools';
import TOOL_NAMES from './toolNames';

const getNewContext = importInternal('drawing/getNewContext');
const draw = importInternal('drawing/draw');
const drawJoinedLines = importInternal('drawing/drawJoinedLines');
const drawHandles = importInternal('drawing/drawHandles');

export default class KinderspitalFreehandRoiTool extends FreehandRoiTool {
  constructor(props = {}) {
    const defaultProps = {
      configuration: defaultFreehandConfiguration(),
      name: TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);
  }

  handleSelectedCallback(evt, toolData, handle, interactionType = 'mouse') {
    // Interupt eventDispatchers

    // Return true so you don't draw directly on an ROI.
    return true;
  }

  /**
   *
   *
   * @param {*} evt
   * @returns {undefined}
   */
  renderToolData(evt) {
    const eventData = evt.detail;

    // If we have no toolState for this element, return immediately as there is nothing to do
    const toolState = getToolState(evt.currentTarget, this.name);

    if (!toolState) {
      return;
    }

    const { image, element } = eventData;
    const config = this.configuration;

    // We have tool data for this element - iterate over each one and draw it
    const context = getNewContext(eventData.canvasContext.canvas);
    const lineWidth = toolStyle.getToolWidth();

    for (let i = 0; i < toolState.data.length; i++) {
      const data = toolState.data[i];

      if (data.visible === false) {
        continue;
      }

      draw(context, context => {
        let color = toolColors.getColorIfActive(data);
        let fillColor;

        if (data.active) {
          if (data.handles.invalidHandlePlacement) {
            color = config.invalidColor;
            fillColor = config.invalidColor;
          } else {
            color = toolColors.getColorIfActive(data);
            fillColor = toolColors.getFillColor();
          }
        } else {
          fillColor = toolColors.getToolColor();
        }

        if (data.handles.points.length) {
          for (let j = 0; j < data.handles.points.length; j++) {
            const lines = [...data.handles.points[j].lines];
            const points = data.handles.points;

            if (this._isDrawingToolData(i) && j === points.length - 1) {
              // If it's still being actively drawn, keep the last line to
              // The mouse location
              lines.push(config.mouseLocation.handles.start);
            }
            drawJoinedLines(context, element, data.handles.points[j], lines, {
              color,
              lineWidth,
            });
          }
        }

        // Draw handles

        const options = {
          color,
          fill: fillColor,
        };

        if (this._isDrawingToolData(i) && data.canComplete) {
          // Draw large handle at the origin if can complete drawing
          options.handleRadius = config.completeHandleRadius;
          const handle = data.handles.points[0];

          if (this.configuration.drawHandles) {
            drawHandles(context, eventData, [handle], options);
          }
        }

        if (this._isDrawingToolData(i) && data.active && !data.complete) {
          // Draw handle at origin and at mouse if actively drawing
          options.handleRadius = config.activeHandleRadius;

          if (this.configuration.drawHandles) {
            drawHandles(
              context,
              eventData,
              config.mouseLocation.handles,
              options
            );
          }

          const firstHandle = data.handles.points[0];

          if (this.configuration.drawHandles) {
            drawHandles(context, eventData, [firstHandle], options);
          }
        }
      });
    }
  }

  _isDrawingToolData(toolDataIndex) {
    return this.configuration.currentTool === toolDataIndex && this._drawing;
  }
}

function defaultFreehandConfiguration() {
  return {
    mouseLocation: {
      handles: {
        start: {
          highlight: true,
          active: true,
        },
      },
    },
    spacing: 1,
    lineWidth: 1,
    activeHandleRadius: 3,
    completeHandleRadius: 6,
    completeHandleRadiusTouch: 28,
    invalidColor: 'crimson',
    currentHandle: 0,
    currentTool: -1,
  };
}
