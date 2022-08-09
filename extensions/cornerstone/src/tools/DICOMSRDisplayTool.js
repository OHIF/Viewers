import csTools, {
  importInternal,
  getToolState,
  toolColors,
} from 'cornerstone-tools';

import cornerstone from 'cornerstone-core';

/** Internal imports */
import TOOL_NAMES from './constants/toolNames';
import SCOORD_TYPES from './constants/scoordTypes';
import id from './id';

/** Cornerstone 3rd party dev kit imports */
const draw = importInternal('drawing/draw');
const drawJoinedLines = importInternal('drawing/drawJoinedLines');
const drawCircle = importInternal('drawing/drawCircle');
const drawEllipse = importInternal('drawing/drawEllipse');
const drawHandles = importInternal('drawing/drawHandles');
const drawArrow = importInternal('drawing/drawArrow');
const getNewContext = importInternal('drawing/getNewContext');
const BaseTool = importInternal('base/BaseTool');
const drawLinkedTextBox = importInternal('drawing/drawLinkedTextBox');

/**
 * @class DICOMSRDisplayTool - Renders DICOMSR data in a read only manner (i.e. as an overlay).
 *
 * This is a generic render tool.
 *
 * A single tool that, given some schema, can render
 * POINT, MULTIPOINT, POLYLINE, CIRCLE, and ELLIPSE
 * value types for a given imageId.
 *
 *
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

    this._module = csTools.getModule(id);
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

    let shouldRepositionTextBoxes = false;

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
          case SCOORD_TYPES.TEXT:
            break;
          case SCOORD_TYPES.POINT:
            this.renderPoint(renderableDataForGraphicType, eventData, options);
            break;
          case SCOORD_TYPES.MULTIPOINT:
            this.renderMultipoint(
              renderableDataForGraphicType,
              eventData,
              options
            );
            break;
          case SCOORD_TYPES.POLYGON:
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

      if (!data.handles || !data.handles.textBox) {
        const textBox = {
          active: false,
          hasMoved: true,
          movesIndependently: false,
          drawnIndependently: true,
          allowedOutsideImage: true,
          hasBoundingBox: true,
        };

        const anchorPoints = _getTextBoxAnchorPointsForRenderableData(
          renderableData,
          eventData
        );
        textBox.anchorPoints = anchorPoints;

        const bottomRight = {
          x: Math.max(...anchorPoints.map(point => point.x)),
          y: Math.max(...anchorPoints.map(point => point.y)),
        };

        textBox.x = bottomRight.x;
        textBox.y = bottomRight.y;

        data.handles = {};
        data.handles.textBox = textBox;

        shouldRepositionTextBoxes = true;
      }

      const text = _getTextBoxLinesFromLabels(labels);

      function textBoxAnchorPoints() {
        return data.handles.textBox.anchorPoints;
      }

      if (data.handles.textBox.anchorPoints.length !== 0) {
        draw(context, context => {
          drawLinkedTextBox(
            context,
            element,
            data.handles.textBox,
            text,
            data.handles,
            textBoxAnchorPoints,
            color,
            lineWidth,
            0,
            true
          );
        });
      }
    }

    // TOOD -> text boxes may overlap with other annotations at the moment.
    // To be fixed after we get requirements.
    // if (shouldRepositionTextBoxes) {
    //   this.repositionTextBox(filteredToolData, eventData);
    // }
  }

  // repositionTextBox(toolData, eventData) {
  //   const toolBoundingBoxes = [];

  //   for (let i = 0; i < toolData.length; i++) {
  //     const toolDataI = toolData[i];

  //     const { textBox } = toolDataI.handles;
  //     const { anchorPoints } = textBox;

  //     const boundingBox = _getBoundingBoxFromAnchorPoints(anchorPoints);
  //     // Get the textbox bounding locations.
  //     // Get the tool extents.
  //   }
  // }

  renderPolyLine(renderableData, eventData, options) {
    const { element } = eventData;
    const context = getNewContext(eventData.canvasContext.canvas);
    renderableData.forEach(points => {
      draw(context, context => {
        drawJoinedLines(context, element, points[0], points, options);
      });
    });
  }

  renderMultipoint(renderableData, eventData, options) {
    const context = getNewContext(eventData.canvasContext.canvas);

    renderableData.forEach(points => {
      draw(context, context => {
        drawHandles(context, eventData, points, options);
      });
    });
  }

  renderPoint(renderableData, eventData, options) {
    // Render single point as an arrow.
    const { element, image } = eventData;
    const { rows, columns } = image;
    const context = getNewContext(eventData.canvasContext.canvas);
    const { color, lineWidth } = options;

    // Find a suitable length for the image size.

    const xOffset = columns / 10;
    const yOffset = rows / 10;

    renderableData.forEach(points => {
      const point = points[0]; // The SCOORD type is POINT so the array length is 1.
      draw(context, context => {
        // Draw the arrow
        const handleStartCanvas = cornerstone.pixelToCanvas(element, point);
        const handleEndCanvas = cornerstone.pixelToCanvas(element, {
          x: point.x + xOffset,
          y: point.y + yOffset,
        });

        drawArrow(
          context,
          handleEndCanvas,
          handleStartCanvas,
          color,
          lineWidth,
          false
        );
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
  // TODO -> max 3 for now (label + shortAxis + longAxis), need a generic solution for this!

  const labelLength = Math.min(labels.length, 3);
  const lines = [];

  for (let i = 0; i < labelLength; i++) {
    const labelEntry = labels[i];
    lines.push(`${_labelToShorthand(labelEntry.label)}${labelEntry.value}`);
  }

  return lines;
}

const SHORT_HAND_MAP = {
  'Short Axis': 'W ',
  'Long Axis': 'L ',
  AREA: 'Area ',
  Length: '',
  CORNERSTONEFREETEXT: '',
};

function _labelToShorthand(label) {
  const shortHand = SHORT_HAND_MAP[label];

  if (shortHand !== undefined) {
    return shortHand;
  }

  return label;
}

function _getTextBoxAnchorPointsForRenderableData(renderableData, eventData) {
  let anchorPoints = [];

  Object.keys(renderableData).forEach(GraphicType => {
    const renderableDataForGraphicType = renderableData[GraphicType];

    switch (GraphicType) {
      case SCOORD_TYPES.TEXT:
        break;
      case SCOORD_TYPES.POINT:
        renderableDataForGraphicType.forEach(points => {
          anchorPoints = [...anchorPoints, ...points];

          // Add other arrow point based on image size.
          const { image } = eventData;
          const { rows, columns } = image;

          const xOffset = columns / 10;
          const yOffset = rows / 10;
          const point = points[0];

          anchorPoints.push({ x: point.x + xOffset, y: point.y + yOffset });
        });

        break;
      case SCOORD_TYPES.MULTIPOINT:
      case SCOORD_TYPES.POLYLINE:
      case SCOORD_TYPES.POLYGON:
        renderableDataForGraphicType.forEach(points => {
          anchorPoints = [...anchorPoints, ...points];
        });
        break;
      case SCOORD_TYPES.CIRCLE:
        renderableDataForGraphicType.forEach(circle => {
          const { center, radius } = circle;

          anchorPoints.push({ x: center.x + radius, y: center.y });
          anchorPoints.push({ x: center.x - radius, y: center.y });
          anchorPoints.push({ x: center.x, y: center.y + radius });
          anchorPoints.push({ x: center.x, y: center.y - radius });
        });

        break;
      case SCOORD_TYPES.ELLIPSE:
        renderableDataForGraphicType.forEach(ellipse => {
          const { corner1, corner2 } = ellipse;

          const halfWidth = Math.abs(corner1.x - corner2.x) / 2;
          const halfHeight = Math.abs(corner1.y - corner2.y) / 2;

          const center = {
            x: (corner1.x + corner2.x) / 2,
            y: (corner1.y + corner2.y) / 2,
          };

          anchorPoints.push({ x: center.x + halfWidth, y: center.y });
          anchorPoints.push({ x: center.x - halfWidth, y: center.y });
          anchorPoints.push({ x: center.x, y: center.y + halfHeight });
          anchorPoints.push({ x: center.x, y: center.y - halfHeight });
        });
        break;
    }
  });

  return anchorPoints;
}

function _getBoundingBoxFromAnchorPoints(anchorPoints) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  anchorPoints.forEach(point => {
    const { x, y } = point;

    if (x > maxX) {
      maxX = x;
    } else if (x < minX) {
      minX = x;
    }

    if (y > maxY) {
      maxY = y;
    } else if (y < minY) {
      minY = y;
    }
  });
}
