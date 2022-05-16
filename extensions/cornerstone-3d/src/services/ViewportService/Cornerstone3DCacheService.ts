import { cache as cs3DCache, Enums } from '@cornerstonejs/core';
import { utils } from '@ohif/core';
import getCornerstoneViewportType from '../../utils/getCornerstoneViewportType';

export type StackData = {
  StudyInstanceUID: string;
  displaySetInstanceUID: string;
  imageIds: string[];
  frameRate?: number;
  isClip?: boolean;
  initialImageIdIndex?: number | string | null;
};

export type VolumeData = {
  StudyInstanceUID: string;
  displaySetInstanceUIDs: string[]; // can have more than one displaySet (fusion)
  imageIds: string[][]; // can have more than one imageId list (fusion)
  initialView?: 'string';
};

const VOLUME_LOADER_SCHEME = 'streaming-wadors';

class Cornerstone3DCacheService {
  stackImageIds: Map<string, string[]> = new Map();
  volumeImageIds: Map<string, string[]> = new Map();

  constructor() {}

  public getCacheSize() {
    return cs3DCache.getCacheSize();
  }

  public getCacheFreeSpace() {
    return cs3DCache.getBytesAvailable();
  }

  public getViewportData(
    dataSource: unknown,
    displaySets: unknown[],
    viewportType: string,
    initialImageIdOrIndex?: number | string
  ): VolumeData | StackData {
    const cs3DViewportType = getCornerstoneViewportType(viewportType);

    if (cs3DViewportType === Enums.ViewportType.STACK) {
      return this._getStackViewportData(
        dataSource,
        displaySets,
        initialImageIdOrIndex
      );
    }

    if (cs3DViewportType === Enums.ViewportType.ORTHOGRAPHIC) {
      return this._getVolumeViewportData(
        dataSource,
        displaySets,
        initialImageIdOrIndex
      );
    }

    throw new Error('Unknown viewport type, cannot get viewport data');
  }

  private _getStackViewportData(
    dataSource,
    displaySets,
    initialImageIdOrIndex
  ): StackData {
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

    const stackData: StackData = {
      StudyInstanceUID,
      displaySetInstanceUID,
      imageIds: stackImageIds,
    };

    if (initialImageIdOrIndex !== undefined) {
      if (typeof initialImageIdOrIndex === 'number') {
        stackData.initialImageIdIndex = initialImageIdOrIndex;
      } else {
        stackData.initialImageIdIndex = stackData.imageIds.indexOf(
          initialImageIdOrIndex
        );
      }
    }

    return stackData;
  }

  private _getVolumeViewportData(
    dataSource,
    displaySets,
    initialView
  ): VolumeData {
    // Check the cache for multiple scenarios to see if we need to
    // decache the volume data from other viewports or not

    const volumeImageIdsArray = [];

    displaySets.forEach(displaySet => {
      let volumeImageIds = this.volumeImageIds.get(
        displaySet.displaySetInstanceUID
      );

      if (!volumeImageIds) {
        volumeImageIds = this._getCornerstoneVolumeImageIds(
          displaySet,
          dataSource
        );

        this.volumeImageIds.set(
          displaySet.displaySetInstanceUID,
          volumeImageIds
        );
      }

      volumeImageIdsArray.push(volumeImageIds);
    });

    // assert displaySets are from the same study
    const { StudyInstanceUID } = displaySets[0];
    const displaySetInstanceUIDs = [];

    displaySets.forEach(displaySet => {
      if (displaySet.StudyInstanceUID !== StudyInstanceUID) {
        throw new Error('Display sets are not from the same study');
      }

      displaySetInstanceUIDs.push(displaySet.displaySetInstanceUID);
    });

    return {
      StudyInstanceUID,
      displaySetInstanceUIDs,
      imageIds: volumeImageIdsArray,
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
      return `${VOLUME_LOADER_SCHEME}:${imageURI}`;
    });
  }
}

const CacheService = new Cornerstone3DCacheService();
export default CacheService;
