import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Enums } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';
import { ImageScrollbar } from '@ohif/ui';

import Cornerstone3DViewportService from '../../services/ViewportService/Cornerstone3DViewportService';

function CornerstoneImageScrollbar({
  viewportData,
  viewportIndex,
  element,
  imageSliceData,
  setImageSliceData,
  scrollbarHeight,
}) {
  const onImageScrollbarChange = useCallback(
    (imageIndex, viewportIndex) => {
      const viewportInfo = Cornerstone3DViewportService.getViewportInfoByIndex(
        viewportIndex
      );

      const viewportId = viewportInfo.getViewportId();
      const viewport = Cornerstone3DViewportService.getCornerstone3DViewport(
        viewportId
      );

      utilities.jumpToSlice(viewport.element, { imageIndex }).then(() => {
        setImageSliceData({
          ...imageSliceData,
          imageIndex: imageIndex,
        });
      });
    },
    [viewportIndex, viewportData, imageSliceData]
  );

  useEffect(() => {
    if (
      !viewportData ||
      viewportData.viewportType !== Enums.ViewportType.STACK
    ) {
      return;
    }

    const updateStackIndex = event => {
      const { imageId } = event.detail;
      // find the index of imageId in the imageIds
      const index = viewportData?.imageIds?.indexOf(imageId);
      if (index !== -1) {
        setImageSliceData({
          imageIndex: index,
          numberOfSlices: viewportData.imageIds.length,
        });
      }
    };

    element.addEventListener(Enums.Events.STACK_NEW_IMAGE, updateStackIndex);

    return () => {
      element.removeEventListener(
        Enums.Events.STACK_NEW_IMAGE,
        updateStackIndex
      );
    };
  }, [viewportData, element]);

  useEffect(() => {
    if (
      !viewportData ||
      viewportData.viewportType !== Enums.ViewportType.ORTHOGRAPHIC
    ) {
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
  viewportData: PropTypes.object.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  element: PropTypes.instanceOf(Element),
  scrollbarHeight: PropTypes.string,
  imageSliceData: PropTypes.object.isRequired,
  setImageSliceData: PropTypes.func.isRequired,
};

export default CornerstoneImageScrollbar;
