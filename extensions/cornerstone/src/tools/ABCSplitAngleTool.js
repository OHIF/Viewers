import {
  AngleTool,
  annotation,
  cursors,
  drawing,
  Enums,
  state,
  utilities,
} from '@cornerstonejs/tools';
import { getEnabledElement, utilities as csUtils } from '@cornerstonejs/core';

const { drawHandles, drawLine, drawTextBox } = drawing;
const { getAnnotations } = annotation.state;
const { isAnnotationLocked } = annotation.locking;
const { isAnnotationVisible } = annotation.visibility;
const { viewportFilters, triggerAnnotationRenderForViewportIds, roundNumber } = utilities;
const { getViewportIdsWithToolToRender } = viewportFilters;
const { ChangeTypes, Events } = Enums;

function add3(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub3(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function scale3(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function projectPointToSegment(a, b, c) {
  const ab = sub3(b, a);
  const abLenSq = dot3(ab, ab);

  if (abLenSq === 0) {
    return [...a];
  }

  const t = Math.max(0, Math.min(1, dot3(sub3(c, a), ab) / abLenSq));
  return add3(a, scale3(ab, t));
}

function distance3(a, b) {
  const d = sub3(a, b);
  return Math.sqrt(dot3(d, d));
}

function triangleArea(a, b, c) {
  const ab = distance3(a, b);
  const bc = distance3(b, c);
  const ca = distance3(c, a);
  const s = (ab + bc + ca) / 2;
  const areaSquared = s * (s - ab) * (s - bc) * (s - ca);

  if (areaSquared <= 0) {
    return 0;
  }

  return Math.sqrt(areaSquared);
}

function angleAt(vertex, p1, p2) {
  const v1 = sub3(p1, vertex);
  const v2 = sub3(p2, vertex);
  const mag1 = Math.sqrt(dot3(v1, v1));
  const mag2 = Math.sqrt(dot3(v2, v2));

  if (mag1 === 0 || mag2 === 0) {
    return null;
  }

  const cos = Math.min(1, Math.max(-1, dot3(v1, v2) / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function formatAngle(value) {
  if (value == null || Number.isNaN(value)) {
    return '--';
  }

  return `${roundNumber(value)}°`;
}

function getSplitStats(points) {
  if (!points || points.length !== 3) {
    return null;
  }

  const [A, B, C] = points;
  const D = projectPointToSegment(A, B, C);

  return {
    D,
    triangle1: {
      A: angleAt(A, D, C),
      D: angleAt(D, A, C),
      C: angleAt(C, A, D),
      area: triangleArea(A, D, C),
      centroid: scale3(add3(add3(A, D), C), 1 / 3),
    },
    triangle2: {
      D: angleAt(D, B, C),
      B: angleAt(B, D, C),
      C: angleAt(C, D, B),
      area: triangleArea(D, B, C),
      centroid: scale3(add3(add3(D, B), C), 1 / 3),
    },
  };
}

function toCanvasPoints(viewport, points) {
  return points.map(point => viewport.worldToCanvas(point));
}

function pointToSegmentDistance(start, end, point) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const px = point[0] - start[0];
    const py = point[1] - start[1];
    return Math.sqrt(px * px + py * py);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lenSq)
  );
  const projX = start[0] + t * dx;
  const projY = start[1] + t * dy;
  const distX = point[0] - projX;
  const distY = point[1] - projY;

  return Math.sqrt(distX * distX + distY * distY);
}

function canvasPointNearSegment(viewport, start, end, canvasCoords, proximity) {
  const startCanvas = viewport.worldToCanvas(start);
  const endCanvas = viewport.worldToCanvas(end);

  return (
    pointToSegmentDistance(
      [startCanvas[0], startCanvas[1]],
      [endCanvas[0], endCanvas[1]],
      [canvasCoords[0], canvasCoords[1]]
    ) <= proximity
  );
}

function offsetPointLabel(pointCanvas, centerCanvas, distance = 18) {
  const dx = pointCanvas[0] - centerCanvas[0];
  const dy = pointCanvas[1] - centerCanvas[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  return [pointCanvas[0] + (dx / len) * distance, pointCanvas[1] + (dy / len) * distance];
}

class ABCSplitAngleTool extends AngleTool {
  static toolName = 'ABCSplitAngle';

  constructor(toolProps = {}, defaultToolProps) {
    super(toolProps, defaultToolProps);
  }

  isPointNearTool = (element, annotationInstance, canvasCoords, proximity) => {
    const enabledElement = getEnabledElement(element);
    const { viewport } = enabledElement;
    const points = annotationInstance?.data?.handles?.points;

    if (!points || points.length < 2) {
      return false;
    }

    if (canvasPointNearSegment(viewport, points[0], points[1], canvasCoords, proximity)) {
      return true;
    }

    if (points.length < 3) {
      return false;
    }

    const splitStats = getSplitStats(points);
    if (!splitStats) {
      return false;
    }

    return [
      [points[1], points[2]],
      [points[2], points[0]],
      [points[2], splitStats.D],
    ].some(([start, end]) => canvasPointNearSegment(viewport, start, end, canvasCoords, proximity));
  };

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    let renderStatus = false;
    const { viewport } = enabledElement;
    const { element } = viewport;
    let annotations = getAnnotations(this.getToolName(), element);

    if (!annotations?.length) {
      return renderStatus;
    }

    annotations = this.filterInteractableAnnotationsForElement(element, annotations);

    if (!annotations?.length) {
      return renderStatus;
    }

    const styleSpecifier = {
      toolGroupId: this.toolGroupId,
      toolName: this.getToolName(),
      viewportId: enabledElement.viewport.id,
    };

    for (const annotationInstance of annotations) {
      const { annotationUID, data } = annotationInstance;
      const points = data?.handles?.points;
      const activeHandleIndex = data?.handles?.activeHandleIndex;

      if (!points || points.length < 2) {
        continue;
      }

      styleSpecifier.annotationUID = annotationUID;

      const { color, lineWidth, lineDash } = this.getAnnotationStyle({
        annotation: annotationInstance,
        styleSpecifier,
      });

      const canvasCoordinates = toCanvasPoints(viewport, points);

      if (!isAnnotationVisible(annotationUID)) {
        continue;
      }

      const showHandles = !isAnnotationLocked(annotationUID);
      if (showHandles) {
        const visibleHandles =
          !this.editData && activeHandleIndex !== null
            ? [canvasCoordinates[activeHandleIndex]]
            : canvasCoordinates;

        drawHandles(svgDrawingHelper, annotationUID, 'handles', visibleHandles, {
          color,
          lineDash,
          lineWidth,
        });
      }

      drawLine(svgDrawingHelper, annotationUID, 'ab', canvasCoordinates[0], canvasCoordinates[1], {
        color,
        width: lineWidth,
        lineDash,
      });

      renderStatus = true;

      if (canvasCoordinates.length < 3) {
        continue;
      }

      const splitStats = getSplitStats(points);
      if (!splitStats) {
        continue;
      }

      const dCanvas = viewport.worldToCanvas(splitStats.D);
      const overallCentroid = [
        (canvasCoordinates[0][0] + canvasCoordinates[1][0] + canvasCoordinates[2][0] + dCanvas[0]) /
          4,
        (canvasCoordinates[0][1] + canvasCoordinates[1][1] + canvasCoordinates[2][1] + dCanvas[1]) /
          4,
      ];

      drawLine(svgDrawingHelper, annotationUID, 'bc', canvasCoordinates[1], canvasCoordinates[2], {
        color,
        width: lineWidth,
        lineDash,
      });
      drawLine(svgDrawingHelper, annotationUID, 'ca', canvasCoordinates[2], canvasCoordinates[0], {
        color,
        width: lineWidth,
        lineDash,
      });
      drawLine(svgDrawingHelper, annotationUID, 'cd', canvasCoordinates[2], dCanvas, {
        color,
        width: lineWidth,
        lineDash: '4,4',
      });

      drawHandles(svgDrawingHelper, annotationUID, 'd-handle', [dCanvas], {
        color: '#f59e0b',
        lineWidth,
      });

      const triangle1Canvas = viewport.worldToCanvas(splitStats.triangle1.centroid);
      const triangle2Canvas = viewport.worldToCanvas(splitStats.triangle2.centroid);
      const triangle1Text = [`T1 Area ${roundNumber(splitStats.triangle1.area)} mm²`];
      const triangle2Text = [`T2 Area ${roundNumber(splitStats.triangle2.area)} mm²`];

      const textStyle = this.getLinkedTextBoxStyle(styleSpecifier, annotationInstance);
      const pointLabelStyle = {
        ...textStyle,
        color: '#f8fafc',
        background: 'rgba(15, 23, 42, 0.95)',
      };
      const angleLabelStyle = {
        ...textStyle,
        color: '#facc15',
        background: 'rgba(15, 23, 42, 0.95)',
      };

      drawTextBox(svgDrawingHelper, annotationUID, 't1-label', triangle1Text, triangle1Canvas, {
        ...textStyle,
        color,
      });
      drawTextBox(svgDrawingHelper, annotationUID, 't2-label', triangle2Text, triangle2Canvas, {
        ...textStyle,
        color,
      });

      drawTextBox(
        svgDrawingHelper,
        annotationUID,
        'point-a',
        ['A'],
        offsetPointLabel(canvasCoordinates[0], overallCentroid),
        pointLabelStyle
      );
      drawTextBox(
        svgDrawingHelper,
        annotationUID,
        'point-b',
        ['B'],
        offsetPointLabel(canvasCoordinates[1], overallCentroid),
        pointLabelStyle
      );
      drawTextBox(
        svgDrawingHelper,
        annotationUID,
        'point-c',
        ['C'],
        offsetPointLabel(canvasCoordinates[2], overallCentroid),
        pointLabelStyle
      );
      drawTextBox(
        svgDrawingHelper,
        annotationUID,
        'point-d',
        ['D'],
        offsetPointLabel(dCanvas, overallCentroid),
        pointLabelStyle
      );
      drawTextBox(
        svgDrawingHelper,
        annotationUID,
        'angle-a',
        [`∠A ${formatAngle(splitStats.triangle1.A)}`],
        offsetPointLabel(canvasCoordinates[0], triangle1Canvas, 34),
        angleLabelStyle
      );
      drawTextBox(
        svgDrawingHelper,
        annotationUID,
        'angle-b',
        [`∠B ${formatAngle(splitStats.triangle2.B)}`],
        offsetPointLabel(canvasCoordinates[1], triangle2Canvas, 34),
        angleLabelStyle
      );
      drawTextBox(
        svgDrawingHelper,
        annotationUID,
        'angle-c',
        [`∠C ${formatAngle(splitStats.triangle1.C)} / ${formatAngle(splitStats.triangle2.C)}`],
        offsetPointLabel(canvasCoordinates[2], overallCentroid, 36),
        angleLabelStyle
      );
      drawTextBox(
        svgDrawingHelper,
        annotationUID,
        'angle-d',
        [`∠D ${formatAngle(splitStats.triangle1.D)} / ${formatAngle(splitStats.triangle2.D)}`],
        offsetPointLabel(dCanvas, overallCentroid, 36),
        angleLabelStyle
      );

      if (annotationInstance.invalidated) {
        this._calculateCachedStats(
          annotationInstance,
          enabledElement.viewport.getRenderingEngine(),
          enabledElement
        );
      }
    }

    return renderStatus;
  };

  _calculateCachedStats(annotationInstance, _renderingEngine, enabledElement) {
    const { data } = annotationInstance;
    const points = data?.handles?.points;
    const cachedStats = data?.cachedStats || {};

    if (!points || points.length !== 3) {
      return cachedStats;
    }

    const splitStats = getSplitStats(points);
    if (!splitStats) {
      return cachedStats;
    }

    const targetId = this.getTargetId(enabledElement.viewport);
    const { element } = enabledElement.viewport;
    const { dimensions, imageData } = this.getTargetImageData(targetId);
    this.isHandleOutsideImage = [...points, splitStats.D]
      .map(worldPos => csUtils.transformWorldToIndex(imageData, worldPos))
      .some(index => !csUtils.indexWithinDimensions(index, dimensions));

    data.cachedStats = {
      ...cachedStats,
      [targetId]: {
        D: splitStats.D,
        triangle1: splitStats.triangle1,
        triangle2: splitStats.triangle2,
      },
    };

    const invalidated = annotationInstance.invalidated;
    annotationInstance.invalidated = false;

    if (invalidated) {
      annotation.state.triggerAnnotationModified(
        annotationInstance,
        element,
        ChangeTypes.StatsUpdated
      );
    }

    return data.cachedStats;
  }

  _endCallback = evt => {
    const eventDetail = evt.detail;
    const { element } = eventDetail;
    const {
      annotation: annotationInstance,
      viewportIdsToRender,
      newAnnotation,
      hasMoved,
    } = this.editData;
    const { data } = annotationInstance;

    if (newAnnotation && !hasMoved) {
      return;
    }

    if (this.angleStartedNotYetCompleted && data?.handles?.points?.length === 2) {
      this.editData.handleIndex = 2;
      return;
    }

    this.angleStartedNotYetCompleted = false;
    if (data?.handles) {
      data.handles.activeHandleIndex = null;
    }
    this._deactivateModify(element);
    this._deactivateDraw(element);
    cursors.elementCursor.resetElementCursor(element);

    if (this.isHandleOutsideImage && this.configuration.preventHandleOutsideImage) {
      annotation.state.removeAnnotation(annotationInstance.annotationUID);
    }

    annotationInstance.invalidated = true;
    this._calculateCachedStats(
      annotationInstance,
      getEnabledElement(element).viewport.getRenderingEngine(),
      getEnabledElement(element)
    );

    triggerAnnotationRenderForViewportIds(viewportIdsToRender);
    this.doneEditMemo();

    if (newAnnotation) {
      annotation.state.triggerAnnotationCompleted(annotationInstance);
    }

    this.editData = null;
    this.isDrawing = false;
  };

  toolSelectedCallback = (evt, annotationInstance) => {
    const { element } = evt.detail;
    annotationInstance.highlighted = true;

    const viewportIdsToRender = getViewportIdsWithToolToRender(element, this.getToolName());
    this.editData = {
      annotation: annotationInstance,
      viewportIdsToRender,
      movingTextBox: false,
    };

    this._activateModify(element);
    cursors.elementCursor.hideElementCursor(element);
    triggerAnnotationRenderForViewportIds(viewportIdsToRender);
    evt.preventDefault();
  };

  _activateModify = element => {
    state.isInteractingWithTool = true;
    element.addEventListener(Events.MOUSE_UP, this._endCallback);
    element.addEventListener(Events.MOUSE_DRAG, this._dragCallback);
    element.addEventListener(Events.MOUSE_CLICK, this._endCallback);
    element.addEventListener(Events.TOUCH_TAP, this._endCallback);
    element.addEventListener(Events.TOUCH_END, this._endCallback);
    element.addEventListener(Events.TOUCH_DRAG, this._dragCallback);
  };
}

export default ABCSplitAngleTool;
