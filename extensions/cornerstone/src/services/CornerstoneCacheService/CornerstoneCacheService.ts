import { Types } from '@ohif/core';
import { cache as cs3DCache, Enums, volumeLoader } from '@cornerstonejs/core';

import getCornerstoneViewportType from '../../utils/getCornerstoneViewportType';
import { StackViewportData, VolumeViewportData } from '../../types/CornerstoneCacheService';
import { VOLUME_LOADER_SCHEME } from '../../constants';

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
    displaySets: Types.DisplaySet[],
    viewportOptions: AppTypes.ViewportGrid.GridViewportOptions,
    dataSource: unknown,
    initialImageIndex?: number
  ): Promise<StackViewportData | VolumeViewportData> {
    const viewportType = viewportOptions.viewportType as string;

    const cs3DViewportType = getCornerstoneViewportType(viewportType, displaySets);
    let viewportData: StackViewportData | VolumeViewportData;

    if (
      cs3DViewportType === Enums.ViewportType.ORTHOGRAPHIC ||
      cs3DViewportType === Enums.ViewportType.VOLUME_3D
    ) {
      viewportData = await this._getVolumeViewportData(dataSource, displaySets, cs3DViewportType);
    } else if (cs3DViewportType === Enums.ViewportType.STACK) {
      // Everything else looks like a stack
      viewportData = await this._getStackViewportData(
        dataSource,
        displaySets,
        initialImageIndex,
        cs3DViewportType
      );
    } else {
      viewportData = await this._getOtherViewportData(
        dataSource,
        displaySets,
        initialImageIndex,
        cs3DViewportType
      );
    }

    viewportData.viewportType = cs3DViewportType;

    return viewportData;
  }

  public async invalidateViewportData(
    viewportData: VolumeViewportData | StackViewportData,
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
            cs3DCache.removeImageLoadObject(imageId, { force: true });
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

  private async _getOtherViewportData(
    dataSource,
    displaySets,
    _initialImageIndex,
    viewportType: Enums.ViewportType
  ): Promise<StackViewportData> {
    // TODO - handle overlays and secondary display sets, but for now assume
    // the 1st display set is the one of interest
    const [displaySet] = displaySets;
    if (!displaySet.imageIds) {
      displaySet.imagesIds = this._getCornerstoneStackImageIds(displaySet, dataSource);
    }
    const { imageIds: data, viewportType: dsViewportType } = displaySet;
    return {
      viewportType: dsViewportType || viewportType,
      data: displaySets,
    };
  }

  private async _getStackViewportData(
    dataSource,
    displaySets,
    initialImageIndex,
    viewportType: Enums.ViewportType
  ): Promise<StackViewportData> {
    const { uiNotificationService } = this.servicesManager.services;
    const overlayDisplaySets = displaySets.filter(ds => ds.isOverlayDisplaySet);
    for (const overlayDisplaySet of overlayDisplaySets) {
      if (overlayDisplaySet.load && overlayDisplaySet.load instanceof Function) {
        const { userAuthenticationService } = this.servicesManager.services;
        const headers = userAuthenticationService.getAuthorizationHeader();
        try {
          await overlayDisplaySet.load({ headers });
        } catch (e) {
          uiNotificationService.show({
            title: 'Error loading displaySet',
            message: e.message,
            type: 'error',
          });
          console.error(e);
        }
      }
    }

    // Ensuring the first non-overlay `displaySet` is always the primary one
    const StackViewportData = [];
    for (const displaySet of displaySets) {
      const { displaySetInstanceUID, StudyInstanceUID, isCompositeStack } = displaySet;

      if (displaySet.load && displaySet.load instanceof Function) {
        const { userAuthenticationService } = this.servicesManager.services;
        const headers = userAuthenticationService.getAuthorizationHeader();
        try {
          await displaySet.load({ headers });
        } catch (e) {
          uiNotificationService.show({
            title: 'Error loading displaySet',
            message: e.message,
            type: 'error',
          });
          console.error(e);
        }
      }

      let stackImageIds = this.stackImageIds.get(displaySet.displaySetInstanceUID);

      if (!stackImageIds) {
        stackImageIds = this._getCornerstoneStackImageIds(displaySet, dataSource);
        // assign imageIds to the displaySet
        displaySet.imageIds = stackImageIds;
        this.stackImageIds.set(displaySet.displaySetInstanceUID, stackImageIds);
      }

      StackViewportData.push({
        StudyInstanceUID,
        displaySetInstanceUID,
        isCompositeStack,
        imageIds: stackImageIds,
        initialImageIndex,
      });
    }

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
      const { Modality } = displaySet;
      const isParametricMap = Modality === 'PMAP';
      const isSeg = Modality === 'SEG';

      // Don't create volumes for the displaySets that have custom load
      // function (e.g., SEG, RT, since they rely on the reference volumes
      // and they take care of their own loading after they are created in their
      // getSOPClassHandler method

      if (displaySet.load && displaySet.load instanceof Function) {
        const { userAuthenticationService } = this.servicesManager.services;
        const headers = userAuthenticationService.getAuthorizationHeader();

        try {
          await displaySet.load({ headers });
        } catch (e) {
          const { uiNotificationService } = this.servicesManager.services;
          uiNotificationService.show({
            title: 'Error loading displaySet',
            message: e.message,
            type: 'error',
          });
          console.error(e);
        }

        // Parametric maps have a `load` method but it should not be loaded in the
        // same way as SEG and RTSTRUCT but like a normal volume
        if (!isParametricMap) {
          volumeData.push({
            studyInstanceUID: displaySet.StudyInstanceUID,
            displaySetInstanceUID: displaySet.displaySetInstanceUID,
          });

          // Todo: do some cache check and empty the cache if needed
          continue;
        }
      }

      const volumeLoaderSchema = displaySet.volumeLoaderSchema ?? VOLUME_LOADER_SCHEME;
      const volumeId = `${volumeLoaderSchema}:${displaySet.displaySetInstanceUID}`;
      let volumeImageIds = this.volumeImageIds.get(displaySet.displaySetInstanceUID);
      let volume = cs3DCache.getVolume(volumeId);

      // Parametric maps do not have image ids but they already have volume data
      // therefore a new volume should not be created.
      if (!isParametricMap && !isSeg && (!volumeImageIds || !volume)) {
        volumeImageIds = this._getCornerstoneVolumeImageIds(displaySet, dataSource);

        volume = await volumeLoader.createAndCacheVolume(volumeId, {
          imageIds: volumeImageIds,
        });

        this.volumeImageIds.set(displaySet.displaySetInstanceUID, volumeImageIds);

        // Add imageIds to the displaySet for volumes
        displaySet.imageIds = volumeImageIds;
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

  private _getCornerstoneStackImageIds(displaySet, dataSource): string[] {
    return dataSource.getImageIdsForDisplaySet(displaySet);
  }

  private _getCornerstoneVolumeImageIds(displaySet, dataSource): string[] {
    if (displaySet.imageIds) {
      return displaySet.imageIds;
    }

    const stackImageIds = this._getCornerstoneStackImageIds(displaySet, dataSource);

    return stackImageIds;
  }
}

export default CornerstoneCacheService;
