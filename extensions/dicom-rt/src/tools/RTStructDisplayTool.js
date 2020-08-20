import { importInternal, getToolState, toolColors } from 'cornerstone-tools';

import TOOL_NAMES from '../utils/toolNames';

// Cornerstone 3rd party dev kit imports
const draw = importInternal('drawing/draw');
const drawCircle = importInternal('drawing/drawCircle');
const drawJoinedLines = importInternal('drawing/drawJoinedLines');
const getNewContext = importInternal('drawing/getNewContext');
const BaseTool = importInternal('base/BaseTool');

/**
 * @class RTStructDisplayTool - Renders RTSTRUCT data in a read only manner (i.e. as an overlay).
 * @extends cornerstoneTools.BaseTool
 */
export default class RTStructDisplayTool extends BaseTool {
  constructor(props = {}) {
    const defaultProps = {
      mixins: ['enabledOrDisabledBinaryTool'],
      name: TOOL_NAMES.RTSTRUCT_DISPLAY_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);

    super(initialProps);

    this._rtStructModule = cornerstoneTools.getModule('rtstruct');
  }

  renderToolData(evt) {
    const eventData = evt.detail;
    const rtstructModule = this._rtStructModule;

    const toolState = getToolState(evt.currentTarget, this.name);

    if (!toolState) {
      return;
    }

    const { lineWidth, opacity } = rtstructModule.configuration;

    // We have tool data for this element - iterate over each one and draw it
    const context = getNewContext(eventData.canvasContext.canvas);

    for (let i = 0; i < toolState.data.length; i++) {
      const data = toolState.data[i];

      const structureSet = rtstructModule.getters.structureSet(
        data.structureSetSeriesInstanceUid
      );

      // Don't render if entire StructureSet is hidden.
      if (structureSet.visible === false) {
        continue;
      }

      const ROIContourData = rtstructModule.getters.ROIContour(
        data.structureSetSeriesInstanceUid,
        data.ROINumber
      );

      // Don't render if ROIContour is hidden.
      if (ROIContourData.visible === false) {
        continue;
      }

      const points = data.handles.points;

      if (!points.length) {
        continue;
      }

      const colorArray = ROIContourData.colorArray;
      const color = `rgba(${colorArray[0]},${colorArray[1]},${
        colorArray[2]
      },${opacity})`;

      switch (data.type) {
        case 'CLOSED_PLANAR':
          this._renderClosedPlanar(context, eventData.element, points, {
            color,
            lineWidth,
          });
          break;
        case 'POINT':
          this._renderPoint(context, eventData.element, points, {
            color,
            lineWidth,
          });
          break;
        case 'OPEN_PLANAR':
          this._renderOpenPlanar(context, eventData.element, points, {
            color,
            lineWidth,
          });
          break;
      }
    }
  }

  _renderClosedPlanar(context, element, points, options) {
    draw(context, context => {
      drawJoinedLines(
        context,
        element,
        points[points.length - 1],
        points,
        options
      );
    });
  }

  _renderPoint(context, element, points, options) {
    draw(context, context => {
      drawCircle(context, element, points[0], 3, options);
    });
  }

  _renderOpenPlanar(context, element, points, options) {
    draw(context, context => {
      drawJoinedLines(context, element, points[0], points, options);
    });
  }
}
