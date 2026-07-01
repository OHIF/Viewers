import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Enums, utilities as csUtils } from '@cornerstonejs/core';
import { ImageScrollbar } from '@ohif/ui-next';
import { isVolume3DViewportType } from '../../utils/getLegacyViewportType';

function CornerstoneImageScrollbar({
  viewportData,
  viewportId,
  element,
  imageSliceData,
  setImageSliceData,
  scrollbarHeight,
  servicesManager,
}: withAppTypes<{
  element: HTMLElement;
}>) {
  const { cineService, cornerstoneViewportService } = servicesManager.services;

  const onImageScrollbarChange = (imageIndex, viewportId) => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

    const { isCineEnabled } = cineService.getState();

    if (isCineEnabled) {
      // on image scrollbar change, stop the CINE if it is playing
      cineService.stopClip(element, { viewportId });
      cineService.setCine({ id: viewportId, isPlaying: false });
    }

    csUtils.jumpToSlice(viewport.element, {
      imageIndex,
      debounceLoading: true,
    });
  };

  useEffect(() => {
    if (!viewportData) {
      return;
    }

    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

    if (!viewport || isVolume3DViewportType(viewport)) {
      return;
    }

    try {
      const firstData = Array.isArray(viewportData.data) ? viewportData.data[0] : viewportData.data;
      const isVolumeData = !!(firstData && (firstData.volume || firstData.volumeId));
      const imageIndex = viewport.getCurrentImageIdIndex();
      // getNumberOfSlices() can be premature while a native Generic ("next")
      // viewport is still binding its data (it returns 1 until then). For an image
      // stack the slice count is known from the bound data, so prefer that and only
      // fall back to the viewport for volume/MPR (where it depends on orientation).
      const numberOfSlices =
        (!isVolumeData && firstData?.imageIds?.length) || viewport.getNumberOfSlices();

      setImageSliceData({
        imageIndex,
        numberOfSlices,
      });
    } catch (error) {
      console.warn(error);
    }
  }, [viewportId, viewportData]);

  useEffect(() => {
    if (!viewportData) {
      return;
    }
    const { viewportType } = viewportData;
    // Native Generic ("next") viewports report viewportType=planarNext regardless
    // of content, so the legacy type check alone misses them. Resolve the slice-
    // change event from the bound data shape (imageIds = stack, volume/volumeId =
    // volume), which is known immediately when this effect runs — unlike a runtime
    // content-mode check, which may not be ready yet. Native viewports emit the
    // same STACK_NEW_IMAGE / VOLUME_NEW_IMAGE events as legacy.
    const firstData = Array.isArray(viewportData.data) ? viewportData.data[0] : viewportData.data;
    const isVolumeData = !!(firstData && (firstData.volume || firstData.volumeId));
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
      const { imageIndex, newImageIdIndex = imageIndex, imageIdIndex } = event.detail;
      const numberOfSlices = viewport.getNumberOfSlices();
      // find the index of imageId in the imageIds
      setImageSliceData({
        imageIndex: newImageIdIndex ?? imageIdIndex,
        numberOfSlices,
      });
    };

    element.addEventListener(eventId, updateIndex);

    return () => {
      element.removeEventListener(eventId, updateIndex);
    };
  }, [viewportData, element]);

  return (
    <ImageScrollbar
      onChange={evt => onImageScrollbarChange(evt, viewportId)}
      max={imageSliceData.numberOfSlices ? imageSliceData.numberOfSlices - 1 : 0}
      height={scrollbarHeight}
      value={imageSliceData.imageIndex || 0}
    />
  );
}

CornerstoneImageScrollbar.propTypes = {
  viewportData: PropTypes.object,
  viewportId: PropTypes.string.isRequired,
  element: PropTypes.instanceOf(Element),
  scrollbarHeight: PropTypes.string,
  imageSliceData: PropTypes.object.isRequired,
  setImageSliceData: PropTypes.func.isRequired,
  servicesManager: PropTypes.object.isRequired,
};

export default CornerstoneImageScrollbar;
