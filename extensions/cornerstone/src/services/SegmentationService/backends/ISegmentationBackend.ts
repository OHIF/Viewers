import type { Types as csTypes } from '@cornerstonejs/core';
import type { Enums as csToolsEnums, Types as cstTypes } from '@cornerstonejs/tools';

/** A derived labelmap image produced by the SEG adapter (one per referenced image,
 *  per overlap group). `voxelManager.getScalarData()` yields the slice's label values. */
export interface SegLabelmapImage {
  imageId: string;
  voxelManager?: { getScalarData: () => ArrayLike<number> };
}

/** Inputs for assembling the cornerstone SegmentationPublicInput from a loaded SEG
 *  display set. `segDisplaySet.labelMapImages` is the adapter's array-of-groups (one
 *  conflict-free group per overlap layer); `overlappingSegments` flags whether the
 *  SEG actually has overlap. `derivedImageIds` is the flattened image-id list. */
export interface AssembleSegmentationForSEGParams {
  segmentationId: string;
  segDisplaySet: {
    labelMapImages?: SegLabelmapImage[][];
    overlappingSegments?: boolean;
    [key: string]: unknown;
  };
  derivedImageIds: string[];
  referencedImageIds: string[];
  label: string;
  fallbackLabel: string;
  segments: { [segmentIndex: string]: cstTypes.Segment };
}

/**
 * Result of classifying a labelmap add: the representation type to actually use
 * (LABELMAP, or SURFACE for a 3D viewport) and whether the viewport was promoted
 * stack -> volume (ORTHOGRAPHIC). When `isConverted` is true the caller defers the
 * representation add until the grid re-mounts the recreated viewport.
 */
export interface LabelmapAddClassification {
  representationTypeToUse: csToolsEnums.SegmentationRepresentations;
  isConverted: boolean;
}

/**
 * Segmentation backend twin (mirrors the viewport backend family at
 * `ViewportService/backends/`). One implementation per lane:
 *   - LegacySegmentationBackend: today's behavior (may promote a stack viewport to
 *     an ORTHOGRAPHIC volume viewport via the host's convertStackToVolumeViewport).
 *   - NextSegmentationBackend: the native GenericViewport ("next") path — renders
 *     the labelmap IN PLACE on the raw PlanarViewport and never promotes.
 *
 * DISPATCH (deliberately diverges from IViewportBackend): unlike the viewport
 * lifecycle backend, which is selected ONCE by the appConfig flag, the segmentation
 * twin is routed PER VIEWPORT via `csUtils.isGenericViewport(viewport)` (the same
 * runtime predicate used by `viewportOperations`). A flag-on session can hold both
 * legacy and native viewports, and every viewport-bearing method already has an
 * already-resolved, self-describing viewport in hand, so per-viewport routing is the
 * runtime truth. `isGenericViewport` is true for the native raw PlanarViewport and
 * false for legacy StackViewport/VolumeViewport.
 *
 * BOUNDARY: viewport (re)creation is NOT a segmentation concern. The Next twin never
 * calls `convertStackToVolumeViewport` (that recreates the viewport as ORTHOGRAPHIC
 * and is owned by CornerstoneViewportService); the Legacy twin reaches it through
 * `ISegmentationServiceInternals`, so the off path stays byte-identical.
 */
export interface ISegmentationBackend {
  /**
   * Decide how a LABELMAP representation is added for `csViewport`, performing any
   * stack->volume promotion the lane requires. Called only inside the LABELMAP gate
   * of `addSegmentationRepresentation` (CONTOUR/SURFACE never reach here).
   */
  classifyAndPrepareLabelmapAdd(
    csViewport: csTypes.IViewport,
    segmentation: cstTypes.Segmentation,
    viewportId: string,
    segmentationId: string,
    representationType: csToolsEnums.SegmentationRepresentations
  ): Promise<LabelmapAddClassification>;

  /**
   * Build the cornerstone SegmentationPublicInput for a loaded DICOM SEG display set.
   *
   * Dispatched by the session flag at SEG-load (NOT per viewport): no target viewport
   * exists yet, and the data shape (single- vs multi-layer) is fixed at creation.
   *
   * Legacy: a single flattened labelmap layer (today's behavior, byte-identical).
   * Next: when the SEG has overlapping segments, register each conflict-free group as
   * its own labelmap layer under one segmentationId (+ segmentBindings) so cornerstone
   * renders all overlapping segments via the slice path; otherwise identical to Legacy.
   */
  assembleSegmentationDataForSEG(
    params: AssembleSegmentationForSEGParams
  ): cstTypes.SegmentationPublicInput;

  /**
   * Recenter a viewport on a segment's world-space center point. Returns whether it
   * actually recentered, so the caller can skip the segment highlight when it did not
   * (preserving today's "no jump -> no highlight" behavior).
   *
   * Legacy: `viewport.jumpToWorld(world)` (guarded; absent -> false no-op, as today).
   * Next: a native PlanarViewport has no jumpToWorld -> navigate via a view reference
   * centered on `world` (setViewReference), turning today's silent native no-op into a
   * working jump-to-slice. (In-plane pan-to-center is a separate, deferred refinement.)
   */
  jumpToSegmentCenter(viewport: csTypes.IViewport, world: csTypes.Point3): boolean;
}
