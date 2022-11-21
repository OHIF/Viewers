import React, { useEffect, useState } from 'react';

import ViewportImageScrollbar from './ViewportImageScrollbar';
import ViewportOverlay from './ViewportOverlay';
import ViewportOrientationMarkers from './ViewportOrientationMarkers';
import ViewportImageSliceLoadingIndicator from './ViewportImageSliceLoadingIndicator';

function CornerstoneOverlays(props) {
  const { viewportIndex, element, scrollbarHeight, servicesManager } = props;
  const { 
    disableViewportImageScrollbar,
    disableViewportOverlay,
    disableViewportImageSliceLoadingIndicator,
    disableViewportOrientationMarkers,
  } = props;
  const { CornerstoneViewportService, CornerstoneCacheService} = servicesManager.services;
  const [imageSliceData, setImageSliceData] = useState({
    imageIndex: 0,
    numberOfSlices: 0,
  });
  const [viewportData, setViewportData] = useState(null);

  useEffect(() => {
    const { unsubscribe } = CornerstoneViewportService.subscribe(
      CornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
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

    if (viewportInfo?.viewportOptions?.customViewportProps?.hideOverlays) {
      return null;
    }
  }

  return (
    <div className="noselect">
      {!disableViewportImageScrollbar && (
        <ViewportImageScrollbar
          viewportIndex={viewportIndex}
          viewportData={viewportData}
          element={element}
          imageSliceData={imageSliceData}
          setImageSliceData={setImageSliceData}
          scrollbarHeight={scrollbarHeight}
          servicesManager={servicesManager}
        />
      )}
      {!disableViewportOverlay && (
        <ViewportOverlay
          imageSliceData={imageSliceData}
          viewportData={viewportData}
          viewportIndex={viewportIndex}
          servicesManager={servicesManager}
          element={element}
        />
      )}
      {!disableViewportImageSliceLoadingIndicator && (
        <ViewportImageSliceLoadingIndicator
          viewportData={viewportData}
          element={element}
        />
      )}
      {!disableViewportOrientationMarkers && (
        <ViewportOrientationMarkers
          imageSliceData={imageSliceData}
          element={element}
          viewportData={viewportData}
          servicesManager={servicesManager}
          viewportIndex={viewportIndex}
        />
      )}
    </div>
  );
}

export default CornerstoneOverlays;
