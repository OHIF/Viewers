import React, { useEffect, useState } from 'react';

import { Enums, eventTarget } from '@cornerstonejs/core';

import ViewportImageScrollbar from './ViewportImageScrollbar';
import ViewportOverlay from './ViewportOverlay';
import ViewportOrientationMarkers from './ViewportOrientationMarkers';
import ViewportLoadingIndicator from './ViewportLoadingIndicator';
import Cornerstone3DCacheService from '../../services/ViewportService/Cornerstone3DCacheService';

function CornerstoneOverlays({ viewportIndex, ToolBarService }) {
  const [element, setElement] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [scrollbarHeight, setScrollbarHeight] = useState('0px');
  const [viewportData, setViewportData] = useState(null);

  useEffect(() => {
    const setEnabledElement = eventDetail => {
      const { element } = eventDetail.detail;
      setElement(element);
      const scrollbarHeight = `${element.clientHeight - 20}px`;
      setScrollbarHeight(scrollbarHeight);
    };

    eventTarget.addEventListener(
      Enums.Events.ELEMENT_ENABLED,
      setEnabledElement
    );

    return () => {
      eventTarget.removeEventListener(
        Enums.Events.ELEMENT_ENABLED,
        setEnabledElement
      );
    };
  }, []);

  useEffect(() => {
    const unsubscribe = Cornerstone3DCacheService.subscribe(
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
