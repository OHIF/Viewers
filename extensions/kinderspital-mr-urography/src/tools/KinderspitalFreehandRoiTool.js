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

let measurementNumber = 0;

export default class KinderspitalFreehandRoiTool extends FreehandRoiTool {
  constructor(props = {}) {
    const defaultProps = {
      configuration: defaultFreehandConfiguration(),
      name: TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);
  }

  createNewMeasurement(eventData) {
    const goodEventData =
      eventData && eventData.currentPoints && eventData.currentPoints.image;

    if (!goodEventData) {
      logger.error(
        `required eventData not supplied to tool ${this.name}'s createNewMeasurement`
      );

      return;
    }

    const { imageId } = eventData.image;

    const instanceMetadata = cornerstone.metaData.get('instance', imageId);

    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID,
      TemporalPositionIdentifier,
    } = instanceMetadata;

    const measurementData = {
      label: null,
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID,
      TemporalPositionIdentifier,
      FrameIndex: 1, //Would need to update this in the case of a multiframe.
      visible: true,
      active: true,
      invalidated: true,
      color: undefined,
      handles: {
        points: [],
      },
      measurementNumber: measurementNumber++,
      auc: 0,
      vol: 0,
    };

    measurementData.handles.textBox = {
      active: false,
      hasMoved: false,
      movesIndependently: false,
      drawnIndependently: true,
      allowedOutsideImage: true,
      hasBoundingBox: true,
    };

    return measurementData;
  }

  handleSelectedCallback() {
    // Override FreehandRoiTool's default functionality to prevent handle movement.
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
