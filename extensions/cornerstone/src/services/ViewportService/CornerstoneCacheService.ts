import {
  cache as cs3DCache,
  Enums,
  Types,
  volumeLoader,
} from '@cornerstonejs/core';
import { utils, pubSubServiceInterface } from '@ohif/core';

import getCornerstoneViewportType from '../../utils/getCornerstoneViewportType';

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
  imageIds: string[];
  volume: Types.IVolume;
};

export type ViewportStackData = {
  viewportType: Enums.ViewportType;
  data: StackData;
};

export type ViewportVolumeData = {
  viewportType: Enums.ViewportType;
  data: VolumeData[];
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
  ): Promise<ViewportStackData | ViewportVolumeData> {
    const cs3DViewportType = getCornerstoneViewportType(viewportType);
    let viewportData: ViewportStackData | ViewportVolumeData;

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
    viewportData: ViewportVolumeData,
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

    const displaySets = viewportData.data.map(({ displaySetInstanceUID }) =>
      DisplaySetService.getDisplaySet(displaySetInstanceUID)
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
  ): ViewportStackData {
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

    const ViewportStackData: ViewportStackData = {
      viewportType: Enums.ViewportType.STACK,
      data: {
        StudyInstanceUID,
        displaySetInstanceUID,
        imageIds: stackImageIds,
      },
    };

    if (typeof initialImageIndex === 'number') {
      ViewportStackData.data.initialImageIndex = initialImageIndex;
    }

    return ViewportStackData;
  }

  private async _getVolumeViewportData(
    dataSource,
    displaySets
  ): Promise<ViewportVolumeData> {
    // Check the cache for multiple scenarios to see if we need to
    // decache the volume data from other viewports or not

    const volumeData = [];

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

      volumeData.push({
        StudyInstanceUID: displaySet.StudyInstanceUID,
        displaySetInstanceUID: displaySet.displaySetInstanceUID,
        imageIds: volumeImageIds,
        volume,
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
      return `${VOLUME_LOADER_SCHEME}:${imageURI}`;
    });
  }
}

const CacheService = new CornerstoneCacheService();
export default CacheService;
