import type { Types } from '@cornerstonejs/core';
import { ProbeTool, drawing, annotation } from '@cornerstonejs/tools';

import type { SVGDrawingHelper } from '@cornerstonejs/tools';
import type { StyleSpecifier } from '@cornerstonejs/tools';
import type { ProbeAnnotation } from '@cornerstonejs/tools';

import { getSRPointTextLines } from '../utils/srToolGetTextLines';

const { drawPath, drawTextBox } = drawing;
const { getAnnotations } = annotation.state;
const { isAnnotationVisible } = annotation.visibility;

const CROSS_SIZE = 6;

/**
 * SRPoint: sub-type of Probe for hydrated DICOM SR SCOORD/SCOORD3D points.
 * Renders a cross (plus) marker per medical imaging convention;
 * shows label only, no intensity/coordinates.
 */
class SRPointTool extends ProbeTool {
  static toolName = 'SRPoint';

  constructor(toolProps, defaultToolProps) {
    super(toolProps, {
      ...defaultToolProps,
      configuration: {
        ...defaultToolProps?.configuration,
        getTextLines: getSRPointTextLines,
        handleRadius: 6,
        textCanvasOffset: { x: 4, y: 4 },
      },
    });
  }

  renderAnnotation = (
    enabledElement: Types.IEnabledElement,
    svgDrawingHelper: SVGDrawingHelper
  ): boolean => {
    let renderStatus = false;
    const { viewport } = enabledElement;
    const { element } = viewport;

    const annotations = getAnnotations(this.getToolName(), element) as ProbeAnnotation[];
    if (!annotations?.length) {
      return renderStatus;
    }

    const filteredAnnotations = this.filterInteractableAnnotationsForElement(
      element,
      annotations
    );
    if (!filteredAnnotations?.length) {
      return renderStatus;
    }

    const styleSpecifier: StyleSpecifier = {
      toolGroupId: this.toolGroupId,
      toolName: this.getToolName(),
      viewportId: enabledElement.viewport.id,
    };

    for (const annotation of filteredAnnotations) {
      const annotationUID = annotation.annotationUID;
      const data = annotation.data;
      const point = data.handles.points[0];
      const [canvasX, canvasY] = viewport.worldToCanvas(point);

      if (!isAnnotationVisible(annotationUID)) {
        continue;
      }

      styleSpecifier.annotationUID = annotationUID;
      const { color, lineWidth } = this.getAnnotationStyle({
        annotation,
        styleSpecifier,
      });

      const size = Number(this.configuration?.handleRadius) || CROSS_SIZE;
      const cx = Number(canvasX);
      const cy = Number(canvasY);
      const crossPaths: [number, number][][] = [
        [[cx, cy - size], [cx, cy + size]],
        [[cx - size, cy], [cx + size, cy]],
      ];
      drawPath(svgDrawingHelper, annotationUID, 'cross', crossPaths, {
        color,
        lineWidth: lineWidth || 2,
      });

      renderStatus = true;

      const options = this.getLinkedTextBoxStyle(styleSpecifier, annotation);
      if (options?.visibility !== false) {
        const targetId = this.getTargetId(viewport, data);
        const textLines = getSRPointTextLines(data, targetId);
        if (textLines?.length) {
          const textCanvasCoordinates = [
            cx + (this.configuration?.textCanvasOffset?.x ?? 4),
            cy + (this.configuration?.textCanvasOffset?.y ?? 4),
          ];
          drawTextBox(
            svgDrawingHelper,
            annotationUID,
            '0',
            textLines,
            [textCanvasCoordinates[0], textCanvasCoordinates[1]],
            { ...options, padding: options.padding ?? 4 }
          );
        }
      }
    }

    return renderStatus;
  };
}

export default SRPointTool;
