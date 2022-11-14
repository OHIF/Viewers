import {
  cache as cs3DCache,
  Enums,
  Types,
  volumeLoader,
} from '@cornerstonejs/core';
import { utils, pubSubServiceInterface } from '@ohif/core';

import getCornerstoneViewportType from '../../utils/getCornerstoneViewportType';

export type StackData = {
  StudyInstanceUID: string;
  displaySetInstanceUID: string;
  imageIds: string[];
  frameRate?: number;
  isClip?: boolean;
  initialImageIndex?: number | string | null;
  viewportType: Enums.ViewportType;
};

export type VolumeData = {
  StudyInstanceUID: string;
  displaySetInstanceUIDs: string[]; // can have more than one displaySet (fusion)
  imageIds: string[][]; // can have more than one imageId list (fusion)
  volumes: Types.IVolume[];
  viewportType: Enums.ViewportType;
};

const VOLUME_LOADER_SCHEME = 'streaming-wadors';

const EVENTS = {
  VIEWPORT_DATA_CHANGED: 'event::cornerstone::viewportdatachanged',
};

export type IViewportData = StackData | VolumeData;

class CornerstoneCacheService {
  stackImageIds: Map<string, string[]> = new Map();
  volumeImageIds: Map<string, string[]> = new Map();
  listeners: { [key: string]: (...args: any[]) => void } = {};
  EVENTS: { [key: string]: string };

  constructor() {
    this.listeners = {};
    this.EVENTS = EVENTS;
    Object.assign(this, pubSubServiceInterface);
  }

  public getCacheSize() {
    return cs3DCache.getCacheSize();
  }

  public getCacheFreeSpace() {
    return cs3DCache.getBytesAvailable();
  }

  public async getViewportData(
    viewportIndex: number,
    displaySets: unknown[],
    viewportType: string,
    dataSource: unknown,
    callback: (val: IViewportData) => unknown,
    initialImageIndex?: number
  ): Promise<StackData | VolumeData> {
    const cs3DViewportType = getCornerstoneViewportType(viewportType);
    let viewportData: IViewportData;

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

    await callback(viewportData);

    this._broadcastEvent(this.EVENTS.VIEWPORT_DATA_CHANGED, {
      viewportData,
      viewportIndex,
    });

    return viewportData;
  }
  public async invalidateViewportData(
    viewportData: VolumeData,
    invalidatedDisplaySetInstanceUID: string,
    dataSource,
    DisplaySetService
  ) {
    if (viewportData.viewportType === Enums.ViewportType.STACK) {
      throw new Error('Invalidation of StackViewport is not supported yet');
    }

    const volumeId = invalidatedDisplaySetInstanceUID;
    const volume = cs3DCache.getVolume(volumeId);

    if (volume) {
      cs3DCache.removeVolumeLoadObject(volumeId);
    }

    const displaySets = viewportData.displaySetInstanceUIDs.map(
      DisplaySetService.getDisplaySetByUID
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
      viewportType: Enums.ViewportType.STACK,
      imageIds: stackImageIds,
    };

    if (typeof initialImageIndex === 'number') {
      stackData.initialImageIndex = initialImageIndex;
    }

    return stackData;
  }

  private async _getVolumeViewportData(
    dataSource,
    displaySets
  ): Promise<VolumeData> {
    // Check the cache for multiple scenarios to see if we need to
    // decache the volume data from other viewports or not

    const volumeImageIdsArray = [];
    const volumes = [];

    for (const displaySet of displaySets) {
      const volumeId = displaySet.displaySetInstanceUID;

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

      volumeImageIdsArray.push(volumeImageIds);
      volumes.push(volume);
    }

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
      viewportType: Enums.ViewportType.ORTHOGRAPHIC,
      volumes,
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

const CacheService = new CornerstoneCacheService();
export default CacheService;
