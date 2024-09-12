import { PlanarFreehandROITool, annotation, drawing } from '@cornerstonejs/tools';

class PlanarFreehandROIWithAxisTool extends PlanarFreehandROITool {
  static toolName = 'PlanarFreehandROIWithAxis';

  constructor(props = {}) {
    super(props);
  }

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    const result = super.renderAnnotation(enabledElement, svgDrawingHelper);

    const { viewport } = enabledElement.viewport;
    const { element } = viewport;

    const annotations = annotation.state.getAnnotations(this.getToolName(), element);

    if (!annotations?.length) {
      return;
    }

    console.log('annotations', annotations);

    annotations.forEach(annotation => {
      const { data } = annotation;
      console.log(data);
      // contour
      const { contour } = data;

      const polyline = contour.polyline;

      if (!contour.closed) {
        return;
      }

      console.log('polyline', polyline);
      const canvasPoints = polyline.map(point => viewport.worldToCanvas(point));

      const [longAxisStart, longAxisEnd] = this.generateLongestAxisPoints(canvasPoints);

      drawing.drawLine(
        svgDrawingHelper,
        annotation.annotationUID,
        'longAxisLine',
        [longAxisStart[0], longAxisStart[1]],
        [longAxisEnd[0], longAxisEnd[1]],
        {
          color: 'red',
          width: 2,
        }
      );

      const [shortAxisStart, shortAxisEnd] = this.generatePerpendicularAxisPoints(
        longAxisStart,
        longAxisEnd,
        canvasPoints
      );

      drawing.drawLine(
        svgDrawingHelper,
        annotation.annotationUID,
        'shortAxisLine',
        [shortAxisStart[0], shortAxisStart[1]],
        [shortAxisEnd[0], shortAxisEnd[1]],
        {
          color: 'white',
          width: 2,
        }
      );
    });

    return result;
  };

  generateLongestAxisPoints(points) {
    let maxDistance = 0;
    let startPoint = points[0];
    let endPoint = points[0];

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const distance = Math.hypot(points[j][0] - points[i][0], points[j][1] - points[i][1]);
        if (distance > maxDistance) {
          maxDistance = distance;
          startPoint = points[i];
          endPoint = points[j];
        }
      }
    }

    return [startPoint, endPoint];
  }

  generatePerpendicularAxisPoints(startPoint, endPoint, contourPoints) {
    const midPoint = [(startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2];
    const dx = endPoint[0] - startPoint[0];
    const dy = endPoint[1] - startPoint[1];

    const length = Math.hypot(dx, dy) / 2;

    const perpDx = -dy;
    const perpDy = dx;

    const perpLength = Math.hypot(perpDx, perpDy);
    const unitPerpDx = (perpDx / perpLength) * length;
    const unitPerpDy = (perpDy / perpLength) * length;

    let shortAxisStart = [midPoint[0] - unitPerpDx, midPoint[1] - unitPerpDy];
    let shortAxisEnd = [midPoint[0] + unitPerpDx, midPoint[1] + unitPerpDy];

    if (contourPoints && contourPoints.length > 0) {
      shortAxisStart = this.findNearestContourPoint(shortAxisStart, contourPoints);
      shortAxisEnd = this.findNearestContourPoint(shortAxisEnd, contourPoints);
    }

    return [shortAxisStart, shortAxisEnd];
  }

  findNearestContourPoint(point, contourPoints) {
    if (!contourPoints || contourPoints.length === 0) {
      return point;
    }

    let nearestPoint = contourPoints[0];
    let minDistance = Math.hypot(point[0] - nearestPoint[0], point[1] - nearestPoint[1]);

    for (const contourPoint of contourPoints) {
      const distance = Math.hypot(point[0] - contourPoint[0], point[1] - contourPoint[1]);
      if (distance < minDistance) {
        nearestPoint = contourPoint;
        minDistance = distance;
      }
    }

    return nearestPoint;
  }
}

export default PlanarFreehandROIWithAxisTool;
