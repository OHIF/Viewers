import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Enums, Types, utilities } from '@cornerstonejs/core';
import { utilities as csToolsUtils } from '@cornerstonejs/tools';
import { ImageScrollbar } from '@ohif/ui';
import { ServicesManger } from '@ohif/core';

function CornerstoneImageScrollbar({
  viewportData,
  viewportIndex,
  element,
  imageSliceData,
  setImageSliceData,
  scrollbarHeight,
  servicesManager,
}) {
  const {
    cineService,
    CornerstoneViewportService,
  } = (servicesManager as ServicesManger).services;

  const onImageScrollbarChange = (imageIndex, viewportIndex) => {
    const viewportInfo = CornerstoneViewportService.getViewportInfoByIndex(
      viewportIndex
    );

    const viewportId = viewportInfo.getViewportId();
    const viewport = CornerstoneViewportService.getCornerstoneViewport(
      viewportId
    );

    const { isCineEnabled } = cineService.getState();

    if (isCineEnabled) {
      // on image scrollbar change, stop the CINE if it is playing
      cineService.stopClip(element);
      cineService.setCine({ id: viewportIndex, isPlaying: false });
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

    const viewport = CornerstoneViewportService.getCornerstoneViewportByIndex(
      viewportIndex
    );

    if (!viewport) {
      return;
    }

    if (viewportData.viewportType === Enums.ViewportType.STACK) {
      const imageIndex = viewport.getCurrentImageIdIndex();

      setImageSliceData({
        imageIndex: imageIndex,
        numberOfSlices: viewportData.data.imageIds.length,
      });

      return;
    }

    if (viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC) {
      const sliceData = utilities.getImageSliceDataForVolumeViewport(
        viewport as Types.IVolumeViewport
      );

      if (!sliceData) {
        return;
      }

      const { imageIndex, numberOfSlices } = sliceData;
      setImageSliceData({ imageIndex, numberOfSlices });
    }
  }, [viewportIndex, viewportData]);

  useEffect(() => {
    if (viewportData?.viewportType !== Enums.ViewportType.STACK) {
      return;
    }

    const updateStackIndex = event => {
      const { newImageIdIndex } = event.detail;
      // find the index of imageId in the imageIds
      setImageSliceData({
        imageIndex: newImageIdIndex,
        numberOfSlices: viewportData.data.imageIds.length,
      });
    };

    element.addEventListener(
      Enums.Events.STACK_VIEWPORT_SCROLL,
      updateStackIndex
    );

    return () => {
      element.removeEventListener(
        Enums.Events.STACK_VIEWPORT_SCROLL,
        updateStackIndex
      );
    };
  }, [viewportData, element]);

  useEffect(() => {
    if (viewportData?.viewportType !== Enums.ViewportType.ORTHOGRAPHIC) {
      return;
    }

    const updateVolumeIndex = event => {
      const { imageIndex, numberOfSlices } = event.detail;
      // find the index of imageId in the imageIds
      setImageSliceData({ imageIndex, numberOfSlices });
    };

    element.addEventListener(Enums.Events.VOLUME_NEW_IMAGE, updateVolumeIndex);

    return () => {
      element.removeEventListener(
        Enums.Events.VOLUME_NEW_IMAGE,
        updateVolumeIndex
      );
    };
  }, [viewportData, element]);

  return (
    <ImageScrollbar
      onChange={evt => onImageScrollbarChange(evt, viewportIndex)}
      max={
        imageSliceData.numberOfSlices ? imageSliceData.numberOfSlices - 1 : 0
      }
      height={scrollbarHeight}
      value={imageSliceData.imageIndex}
    />
  );
}

CornerstoneImageScrollbar.propTypes = {
  viewportData: PropTypes.object,
  viewportIndex: PropTypes.number.isRequired,
  element: PropTypes.instanceOf(Element),
  scrollbarHeight: PropTypes.string,
  imageSliceData: PropTypes.object.isRequired,
  setImageSliceData: PropTypes.func.isRequired,
  servicesManager: PropTypes.object.isRequired,
};

export default CornerstoneImageScrollbar;
