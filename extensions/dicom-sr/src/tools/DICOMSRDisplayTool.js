import { importInternal, getToolState, toolColors } from 'cornerstone-tools';

import TOOL_NAMES from '../constants/toolNames';
import SCOORD_TYPES from '../constants/scoordTypes';

// Cornerstone 3rd party dev kit imports
const draw = importInternal('drawing/draw');
const drawJoinedLines = importInternal('drawing/drawJoinedLines');
const drawCircle = importInternal('drawing/drawCircle');
const drawEllipse = importInternal('drawing/drawEllipse');
const getNewContext = importInternal('drawing/getNewContext');
const BaseTool = importInternal('base/BaseTool');

/**
 * @class DICOMSRDisplayTool - Renders DICOMSR data in a read only manner (i.e. as an overlay).
 * @extends cornerstoneTools.BaseTool
 */
export default class DICOMSRDisplayTool extends BaseTool {
  constructor(props = {}) {
    const defaultProps = {
      mixins: ['enabledOrDisabledBinaryTool'],
      name: TOOL_NAMES.DICOM_SR_DISPLAY_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);
  }

  renderToolData(evt) {
    const eventData = evt.detail;
    const { element } = eventData;

    const toolState = getToolState(element, this.name);

    if (!toolState) {
      return;
    }

    const options = {
      color: toolColors.setToolColor(),
      lineWidth: 2,
      handleRadius: 6,
    };

    for (let i = 0; i < toolState.data.length; i++) {
      const data = toolState.data[i];

      Object.keys(data).forEach(GraphicType => {
        const renderableData = data[GraphicType];

        switch (GraphicType) {
          case SCOORD_TYPES.POINT:
          case SCOORD_TYPES.MULTIPOINT:
            renderPointOrMultipoint(renderableData, eventData, options);
            break;
          case SCOORD_TYPES.POLYLINE:
            renderPolyLine(renderableData, eventData, options);
            break;
          case SCOORD_TYPES.CIRCLE:
            renderCircle(renderableData, eventData, options);
            break;
          case SCOORD_TYPES.ELLIPSE:
            renderEllipse(renderableData, eventData, options);
            break;
        }
      });
    }
  }

  renderPolyLine(renderableData, eventData, options) {
    const { element } = eventData;
    const context = getNewContext(eventData.canvasContext.canvas);

    renderableData.forEach(points => {
      draw(context, context => {
        drawJoinedLines(context, element, points[0], points, options);
      });
    });
  }

  renderPointOrMultipoint(renderableData, eventData, options) {
    const context = getNewContext(eventData.canvasContext.canvas);

    renderableData.forEach(points => {
      draw(context, context => {
        drawHandles(context, eventData, points, options);
      });
    });
  }

  renderCircle(renderableData, eventData, options) {
    const { element } = eventData;

    const context = getNewContext(eventData.canvasContext.canvas);

    renderableData.forEach(circle => {
      const { center, radius } = circle;

      drawCircle(context, element, center, radius, options);
    });
  }

  renderEllipse(renderableData, eventData, options) {
    const { element } = eventData;

    const context = getNewContext(eventData.canvasContext.canvas);

    renderableData.forEach(ellipse => {
      const { corner1, corner2 } = ellipse;

      drawEllipse(
        context,
        element,
        corner1,
        corner2,
        options,
        'pixel',
        0 // TODO -> Work our the initial rotation and add it here so we render appropriately rotated ellipses.
      );
    });
  }
}
