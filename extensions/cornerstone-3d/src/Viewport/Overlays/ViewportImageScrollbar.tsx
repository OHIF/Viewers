import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Enums, StackViewport, VolumeViewport } from '@cornerstonejs/core';
import { ImageScrollbar } from '@ohif/ui';

import Cornerstone3DViewportService from '../../services/ViewportService/Cornerstone3DViewportService';

function CornerstoneImageScrollbar({
  viewportData,
  viewportIndex,
  element,
  setImageIndex,
  imageIndex,
  scrollbarHeight,
}) {
  const cornerstoneViewport = Cornerstone3DViewportService.getCornerstone3DViewportByIndex(
    viewportIndex
  );

  const onImageScrollbarChange = useCallback(
    (imageIndex, viewportIndex) => {
      const viewportInfo = Cornerstone3DViewportService.getViewportInfoByIndex(
        viewportIndex
      );

      const viewportId = viewportInfo.getViewportId();
      const viewport = Cornerstone3DViewportService.getCornerstone3DViewport(
        viewportId
      );

      // if getCurrentImageId is not a method on viewport
      if (!(viewport instanceof StackViewport)) {
        throw new Error('cannot use scrollbar for non-stack viewports');
      }

      // Later scrollThroughStack should return two values the current index
      // and the total number of indices (volume it is different)
      viewport.setImageIdIndex(imageIndex).then(() => {
        // Update scrollbar index
        const currentIndex = viewport.getCurrentImageIdIndex();
        setImageIndex(currentIndex);
      });
    },
    [viewportIndex, viewportData]
  );

  useEffect(() => {
    if (!(cornerstoneViewport instanceof StackViewport)) {
      return;
    }

    const updateIndex = event => {
      const { imageId } = event.detail;
      // find the index of imageId in the imageIds
      const index = viewportData?.imageIds?.indexOf(imageId);
      if (index !== -1) {
        setImageIndex(index);
      }
    };

    element.addEventListener(Enums.Events.STACK_NEW_IMAGE, updateIndex);

    return () => {
      element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, updateIndex);
    };
  }, [viewportData]);

  // useEffect(() => {
  //   if (!(cornerstoneViewport instanceof VolumeViewport)) {
  //     return;
  //   }

  //   const updateIndex = event => {
  //     const { imageId } = event.detail;
  //     // find the index of imageId in the imageIds
  //     const index = viewportData?.imageIds?.indexOf(imageId);
  //     if (index !== -1) {
  //       setImageIndex(index);
  //     }
  //   };

  //   element.addEventListener(Enums.Events.STACK_NEW_IMAGE, updateIndex);

  //   return () => {
  //     element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, updateIndex);
  //   };
  // }, [viewportData]);

  return (
    <ImageScrollbar
      onChange={evt => onImageScrollbarChange(evt, viewportIndex)}
      max={viewportData ? viewportData.stack?.imageIds?.length - 1 : 0}
      height={scrollbarHeight}
      value={imageIndex}
    />
  );
}

CornerstoneImageScrollbar.propTypes = {
  viewportData: PropTypes.object.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  element: PropTypes.instanceOf(Element),
  scrollbarHeight: PropTypes.string,
  setImageIndex: PropTypes.func.isRequired,
  imageIndex: PropTypes.number.isRequired,
};

export default CornerstoneImageScrollbar;
