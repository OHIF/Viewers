import { type Types } from '@cornerstonejs/core';
import {
  annotation,
  drawing,
  utilities,
  Types as cs3DToolsTypes,
  AnnotationDisplayTool,
} from '@cornerstonejs/tools';
import toolNames from './toolNames';
import { Annotation } from '@cornerstonejs/tools/dist/types/types';

export default class SCOORD3DPointTool extends AnnotationDisplayTool {
  static toolName = toolNames.SRSCOORD3DPoint;

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

    return lines;
  }

  // This tool should not inherit from AnnotationTool and we should not need
  // to add the following lines.
  isPointNearTool = () => null;
  getHandleNearImagePoint = () => null;

  renderAnnotation = (enabledElement: Types.IEnabledElement, svgDrawingHelper: any): void => {
    const { viewport } = enabledElement;
    const { element } = viewport;

    const annotations = annotation.state.getAnnotations(this.getToolName(), element);

    // Todo: We don't need this anymore, filtering happens in triggerAnnotationRender
    if (!annotations?.length) {
      return;
    }

    // Filter toolData to only render the data for the active SR.
    const filteredAnnotations = annotations;
    if (!viewport._actors?.size) {
      return;
    }

    const styleSpecifier: cs3DToolsTypes.AnnotationStyle.StyleSpecifier = {
      toolGroupId: this.toolGroupId,
      toolName: this.getToolName(),
      viewportId: enabledElement.viewport.id,
    };

    for (let i = 0; i < filteredAnnotations.length; i++) {
      const annotation = filteredAnnotations[i];

      const annotationUID = annotation.annotationUID;
      const { renderableData } = annotation.data;
      const { POINT: points } = renderableData;

      styleSpecifier.annotationUID = annotationUID;

      const lineWidth = this.getStyle('lineWidth', styleSpecifier, annotation);
      const lineDash = this.getStyle('lineDash', styleSpecifier, annotation);
      const color = this.getStyle('color', styleSpecifier, annotation);

      const options = {
        color,
        lineDash,
        lineWidth,
      };

      const point = points[0][0];

      // check if viewport can render it
      const viewable = viewport.isReferenceViewable(
        { FrameOfReferenceUID: annotation.metadata.FrameOfReferenceUID, cameraFocalPoint: point },
        { asNearbyProjection: true }
      );

      if (!viewable) {
        continue;
      }

      // render the point
      const arrowPointCanvas = viewport.worldToCanvas(point);
      // Todo: configure this
      const arrowEndCanvas = [arrowPointCanvas[0] + 20, arrowPointCanvas[1] + 20];
      const canvasCoordinates = [arrowPointCanvas, arrowEndCanvas];

      drawing.drawArrow(
        svgDrawingHelper,
        annotationUID,
        '1',
        canvasCoordinates[1],
        canvasCoordinates[0],
        {
          color: options.color,
          width: options.lineWidth,
        }
      );

      this.renderTextBox(
        svgDrawingHelper,
        viewport,
        canvasCoordinates,
        annotation,
        styleSpecifier,
        options
      );
    }
  };

  renderTextBox(
    svgDrawingHelper,
    viewport,
    canvasCoordinates,
    annotation,
    styleSpecifier,
    options = {}
  ) {
    if (!canvasCoordinates || !annotation) {
      return;
    }

    const { annotationUID, data = {} } = annotation;
    const { labels } = data;

    const textLines = [];

    for (const label of labels) {
      // make this generic
      // fix this
      if (label.label === '363698007') {
        textLines.push(`Finding Site: ${label.value}`);
      }
    }

    const { color } = options;

    const adaptedCanvasCoordinates = canvasCoordinates;
    // adapt coordinates if there is an adapter
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

  public getLinkedTextBoxStyle(
    specifications: cs3DToolsTypes.AnnotationStyle.StyleSpecifier,
    annotation?: Annotation
  ): Record<string, unknown> {
    // Todo: this function can be used to set different styles for different toolMode
    // for the textBox.

    return {
      visibility: this.getStyle('textBoxVisibility', specifications, annotation),
      fontFamily: this.getStyle('textBoxFontFamily', specifications, annotation),
      fontSize: this.getStyle('textBoxFontSize', specifications, annotation),
      color: this.getStyle('textBoxColor', specifications, annotation),
      shadow: this.getStyle('textBoxShadow', specifications, annotation),
      background: this.getStyle('textBoxBackground', specifications, annotation),
      lineWidth: this.getStyle('textBoxLinkLineWidth', specifications, annotation),
      lineDash: this.getStyle('textBoxLinkLineDash', specifications, annotation),
    };
  }
}
