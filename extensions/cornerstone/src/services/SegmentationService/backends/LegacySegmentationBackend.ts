import type { Types as csTypes } from '@cornerstonejs/core';
import {
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  type Types as cstTypes,
} from '@cornerstonejs/tools';
import { isVolume3DViewportType, isVolumeViewportType } from '../../../utils/getLegacyViewportType';
import type {
  AssembleSegmentationForSEGParams,
  ISegmentationBackend,
  LabelmapAddClassification,
} from './ISegmentationBackend';
import type { ISegmentationServiceInternals } from './ISegmentationServiceInternals';

const { Labelmap: LABELMAP, Surface: SURFACE } = csToolsEnums.SegmentationRepresentations;
const {
  state: { updateLabelmapSegmentationImageReferences },
} = cstSegmentation;

/**
 * Legacy (default) segmentation backend. Selected when the target viewport is NOT a
 * native GenericViewport (the off path / legacy StackViewport / VolumeViewport).
 * Holds the labelmap-add decision tree verbatim (determine + handleViewportConversion
 * + the stack/volume case handlers) and delegates the servicesManager-coupled work
 * (convertStackToVolumeViewport / attemptStackToVolumeConversion / handleVolumeViewport)
 * back to the service via ISegmentationServiceInternals, so behavior is byte-identical
 * to before the backend split.
 */
export class LegacySegmentationBackend implements ISegmentationBackend {
  constructor(private readonly service: ISegmentationServiceInternals) {}

  async classifyAndPrepareLabelmapAdd(
    csViewport: csTypes.IViewport,
    segmentation: cstTypes.Segmentation,
    viewportId: string,
    segmentationId: string,
    // The case handlers return LABELMAP/SURFACE directly (byte-identical to the
    // pre-split handleViewportConversion), so the incoming type is unused here.
    _representationType: csToolsEnums.SegmentationRepresentations
  ): Promise<LabelmapAddClassification> {
    const isVolumeViewport = isVolumeViewportType(csViewport);
    // A missing labelmap representation (stale/partial segmentation state) must not
    // throw on the `'volumeId' in ...` probe; treat it as a non-volume segmentation.
    const labelmapData = segmentation?.representationData?.[LABELMAP];
    const isVolumeSegmentation = !!labelmapData && 'volumeId' in labelmapData;

    return isVolumeViewport
      ? this.handleVolumeViewportCase(csViewport, segmentation, isVolumeSegmentation)
      : this.handleStackViewportCase(
          csViewport,
          segmentation,
          isVolumeSegmentation,
          viewportId,
          segmentationId
        );
  }

  private async handleVolumeViewportCase(
    csViewport: csTypes.IViewport,
    segmentation: cstTypes.Segmentation,
    isVolumeSegmentation: boolean
  ): Promise<LabelmapAddClassification> {
    if (isVolume3DViewportType(csViewport)) {
      return { representationTypeToUse: SURFACE, isConverted: false };
    }

    await this.service.handleVolumeViewport(
      csViewport as csTypes.IVolumeViewport,
      segmentation,
      isVolumeSegmentation
    );
    return { representationTypeToUse: LABELMAP, isConverted: false };
  }

  private async handleStackViewportCase(
    csViewport: csTypes.IViewport,
    segmentation: cstTypes.Segmentation,
    isVolumeSegmentation: boolean,
    viewportId: string,
    segmentationId: string
  ): Promise<LabelmapAddClassification> {
    if (isVolumeSegmentation) {
      const isConverted = await this.service.convertStackToVolumeViewport(csViewport);
      return { representationTypeToUse: LABELMAP, isConverted };
    }

    if (updateLabelmapSegmentationImageReferences(viewportId, segmentationId)) {
      return { representationTypeToUse: LABELMAP, isConverted: false };
    }

    const isConverted = await this.service.attemptStackToVolumeConversion(
      csViewport as csTypes.IStackViewport,
      segmentation,
      viewportId,
      segmentationId
    );

    return { representationTypeToUse: LABELMAP, isConverted };
  }

  assembleSegmentationDataForSEG(
    params: AssembleSegmentationForSEGParams
  ): cstTypes.SegmentationPublicInput {
    const { segmentationId, derivedImageIds, referencedImageIds, label, fallbackLabel, segments } =
      params;

    // Single flattened labelmap layer — byte-identical to the pre-split builder in
    // createSegmentationForSEGDisplaySet. Overlap is collapsed (one voxel = one id).
    return {
      segmentationId,
      representation: {
        type: LABELMAP,
        data: {
          imageIds: derivedImageIds,
          referencedImageIds,
        },
      },
      config: {
        label,
        fallbackLabel,
        segments,
      },
    };
  }

  jumpToSegmentCenter(viewport: csTypes.IViewport, world: csTypes.Point3): boolean {
    // Byte-identical to the pre-split guarded recenter: legacy stack/volume viewports
    // have jumpToWorld; if absent (e.g. a native viewport reaching the legacy twin),
    // no-op and report it so the caller skips the highlight, exactly as before.
    const legacyViewport = viewport as csTypes.IViewport & {
      jumpToWorld?: (world: csTypes.Point3) => void;
    };
    if (!legacyViewport?.jumpToWorld) {
      return false;
    }
    legacyViewport.jumpToWorld(world);
    return true;
  }
}
