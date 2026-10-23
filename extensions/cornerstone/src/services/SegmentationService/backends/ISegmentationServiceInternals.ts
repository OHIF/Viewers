import type { Types as csTypes } from '@cornerstonejs/core';
import type { Types as cstTypes } from '@cornerstonejs/tools';

/**
 * The narrow slice of SegmentationService that a segmentation backend is allowed to
 * reach (mirrors `IViewportServiceInternals`). The service `implements` this and
 * passes `this` to each backend, so the legacy twin can delegate the viewport
 * (re)creation / data-volume conversion work back to the shared service methods
 * (which touch servicesManager-owned services) without the backends reaching into
 * unrelated internals. Keeping this surface narrow is what stops the legacy path
 * from drifting as the next backend grows.
 *
 * Only the LEGACY twin uses these; the NEXT twin renders in place and needs none of
 * them (it never converts).
 */
export interface ISegmentationServiceInternals {
  /**
   * Recreate the stack viewport as an ORTHOGRAPHIC volume viewport (legacy
   * promotion). Owned by the service because it drives viewportGridService /
   * cornerstoneViewportService. Returns true (converted).
   */
  convertStackToVolumeViewport(viewport: csTypes.IViewport): Promise<boolean>;

  /**
   * Promote a stack viewport to volume only when the segmentation's
   * FrameOfReference matches the viewport's. Returns whether it converted.
   */
  attemptStackToVolumeConversion(
    viewport: csTypes.IStackViewport,
    segmentation: cstTypes.Segmentation,
    viewportId: string,
    segmentationId: string
  ): Promise<boolean>;

  /**
   * Convert the segmentation DATA to a volume labelmap when its FrameOfReference
   * matches a volume viewport (pure data; no viewport recreation).
   */
  handleVolumeViewport(
    viewport: csTypes.IVolumeViewport,
    segmentation: cstTypes.Segmentation,
    isVolumeSegmentation: boolean
  ): Promise<void>;
}
