import { ProbeTool, utilities, annotation } from '@cornerstonejs/tools';
import { callInputDialog } from '@ohif/extension-default';
import getActiveViewportEnabledElement from '../utils/getActiveViewportEnabledElement';
import log from '@ohif/core/src/log';
import { utils } from '@ohif/core';
import { drawing } from '@cornerstonejs/tools';
import { metaData, Types } from '@cornerstonejs/core';
import { vec3 } from 'gl-matrix';

const { calibrateImageSpacing } = utilities;

/**
 * CustomProbe tool that displays annotations per frame of reference instead of per DICOM slice
 */
class CustomProbeTool extends ProbeTool {
  static toolName = 'CustomProbe';

  constructor(props, defaultProps) {
    super(props, {
      ...defaultProps,
      configuration: {
        ...((defaultProps && defaultProps.configuration) || {}),
        getTextLines: (data, targetId) => this.getTextLines(data, targetId),
      },
    });
  }

  renderAnnotation = (enabledElement, svgDrawingHelper): boolean => {
    let renderStatus = false;
    const { viewport } = enabledElement;
    const { element } = viewport;

    // Get all annotations for this tool across all elements (not just this element)
    let annotations = annotation.state.getAnnotations(this.getToolName(), element);

    if (!annotations?.length) {
      return renderStatus;
    }

    // Filter annotations that belong to the same Frame of Reference as this viewport
    const viewportFrameOfReference = this.getViewportFrameOfReference(viewport);
    annotations = annotations.filter(annotation => {
      const annotationFrameOfReference = annotation.metadata?.FrameOfReferenceUID;
      return annotationFrameOfReference === viewportFrameOfReference;
    });

    if (!annotations?.length) {
      return renderStatus;
    }

    const targetId = this.getTargetId(viewport);
    const renderingEngine = viewport.getRenderingEngine();
    const styleSpecifier = {
      toolGroupId: this.toolGroupId,
      toolName: this.getToolName(),
      viewportId: enabledElement.viewport.id,
    };

    for (let i = 0; i < annotations.length; i++) {
      const annotation = annotations[i];
      const annotationUID = annotation.annotationUID;
      const data = annotation.data;
      const point = data.handles.points[0];

      // Check if annotation should be visible in this viewport based on world coordinates
      if (!this.shouldShowAnnotationInViewport(viewport, annotation)) {
        continue;
      }


      // Convert world coordinates to canvas coordinates
      const canvasCoordinates = viewport.worldToCanvas(point);

      (styleSpecifier as any).annotationUID = annotationUID;
      const { color, lineWidth } = this.getAnnotationStyle({
        annotation,
        styleSpecifier,
      });

      // Calculate cached stats if needed
      if (!data.cachedStats) {
        data.cachedStats = {};
      }

      if (!data.cachedStats[targetId] || (data.cachedStats[targetId] as any).value === null) {
        data.cachedStats[targetId] = {
          Modality: null,
          index: null,
          value: null,
        };
        this._calculateCachedStats(annotation, renderingEngine, enabledElement, 'StatsUpdated' as any);
      } else if (annotation.invalidated) {
        this._calculateCachedStats(annotation, renderingEngine, enabledElement);
      }

      if (!viewport.getRenderingEngine()) {
        console.warn('Rendering Engine has been destroyed');
        return renderStatus;
      }

      // Draw the handle (point)
      const handleGroupUID = '0';
      drawing.drawHandles(svgDrawingHelper, annotationUID, handleGroupUID, [canvasCoordinates], {
        color,
        lineWidth,
        handleRadius: this.configuration.handleRadius,
      });

      renderStatus = true;

      // Draw text box
      const options = this.getLinkedTextBoxStyle(styleSpecifier, annotation);
      if (!options.visibility) {
        continue;
      }

      const textLines = this.configuration.getTextLines(data, targetId);
      if (textLines) {
        const textCanvasCoordinates = [
          canvasCoordinates[0] + this.configuration.textCanvasOffset.x,
          canvasCoordinates[1] + this.configuration.textCanvasOffset.y,
        ];
        const textUID = '0';
        drawing.drawTextBox(svgDrawingHelper, annotationUID, textUID, textLines, [textCanvasCoordinates[0], textCanvasCoordinates[1]], options);
      }
    }
    return renderStatus;
  };

  /**
   * Check if an annotation should be visible in the current viewport based on world coordinates
   * @param viewport - The current viewport
   * @param annotation - The annotation object containing metadata
   * @returns boolean - Whether the annotation should be visible
   */
  shouldShowAnnotationInViewport(viewport, annotation) {
    // Check if frame of reference matches the viewport and the annotation
    if (viewport.getFrameOfReferenceUID() === annotation.metadata?.FrameOfReferenceUID) {
      return this.isAnnotationNearViewingPlane(viewport, annotation.data.handles.points[0]);
    }

    return false;
  }

  /**
   * Check if an annotation is near the current viewing plane in a volume viewport
   * @param viewport - The volume viewport
   * @param annotationPoint - The world coordinates of the annotation point
   * @returns boolean - Whether the annotation is near the viewing plane
   */
  isAnnotationNearViewingPlane(viewport, annotationPoint) {
    const camera = viewport.getCamera();
    const { viewPlaneNormal, focalPoint } = camera;

    // Calculate the distance from the annotation point to the viewing plane
    // The viewing plane is defined by: viewPlaneNormal • (point - focalPoint) = 0
    const pointToFocal = vec3.subtract(vec3.create(), annotationPoint, focalPoint);
    const distanceToPlane = Math.abs(vec3.dot(pointToFocal, viewPlaneNormal));

    const threshold = 1; // 1mm threshold

    return distanceToPlane <= threshold;
  }


  /**
   * Get the Frame of Reference for the current viewport
   */
  getViewportFrameOfReference(viewport) {
    // Try to get Frame of Reference from the current image/volume
    const currentImageId = viewport.getCurrentImageId();
    if (currentImageId) {
      const imagePlaneModule = metaData.get('imagePlaneModule', currentImageId);
      return imagePlaneModule?.frameOfReferenceUID;
    }

    // Fallback: try to get from viewport data
    if (viewport.getImageData) {
      const imageData = viewport.getImageData();
      return imageData?.metadata?.FrameOfReferenceUID;
    }

    return null;
  }

  getTextLines(data, targetId) {
    const cachedVolumeStats = data.cachedStats[targetId];
    const { index, value, modalityUnit } = cachedVolumeStats;
    if (value === undefined || !index) {
        return;
    }
    const textLines = [];
    if (data.label) {
      textLines.push(`Label: ${data.label}`);
    }
    textLines.push(`(${index[0]}, ${index[1]}, ${index[2]})`);
    if (value instanceof Array && modalityUnit instanceof Array) {
        for (let i = 0; i < value.length; i++) {
            textLines.push(`${utils.roundNumber(value[i])} ${modalityUnit[i]}`);
        }
    }
    else {
        textLines.push(`${utils.roundNumber(value)} ${modalityUnit}`);
    }
    return textLines;
  }
}

export default CustomProbeTool;
