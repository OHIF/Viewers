import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  cache as cornerstoneCache,
  Enums,
  eventTarget,
  VolumeViewport3D,
  utilities as csUtils,
} from '@cornerstonejs/core';
import {
  SmartScrollbar,
  SmartScrollbarTrack,
  SmartScrollbarFill,
  SmartScrollbarIndicator,
  SmartScrollbarEndpoints,
  useByteArray,
} from '@ohif/ui-next';
import { StackViewportData, VolumeViewportData } from '../../types/CornerstoneCacheService';

type ViewportData = StackViewportData | VolumeViewportData;
type ImageSliceData = {
  imageIndex: number;
  numberOfSlices: number;
};
type ViewportSliceProgressScrollbarProps = {
  viewportData: ViewportData | null;
  viewportId: string;
  element: HTMLElement;
  imageSliceData: ImageSliceData;
  setImageSliceData: (data: ImageSliceData) => void;
  servicesManager: AppTypes.ServicesManager;
};

function getImageIndexFromEvent(event): number | undefined {
  const { imageIndex, newImageIdIndex = imageIndex, imageIdIndex } = event.detail;
  return newImageIdIndex ?? imageIdIndex;
}

function getViewportImageIds(viewportData: ViewportData): string[] {
  if (!viewportData?.data?.length) {
    return [];
  }

  const firstData = viewportData.data[0];
  const volumeImageIds = (firstData as any).volume?.imageIds as string[] | undefined;
  const datumImageIds = (firstData as any).imageIds as string[] | undefined;

  return volumeImageIds || datumImageIds || [];
}

function isProgressFullMode(viewportData: ViewportData, viewport): boolean {
  if (!viewportData || !viewport || viewport instanceof VolumeViewport3D) {
    return false;
  }

  if (viewportData.viewportType === Enums.ViewportType.STACK) {
    return true;
  }

  if (viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC) {
    return !!viewport.isInAcquisitionPlane?.();
  }

  return false;
}

function getImageIdFromCacheEvent(event): string | undefined {
  const detail = event?.detail;
  return detail?.imageId || detail?.image?.imageId || detail?.cachedImage?.imageId;
}

function ViewportSliceProgressScrollbar({
  viewportData,
  viewportId,
  element,
  imageSliceData,
  setImageSliceData,
  servicesManager,
}: ViewportSliceProgressScrollbarProps) {
  const { cineService, cornerstoneViewportService, customizationService, viewedImagesService } =
    servicesManager.services;
  const [isFullMode, setIsFullMode] = useState(false);

  const showLoadedEndpoints =
    customizationService.getCustomization('viewportScrollbar.showLoadedEndpoints') !== false;
  const showLoadedFill =
    customizationService.getCustomization('viewportScrollbar.showLoadedFill') !== false;
  const showViewedFill =
    customizationService.getCustomization('viewportScrollbar.showViewedFill') !== false;
  const showLoadingPattern =
    customizationService.getCustomization('viewportScrollbar.showLoadingPattern') !== false;
  const viewedDwellMsRaw = customizationService.getCustomization('viewportScrollbar.viewedDwellMs');
  const loadedBatchIntervalMsRaw = customizationService.getCustomization(
    'viewportScrollbar.loadedBatchIntervalMs'
  );
  const viewedDwellMs =
    typeof viewedDwellMsRaw === 'number' && viewedDwellMsRaw >= 0 ? viewedDwellMsRaw : 0;
  const loadedBatchIntervalMs =
    typeof loadedBatchIntervalMsRaw === 'number' && loadedBatchIntervalMsRaw >= 0
      ? loadedBatchIntervalMsRaw
      : 50;

  const { numberOfSlices, imageIndex } = imageSliceData;
  const {
    bytes: loadedBytes,
    version: loadedVersion,
    isFull: isFullyLoaded,
    setByte: setLoadedByte,
    clearByte: clearLoadedByte,
    resetWith: resetLoaded,
  } = useByteArray(numberOfSlices || 0, loadedBatchIntervalMs);
  const {
    bytes: viewedBytes,
    version: viewedVersion,
    setByte: setViewedByte,
    resetWith: resetViewed,
  } = useByteArray(numberOfSlices || 0);

  const imageIds = useMemo(() => getViewportImageIds(viewportData), [viewportData]);
  const imageIdToIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = imageIds[i];
      if (imageId) {
        map.set(imageId, i);
      }
    }
    return map;
  }, [imageIds]);

  const onScrollbarValueChange = targetImageIndex => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

    if (!viewport || viewport instanceof VolumeViewport3D) {
      return;
    }

    const { isCineEnabled } = cineService.getState();

    if (isCineEnabled) {
      cineService.stopClip(element, { viewportId });
      cineService.setCine({ id: viewportId, frameRate: undefined, isPlaying: false });
    }

    csUtils.jumpToSlice(viewport.element, {
      imageIndex: targetImageIndex,
      debounceLoading: true,
    });
  };

  /**
   * Tracks whether this viewport should render full progress UI (stack or acquisition-plane
   * orthographic volume) versus minimal UI. We compute once on setup and recompute on each
   * CAMERA_MODIFIED event so stack->MPR transitions and acquisition-plane changes are reflected
   * immediately.
   */
  useEffect(() => {
    if (!viewportData) {
      return;
    }

    const updateMode = () => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      const nextMode = isProgressFullMode(viewportData, viewport);
      setIsFullMode(prevMode => (prevMode === nextMode ? prevMode : nextMode));
    };

    updateMode();

    const onCameraModified = () => {
      updateMode();
    };
    element.addEventListener(Enums.Events.CAMERA_MODIFIED, onCameraModified);

    return () => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, onCameraModified);
    };
  }, [viewportData, viewportId, cornerstoneViewportService, element]);

  /**
   * Keeps shared slice state in sync: first initialize from the live viewport snapshot, then
   * subscribe to navigation/render events for incremental updates while users scroll.
   */
  useEffect(() => {
    if (!viewportData) {
      return;
    }

    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (viewport && !(viewport instanceof VolumeViewport3D)) {
      try {
        const currentImageIndex = viewport.getCurrentImageIdIndex();
        const currentNumberOfSlices = viewport.getNumberOfSlices();

        setImageSliceData({
          imageIndex: currentImageIndex,
          numberOfSlices: currentNumberOfSlices,
        });
      } catch (error) {
        console.warn(error);
      }
    }

    const { viewportType } = viewportData;
    const eventId =
      (viewportType === Enums.ViewportType.STACK && Enums.Events.STACK_NEW_IMAGE) ||
      (viewportType === Enums.ViewportType.ORTHOGRAPHIC && Enums.Events.VOLUME_NEW_IMAGE) ||
      Enums.Events.IMAGE_RENDERED;

    const updateIndex = event => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      if (!viewport || viewport instanceof VolumeViewport3D) {
        return;
      }

      const nextImageIndex = getImageIndexFromEvent(event);
      if (nextImageIndex == null) {
        return;
      }
      const nextNumberOfSlices = viewport.getNumberOfSlices();

      setImageSliceData({
        imageIndex: nextImageIndex,
        numberOfSlices: nextNumberOfSlices,
      });
    };

    element.addEventListener(eventId, updateIndex);

    return () => {
      element.removeEventListener(eventId, updateIndex);
    };
  }, [viewportData, element, viewportId, cornerstoneViewportService, setImageSliceData]);

  /**
   * Keeps the loaded byte array in sync with Cornerstone cache: seed from cache whenever stack /
   * mode / slice count changes, then subscribe so cache add/remove updates stay incremental.
   * Seeding runs immediately before registering listeners in the same effect.
   */
  useEffect(() => {
    if (isFullMode && numberOfSlices) {
      resetLoaded(bytes => {
        for (let i = 0; i < bytes.length; i++) {
          const imageId = imageIds[i];
          if (imageId && cornerstoneCache.isLoaded(imageId)) {
            bytes[i] = 1;
          }
        }
      });
    }

    if (!isFullMode || !viewportData) {
      return;
    }

    const markLoaded = event => {
      const imageId = getImageIdFromCacheEvent(event);
      if (!imageId) {
        return;
      }
      const index = imageIdToIndex.get(imageId);
      if (index !== undefined) {
        setLoadedByte(index);
      }
    };

    const markRemoved = event => {
      const imageId = getImageIdFromCacheEvent(event);
      if (!imageId) {
        return;
      }
      const index = imageIdToIndex.get(imageId);
      if (index !== undefined) {
        clearLoadedByte(index);
      }
    };

    eventTarget.addEventListener(Enums.Events.IMAGE_CACHE_IMAGE_ADDED, markLoaded);
    eventTarget.addEventListener(Enums.Events.IMAGE_CACHE_IMAGE_REMOVED, markRemoved);

    return () => {
      eventTarget.removeEventListener(Enums.Events.IMAGE_CACHE_IMAGE_ADDED, markLoaded);
      eventTarget.removeEventListener(Enums.Events.IMAGE_CACHE_IMAGE_REMOVED, markRemoved);
    };
  }, [
    imageIds,
    isFullMode,
    numberOfSlices,
    viewportData,
    imageIdToIndex,
    resetLoaded,
    setLoadedByte,
    clearLoadedByte,
  ]);

  /**
   * Keeps the viewed byte array in sync with the global viewed-images store: seed from the store
   * whenever stack / mode / slice count changes, then subscribe so `markImageViewed` updates stay
   * incremental. Seeding runs immediately before registering the listener in the same effect.
   */
  useEffect(() => {
    if (isFullMode && numberOfSlices) {
      resetViewed(bytes => {
        for (let i = 0; i < bytes.length; i++) {
          const imageId = imageIds[i];
          if (imageId && viewedImagesService?.isImageViewed(imageId)) {
            bytes[i] = 1;
          }
        }
      });
    }

    if (!viewedImagesService) {
      return;
    }

    const subscription = viewedImagesService.subscribeViewedImageChanges(
      ({
        viewedImageId,
        viewedImagesCleared,
      }: {
        viewedImageId?: string;
        viewedImagesCleared?: boolean;
      }) => {
        if (!isFullMode || !numberOfSlices) {
          return;
        }

        if (viewedImagesCleared) {
          resetViewed(bytes => {
            bytes.fill(0);
          });
          return;
        }

        const index = imageIdToIndex.get(viewedImageId);
        if (index !== undefined) {
          setViewedByte(index);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [
    imageIds,
    isFullMode,
    numberOfSlices,
    imageIdToIndex,
    resetViewed,
    setViewedByte,
    viewedImagesService,
  ]);

  /**
   * Marks slices as viewed in full mode. With `viewedDwellMs === 0`, marking is immediate on
   * index change; otherwise a dwell timer is used and cleaned up on subsequent changes/unmount.
   */
  useEffect(() => {
    if (!isFullMode || !numberOfSlices) {
      return;
    }

    const markViewed = (targetIndex: number) => {
      setViewedByte(targetIndex);
      const imageId = imageIds[targetIndex];
      if (imageId) {
        viewedImagesService?.markImageViewed(imageId);
      }
    };

    if (viewedDwellMs === 0) {
      markViewed(imageIndex || 0);
      return;
    }

    const timerId = window.setTimeout(() => {
      markViewed(imageIndex || 0);
    }, viewedDwellMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    isFullMode,
    numberOfSlices,
    imageIndex,
    imageIds,
    setViewedByte,
    viewedDwellMs,
    viewedImagesService,
  ]);

  const isLoading = isFullMode && showLoadingPattern ? !isFullyLoaded : false;

  if (!numberOfSlices || numberOfSlices <= 1) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        padding: '8px 5px',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '100%',
          width: '11px',
        }}
      >
        <SmartScrollbar
          className="absolute inset-0"
          value={imageIndex || 0}
          total={numberOfSlices}
          onValueChange={onScrollbarValueChange}
          isLoading={isLoading}
          enableKeyboardNavigation={false}
          aria-label="Image navigation scrollbar"
          indicator={
            customizationService.getCustomization('viewportScrollbar.indicator') as
              | Record<string, unknown>
              | undefined
          }
        >
          <SmartScrollbarTrack>
            {isFullMode && showLoadedFill && (
              <SmartScrollbarFill
                marked={loadedBytes}
                version={loadedVersion}
                className="bg-neutral/25"
                loadingClassName="bg-neutral/50"
              />
            )}
            {isFullMode && showViewedFill && (
              <SmartScrollbarFill
                marked={viewedBytes}
                version={viewedVersion}
                className="bg-primary/35"
              />
            )}
          </SmartScrollbarTrack>
          <SmartScrollbarIndicator />
          {isFullMode && showLoadedEndpoints && (
            <SmartScrollbarEndpoints
              marked={loadedBytes}
              version={loadedVersion}
            />
          )}
        </SmartScrollbar>
      </div>
    </div>
  );
}

ViewportSliceProgressScrollbar.propTypes = {
  viewportData: PropTypes.object,
  viewportId: PropTypes.string.isRequired,
  element: PropTypes.instanceOf(Element),
  imageSliceData: PropTypes.object.isRequired,
  setImageSliceData: PropTypes.func.isRequired,
  servicesManager: PropTypes.object.isRequired,
};

export default ViewportSliceProgressScrollbar;
