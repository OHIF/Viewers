import type { Types as csTypes } from '@cornerstonejs/core';
import {
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  type Types as cstTypes,
} from '@cornerstonejs/tools';
import type {
  AssembleSegmentationForSEGParams,
  ISegmentationBackend,
  LabelmapAddClassification,
} from './ISegmentationBackend';

const { Labelmap: LABELMAP } = csToolsEnums.SegmentationRepresentations;
const {
  state: { updateLabelmapSegmentationImageReferences },
} = cstSegmentation;

/**
 * Native GenericViewport ("next") segmentation backend. Selected when the target
 * viewport is a native generic viewport (raw PlanarViewport;
 * `csUtils.isGenericViewport(viewport)` is true).
 *
 * The keystone of the native migration: a native PlanarViewport renders a labelmap
 * IN PLACE — cornerstone's `resolveLabelmapRenderPlan` picks `legacy-stack-image`
 * for a stack labelmap (no volumeId, no VTK_VOLUME_SLICE precondition) and the
 * duck-typed image-reference resolver maps it onto the viewport's current image. So
 * this twin NEVER promotes the viewport to an ORTHOGRAPHIC volume viewport: the
 * legacy `convertStackToVolumeViewport` calls `getViewPresentation` /
 * `setViewPresentation`, which the raw PlanarViewport does not implement — it throws
 * (the observed `getViewPresentation is not a function`) and would recreate the
 * viewport, defeating `useNextViewports`.
 *
 * Needs nothing from the host service (it never converts / never touches
 * servicesManager), so unlike the legacy twin it takes no internals handle.
 */
export class NextSegmentationBackend implements ISegmentationBackend {
  async classifyAndPrepareLabelmapAdd(
    _csViewport: csTypes.IViewport,
    _segmentation: cstTypes.Segmentation,
    viewportId: string,
    segmentationId: string,
    representationType: csToolsEnums.SegmentationRepresentations
  ): Promise<LabelmapAddClassification> {
    // Try the duck-typed in-place resolver so the labelmap's images map onto the
    // viewport's current image when the FrameOfReference matches. Its return value
    // is intentionally ignored: we return isConverted:false UNCONDITIONALLY so we
    // never promote, even on a mount-timing race where the resolver cannot map yet.
    updateLabelmapSegmentationImageReferences(viewportId, segmentationId);

    return { representationTypeToUse: representationType, isConverted: false };
  }

  assembleSegmentationDataForSEG(
    params: AssembleSegmentationForSEGParams
  ): cstTypes.SegmentationPublicInput {
    const {
      segmentationId,
      segDisplaySet,
      derivedImageIds,
      referencedImageIds,
      label,
      fallbackLabel,
      segments,
    } = params;

    const groups = segDisplaySet.labelMapImages ?? [];
    const config = { label, fallbackLabel, segments };

    // Non-overlapping (or a single group): identical to the legacy single-layer build.
    if (!segDisplaySet.overlappingSegments || groups.length <= 1) {
      return {
        segmentationId,
        representation: {
          type: LABELMAP,
          data: { imageIds: derivedImageIds, referencedImageIds },
        },
        config,
      };
    }

    // Overlapping SEG: register each conflict-free group as its OWN labelmap layer
    // under one segmentationId. cornerstone's slice path auto-fires for >1 stack layer
    // (shouldUseSliceRendering) and stacks one depth-offset vtkImageSlice actor per
    // layer, so all overlapping segments stay simultaneously visible.
    // ensureLabelmapState preserves a supplied labelmaps/segmentBindings/
    // primaryLabelmapId map via its `||=` guards, so this needs NO cornerstone change.
    const labelmaps: Record<
      string,
      { labelmapId: string; storageKind: 'stack'; imageIds: string[]; referencedImageIds: string[] }
    > = {};
    const segmentBindings: Record<number, { labelmapId: string; labelValue: number }> = {};

    groups.forEach((group, index) => {
      const labelmapId = `${segmentationId}-storage-${index}`;
      labelmaps[labelmapId] = {
        labelmapId,
        storageKind: 'stack',
        imageIds: group.map(image => image.imageId),
        referencedImageIds,
      };

      // The adapter bin-packs non-overlapping segments into each group and writes each
      // segment's index as its label value (the colorLUT is segment-indexed, so
      // labelValue === segmentIndex). Group membership is implicit in the pixel data,
      // so recover it by collecting the distinct non-zero values present in the group;
      // those segment indices bind to this layer (so ensureLabelmapState does not
      // default them all onto the primary layer, which would hide layers 1..N-1).
      const valuesInGroup = new Set<number>();
      for (const image of group) {
        const scalarData = image.voxelManager?.getScalarData();
        if (!scalarData) {
          continue;
        }
        for (let i = 0; i < scalarData.length; i++) {
          const value = scalarData[i];
          if (value !== 0) {
            valuesInGroup.add(value);
          }
        }
      }
      valuesInGroup.forEach(value => {
        segmentBindings[value] = { labelmapId, labelValue: value };
      });
    });

    return {
      segmentationId,
      representation: {
        type: LABELMAP,
        data: {
          // Keep the flattened list for legacy singular readers (getLabelmapImageIds,
          // SEG export); the per-layer truth lives in `labelmaps`.
          imageIds: derivedImageIds,
          referencedImageIds,
          labelmaps,
          segmentBindings,
          primaryLabelmapId: `${segmentationId}-storage-0`,
        },
      },
      config,
    } as cstTypes.SegmentationPublicInput;
  }

  jumpToSegmentCenter(viewport: csTypes.IViewport, world: csTypes.Point3): boolean {
    // A native PlanarViewport has no jumpToWorld; navigate via a view reference
    // centered on the segment's world point. This snaps to the slice containing
    // `world` along the viewport's current view normal (the core of jump-to-segment).
    // In-plane pan-to-center is a separate, deferred refinement.
    const nativeViewport = viewport as csTypes.IViewport & {
      setViewReference?: (ref: csTypes.ViewReference) => void;
    };
    if (typeof nativeViewport.setViewReference !== 'function') {
      return false;
    }
    nativeViewport.setViewReference({ cameraFocalPoint: world } as csTypes.ViewReference);
    viewport.render();
    return true;
  }
}
