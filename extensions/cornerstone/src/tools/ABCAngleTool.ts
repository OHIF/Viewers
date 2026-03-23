import { AngleTool, drawing, Enums, annotation, utilities } from '@cornerstonejs/tools';
import { eventTarget } from '@cornerstonejs/core';

const { Events } = Enums;
const { triggerAnnotationRenderForToolGroupIds } = utilities;

type P2 = [number, number];
type P3 = [number, number, number];

const POINT_LABELS = ['A', 'B', 'C', 'D'];

/**
 * ABCAngleTool
 *
 * Usage:
 *  1. Click → place A
 *  2. Click → place B (angle vertex)
 *  3. Click → place C  (reference anchor — shown as gray dashed reference line)
 *  4. D is auto-provided on the B→C extension; drag D to adjust the active arm.
 *
 * Displayed angle: ∠ABD (between ray B→A and ray B→D).
 */
class ABCAngleTool extends AngleTool {
  static toolName = 'ABCAngle';

  constructor(toolProps = {}, defaultToolProps = {}) {
    super(toolProps, defaultToolProps);
    eventTarget.addEventListener(
      Events.ANNOTATION_COMPLETED,
      this._onAnnotationCompleted as EventListener
    );
  }

  // ─── Auto-place D after A, B, C are committed ─────────────────────────────

  private _onAnnotationCompleted = (evt: CustomEvent) => {
    const ann = (evt.detail as any)?.annotation;
    if (ann?.metadata?.toolName !== ABCAngleTool.toolName) return;

    const points: P3[] = ann.data.handles.points;
    if (points.length !== 3) return;

    const [_A, B, C] = points;

    // D = C + (C − B)  → one BC-length beyond C along B→C
    const D: P3 = [
      C[0] + (C[0] - B[0]),
      C[1] + (C[1] - B[1]),
      C[2] + (C[2] - B[2]),
    ];

    points.push(D);
    ann.invalidated = true;

    // Trigger render via tool group IDs (reliable fallback when element metadata is absent)
    triggerAnnotationRenderForToolGroupIds(['default', 'mpr']);
  };

  // ─── Angle stats: ∠ABD when D exists ─────────────────────────────────────

  _calculateCachedStats(ann: any, renderingEngine: any, enabledElement: any) {
    const { points } = ann.data.handles;

    if (points.length < 4) {
      return super._calculateCachedStats(ann, renderingEngine, enabledElement);
    }

    const A = points[0] as P3;
    const B = points[1] as P3;
    const D = points[3] as P3;

    const BAx = A[0] - B[0], BAy = A[1] - B[1], BAz = A[2] - B[2];
    const BDx = D[0] - B[0], BDy = D[1] - B[1], BDz = D[2] - B[2];
    const magBA = Math.sqrt(BAx ** 2 + BAy ** 2 + BAz ** 2);
    const magBD = Math.sqrt(BDx ** 2 + BDy ** 2 + BDz ** 2);

    let angle: number | string = 'Incomplete Angle';
    if (magBA > 0 && magBD > 0) {
      const cos = Math.max(-1, Math.min(1, (BAx * BDx + BAy * BDy + BAz * BDz) / (magBA * magBD)));
      angle = Math.round(Math.acos(cos) * (180 / Math.PI) * 100) / 100;
    }

    const targetId = this.getTargetId(enabledElement.viewport);
    ann.data.cachedStats[targetId] = { angle };
    ann.invalidated = false;
    return ann.data.cachedStats;
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  renderAnnotation = (enabledElement: any, svgDrawingHelper: any): boolean => {
    let renderStatus = false;
    const { viewport } = enabledElement;
    const { element } = viewport;

    let annotations = annotation.state.getAnnotations(ABCAngleTool.toolName, element);
    if (!annotations?.length) return renderStatus;

    annotations = this.filterInteractableAnnotationsForElement(element, annotations);
    if (!annotations?.length) return renderStatus;

    const targetId = this.getTargetId(viewport);
    const renderingEngine = viewport.getRenderingEngine();

    const styleSpecifier: any = {
      toolGroupId: this.toolGroupId,
      toolName: this.getToolName(),
      viewportId: viewport.id,
    };

    for (const ann of annotations) {
      const { annotationUID, data } = ann;
      const { points, activeHandleIndex } = data.handles;

      if (!annotation.visibility.isAnnotationVisible(annotationUID)) continue;

      styleSpecifier.annotationUID = annotationUID;
      const { color, lineWidth, lineDash } = this.getAnnotationStyle({ annotation: ann, styleSpecifier });

      const canvasCoords = points.map((p: P3) => viewport.worldToCanvas(p) as P2);

      // ── Update stats ──────────────────────────────────────────────────
      const cached = data.cachedStats[targetId] as { angle?: number | string } | undefined;
      if (!cached || cached.angle == null) {
        data.cachedStats[targetId] = { angle: null };
        this._calculateCachedStats(ann, renderingEngine, enabledElement);
      } else if (ann.invalidated) {
        this._calculateCachedStats(ann, renderingEngine, enabledElement);
      }

      // ── Handles ───────────────────────────────────────────────────────
      const isLocked = annotation.locking.isAnnotationLocked(annotationUID);
      const hasActive = !isLocked && !this.editData && activeHandleIndex !== null;
      if (hasActive) {
        drawing.drawHandles(svgDrawingHelper, annotationUID, '0', canvasCoords, {
          color, lineDash, lineWidth,
        });
      }

      // ── Line A–B ──────────────────────────────────────────────────────
      if (canvasCoords.length >= 2) {
        drawing.drawLine(svgDrawingHelper, annotationUID, 'line-AB', canvasCoords[0], canvasCoords[1], {
          color, width: lineWidth, lineDash,
        });
        renderStatus = true;
      }

      if (canvasCoords.length >= 3) {
        const hasD = canvasCoords.length >= 4;
        const activeArmEnd: P2 = hasD ? canvasCoords[3] : canvasCoords[2];
        const refEnd: P2 | null = hasD ? canvasCoords[2] : null;

        // B → D  (active arm)
        drawing.drawLine(svgDrawingHelper, annotationUID, 'line-BD', canvasCoords[1], activeArmEnd, {
          color, width: lineWidth, lineDash,
        });

        // B → C  gray dashed reference (only after D exists)
        if (refEnd) {
          drawing.drawLine(svgDrawingHelper, annotationUID, 'line-BC-ref', canvasCoords[1], refEnd, {
            color: '#888888', width: '1', lineDash: '4,4',
          });
        }
      }

      // ── Labels A, B, C, D ────────────────────────────────────────────
      canvasCoords.forEach((cp, i) => {
        const label = POINT_LABELS[i];
        if (!label) return;
        drawing.drawTextBox(
          svgDrawingHelper,
          annotationUID,
          `pt-label-${label}`,
          [label],
          [cp[0] + 10, cp[1] - 10] as P2,
          {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#FFD700',
            background: 'rgba(0,0,0,0.5)',
            padding: 2,
          }
        );
      });

      // ── Angle text box ────────────────────────────────────────────────
      const cachedAngle = (data.cachedStats[targetId] as { angle?: number | string })?.angle;
      if (cachedAngle == null) continue;

      const options = this.getLinkedTextBoxStyle(styleSpecifier, ann);
      if (!options.visibility) {
        data.handles.textBox = {
          hasMoved: false,
          worldPosition: [0, 0, 0] as P3,
          worldBoundingBox: {
            topLeft: [0, 0, 0], topRight: [0, 0, 0],
            bottomLeft: [0, 0, 0], bottomRight: [0, 0, 0],
          },
        };
        continue;
      }

      const textLines =
        typeof cachedAngle === 'number'
          ? [`\u2220ABD: ${cachedAngle}\u00B0`]
          : [String(cachedAngle)];

      if (!data.handles.textBox.hasMoved) {
        data.handles.textBox.worldPosition = viewport.canvasToWorld(canvasCoords[1]);
      }
      const textBoxPos = viewport.worldToCanvas(data.handles.textBox.worldPosition) as P2;

      drawing.drawLinkedTextBox(
        svgDrawingHelper,
        annotationUID,
        'textbox-1',
        textLines,
        textBoxPos,
        canvasCoords,
        {},
        options
      );
    }

    return renderStatus;
  };
}

export default ABCAngleTool;
