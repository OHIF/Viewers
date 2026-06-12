/**
 * viewportOverlay.ts (MIMPS-10)
 *
 * Renders read-only AI bounding boxes on the active Cornerstone3D viewport
 * using the cornerstoneTools annotation state API (same mechanism
 * extensions/cornerstone/src/initMeasurementService.ts uses to hydrate
 * annotations programmatically).
 *
 * Design constraints:
 *  - The box must NOT be editable, movable or deletable by the user. We use a
 *    RectangleROITool subclass with its own toolName ('AIBoundingBox') that is
 *    added to the tool group in `Enabled` mode (rendered, never interactive)
 *    and additionally reports no hit-test proximity. Because the toolName has
 *    no measurement-service mapping, the box also never appears in the
 *    measurements panel.
 *  - Re-running the panel must not duplicate boxes: every UID we add is
 *    tracked and cleared before the next draw (and on panel unmount).
 *  - bounding_box coordinates arrive in image pixel space for a specific
 *    imageId; they are converted to world space with imageToWorldCoords.
 */

import {
  getEnabledElementByViewportId,
  utilities as csUtils,
} from '@cornerstonejs/core';
import type { Types as CoreTypes } from '@cornerstonejs/core';
import { addTool, annotation as csAnnotation, RectangleROITool } from '@cornerstonejs/tools';
import type { Types as csToolsTypes } from '@cornerstonejs/tools';
import { triggerAnnotationRenderForViewportIds } from '@cornerstonejs/tools/utilities';

import type { InferenceFinding } from './inferenceClient';
import { toPtLabel } from '../utils/labels';

const BRAND_VIOLET = '#7C3AED';

/**
 * Display-only rectangle: renders like RectangleROI but is invisible to
 * hit-testing, so it can never be selected, dragged or deleted, and it shows
 * the AI label instead of area/mean statistics.
 */
class AIBoundingBoxTool extends RectangleROITool {
  static toolName = 'AIBoundingBox';

  constructor(toolProps = {}, defaultToolProps = undefined) {
    super(toolProps, defaultToolProps);
    // Label text instead of cached stats (area/mean/max).
    this.configuration.getTextLines = (data: { label?: string }) =>
      data?.label ? [data.label] : [];
    // Defense in depth: even if the tool ends up Passive in some tool group,
    // a tool that is never "near" the pointer can't be grabbed or deleted.
    this.isPointNearTool = () => false;
    this.getHandleNearImagePoint = () => undefined;
  }
}

let toolClassRegistered = false;
const activeAnnotationUIDs = new Set<string>();
let lastViewportId: string | null = null;

function ensureToolOnViewport(servicesManager: unknown, viewportId: string): boolean {
  const services = (servicesManager as { services?: Record<string, unknown> })?.services;
  const toolGroupService = services?.toolGroupService as
    | {
        getToolGroupForViewport?: (viewportId: string) => {
          hasTool: (toolName: string) => boolean;
          addTool: (toolName: string) => void;
          setToolEnabled: (toolName: string) => void;
        } | void;
      }
    | undefined;

  if (!toolGroupService?.getToolGroupForViewport) {
    return false;
  }

  if (!toolClassRegistered) {
    try {
      addTool(AIBoundingBoxTool);
    } catch (_err) {
      // Already registered globally (e.g. mode re-entry) — fine.
    }
    toolClassRegistered = true;
  }

  const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
  if (!toolGroup) {
    return false;
  }

  if (!toolGroup.hasTool(AIBoundingBoxTool.toolName)) {
    toolGroup.addTool(AIBoundingBoxTool.toolName);
  }
  // Enabled = rendered but never interactive (vs Passive, which still allows
  // manipulation of existing annotations).
  toolGroup.setToolEnabled(AIBoundingBoxTool.toolName);
  return true;
}

/**
 * Removes every AI box previously added by this module and re-renders the
 * viewport they lived on. Safe to call when nothing was drawn.
 */
export function clearAIBoundingBoxes(): void {
  if (activeAnnotationUIDs.size === 0) {
    return;
  }
  for (const uid of activeAnnotationUIDs) {
    try {
      csAnnotation.state.removeAnnotation(uid);
    } catch (_err) {
      // Annotation may already be gone (e.g. study closed) — ignore.
    }
  }
  activeAnnotationUIDs.clear();

  if (lastViewportId) {
    try {
      triggerAnnotationRenderForViewportIds([lastViewportId]);
    } catch (_err) {
      // Viewport may have been destroyed — nothing to re-render.
    }
    lastViewportId = null;
  }
}

export interface ShowBoundingBoxesArgs {
  servicesManager: unknown;
  /** imageId of the frame the inference ran on (capture source). */
  imageId: string;
  findings: InferenceFinding[];
}

/**
 * Draws one read-only dashed violet rectangle per finding that carries a
 * bounding_box. Findings with bounding_box === null are skipped — we never
 * synthesize a localization the model did not produce.
 *
 * Returns the number of boxes drawn.
 */
export function showAIBoundingBoxes({
  servicesManager,
  imageId,
  findings,
}: ShowBoundingBoxesArgs): number {
  // Idempotency: re-runs replace, never stack.
  clearAIBoundingBoxes();

  const localized = findings.filter(f => f.bounding_box !== null);
  if (localized.length === 0 || !imageId) {
    return 0;
  }

  const services = (servicesManager as { services?: Record<string, unknown> })?.services;
  const viewportGridService = services?.viewportGridService as
    | { getActiveViewportId?: () => string | undefined }
    | undefined;
  const viewportId = viewportGridService?.getActiveViewportId?.();
  if (!viewportId) {
    return 0;
  }

  const enabledElement = getEnabledElementByViewportId(viewportId);
  if (!enabledElement) {
    return 0;
  }
  const { viewport } = enabledElement;

  if (!ensureToolOnViewport(servicesManager, viewportId)) {
    return 0;
  }

  const FrameOfReferenceUID = viewport.getFrameOfReferenceUID();
  let drawn = 0;

  for (const finding of localized) {
    const box = finding.bounding_box;
    if (!box) {
      continue;
    }

    let corners: CoreTypes.Point3[];
    try {
      // Image pixel space -> world space for the analyzed frame.
      corners = [
        csUtils.imageToWorldCoords(imageId, [box.x, box.y]), // top-left
        csUtils.imageToWorldCoords(imageId, [box.x + box.width, box.y]), // top-right
        csUtils.imageToWorldCoords(imageId, [box.x, box.y + box.height]), // bottom-left
        csUtils.imageToWorldCoords(imageId, [box.x + box.width, box.y + box.height]), // bottom-right
      ];
    } catch (err) {
      console.warn('[blackvoxel-ai] could not map bounding box to world coords:', err);
      continue;
    }

    if (corners.some(corner => !corner)) {
      continue;
    }

    const pct = Math.round(finding.confidence * 100);
    const label = `IA: ${toPtLabel(finding.label)} ${pct}%`;
    const annotationUID = csUtils.uuidv4();

    const aiAnnotation = {
      annotationUID,
      highlighted: false,
      // invalidated MUST be true at add-time: MeasurementService.addUnmappedMeasurement
      // (platform/core) skips invalidated annotations, which keeps this read-only
      // overlay out of the measurements panel (where it would become deletable).
      // Cornerstone resets it to false after the first stats pass.
      invalidated: true,
      isLocked: true,
      isVisible: true,
      metadata: {
        toolName: AIBoundingBoxTool.toolName,
        FrameOfReferenceUID,
        referencedImageId: imageId,
      },
      data: {
        label,
        handles: {
          points: corners,
          activeHandleIndex: null,
          textBox: {
            hasMoved: false,
            worldPosition: [0, 0, 0],
            worldBoundingBox: {
              topLeft: [0, 0, 0],
              topRight: [0, 0, 0],
              bottomLeft: [0, 0, 0],
              bottomRight: [0, 0, 0],
            },
          },
        },
        cachedStats: {},
      },
    } as unknown as csToolsTypes.Annotation;

    csAnnotation.state.addAnnotation(aiAnnotation, viewport.element);
    csAnnotation.locking.setAnnotationLocked(annotationUID, true);
    csAnnotation.config.style.setAnnotationStyles(annotationUID, {
      color: BRAND_VIOLET,
      colorHighlighted: BRAND_VIOLET,
      colorSelected: BRAND_VIOLET,
      colorLocked: BRAND_VIOLET,
      lineDash: '4,4',
      lineWidth: '2',
      textBoxColor: BRAND_VIOLET,
      textBoxColorHighlighted: BRAND_VIOLET,
      textBoxColorSelected: BRAND_VIOLET,
      textBoxColorLocked: BRAND_VIOLET,
    });

    activeAnnotationUIDs.add(annotationUID);
    drawn += 1;
  }

  lastViewportId = viewportId;
  triggerAnnotationRenderForViewportIds([viewportId]);
  return drawn;
}
