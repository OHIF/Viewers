import { importInternal, getToolState, toolColors } from 'cornerstone-tools';

import TOOL_NAMES from '../constants/toolNames';
import SCOORD_TYPES from '../constants/scoordTypes';
import id from '../id';

// Cornerstone 3rd party dev kit imports
const draw = importInternal('drawing/draw');
const drawJoinedLines = importInternal('drawing/drawJoinedLines');
const drawCircle = importInternal('drawing/drawCircle');
const drawEllipse = importInternal('drawing/drawEllipse');
const drawHandles = importInternal('drawing/drawHandles');
const getNewContext = importInternal('drawing/getNewContext');
const BaseTool = importInternal('base/BaseTool');
const drawLinkedTextBox = importInternal('drawing/drawLinkedTextBox');

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

    this._module = cornerstoneTools.getModule(id);
  }

  renderToolData(evt) {
    const eventData = evt.detail;
    const { element } = eventData;
    const module = this._module;

    const toolState = getToolState(element, this.name);

    if (!toolState) {
      return;
    }

    const trackingUniqueIdentifiersForElement = module.getters.trackingUniqueIdentifiersForElement(
      element
    );

    const {
      activeIndex,
      trackingUniqueIdentifiers,
    } = trackingUniqueIdentifiersForElement;

    const activeTrackingUniqueIdentifier =
      trackingUniqueIdentifiers[activeIndex];

    // Filter toolData to only render the data for the active SR.
    const filteredToolData = toolState.data.filter(td =>
      trackingUniqueIdentifiers.includes(td.TrackingUniqueIdentifier)
    );

    for (let i = 0; i < filteredToolData.length; i++) {
      const data = filteredToolData[i];
      const { renderableData, labels } = data;

      const color =
        data.TrackingUniqueIdentifier === activeTrackingUniqueIdentifier
          ? toolColors.getActiveColor()
          : toolColors.getToolColor();
      const lineWidth = 2;
      const options = {
        color,
        lineWidth,
        handleRadius: 6,
      };

      Object.keys(renderableData).forEach(GraphicType => {
        const renderableDataForGraphicType = renderableData[GraphicType];

        switch (GraphicType) {
          case SCOORD_TYPES.POINT:
          case SCOORD_TYPES.MULTIPOINT:
            this.renderPointOrMultipoint(
              renderableDataForGraphicType,
              eventData,
              options
            );
            break;
          case SCOORD_TYPES.POLYLINE:
            this.renderPolyLine(
              renderableDataForGraphicType,
              eventData,
              options
            );
            break;
          case SCOORD_TYPES.CIRCLE:
            this.renderCircle(renderableDataForGraphicType, eventData, options);
            break;
          case SCOORD_TYPES.ELLIPSE:
            this.renderEllipse(
              renderableDataForGraphicType,
              eventData,
              options
            );
            break;
        }
      });

      const { element } = eventData;
      const context = getNewContext(eventData.canvasContext.canvas);

      debugger;

      const text = _getTextBoxLinesFromLabels(labels);

      debugger;

      function textBoxAnchorPoints() {
        return [{ x: 1000, y: 1000 }];
      }

      draw(context, context => {
        drawLinkedTextBox(
          context,
          element,
          {
            active: false,
            hasMoved: false,
            movesIndependently: false,
            drawnIndependently: true,
            allowedOutsideImage: true,
            hasBoundingBox: true,
            x: 256,
            y: 256,
          },
          text,
          null,
          textBoxAnchorPoints,
          color,
          lineWidth,
          10,
          true
        );
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

function _getTextBoxLinesFromLabels(labels) {
  // TODO -> max 2 for now, need a generic solution for this!

  const labelLength = Math.min(labels.length, 2);

  const lines = [];

  for (let i = 0; i < labelLength; i++) {
    const labelEntry = labels[i];
    lines.push(`${_labelToShorthand(labelEntry.label)}${labelEntry.value}`);
  }

  return lines;
}

const SHORT_HAND_MAP = {
  'Short Axis': 'S ',
  'Long Axis': 'L ',
  AREA: 'Area ',
  Length: '',
};

function _labelToShorthand(label) {
  const shortHand = SHORT_HAND_MAP[label];

  if (shortHand !== undefined) {
    return shortHand;
  }

  return label;
}
