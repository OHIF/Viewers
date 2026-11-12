// React Compiler opt-out: this file reads and mutates external cornerstone3D
// state (the enabled element, the camera, GL actors) during render and from
// imperative event handlers. The compiler's memoization assumes referential
// purity, so compiling it silently drops updates.
'use no memo';

import React, { useEffect } from 'react';
import { utilities as csUtils } from '@cornerstonejs/core';
import { ImageScrollbar } from '@ohif/ui-next';
import { isVolume3DViewportType } from '../../utils/getLegacyViewportType';
import { getSliceEventName, getViewportSliceCount } from '../../utils/viewportDataShape';

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
      const imageIndex = viewport.getCurrentImageIdIndex();
      const numberOfSlices = getViewportSliceCount(viewportData, viewport);

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
    const eventId = getSliceEventName(viewportData);

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



export default CornerstoneImageScrollbar;
