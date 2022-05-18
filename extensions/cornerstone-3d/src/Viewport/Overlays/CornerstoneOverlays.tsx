import React, { useEffect, useState, useRef } from 'react';

import { Enums, eventTarget } from '@cornerstonejs/core';

import ViewportImageScrollbar from './ViewportImageScrollbar';
import ViewportOverlay from './ViewportOverlay';
import ViewportOrientationMarkers from './ViewportOrientationMarkers';
import ViewportLoadingIndicator from './ViewportLoadingIndicator';
import Cornerstone3DCacheService from '../../services/ViewportService/Cornerstone3DCacheService';

function CornerstoneOverlays(props) {
  const { viewportIndex, ToolBarService, element, scrollbarHeight } = props;
  const [imageIndex, setImageIndex] = useState(0);
  const [viewportData, setViewportData] = useState(null);

  useEffect(() => {
    const { unsubscribe } = Cornerstone3DCacheService.subscribe(
      Cornerstone3DCacheService.EVENTS.VIEWPORT_DATA_CHANGED,
      props => {
        console.debug(
          'tryign to set viewport data for viewport',
          viewportIndex
        );
        if (props.viewportIndex !== viewportIndex) {
          return;
        }

        console.debug('setting viewport data for viewport', viewportIndex);

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

  return (
    <>
      <ViewportImageScrollbar
        viewportIndex={viewportIndex}
        viewportData={viewportData}
        element={element}
        imageIndex={imageIndex}
        setImageIndex={setImageIndex}
        scrollbarHeight={scrollbarHeight}
      />
      <ViewportOverlay
        imageIndex={imageIndex}
        viewportData={viewportData}
        viewportIndex={viewportIndex}
        ToolBarService={ToolBarService}
      />
      <ViewportLoadingIndicator viewportData={viewportData} element={element} />
      <ViewportOrientationMarkers
        imageIndex={imageIndex}
        viewportData={viewportData}
        viewportIndex={viewportIndex}
      />
    </>
  );
}

export default CornerstoneOverlays;
