// React Compiler opt-out: this file reads and mutates external cornerstone3D
// state (the enabled element, the camera, GL actors) during render and from
// imperative event handlers. The compiler's memoization assumes referential
// purity, so compiling it silently drops updates.
'use no memo';

import React, { useEffect, useState } from 'react';

import ViewportImageScrollbar from './ViewportImageScrollbar';
import ViewportSliceProgressScrollbar from './ViewportSliceProgressScrollbar/ViewportSliceProgressScrollbar';
import CustomizableViewportOverlay from './CustomizableViewportOverlay';
import ViewportOrientationMarkers from './ViewportOrientationMarkers';
import ViewportImageSliceLoadingIndicator from './ViewportImageSliceLoadingIndicator';

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
  }, [viewportId]);

  if (!element) {
    return null;
  }

  // Volume3D HPs set hideOverlays to drop DICOM chrome (scrollbar, markers,
  // StudyDate, etc.). Still mount CustomizableViewportOverlay in fidelity-only
  // mode so the always-visible fidelity indicator can show (VF-VIS / #6256).
  const hideOverlays = Boolean(
    viewportData &&
      cornerstoneViewportService.getViewportInfo(viewportId)?.viewportOptions?.customViewportProps
        ?.hideOverlays
  );

  const viewportScrollbarVariant = customizationService.getCustomization('viewportScrollbar.variant');
  const useProgressScrollbar = viewportScrollbarVariant !== 'legacy';

  return (
    <div className="noselect">
      {!hideOverlays &&
        (useProgressScrollbar ? (
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
        ))}

      <CustomizableViewportOverlay
        imageSliceData={imageSliceData}
        viewportData={viewportData}
        viewportId={viewportId}
        servicesManager={servicesManager}
        element={element}
        fidelityOnly={hideOverlays}
      />

      {!hideOverlays && (
        <ViewportImageSliceLoadingIndicator
          viewportData={viewportData}
          element={element}
        />
      )}

      {!hideOverlays && (
        <ViewportOrientationMarkers
          imageSliceData={imageSliceData}
          element={element}
          viewportData={viewportData}
          servicesManager={servicesManager}
          viewportId={viewportId}
        />
      )}
    </div>
  );
}

export default CornerstoneOverlays;
