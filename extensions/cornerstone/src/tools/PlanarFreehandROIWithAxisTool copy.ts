import { PlanarFreehandROITool, annotation, drawing } from '@cornerstonejs/tools';

class PlanarFreehandROIWithAxisTool extends PlanarFreehandROITool {
  static toolName = 'PlanarFreehandROIWithAxis';

  constructor(props = {}) {
    super(props);
  }

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    const result = super.renderAnnotation(enabledElement, svgDrawingHelper);
    const { viewport } = enabledElement;
    const { element } = viewport;

    // Retrieve annotations for the current tool and element
    const annotations = annotation.state.getAnnotations(this.getToolName(), element);

    if (!annotations?.length) {
      return;
    }

    annotations.forEach(annotation => {
      const { contour } = annotation.data;
      if (!contour?.polyline?.length || !contour.closed) {
        return;
      }

      const canvasPoints = this.getCanvasPoints(viewport, contour.polyline);
      const [longAxisStart, longAxisEnd] = this.generateLongestAxisPoints(canvasPoints);
      const [shortAxisStart, shortAxisEnd] = this.generateShortAxisPoints(
        longAxisStart,
        longAxisEnd,
        canvasPoints
      );

      this.drawAxis(
        svgDrawingHelper,
        annotation.annotationUID,
        'longAxisLine',
        longAxisStart,
        longAxisEnd,
        'red'
      );
      this.drawAxis(
        svgDrawingHelper,
        annotation.annotationUID,
        'shortAxisLine',
        shortAxisStart,
        shortAxisEnd,
        'white'
      );
    });

    return result;
  };

  getCanvasPoints = (viewport, polyline) => polyline.map(point => viewport.worldToCanvas(point));

  drawAxis = (svgDrawingHelper, annotationUID, axisName, start, end, color) => {
    drawing.drawLine(
      svgDrawingHelper,
      annotationUID,
      axisName,
      [start[0], start[1]],
      [end[0], end[1]],
      {
        color,
        width: 2,
      }
    );
  };

  // LA
  generateLongestAxisPoints = points => {
    let maxDistance = 0;
    let longestPair = [points[0], points[1]];

    points.forEach((p1, i) => {
      points.slice(i + 1).forEach(p2 => {
        const distance = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        if (distance > maxDistance) {
          maxDistance = distance;
          longestPair = [p1, p2];
        }
      });
    });

    return longestPair;
  };

  // SA
  generateShortAxisPoints = (longAxisStart, longAxisEnd, contourPoints) => {
    const midPoint = this.getMidPoint(longAxisStart, longAxisEnd);
    const [unitPerpDx, unitPerpDy] = this.getPerpendicularUnitVector(longAxisStart, longAxisEnd);

    const shortAxisStart = this.adjustAxisPoint(midPoint, -unitPerpDx, -unitPerpDy, contourPoints);
    const shortAxisEnd = this.adjustAxisPoint(midPoint, unitPerpDx, unitPerpDy, contourPoints);

    return [shortAxisStart, shortAxisEnd];
  };

  // Gets the midpoint between two points
  getMidPoint = (p1, p2) => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

  // Calculates the perpendicular unit vector based on the long axis
  getPerpendicularUnitVector = (start, end) => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);
    return [-dy / length, dx / length];
  };

  // Adjusts the axis point to the nearest contour point if available
  adjustAxisPoint = (midPoint, perpDx, perpDy, contourPoints) => {
    const adjustedPoint = [midPoint[0] + perpDx * 20, midPoint[1] + perpDy * 20];
    return this.findNearestContourPoint(adjustedPoint, contourPoints);
  };

  // Finds the nearest point on the contour to a given point
  findNearestContourPoint = (point, contourPoints) => {
    return contourPoints.reduce((nearest, contourPoint) => {
      const distance = Math.hypot(point[0] - contourPoint[0], point[1] - contourPoint[1]);
      return distance < Math.hypot(point[0] - nearest[0], point[1] - nearest[1])
        ? contourPoint
        : nearest;
    }, contourPoints[0]);
  };
}

export default PlanarFreehandROIWithAxisTool;
