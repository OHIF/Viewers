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

    const labelLength = Math.min(labels.length, 5);
    const lines = [];

    for (let i = 0; i < labelLength; i++) {
      const labelEntry = labels[i];
      lines.push(`${_labelToShorthand(labelEntry.label)}: ${labelEntry.value}`);
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
    renderableData.map((data, index) => {
      const point = data[0];
      // This gives us one point for arrow
      canvasCoordinates.push(viewport.worldToCanvas(point));

      if (data[1] !== undefined) {
        canvasCoordinates.push(viewport.worldToCanvas(data[1]));
      }
      else{
         // We get the other point for the arrow by using the image size
      const imagePixelModule = metaData.get('imagePixelModule', referencedImageId);

      let xOffset = 10;
      let yOffset = 10;

      if (imagePixelModule) {
        const { columns, rows } = imagePixelModule;
        xOffset = columns / 10;
        yOffset = rows / 10;
      }

      const imagePoint = csUtils.worldToImageCoords(referencedImageId, point);
      const arrowEnd = csUtils.imageToWorldCoords(referencedImageId, [
        imagePoint[0] + xOffset,
        imagePoint[1] + yOffset,
      ]);

      canvasCoordinates.push(viewport.worldToCanvas(arrowEnd));
        
      }
     

      const arrowUID = `${index}`;

      // Todo: handle drawing probe as probe, currently we are drawing it as an arrow
      drawing.drawArrow(
        svgDrawingHelper,
        annotationUID,
        arrowUID,
        canvasCoordinates[1],
        canvasCoordinates[0],
        {
          color: options.color,
          width: options.lineWidth,
        }
      );
    });

    return canvasCoordinates; // used for drawing textBox
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
    const { labels } = data;
    const { color } = options;

    let adaptedCanvasCoordinates = canvasCoordinates;
    // adapt coordinates if there is an adapter
    if (typeof canvasCoordinatesAdapter === 'function') {
      adaptedCanvasCoordinates = canvasCoordinatesAdapter(canvasCoordinates);
    }
    const textLines = this._getTextBoxLinesFromLabels(labels);
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
