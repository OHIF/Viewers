import { Types, metaData, utilities as csUtils } from '@cornerstonejs/core';
import {
  AnnotationTool,
  annotation,
  drawing,
  utilities,
  Types as cs3DToolsTypes,
} from '@cornerstonejs/tools';
import { getTrackingUniqueIdentifiersForElement } from './modules/dicomSRModule';
import { SCOORDTypes } from '../enums';
import toolNames from './toolNames';

export default class DICOMSRDisplayTool extends AnnotationTool {
  static toolName = toolNames.DICOMSRDisplay;

  constructor(
    toolProps = {},
    defaultToolProps = {
      configuration: {},
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  _getTextBoxLinesFromLabels(labels) {
    // TODO -> max 5 for now (label + shortAxis + longAxis), need a generic solution for this!

    if (!labels?.length) {
      return [];
    }

    const labelLength = Math.min(labels.length, 5);
    const lines = [];

    for (let i = 0; i < labelLength; i++) {
      const labelEntry = labels[i];
      const shorthand = _labelToShorthand(labelEntry.label);
      const value = labelEntry.value ?? '';

      /** 
       * Empty shorthand (CORNERSTONEFREETEXT, Length, etc.): show value only — avoids ": text" or
       * "363698007: site" when label was a raw code (fixed at source for finding site).
       */
      if (shorthand === '' && value !== '') {
        lines.push(String(value));
      } else if (shorthand === '') {
        continue;
      } else {
        lines.push(`${shorthand}: ${value}`);
      }
    }

    return lines;
  }

  // This tool should not inherit from AnnotationTool and we should not need
  // to add the following lines.
  isPointNearTool = () => null;
  getHandleNearImagePoint = () => null;

  renderAnnotation = (enabledElement: Types.IEnabledElement, svgDrawingHelper: any): void => {
    const { viewport } = enabledElement;
    const { element } = viewport;

    let annotations = annotation.state.getAnnotations(this.getToolName(), element);

    // Todo: We don't need this anymore, filtering happens in triggerAnnotationRender
    if (!annotations?.length) {
      return;
    }

    annotations = this.filterInteractableAnnotationsForElement(element, annotations);

    if (!annotations?.length) {
      return;
    }

    const trackingUniqueIdentifiersForElement = getTrackingUniqueIdentifiersForElement(element);

    const { activeIndex, trackingUniqueIdentifiers } = trackingUniqueIdentifiersForElement;

    const activeTrackingUniqueIdentifier = trackingUniqueIdentifiers[activeIndex];

    // Filter toolData to only render the data for the active SR.
    const filteredAnnotations = annotations.filter(annotation =>
      trackingUniqueIdentifiers.includes(annotation.data?.TrackingUniqueIdentifier)
    );

    if (!viewport._actors?.size) {
      return;
    }

    const styleSpecifier: cs3DToolsTypes.AnnotationStyle.StyleSpecifier = {
      toolGroupId: this.toolGroupId,
      toolName: this.getToolName(),
      viewportId: enabledElement.viewport.id,
    };
    const { style: annotationStyle } = annotation.config;

    for (let i = 0; i < filteredAnnotations.length; i++) {
      const annotation = filteredAnnotations[i];
      const annotationUID = annotation.annotationUID;
      const { renderableData, TrackingUniqueIdentifier } = annotation.data;
      const { referencedImageId } = annotation.metadata;

      styleSpecifier.annotationUID = annotationUID;

      const groupStyle = annotationStyle.getToolGroupToolStyles(this.toolGroupId)[
        this.getToolName()
      ];

      const lineWidth = this.getStyle('lineWidth', styleSpecifier, annotation);
      const lineDash = this.getStyle('lineDash', styleSpecifier, annotation);
      const color =
        TrackingUniqueIdentifier === activeTrackingUniqueIdentifier
          ? 'rgb(0, 255, 0)'
          : this.getStyle('color', styleSpecifier, annotation);

      const options = {
        color,
        lineDash,
        lineWidth,
        ...groupStyle,
      };

      Object.keys(renderableData).forEach(GraphicType => {
        const renderableDataForGraphicType = renderableData[GraphicType];

        let renderMethod;
        let canvasCoordinatesAdapter;

        switch (GraphicType) {
          case SCOORDTypes.POINT:
            renderMethod = this.renderPoint;
            break;
          case SCOORDTypes.MULTIPOINT:
            renderMethod = this.renderMultipoint;
            break;
          case SCOORDTypes.POLYLINE:
            renderMethod = this.renderPolyLine;
            break;
          case SCOORDTypes.CIRCLE:
            renderMethod = this.renderEllipse;
            break;
          case SCOORDTypes.ELLIPSE:
            renderMethod = this.renderEllipse;
            canvasCoordinatesAdapter = utilities.math.ellipse.getCanvasEllipseCorners;
            break;
          default:
            throw new Error(`Unsupported GraphicType: ${GraphicType}`);
        }

        const canvasCoordinates = renderMethod(
          svgDrawingHelper,
          viewport,
          renderableDataForGraphicType,
          annotationUID,
          referencedImageId,
          options
        );

        this.renderTextBox(
          svgDrawingHelper,
          viewport,
          canvasCoordinates,
          canvasCoordinatesAdapter,
          annotation,
          styleSpecifier,
          options
        );
      });
    }
  };

  renderPolyLine(
    svgDrawingHelper,
    viewport,
    renderableData,
    annotationUID,
    referencedImageId,
    options
  ) {
    const drawingOptions = {
      color: options.color,
      width: options.lineWidth,
      lineDash: options.lineDash,
    };
    let allCanvasCoordinates = [];
    renderableData.map((data, index) => {
      const canvasCoordinates = data.map(p => viewport.worldToCanvas(p));
      const lineUID = `${index}`;

      if (canvasCoordinates.length === 2) {
        drawing.drawLine(
          svgDrawingHelper,
          annotationUID,
          lineUID,
          canvasCoordinates[0],
          canvasCoordinates[1],
          drawingOptions
        );
      } else {
        drawing.drawPolyline(
          svgDrawingHelper,
          annotationUID,
          lineUID,
          canvasCoordinates,
          drawingOptions
        );
      }

      allCanvasCoordinates = allCanvasCoordinates.concat(canvasCoordinates);
    });

    return allCanvasCoordinates; // used for drawing textBox
  }

  renderMultipoint(
    svgDrawingHelper,
    viewport,
    renderableData,
    annotationUID,
    referencedImageId,
    options
  ) {
    let canvasCoordinates;
    renderableData.map((data, index) => {
      canvasCoordinates = data.map(p => viewport.worldToCanvas(p));
      const handleGroupUID = '0';
      drawing.drawHandles(svgDrawingHelper, annotationUID, handleGroupUID, canvasCoordinates, {
        color: options.color,
      });
    });
  }

  renderPoint(
    svgDrawingHelper,
    viewport,
    renderableData,
    annotationUID,
    referencedImageId,
    options
  ) {
    const canvasCoordinates = [];
    const crossSize = 6;

    renderableData.map((data, index) => {
      const point = data[0];
      const [canvasX, canvasY] = viewport.worldToCanvas(point);
      canvasCoordinates.push(viewport.worldToCanvas(point));

      if (data[1] !== undefined) {
        canvasCoordinates.push(viewport.worldToCanvas(data[1]));
        drawing.drawArrow(
          svgDrawingHelper,
          annotationUID,
          `arrow-${index}`,
          canvasCoordinates[canvasCoordinates.length - 1],
          canvasCoordinates[canvasCoordinates.length - 2],
          { color: options.color, width: options.lineWidth }
        );
      } else {
        const cx = Number(canvasX);
        const cy = Number(canvasY);
        const crossPaths = [
          [[cx, cy - crossSize], [cx, cy + crossSize]],
          [[cx - crossSize, cy], [cx + crossSize, cy]],
        ];
        drawing.drawPath(
          svgDrawingHelper,
          annotationUID,
          `cross-${index}`,
          crossPaths,
          { color: options.color, lineWidth: options.lineWidth || 2 }
        );
      }
    });

    return canvasCoordinates;
  }

  renderEllipse(
    svgDrawingHelper,
    viewport,
    renderableData,
    annotationUID,
    referencedImageId,
    options
  ) {
    let canvasCoordinates;
    renderableData.map((data, index) => {
      if (data.length === 0) {
        // since oblique ellipse is not supported for hydration right now
        // we just return
        return;
      }

      const ellipsePointsWorld = data;

      const rotation = viewport.getRotation();

      canvasCoordinates = ellipsePointsWorld.map(p => viewport.worldToCanvas(p));
      let canvasCorners;
      if (rotation == 90 || rotation == 270) {
        canvasCorners = utilities.math.ellipse.getCanvasEllipseCorners([
          canvasCoordinates[2],
          canvasCoordinates[3],
          canvasCoordinates[0],
          canvasCoordinates[1],
        ]) as Array<Types.Point2>;
      } else {
        canvasCorners = utilities.math.ellipse.getCanvasEllipseCorners(
          canvasCoordinates
        ) as Array<Types.Point2>;
      }

      const lineUID = `${index}`;
      drawing.drawEllipse(
        svgDrawingHelper,
        annotationUID,
        lineUID,
        canvasCorners[0],
        canvasCorners[1],
        {
          color: options.color,
          width: options.lineWidth,
          lineDash: options.lineDash,
        }
      );
    });

    return canvasCoordinates;
  }

  renderTextBox(
    svgDrawingHelper,
    viewport,
    canvasCoordinates,
    canvasCoordinatesAdapter,
    annotation,
    styleSpecifier,
    options = {}
  ) {
    if (!canvasCoordinates || !annotation) {
      return;
    }

    const { annotationUID, data = {} } = annotation;
    const { labels, label } = data;
    const { color } = options;

    let adaptedCanvasCoordinates = canvasCoordinates;

    if (typeof canvasCoordinatesAdapter === 'function') {
      adaptedCanvasCoordinates = canvasCoordinatesAdapter(canvasCoordinates);
    }

    const textLines =
      typeof label === 'string' && label.length > 0
        ? [label]
        : this._getTextBoxLinesFromLabels(labels);
    const canvasTextBoxCoords = utilities.drawing.getTextBoxCoordsCanvas(adaptedCanvasCoordinates);

    if (!annotation.data?.handles?.textBox?.worldPosition) {
      annotation.data.handles.textBox.worldPosition = viewport.canvasToWorld(canvasTextBoxCoords);
    }

    const textBoxPosition = viewport.worldToCanvas(annotation.data.handles.textBox.worldPosition);

    const textBoxUID = '1';
    const textBoxOptions = this.getLinkedTextBoxStyle(styleSpecifier, annotation);

    const boundingBox = drawing.drawLinkedTextBox(
      svgDrawingHelper,
      annotationUID,
      textBoxUID,
      textLines,
      textBoxPosition,
      canvasCoordinates,
      {},
      {
        ...textBoxOptions,
        color,
        padding: textBoxOptions.padding ?? 6,
      }
    );

    const { x: left, y: top, width, height } = boundingBox;

    annotation.data.handles.textBox.worldBoundingBox = {
      topLeft: viewport.canvasToWorld([left, top]),
      topRight: viewport.canvasToWorld([left + width, top]),
      bottomLeft: viewport.canvasToWorld([left, top + height]),
      bottomRight: viewport.canvasToWorld([left + width, top + height]),
    };
  }
}

const SHORT_HAND_MAP = {
  'Short Axis': 'W: ',
  'Long Axis': 'L: ',
  AREA: 'Area: ',
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
