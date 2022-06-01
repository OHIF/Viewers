import React, { useEffect, useState } from 'react';

import ViewportImageScrollbar from './ViewportImageScrollbar';
import ViewportOverlay from './ViewportOverlay';
import ViewportOrientationMarkers from './ViewportOrientationMarkers';
import ViewportLoadingIndicator from './ViewportLoadingIndicator';
import CornerstoneCacheService from '../../services/ViewportService/CornerstoneCacheService';

function CornerstoneOverlays(props) {
  const {
    viewportIndex,
    ToolBarService,
    element,
    scrollbarHeight,
    CornerstoneViewportService,
  } = props;
  const [imageSliceData, setImageSliceData] = useState({
    imageIndex: 0,
    numberOfSlices: 0,
  });
  const [viewportData, setViewportData] = useState(null);

  useEffect(() => {
    const { unsubscribe } = CornerstoneCacheService.subscribe(
      CornerstoneCacheService.EVENTS.VIEWPORT_DATA_CHANGED,
      props => {
        if (props.viewportIndex !== viewportIndex) {
          return;
        }

        setViewportData(props.viewportData);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewportIndex]);

  if (!element) {
    return null;
  }

  if (viewportData) {
    const viewportInfo = CornerstoneViewportService.getViewportInfoByIndex(
      viewportIndex
    );

    if (viewportInfo?.viewportOptions?.customViewportOptions?.hideOverlays) {
      return null;
    }
  }

  return (
    <>
      <ViewportImageScrollbar
        viewportIndex={viewportIndex}
        viewportData={viewportData}
        element={element}
        imageSliceData={imageSliceData}
        setImageSliceData={setImageSliceData}
        scrollbarHeight={scrollbarHeight}
        CornerstoneViewportService={CornerstoneViewportService}
      />
      <ViewportOverlay
        imageSliceData={imageSliceData}
        viewportData={viewportData}
        viewportIndex={viewportIndex}
        ToolBarService={ToolBarService}
        CornerstoneViewportService={CornerstoneViewportService}
        element={element}
      />
      <ViewportLoadingIndicator viewportData={viewportData} element={element} />
      <ViewportOrientationMarkers
        imageSliceData={imageSliceData}
        element={element}
        viewportData={viewportData}
        viewportIndex={viewportIndex}
      />
    </>
  );
}

export default CornerstoneOverlays;
