import type { Types } from '@cornerstonejs/core';
import { ProbeTool, drawing, annotation } from '@cornerstonejs/tools';

import type { SVGDrawingHelper } from '@cornerstonejs/tools';
import type { StyleSpecifier } from '@cornerstonejs/tools';
import type { ProbeAnnotation } from '@cornerstonejs/tools';

import { getSRPointTextLines } from '../utils/srToolGetTextLines';
import drawCross, { CROSS_SIZE } from './drawCross';

const { drawTextBox } = drawing;
const { getAnnotations } = annotation.state;
const { isAnnotationVisible } = annotation.visibility;

/**
 * SRPoint: sub-type of Probe for hydrated DICOM SR SCOORD/SCOORD3D points.
 * Renders a cross (plus) marker per medical imaging convention;
 * shows label only, no intensity/coordinates.
 *
 * The SR sub-types (SRPoint, SRRectangleROI) are used when an onBeforeSRHydration hook remaps a
 * hydrated Probe or RectangleROI to them, so that the annotation shows its finding label instead of
 * statistics. Modes that use such a hook must add both tools to their tool groups.
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
    const { viewport, renderingEngine } = enabledElement;
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

      /**
       * Keep the Probe statistics update, which records a moved point and triggers
       * ANNOTATION_MODIFIED for the measurement service.
       */
      const targetId = this.getTargetId(viewport, data);
      data.cachedStats ??= {};
      if (!data.cachedStats[targetId] || annotation.invalidated) {
        this._calculateCachedStats(annotation, renderingEngine, enabledElement);
      }

      if (!isAnnotationVisible(annotationUID)) {
        continue;
      }

      styleSpecifier.annotationUID = annotationUID;
      const { color, lineWidth, lineDash } = this.getAnnotationStyle({
        annotation,
        styleSpecifier,
      });

      const size = Number(this.configuration?.handleRadius) || CROSS_SIZE;
      const cx = Number(canvasX);
      const cy = Number(canvasY);
      drawCross(svgDrawingHelper, annotationUID, 'cross', [cx, cy], size, {
        color,
        lineWidth,
        lineDash,
      });

      renderStatus = true;

      const options = this.getLinkedTextBoxStyle(styleSpecifier, annotation);
      if (options?.visibility !== false) {
        const textLines = this.configuration.getTextLines(data, targetId);
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
