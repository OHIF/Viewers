import {
  AngleTool,
  annotation,
  cursors,
  drawing,
  Enums,
  state,
  utilities,
} from '@cornerstonejs/tools';
import { getEnabledElement } from '@cornerstonejs/core';

const { drawHandles, drawLine, drawTextBox } = drawing;
const { getAnnotations } = annotation.state;
const { isAnnotationLocked } = annotation.locking;
const { isAnnotationVisible } = annotation.visibility;
const { viewportFilters, triggerAnnotationRenderForViewportIds, roundNumber } = utilities;
const { getViewportIdsWithToolToRender } = viewportFilters;
const { ChangeTypes, Events } = Enums;

// Standard ECG paper speed: 25 mm/s → 1 mm = 40 ms
const ECG_PAPER_SPEED_MM_S = 25;

// 3 points: A = QRS-onset, B = T-end, C = next QRS-onset
const POINT_LABELS = ['A', 'B', 'C'];
const POINT_COLORS = ['#60a5fa', '#fb923c', '#4ade80'];
const POINT_HINTS = ['QRS-onset', 'T-end', 'Next QRS'];

// QTc normal thresholds (ms)
const QTC_NORMAL_MAX = 440;
const QTC_BORDERLINE_MAX = 460;

// RR normal range: 600–1000 ms (60–100 bpm)
const RR_MIN_MS = 600;
const RR_MAX_MS = 1000;

// QT normal range
const QT_MIN_MS = 350;
const QT_MAX_MS = 440;

// ── Math helpers ──────────────────────────────────────────────────────────────

function distance3(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = (a[2] || 0) - (b[2] || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function mmToMs(mm) {
  return (mm / ECG_PAPER_SPEED_MM_S) * 1000;
}

function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function offsetPointLabel(ptCanvas, centerCanvas, dist = 18) {
  const dx = ptCanvas[0] - centerCanvas[0];
  const dy = ptCanvas[1] - centerCanvas[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [ptCanvas[0] + (dx / len) * dist, ptCanvas[1] + (dy / len) * dist];
}

function toCanvasPoints(viewport, points) {
  return points.map(p => viewport.worldToCanvas(p));
}

function ptSegDist(s, e, p) {
  const dx = e[0] - s[0];
  const dy = e[1] - s[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((p[0] - s[0]) ** 2 + (p[1] - s[1]) ** 2);
  const t = Math.max(0, Math.min(1, ((p[0] - s[0]) * dx + (p[1] - s[1]) * dy) / lenSq));
  return Math.sqrt((p[0] - s[0] - t * dx) ** 2 + (p[1] - s[1] - t * dy) ** 2);
}

function nearSegment(viewport, wA, wB, canvasCoords, proximity) {
  const [s, e] = [viewport.worldToCanvas(wA), viewport.worldToCanvas(wB)];
  return ptSegDist([s[0], s[1]], [e[0], e[1]], [canvasCoords[0], canvasCoords[1]]) <= proximity;
}

function qtcStatus(qtcMs) {
  if (qtcMs <= QTC_NORMAL_MAX) return { label: `✓ Normal (≤${QTC_NORMAL_MAX} ms)`, color: '#4ade80' };
  if (qtcMs <= QTC_BORDERLINE_MAX) return { label: `~ Borderline (${QTC_NORMAL_MAX}–${QTC_BORDERLINE_MAX} ms)`, color: '#facc15' };
  return { label: `↑ Prolonged (>${QTC_BORDERLINE_MAX} ms)`, color: '#f87171' };
}

function intervalStatus(ms, min, max, name) {
  if (ms < min) return { label: `↓ Short (<${min} ms)`, color: '#facc15' };
  if (ms > max) return { label: `↑ Long (>${max} ms)`, color: '#f87171' };
  return { label: `✓ Normal (${min}–${max} ms)`, color: '#4ade80' };
}

/**
 * Compute QT, RR, QTc Bazett, QTc Fridericia from 3 world points.
 *
 * A = QRS-onset, B = T-end, C = next QRS-onset
 *   AB = QT interval
 *   AC = RR interval
 */
function computeStats(points) {
  const result = {};
  const [A, B, C] = points;

  if (A && B) {
    const mm = distance3(A, B);
    result.QT = { mm, ms: mmToMs(mm) };
  }

  if (A && C) {
    const mm = distance3(A, C);
    result.RR = { mm, ms: mmToMs(mm) };
  }

  if (result.QT && result.RR) {
    const qtSec = result.QT.ms / 1000;
    const rrSec = result.RR.ms / 1000;
    if (rrSec > 0) {
      result.QTcB = { ms: (qtSec / Math.sqrt(rrSec)) * 1000 };
      result.QTcF = { ms: (qtSec / Math.cbrt(rrSec)) * 1000 };
    }
  }

  return result;
}

// ── Tool class ────────────────────────────────────────────────────────────────

class ECGBidirectionalTool extends AngleTool {
  static toolName = 'ECGBidirectional';

  constructor(toolProps = {}, defaultToolProps) {
    super(toolProps, defaultToolProps);
  }

  // ── Hit detection ──────────────────────────────────────────────────────────

  isPointNearTool = (element, annotationInstance, canvasCoords, proximity) => {
    const { viewport } = getEnabledElement(element);
    const points = annotationInstance?.data?.handles?.points;
    if (!points || points.length < 2) return false;

    // A→B (QT line) and A→C (RR line)
    if (nearSegment(viewport, points[0], points[1], canvasCoords, proximity)) return true;
    if (points.length === 3) {
      if (nearSegment(viewport, points[0], points[2], canvasCoords, proximity)) return true;
    }
    return false;
  };

  // ── Rendering ─────────────────────────────────────────────────────────────

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    let renderStatus = false;
    const { viewport } = enabledElement;
    const { element } = viewport;

    let annotations = getAnnotations(this.getToolName(), element);
    if (!annotations?.length) return renderStatus;
    annotations = this.filterInteractableAnnotationsForElement(element, annotations);
    if (!annotations?.length) return renderStatus;

    const styleSpecifier = {
      toolGroupId: this.toolGroupId,
      toolName: this.getToolName(),
      viewportId: viewport.id,
    };

    for (const annotationInstance of annotations) {
      const { annotationUID, data } = annotationInstance;
      const points = data?.handles?.points;
      const activeHandleIndex = data?.handles?.activeHandleIndex;
      if (!points || points.length < 2) continue;

      if (!isAnnotationVisible(annotationUID)) continue;

      styleSpecifier.annotationUID = annotationUID;
      const { color, lineWidth, lineDash } = this.getAnnotationStyle({
        annotation: annotationInstance,
        styleSpecifier,
      });

      const canvasCoords = toCanvasPoints(viewport, points);
      const center = [
        canvasCoords.reduce((s, p) => s + p[0], 0) / canvasCoords.length,
        canvasCoords.reduce((s, p) => s + p[1], 0) / canvasCoords.length,
      ];
      const textStyle = this.getLinkedTextBoxStyle(styleSpecifier, annotationInstance);

      // Draw handles
      if (!isAnnotationLocked(annotationUID)) {
        const visibleHandles =
          !this.editData && activeHandleIndex !== null
            ? [canvasCoords[activeHandleIndex]]
            : canvasCoords;
        drawHandles(svgDrawingHelper, annotationUID, 'handles', visibleHandles, {
          color,
          lineDash,
          lineWidth,
        });
      }

      // Draw point labels A / B / C with hint
      canvasCoords.forEach((cp, i) => {
        drawTextBox(
          svgDrawingHelper,
          annotationUID,
          `pt-${POINT_LABELS[i]}`,
          [`${POINT_LABELS[i]} (${POINT_HINTS[i]})`],
          offsetPointLabel(cp, center, 20),
          { ...textStyle, color: POINT_COLORS[i], background: 'rgba(15,23,42,0.9)' }
        );
      });

      const stats = computeStats(points);

      // Draw A→B line (QT interval)
      drawLine(svgDrawingHelper, annotationUID, 'ab', canvasCoords[0], canvasCoords[1], {
        color: '#fb923c',
        width: lineWidth,
        lineDash,
      });

      if (stats.QT) {
        const ms = Math.round(stats.QT.ms);
        const status = intervalStatus(ms, QT_MIN_MS, QT_MAX_MS, 'QT');
        const mid = midpoint(canvasCoords[0], canvasCoords[1]);
        drawTextBox(
          svgDrawingHelper, annotationUID, 'lbl-qt',
          [`QT: ${ms} ms`, `(${roundNumber(stats.QT.mm)} mm)`, status.label],
          [mid[0], mid[1] - 24],
          { ...textStyle, color: '#fb923c', background: 'rgba(15,23,42,0.85)' }
        );
      }

      renderStatus = true;

      // Draw A→C line (RR interval, dashed)
      if (points.length >= 3) {
        drawLine(svgDrawingHelper, annotationUID, 'ac', canvasCoords[0], canvasCoords[2], {
          color: '#4ade80',
          width: lineWidth,
          lineDash: '6,4',
        });

        if (stats.RR) {
          const ms = Math.round(stats.RR.ms);
          const status = intervalStatus(ms, RR_MIN_MS, RR_MAX_MS, 'RR');
          const mid = midpoint(canvasCoords[0], canvasCoords[2]);
          drawTextBox(
            svgDrawingHelper, annotationUID, 'lbl-rr',
            [`RR: ${ms} ms`, `(${roundNumber(stats.RR.mm)} mm)`, status.label],
            [mid[0], mid[1] + 28],
            { ...textStyle, color: '#4ade80', background: 'rgba(15,23,42,0.85)' }
          );
        }

        if (stats.QTcB) {
          const qtcBMs = Math.round(stats.QTcB.ms);
          const qtcFMs = Math.round(stats.QTcF.ms);
          const statusB = qtcStatus(qtcBMs);
          const statusF = qtcStatus(qtcFMs);

          // QTc box anchored near point B
          const bCanvas = canvasCoords[1];
          drawTextBox(
            svgDrawingHelper, annotationUID, 'lbl-qtc',
            [
              `QTcB: ${qtcBMs} ms`,
              statusB.label,
              `QTcF: ${qtcFMs} ms`,
              statusF.label,
            ],
            [bCanvas[0] + 20, bCanvas[1] - 10],
            { ...textStyle, color: '#c084fc', background: 'rgba(15,23,42,0.9)' }
          );
        }
      }

      if (annotationInstance.invalidated) {
        this._calculateCachedStats(
          annotationInstance,
          viewport.getRenderingEngine(),
          enabledElement
        );
      }
    }

    return renderStatus;
  };

  // ── Stats cache ───────────────────────────────────────────────────────────

  _calculateCachedStats(annotationInstance, _renderingEngine, enabledElement) {
    const { data } = annotationInstance;
    const points = data?.handles?.points;
    if (!points || points.length < 2) return data?.cachedStats || {};

    const targetId = this.getTargetId(enabledElement.viewport);
    const stats = computeStats(points);

    data.cachedStats = { ...(data.cachedStats || {}), [targetId]: stats };

    const wasInvalidated = annotationInstance.invalidated;
    annotationInstance.invalidated = false;

    if (wasInvalidated) {
      annotation.state.triggerAnnotationModified(
        annotationInstance,
        enabledElement.viewport.element,
        ChangeTypes.StatsUpdated
      );
    }

    return data.cachedStats;
  }

  // ── 3-click placement (inherits AngleTool's natural 3-point stop) ──────────
  // No override needed — AngleTool stops at 3 points by default.

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

export default ECGBidirectionalTool;
