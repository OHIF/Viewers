import { cache as cs3DCache, Enums } from '@cornerstonejs/core';
import Cornerstone3DViewportService from '../ViewportService/Cornerstone3DViewportService';

type StackMap = {
  StudyInstanceUID: string;
  displaySetInstanceUID: string;
  imageIds: string[];
  frameRate?: number;
  isClip?: boolean;
  initialImageIdIndex?: number | string | null;
};

type StackViewportData = {
  stack: StackMap;
  StudyInstanceUID: string;
  displaySetInstanceUID: string;
};

type VolumeViewportData = {
  stack: StackMap;
  StudyInstanceUID: string;
  displaySetInstanceUID: string;
};

class Cornerstone3DCacheService {
  stackMap: Map<string, StackMap> = new Map();
  volumeMap: Map<string, StackMap> = new Map();

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
  ): StackViewportData | VolumeViewportData {
    const cs3DViewportType = Cornerstone3DViewportService.getCornerstone3DViewportType(
      viewportType
    );

    if (cs3DViewportType === Enums.ViewportType.STACK) {
      return this._getStackViewportData(
        dataSource,
        displaySets,
        initialImageIdOrIndex
      );
    }
  }

  private _getStackViewportData(
    dataSource,
    displaySets,
    initialImageIdOrIndex
  ): StackViewportData {
    // For Stack Viewport we don't have fusion currently
    const displaySet = displaySets[0];

    let stack = this.stackMap.get(displaySet.displaySetInstanceUID);

    if (!stack || !stack.imageIds) {
      stack = this._getCornerstoneStack(displaySet, dataSource);
      this.stackMap.set(displaySet.displaySetInstanceUID, stack);
    }

    if (initialImageIdOrIndex !== undefined && stack.imageIds) {
      if (typeof initialImageIdOrIndex === 'number') {
        stack.initialImageIdIndex = initialImageIdOrIndex;
      } else {
        stack.initialImageIdIndex = stack.imageIds.indexOf(
          initialImageIdOrIndex
        );
      }
    }

    const viewportData = {
      StudyInstanceUID: displaySet.StudyInstanceUID,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      stack,
    };

    return viewportData;
  }

  private _getCornerstoneStack(displaySet, dataSource) {
    const {
      images,
      displaySetInstanceUID,
      StudyInstanceUID,
      frameRate,
      isClip,
      initialImageIdIndex,
    } = displaySet;

    if (!images) {
      return;
    }

    const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);

    return {
      StudyInstanceUID,
      displaySetInstanceUID,
      imageIds,
      frameRate,
      isClip,
      initialImageIdIndex,
    };
  }
}

const CacheService = new Cornerstone3DCacheService();
export default CacheService;
