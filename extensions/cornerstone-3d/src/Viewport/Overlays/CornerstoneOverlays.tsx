import React, { useEffect, useState } from 'react';

import ViewportImageScrollbar from './ViewportImageScrollbar';
import ViewportOverlay from './ViewportOverlay';
import ViewportOrientationMarkers from './ViewportOrientationMarkers';
import ViewportLoadingIndicator from './ViewportLoadingIndicator';
import Cornerstone3DCacheService from '../../services/ViewportService/Cornerstone3DCacheService';

function CornerstoneOverlays(props) {
  const {
    viewportIndex,
    ToolBarService,
    element,
    scrollbarHeight,
    Cornerstone3DViewportService,
  } = props;
  const [imageSliceData, setImageSliceData] = useState({
    imageIndex: 0,
    numberOfSlices: 0,
  });
  const [viewportData, setViewportData] = useState(null);

  useEffect(() => {
    const { unsubscribe } = Cornerstone3DCacheService.subscribe(
      Cornerstone3DCacheService.EVENTS.VIEWPORT_DATA_CHANGED,
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
    const viewportInfo = Cornerstone3DViewportService.getViewportInfoByIndex(
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
        Cornerstone3DViewportService={Cornerstone3DViewportService}
      />
      <ViewportOverlay
        imageSliceData={imageSliceData}
        viewportData={viewportData}
        viewportIndex={viewportIndex}
        ToolBarService={ToolBarService}
        Cornerstone3DViewportService={Cornerstone3DViewportService}
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
