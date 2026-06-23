import { useEffect, useRef, useState } from 'react';
import {
  cache as cornerstoneCache,
  Enums,
  eventTarget,
  utilities,
} from '@cornerstonejs/core';
import { useByteArray } from '@ohif/ui-next';
import { isVolume3DViewportType } from '../../../utils/getLegacyViewportType';
import { getImageIdFromCacheEvent, getImageIndexFromEvent, isProgressFullMode } from './helpers';
import { ImageSliceData, ViewportData } from './types';

export function useProgressScrollbarMode({
  viewportData,
  viewportId,
  element,
  cornerstoneViewportService,
}: {
  viewportData: ViewportData;
  viewportId: string;
  element: HTMLElement;
  cornerstoneViewportService: AppTypes.CornerstoneViewportService;
}) {
  const [isFullMode, setIsFullMode] = useState(false);
  const lastViewPlaneNormalRef = useRef<number[] | null>(null);

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
      const viewportImageData = viewport?.getImageData?.();
      const nextViewPlaneNormal = viewport?.getCamera?.()?.viewPlaneNormal as number[] | undefined;
      // Do not update the lastViewPlaneNormalRef until we have a valid viewportImageData.
      // Without viewportImageData, the viewport is not fully initialized and the isAcquisitionPlane
      // check will not be accurate.
      if (viewportImageData && nextViewPlaneNormal) {
        lastViewPlaneNormalRef.current = [...nextViewPlaneNormal];
      }
      const nextMode = isProgressFullMode(viewportData, viewport);
      setIsFullMode(prevMode => (prevMode === nextMode ? prevMode : nextMode));
    };

    updateMode();

    const onCameraModified = () => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      const nextViewPlaneNormal = viewport?.getCamera?.()?.viewPlaneNormal as number[] | undefined;
      const previousViewPlaneNormal = lastViewPlaneNormalRef.current;

      // Ignore camera updates that keep the same orientation (pan/zoom/scroll).
      if (nextViewPlaneNormal && previousViewPlaneNormal) {
        if (utilities.isEqual(nextViewPlaneNormal, previousViewPlaneNormal)) {
          return;
        }
      }

      updateMode();
    };
    element.addEventListener(Enums.Events.CAMERA_MODIFIED, onCameraModified);

    return () => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, onCameraModified);
    };
  }, [viewportData, viewportId, cornerstoneViewportService, element]);

  return isFullMode;
}

export function useViewportSliceSync({
  viewportData,
  viewportId,
  element,
  cornerstoneViewportService,
  setImageSliceData,
}: {
  viewportData: ViewportData;
  viewportId: string;
  element: HTMLElement;
  cornerstoneViewportService: AppTypes.CornerstoneViewportService;
  setImageSliceData: (data: ImageSliceData) => void;
}) {
  /**
   * Keeps shared slice state in sync: first initialize from the live viewport snapshot, then
   * subscribe to navigation/render events for incremental updates while users scroll.
   */
  useEffect(() => {
    if (!viewportData) {
      return;
    }

    // Native Generic ("next") viewports report viewportType=planarNext regardless
    // of content, so resolve stack-vs-volume from the bound data shape (imageIds =
    // stack, volume/volumeId = volume). This is known immediately when the effect
    // runs, unlike a runtime getNumberOfSlices read which can be premature while
    // the native viewport is still binding its data.
    const firstData = Array.isArray(viewportData.data) ? viewportData.data[0] : viewportData.data;
    const isVolumeData = !!(firstData && (firstData.volume || firstData.volumeId));

    // Last values we pushed, so re-seeding on camera changes does not churn React
    // state on pure pan/zoom (which keep the slice geometry unchanged).
    const lastSlice = { imageIndex: -1, numberOfSlices: -1 };

    const pushSliceData = (imageIndex: number, numberOfSlices: number) => {
      if (imageIndex === lastSlice.imageIndex && numberOfSlices === lastSlice.numberOfSlices) {
        return;
      }
      lastSlice.imageIndex = imageIndex;
      lastSlice.numberOfSlices = numberOfSlices;
      setImageSliceData({ imageIndex, numberOfSlices });
    };

    // Seeds the shared slice state from the live viewport. Re-run on the initial
    // effect and on camera/orientation changes (below).
    const syncFromViewport = () => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      if (!viewport || isVolume3DViewportType(viewport)) {
        return;
      }
      try {
        const currentImageIndex = viewport.getCurrentImageIdIndex();
        // For an image stack the slice count is known from the bound data; only
        // fall back to the viewport for volume/MPR (count depends on orientation).
        const currentNumberOfSlices =
          (!isVolumeData && firstData?.imageIds?.length) || viewport.getNumberOfSlices();

        pushSliceData(currentImageIndex, currentNumberOfSlices);
      } catch (error) {
        console.warn(error);
      }
    };

    syncFromViewport();

    const { viewportType } = viewportData;
    const eventId =
      (viewportType === Enums.ViewportType.STACK && Enums.Events.STACK_NEW_IMAGE) ||
      (viewportType === Enums.ViewportType.ORTHOGRAPHIC && Enums.Events.VOLUME_NEW_IMAGE) ||
      (isVolumeData && Enums.Events.VOLUME_NEW_IMAGE) ||
      (firstData?.imageIds && Enums.Events.STACK_NEW_IMAGE) ||
      Enums.Events.IMAGE_RENDERED;

    const updateIndex = event => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      if (!viewport || isVolume3DViewportType(viewport)) {
        return;
      }

      const nextImageIndex = getImageIndexFromEvent(event);
      if (nextImageIndex == null) {
        return;
      }
      const nextNumberOfSlices = viewport.getNumberOfSlices();

      pushSliceData(nextImageIndex, nextNumberOfSlices);
    };

    element.addEventListener(eventId, updateIndex);
    // Native ("next") viewports keep the same viewportData across a stack->volume
    // transition or an orientation change, so this effect does not re-run and the
    // slice-navigation event above may not fire until the first scroll, leaving the
    // scrollbar unseeded (or stale, with a now-wrong slice count). CAMERA_MODIFIED
    // fires on those orientation/geometry changes, so re-seed from the viewport
    // then; the pushSliceData guard makes pan/zoom (same geometry) a no-op.
    element.addEventListener(Enums.Events.CAMERA_MODIFIED, syncFromViewport);

    return () => {
      element.removeEventListener(eventId, updateIndex);
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, syncFromViewport);
    };
  }, [viewportData, element, viewportId, cornerstoneViewportService, setImageSliceData]);
}

export function useLoadedSliceBytes({
  isFullMode,
  numberOfSlices,
  viewportData,
  imageIds,
  imageIdToIndex,
  loadedBatchIntervalMs,
}: {
  isFullMode: boolean;
  numberOfSlices: number;
  viewportData: ViewportData;
  imageIds: string[];
  imageIdToIndex: Map<string, number>;
  loadedBatchIntervalMs: number;
}) {
  const loadedState = useByteArray(numberOfSlices || 0, loadedBatchIntervalMs);
  const {
    resetWith: resetLoaded,
    setByte: setLoadedByte,
    clearByte: clearLoadedByte,
  } = loadedState;

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

  return loadedState;
}

export function useViewedSliceBytes({
  isFullMode,
  numberOfSlices,
  imageIndex,
  imageIds,
  imageIdToIndex,
  viewedDwellMs,
  viewedDataService,
}: {
  isFullMode: boolean;
  numberOfSlices: number;
  imageIndex: number;
  imageIds: string[];
  imageIdToIndex: Map<string, number>;
  viewedDwellMs: number;
  viewedDataService: AppTypes.ViewedDataService;
}) {
  const viewedState = useByteArray(numberOfSlices || 0);
  const { resetWith: resetViewed, setByte: setViewedByte } = viewedState;

  /**
   * Keeps the viewed byte array in sync with the global viewed-data store: seed from the store
   * whenever stack / mode / slice count changes, then subscribe so `markDataViewed` updates stay
   * incremental. Seeding runs immediately before registering the listener in the same effect.
   */
  useEffect(() => {
    if (isFullMode && numberOfSlices) {
      resetViewed(bytes => {
        for (let i = 0; i < bytes.length; i++) {
          const imageId = imageIds[i];
          if (imageId && viewedDataService?.isDataViewed(imageId)) {
            bytes[i] = 1;
          }
        }
      });
    }

    if (!viewedDataService) {
      return;
    }

    const subscription = viewedDataService.subscribeViewedDataChanges(
      ({
        viewedDataId,
        viewedDataCleared,
      }: {
        viewedDataId?: string;
        viewedDataCleared?: boolean;
      }) => {
        if (!isFullMode || !numberOfSlices) {
          return;
        }

        if (viewedDataCleared) {
          resetViewed(bytes => {
            bytes.fill(0);
          });
          return;
        }

        const index = imageIdToIndex.get(viewedDataId);
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
    viewedDataService,
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
        viewedDataService?.markDataViewed(imageId);
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
    viewedDataService,
  ]);

  return viewedState;
}
