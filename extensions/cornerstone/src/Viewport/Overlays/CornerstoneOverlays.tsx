import React, { useRef } from 'react';
import { shallowEqual } from '@ohif/core';

import { useViewportState } from '../../hooks/useViewportState';
import ViewportImageScrollbar from './ViewportImageScrollbar';
import ViewportSliceProgressScrollbar from './ViewportSliceProgressScrollbar/ViewportSliceProgressScrollbar';
import CustomizableViewportOverlay from './CustomizableViewportOverlay';
import ViewportOrientationMarkers from './ViewportOrientationMarkers';
import ViewportImageSliceLoadingIndicator from './ViewportImageSliceLoadingIndicator';

const MOUNTED_PHASES = new Set(['mounted', 'rendered', 'settled']);

function CornerstoneOverlays(props: withAppTypes) {
  const { viewportId, element, scrollbarHeight, servicesManager } = props;
  const { cornerstoneViewportService, customizationService } = servicesManager.services;
  // Only the consumed fields: camera/VOI/colormap bumps (once per frame during
  // interaction) must not re-render the whole overlays subtree. The children
  // wire their own element listeners for those. displaySetKey is the coarse
  // signal for the viewportData re-read below.
  const runtime = useViewportState(
    viewportId,
    s => ({
      phase: s.phase,
      sliceIndex: s.sliceIndex,
      numSlices: s.numSlices,
      displaySetKey: s.displaySetInstanceUIDs.join('\n'),
    }),
    shallowEqual
  );

  // Read-through gated on the runtime phase: viewportInfo carries the NEW
  // viewportData from mount START, before the viewport has bound it, so raw
  // reads mid-swap would hand children data the viewport does not display yet.
  const liveViewportData = MOUNTED_PHASES.has(runtime.phase)
    ? (cornerstoneViewportService.getViewportInfo(viewportId)?.getViewportData() ?? null)
    : null;

  // During a remount (phase transiently below mounted while the element stays
  // enabled) keep handing children the previously mounted data; drop to null
  // only when the cornerstone viewport is gone entirely.
  const lastMountedViewportDataRef = useRef(null);
  if (liveViewportData) {
    lastMountedViewportDataRef.current = liveViewportData;
  }
  const viewportData =
    liveViewportData ??
    (cornerstoneViewportService.getCornerstoneViewport(viewportId)
      ? lastMountedViewportDataRef.current
      : null);

  const imageSliceData = {
    imageIndex: runtime.sliceIndex ?? 0,
    numberOfSlices: runtime.numSlices ?? 0,
  };

  if (!element) {
    return null;
  }

  if (viewportData) {
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);

    if (viewportInfo?.viewportOptions?.customViewportProps?.hideOverlays) {
      return null;
    }
  }

  const viewportScrollbarVariant = customizationService.getCustomization('viewportScrollbar.variant');
  const useProgressScrollbar = viewportScrollbarVariant !== 'legacy';

  return (
    <div className="noselect">
      {useProgressScrollbar ? (
        <ViewportSliceProgressScrollbar
          viewportId={viewportId}
          viewportData={viewportData}
          element={element}
          imageSliceData={imageSliceData}
          servicesManager={servicesManager}
        />
      ) : (
        <ViewportImageScrollbar
          viewportId={viewportId}
          element={element}
          imageSliceData={imageSliceData}
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
