import React, { useEffect, useState } from 'react';

import ViewportImageScrollbar from './ViewportImageScrollbar';
import ViewportSliceProgressScrollbar from './ViewportSliceProgressScrollbar/ViewportSliceProgressScrollbar';
import CustomizableViewportOverlay from './CustomizableViewportOverlay';
import ViewportOrientationMarkers from './ViewportOrientationMarkers';
import ViewportImageSliceLoadingIndicator from './ViewportImageSliceLoadingIndicator';
import AutoDecimationOverlay from './AutoDecimationOverlay';

function CornerstoneOverlays(props: withAppTypes) {
  const { viewportId, element, scrollbarHeight, servicesManager } = props;
  const { cornerstoneViewportService, customizationService } = servicesManager.services;
  const [imageSliceData, setImageSliceData] = useState({
    imageIndex: 0,
    numberOfSlices: 0,
  });
  const [viewportData, setViewportData] = useState(null);

  useEffect(() => {
    const { unsubscribe } = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      props => {
        if (props.viewportId !== viewportId) {
          return;
        }

        setViewportData(props.viewportData);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewportId, cornerstoneViewportService]);

  if (!element) {
    return null;
  }

  if (viewportData) {
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);

    if (viewportInfo?.viewportOptions?.customViewportProps?.hideOverlays) {
      return (
        <div className="noselect">
          <AutoDecimationOverlay viewportId={viewportId} servicesManager={servicesManager} />
        </div>
      );
    }
  }

  const viewportScrollbarVariant = customizationService.getCustomization(
    'viewportScrollbar.variant'
  );
  const useProgressScrollbar = viewportScrollbarVariant !== 'legacy';

  return (
    <div className="noselect">
      {useProgressScrollbar ? (
        <ViewportSliceProgressScrollbar
          viewportId={viewportId}
          viewportData={viewportData}
          element={element}
          imageSliceData={imageSliceData}
          setImageSliceData={setImageSliceData}
          servicesManager={servicesManager}
        />
      ) : (
        <ViewportImageScrollbar
          viewportId={viewportId}
          viewportData={viewportData}
          element={element}
          imageSliceData={imageSliceData}
          setImageSliceData={setImageSliceData}
          scrollbarHeight={scrollbarHeight}
          servicesManager={servicesManager}
        />
      )}

      <CustomizableViewportOverlay
        imageSliceData={imageSliceData}
        viewportData={viewportData}
        viewportId={viewportId}
        servicesManager={servicesManager}
        element={element}
      />

      <AutoDecimationOverlay viewportId={viewportId} servicesManager={servicesManager} />

      <ViewportImageSliceLoadingIndicator
        viewportData={viewportData}
        element={element}
      />

      <ViewportOrientationMarkers
        imageSliceData={imageSliceData}
        element={element}
        viewportData={viewportData}
        servicesManager={servicesManager}
        viewportId={viewportId}
      />
    </div>
  );
}

export default CornerstoneOverlays;
