import { Enums, Types } from '@cornerstonejs/core';

type StackData = {
  StudyInstanceUID: string;
  displaySetInstanceUID: string;
  imageIds: string[];
  frameRate?: number;
  isClip?: boolean;
  initialImageIndex?: number | string | null;
};

type VolumeData = {
  studyInstanceUID: string;
  displaySetInstanceUID: string;
  volume?: Types.IVolume;
  imageIds?: string[];
};

type StackViewportData = {
  viewportType: Enums.ViewportType;
  data: StackData;
};

type VolumeViewportData = {
  viewportType: Enums.ViewportType;
  data: VolumeData[];
};

const VOLUME_IMAGE_LOADER_SCHEME = 'streaming-wadors';
const VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';

class CornerstoneCacheService {
  stackImageIds: Map<string, string[]> = new Map();
  volumeImageIds: Map<string, string[]> = new Map();

  constructor() {}

  public getCacheSize() {
    return cs3DCache.getCacheSize();
  }

  public getCacheFreeSpace() {
    return cs3DCache.getBytesAvailable();
  }

  public async createViewportData(
    displaySets: unknown[],
    viewportType: string,
    dataSource: unknown,
    initialImageIndex?: number
  ): Promise<StackViewportData | VolumeViewportData> {
    const cs3DViewportType = getCornerstoneViewportType(viewportType);
    let viewportData: StackViewportData | VolumeViewportData;

    if (cs3DViewportType === Enums.ViewportType.STACK) {
      viewportData = await this._getStackViewportData(
        dataSource,
        displaySets,
        initialImageIndex
      );
    }

    if (cs3DViewportType === Enums.ViewportType.ORTHOGRAPHIC) {
      viewportData = await this._getVolumeViewportData(dataSource, displaySets);
    }

    viewportData.viewportType = cs3DViewportType;

    return viewportData;
  }

  public async invalidateViewportData(
    viewportData: VolumeViewportData,
    invalidatedDisplaySetInstanceUID: string,
    dataSource,
    DisplaySetService
  ) {
    if (viewportData.viewportType === Enums.ViewportType.STACK) {
      throw new Error('Invalidation of StackViewport is not supported yet');
    }

    // Todo: grab the volume and get the id from the viewport itself
    const volumeId = `${VOLUME_LOADER_SCHEME}:${invalidatedDisplaySetInstanceUID}`;

    const volume = cs3DCache.getVolume(volumeId);

    if (volume) {
      cs3DCache.removeVolumeLoadObject(volumeId);
    }

    const displaySets = viewportData.data.map(({ displaySetInstanceUID }) =>
      DisplaySetService.getDisplaySetByUID(displaySetInstanceUID)
    );

    const newViewportData = await this._getVolumeViewportData(
      dataSource,
      displaySets
    );

    return newViewportData;
  }

  private _getStackViewportData(
    dataSource,
    displaySets,
    initialImageIndex
  ): StackViewportData {
    // For Stack Viewport we don't have fusion currently
    const displaySet = displaySets[0];

    let stackImageIds = this.stackImageIds.get(
      displaySet.displaySetInstanceUID
    );

    if (!stackImageIds) {
      stackImageIds = this._getCornerstoneStackImageIds(displaySet, dataSource);
      this.stackImageIds.set(displaySet.displaySetInstanceUID, stackImageIds);
    }

    const { displaySetInstanceUID, StudyInstanceUID } = displaySet;

    const StackViewportData: StackViewportData = {
      viewportType: Enums.ViewportType.STACK,
      data: {
        StudyInstanceUID,
        displaySetInstanceUID,
        imageIds: stackImageIds,
      },
    };

    if (typeof initialImageIndex === 'number') {
      StackViewportData.data.initialImageIndex = initialImageIndex;
    }

    return StackViewportData;
  }

  private async _getVolumeViewportData(
    dataSource,
    displaySets
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
        await displaySet.load();

        volumeData.push({
          studyInstanceUID: displaySet.StudyInstanceUID,
          displaySetInstanceUID: displaySet.displaySetInstanceUID,
        });

        // Todo: do some cache check and empty the cache if needed
        continue;
      }

      const volumeLoaderSchema =
        displaySet.volumeLoaderSchema ?? VOLUME_LOADER_SCHEME;

      const volumeId = `${volumeLoaderSchema}:${displaySet.displaySetInstanceUID}`;

      let volumeImageIds = this.volumeImageIds.get(
        displaySet.displaySetInstanceUID
      );

      let volume = cs3DCache.getVolume(volumeId);

      if (!volumeImageIds || !volume) {
        volumeImageIds = this._getCornerstoneVolumeImageIds(
          displaySet,
          dataSource
        );

        volume = await volumeLoader.createAndCacheVolume(volumeId, {
          imageIds: volumeImageIds,
        });

        this.volumeImageIds.set(
          displaySet.displaySetInstanceUID,
          volumeImageIds
        );
      }

      volumeData.push({
        StudyInstanceUID: displaySet.StudyInstanceUID,
        displaySetInstanceUID: displaySet.displaySetInstanceUID,
        volume,
        volumeId,
        imageIds: volumeImageIds,
      });
    }

    return {
      viewportType: Enums.ViewportType.ORTHOGRAPHIC,
      data: volumeData,
    };
  }

  private _getCornerstoneStackImageIds(displaySet, dataSource): string[] {
    return dataSource.getImageIdsForDisplaySet(displaySet);
  }

  private _getCornerstoneVolumeImageIds(displaySet, dataSource): string[] {
    const stackImageIds = this._getCornerstoneStackImageIds(
      displaySet,
      dataSource
    );

    return stackImageIds.map(imageId => {
      const imageURI = utils.imageIdToURI(imageId);
      return `${VOLUME_IMAGE_LOADER_SCHEME}:${imageURI}`;
    });
  }
}

const CacheService = new CornerstoneCacheService();
export default CacheService;
