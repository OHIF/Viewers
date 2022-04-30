import { Types, Settings } from '@cornerstonejs/core';
import {
  AnnotationTool,
  annotation,
  drawing,
  utilities,
} from '@cornerstonejs/tools';

import SCOORD_TYPES from '../constants/scoordTypes';

export default class DICOMSRDisplayTool extends AnnotationTool {
  static toolName = 'DICOMSRDisplayTool';

  constructor(
    toolProps = {},
    defaultToolProps = {
      configuration: {},
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  _getTextBoxLinesFromLabels(labels) {
    // TODO -> max 3 for now (label + shortAxis + longAxis), need a generic solution for this!

    const labelLength = Math.min(labels.length, 3);
    const lines = [];

    for (let i = 0; i < labelLength; i++) {
      const labelEntry = labels[i];
      lines.push(`${_labelToShorthand(labelEntry.label)}${labelEntry.value}`);
    }

    return lines;
  }

  // This tool should not inherit from AnnotationTool and we should not need
  // to add the following lines.
  isPointNearTool = () => null;
  getHandleNearImagePoint = () => null;

  renderAnnotation = (
    enabledElement: Types.IEnabledElement,
    svgDrawingHelper: any
  ): void => {
    const { viewport } = enabledElement;
    const { element } = viewport;

    let annotations = annotation.state.getAnnotations(
      element,
      this.getToolName()
    );

    // Todo: We don't need this anymore, filtering happens in triggerAnnotationRender
    if (!annotations?.length) {
      return;
    }

    annotations = this.filterInteractableAnnotationsForElement(
      element,
      annotations
    );

    if (!annotations?.length) {
      return;
    }

    // Todo: add back
    // const trackingUniqueIdentifiersForElement = module.getters.trackingUniqueIdentifiersForElement(
    //   element
    // );

    // const {
    //   activeIndex,
    //   trackingUniqueIdentifiers,
    // } = trackingUniqueIdentifiersForElement;

    // const activeTrackingUniqueIdentifier =
    //   trackingUniqueIdentifiers[activeIndex];

    // // Filter toolData to only render the data for the active SR.
    // const filteredToolData = toolState.data.filter(td =>
    //   trackingUniqueIdentifiers.includes(td.TrackingUniqueIdentifier)
    // );

    for (let i = 0; i < annotations.length; i++) {
      // const data = annotations[i];
      const annotation = annotations[i];
      const settings = Settings.getObjectSettings(
        annotation,
        DICOMSRDisplayTool
      );
      const annotationUID = annotation.annotationUID;
      const {
        renderableData,
        TrackingUniqueIdentifier,
      } = annotation.data.cachedStats;
      const { label } = annotation.data;
      const lineWidth = this.getStyle(settings, 'lineWidth', annotation);
      const lineDash = this.getStyle(settings, 'lineDash', annotation);
      const color = this.getStyle(settings, 'color', annotation);
      const options = {
        color,
        lineDash,
        lineWidth,
      };

      Object.keys(renderableData).forEach(GraphicType => {
        const renderableDataForGraphicType = renderableData[GraphicType];

        // Todo: Don't know why it is returning an array
        const canvasCoordinates = renderableDataForGraphicType[0].map(p =>
          viewport.worldToCanvas(p)
        );

        switch (GraphicType) {
          case SCOORD_TYPES.POINT:
            this.renderPoint(canvasCoordinates, svgDrawingHelper, options);
            break;
          case SCOORD_TYPES.MULTIPOINT:
            this.renderMultipoint(canvasCoordinates, svgDrawingHelper, options);
            break;
          case SCOORD_TYPES.POLYLINE:
            this.renderPolyLine(canvasCoordinates, svgDrawingHelper, options);
            break;
          case SCOORD_TYPES.CIRCLE:
            this.renderCircle(canvasCoordinates, svgDrawingHelper, options);
            break;
          case SCOORD_TYPES.ELLIPSE:
            this.renderEllipse(canvasCoordinates, svgDrawingHelper, options);
            break;
          default:
            throw new Error(`Unsupported GraphicType: ${GraphicType}`);
        }

        const textLines = this._getTextBoxLinesFromLabels(label);

        // Need to update to sync w/ annotation while unlinked/not moved
        const canvasTextBoxCoords = utilities.drawing.getTextBoxCoordsCanvas(
          canvasCoordinates
        );

        annotation.data.handles.textBox.worldPosition = viewport.canvasToWorld(
          canvasTextBoxCoords
        );

        const textBoxPosition = viewport.worldToCanvas(
          annotation.data.handles.textBox.worldPosition
        );

        const textBoxUID = '1';
        const boundingBox = drawing.drawLinkedTextBox(
          svgDrawingHelper,
          annotationUID,
          textBoxUID,
          textLines,
          textBoxPosition,
          canvasCoordinates,
          {},
          this.getLinkedTextBoxStyle(settings, annotation)
        );

        const { x: left, y: top, width, height } = boundingBox;

        annotation.data.handles.textBox.worldBoundingBox = {
          topLeft: viewport.canvasToWorld([left, top]),
          topRight: viewport.canvasToWorld([left + width, top]),
          bottomLeft: viewport.canvasToWorld([left, top + height]),
          bottomRight: viewport.canvasToWorld([left + width, top + height]),
        };
      });
    }
  };

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

  renderPolyLine(canvasCoordinates, svgDrawingHelper, options) {
    const annotationUID = '123123';
    const lineUID = '1';
    drawing.drawLine(
      svgDrawingHelper,
      annotationUID,
      lineUID,
      canvasCoordinates[0],
      canvasCoordinates[1],
      {
        color: options.color,
        width: options.lineWidth,
      }
    );
  }

  renderMultipoint(renderableData, eventData, options) {
    // Todo: cs3d
    const context = getNewContext(eventData.canvasContext.canvas);

    renderableData.forEach(points => {
      draw(context, context => {
        drawHandles(context, eventData, points, options);
      });
    });
  }

  renderPoint(renderableData, eventData, options) {
    // Todo: cs3d
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
        const handleStartCanvas = pixelToCanvas(element, point);
        const handleEndCanvas = pixelToCanvas(element, {
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
    // Todo: cs3d
    const { element } = eventData;

    const context = getNewContext(eventData.canvasContext.canvas);

    renderableData.forEach(circle => {
      const { center, radius } = circle;

      drawCircle(context, element, center, radius, options);
    });
  }

  renderEllipse(renderableData, eventData, options) {
    // Todo: cs3d
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
