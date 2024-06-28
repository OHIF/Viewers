import { Types } from '@ohif/core';
import { cache as cs3DCache, Enums, volumeLoader, utilities as utils } from '@cornerstonejs/core';

import getCornerstoneViewportType from '../../utils/getCornerstoneViewportType';
import { StackViewportData, VolumeViewportData } from '../../types/CornerstoneCacheService';

const VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';

class CornerstoneCacheService {
  static REGISTRATION = {
    name: 'cornerstoneCacheService',
    altName: 'CornerstoneCacheService',
    create: ({ servicesManager }: Types.Extensions.ExtensionParams): CornerstoneCacheService => {
      return new CornerstoneCacheService(servicesManager);
    },
  };

  stackImageIds: Map<string, string[]> = new Map();
  volumeImageIds: Map<string, string[]> = new Map();
  readonly servicesManager: AppTypes.ServicesManager;

  constructor(servicesManager: AppTypes.ServicesManager) {
    this.servicesManager = servicesManager;
  }

  public getCacheSize() {
    return cs3DCache.getCacheSize();
  }

  public getCacheFreeSpace() {
    return cs3DCache.getBytesAvailable();
  }

  public async createViewportData(
    displaySets: unknown[],
    viewportOptions: Record<string, unknown>,
    dataSource: unknown,
    initialImageIndex?: number
  ): Promise<StackViewportData | VolumeViewportData> {
    let viewportType = viewportOptions.viewportType as string;

    // Todo: Since Cornerstone 3D currently doesn't support segmentation
    // on stack viewport, we should check if whether the the displaySets
    // that are about to be displayed are referenced in a segmentation
    // as a reference volume, if so, we should hang a volume viewport
    // instead of a stack viewport
    if (this._shouldRenderSegmentation(displaySets)) {
      // if the viewport type is volume 3D, we should let it be as it is
      // Todo: in future here we should kick start the conversion of the
      // segmentation to closed surface
      viewportType =
        viewportType === Enums.ViewportType.VOLUME_3D ? Enums.ViewportType.VOLUME_3D : 'volume';

      // update viewportOptions to reflect the new viewport type
      viewportOptions.viewportType = viewportType;
    }

    const cs3DViewportType = getCornerstoneViewportType(viewportType);
    let viewportData: StackViewportData | VolumeViewportData;

    if (cs3DViewportType === Enums.ViewportType.STACK) {
      viewportData = await this._getStackViewportData(
        dataSource,
        displaySets,
        initialImageIndex,
        cs3DViewportType
      );
    }

    if (
      cs3DViewportType === Enums.ViewportType.ORTHOGRAPHIC ||
      cs3DViewportType === Enums.ViewportType.VOLUME_3D
    ) {
      viewportData = await this._getVolumeViewportData(dataSource, displaySets, cs3DViewportType);
    }

    viewportData.viewportType = cs3DViewportType;

    return viewportData;
  }

  public async invalidateViewportData(
    viewportData: VolumeViewportData,
    invalidatedDisplaySetInstanceUID: string,
    dataSource,
    displaySetService
  ): Promise<VolumeViewportData | StackViewportData> {
    if (viewportData.viewportType === Enums.ViewportType.STACK) {
      const displaySet = displaySetService.getDisplaySetByUID(invalidatedDisplaySetInstanceUID);
      const imageIds = this._getCornerstoneStackImageIds(displaySet, dataSource);

      // remove images from the cache to be able to re-load them
      imageIds.forEach(imageId => {
        if (cs3DCache.getImageLoadObject(imageId)) {
          cs3DCache.removeImageLoadObject(imageId);
        }
      });

      return {
        viewportType: Enums.ViewportType.STACK,
        data: {
          StudyInstanceUID: displaySet.StudyInstanceUID,
          displaySetInstanceUID: invalidatedDisplaySetInstanceUID,
          imageIds,
        },
      };
    }

    // Todo: grab the volume and get the id from the viewport itself
    const volumeId = `${VOLUME_LOADER_SCHEME}:${invalidatedDisplaySetInstanceUID}`;

    const volume = cs3DCache.getVolume(volumeId);

    if (volume) {
      if (volume.imageIds) {
        // also for each imageId in the volume, remove the imageId from the cache
        // since that will hold the old metadata as well

        volume.imageIds.forEach(imageId => {
          if (cs3DCache.getImageLoadObject(imageId)) {
            cs3DCache.removeImageLoadObject(imageId);
          }
        });
      }

      // this shouldn't be via removeVolumeLoadObject, since that will
      // remove the texture as well, but here we really just need a remove
      // from registry so that we load it again
      cs3DCache._volumeCache.delete(volumeId);
      this.volumeImageIds.delete(volumeId);
    }

    const displaySets = viewportData.data.map(({ displaySetInstanceUID }) =>
      displaySetService.getDisplaySetByUID(displaySetInstanceUID)
    );

    const newViewportData = await this._getVolumeViewportData(
      dataSource,
      displaySets,
      viewportData.viewportType
    );

    return newViewportData;
  }

  private async _getStackViewportData(
    dataSource,
    displaySets,
    initialImageIndex,
    viewportType: Enums.ViewportType
  ): Promise<StackViewportData> {
    const overlayDisplaySets = displaySets.filter(ds => ds.isOverlayDisplaySet);
    const nonOverlayDisplaySets = displaySets.filter(ds => !ds.isOverlayDisplaySet);

    // load overlays if they are not loaded
    for (const overlayDisplaySet of overlayDisplaySets) {
      if (overlayDisplaySet.load && overlayDisplaySet.load instanceof Function) {
        const { userAuthenticationService } = this.servicesManager.services;
        const headers = userAuthenticationService.getAuthorizationHeader();
        await overlayDisplaySet.load({ headers });
      }
    }

    const displaySet = nonOverlayDisplaySets[0];

    let stackImageIds = this.stackImageIds.get(displaySet.displaySetInstanceUID);

    if (!stackImageIds) {
      stackImageIds = this._getCornerstoneStackImageIds(displaySet, dataSource);
      this.stackImageIds.set(displaySet.displaySetInstanceUID, stackImageIds);
    }

    // Ensuring the first non-overlay `displaySet` is always the primary one
    const StackViewportData = [displaySet, ...overlayDisplaySets].map(ds => {
      const { displaySetInstanceUID, StudyInstanceUID, isCompositeStack } = ds;

      return {
        StudyInstanceUID,
        displaySetInstanceUID,
        isCompositeStack,
        imageIds: stackImageIds,
        initialImageIndex,
      };
    });

    return {
      viewportType,
      data: StackViewportData,
    };
  }

  private async _getVolumeViewportData(
    dataSource,
    displaySets,
    viewportType: Enums.ViewportType
  ): Promise<VolumeViewportData> {
    // Todo: Check the cache for multiple scenarios to see if we need to
    // decache the volume data from other viewports or not

    const volumeData = [];

    for (const displaySet of displaySets) {
      // Don't create volumes for the displaySets that have custom load
      // function (e.g., SEG, RT, since they rely on the reference volumes
      // and they take care of their own loading after they are created in their
      // getSOPClassHandler method

      if (displaySet.load && displaySet.load instanceof Function) {
        const { userAuthenticationService } = this.servicesManager.services;
        const headers = userAuthenticationService.getAuthorizationHeader();
        await displaySet.load({ headers });

        volumeData.push({
          studyInstanceUID: displaySet.StudyInstanceUID,
          displaySetInstanceUID: displaySet.displaySetInstanceUID,
        });

        // Todo: do some cache check and empty the cache if needed
        continue;
      }

      const volumeLoaderSchema = displaySet.volumeLoaderSchema ?? VOLUME_LOADER_SCHEME;

      const volumeId = `${volumeLoaderSchema}:${displaySet.displaySetInstanceUID}`;

      let volumeImageIds = this.volumeImageIds.get(displaySet.displaySetInstanceUID);

      let volume = cs3DCache.getVolume(volumeId);

      if (!volumeImageIds || !volume) {
        volumeImageIds = this._getCornerstoneVolumeImageIds(displaySet, dataSource);

        volume = await volumeLoader.createAndCacheVolume(volumeId, {
          imageIds: volumeImageIds,
        });

        this.volumeImageIds.set(displaySet.displaySetInstanceUID, volumeImageIds);
      }

      volumeData.push({
        StudyInstanceUID: displaySet.StudyInstanceUID,
        displaySetInstanceUID: displaySet.displaySetInstanceUID,
        volume,
        volumeId,
        imageIds: volumeImageIds,
        isDynamicVolume: displaySet.isDynamicVolume,
      });
    }

    return {
      viewportType,
      data: volumeData,
    };
  }

  private _shouldRenderSegmentation(displaySets) {
    const { segmentationService, displaySetService } = this.servicesManager.services;

    const viewportDisplaySetInstanceUIDs = displaySets.map(
      ({ displaySetInstanceUID }) => displaySetInstanceUID
    );

    // check inside segmentations if any of them are referencing the displaySets
    // that are about to be displayed
    const segmentations = segmentationService.getSegmentations();

    for (const segmentation of segmentations) {
      const segDisplaySetInstanceUID = segmentation.displaySetInstanceUID;
      const segDisplaySet = displaySetService.getDisplaySetByUID(segDisplaySetInstanceUID);

      const instance = segDisplaySet.instances?.[0] || segDisplaySet.instance;

      const shouldDisplaySeg = segmentationService.shouldRenderSegmentation(
        viewportDisplaySetInstanceUIDs,
        instance?.FrameOfReferenceUID || segDisplaySet.FrameOfReferenceUID
      );

      if (shouldDisplaySeg) {
        return true;
      }
    }
  }

  private _getCornerstoneStackImageIds(displaySet, dataSource): string[] {
    return dataSource.getImageIdsForDisplaySet(displaySet);
  }

  private _getCornerstoneVolumeImageIds(displaySet, dataSource): string[] {
    const stackImageIds = this._getCornerstoneStackImageIds(displaySet, dataSource);

    return stackImageIds;
  }
}

export default CornerstoneCacheService;
