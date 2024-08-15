import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Enums, Types, utilities } from '@cornerstonejs/core';
import { utilities as csToolsUtils } from '@cornerstonejs/tools';
import { ImageScrollbar } from '@ohif/ui';

function CornerstoneImageScrollbar({
  viewportData,
  viewportId,
  element,
  imageSliceData,
  setImageSliceData,
  scrollbarHeight,
  servicesManager,
}: withAppTypes) {
  const { cineService, cornerstoneViewportService } = servicesManager.services;

  const onImageScrollbarChange = (imageIndex, viewportId) => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

    const { isCineEnabled } = cineService.getState();

    if (isCineEnabled) {
      // on image scrollbar change, stop the CINE if it is playing
      cineService.stopClip(element, { viewportId });
      cineService.setCine({ id: viewportId, isPlaying: false });
    }

    csToolsUtils.jumpToSlice(viewport.element, {
      imageIndex,
      debounceLoading: true,
    });
  };

  useEffect(() => {
    if (!viewportData) {
      return;
    }

    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

    if (!viewport) {
      return;
    }

    const imageIndex = viewport.getCurrentImageIdIndex();
    const numberOfSlices = viewport.getNumberOfSlices();

    setImageSliceData({
      imageIndex: imageIndex,
      numberOfSlices,
    });
  }, [viewportId, viewportData]);

  useEffect(() => {
    if (!viewportData) {
      return;
    }
    const { viewportType } = viewportData;
    const eventId =
      (viewportType === Enums.ViewportType.STACK && Enums.Events.STACK_VIEWPORT_SCROLL) ||
      (viewportType === Enums.ViewportType.ORTHOGRAPHIC && Enums.Events.VOLUME_NEW_IMAGE) ||
      Enums.Events.IMAGE_RENDERED;

    const updateIndex = event => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      const { imageIndex, newImageIdIndex = imageIndex } = event.detail;
      const numberOfSlices = viewport.getNumberOfSlices();
      // find the index of imageId in the imageIds
      setImageSliceData({
        imageIndex: newImageIdIndex,
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
