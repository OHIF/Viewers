/**
 * XNAT wrapper for OHIFCornerstoneViewport that ensures the viewport is enabled
 * when viewportId changes (e.g. when "No protocol matches, defaulting to..." uses
 * a different layout). The cornerstone OHIFCornerstoneViewport only calls
 * enableViewport on mount; when viewportId changes due to protocol fallback,
 * the viewport must be re-enabled before setViewportData runs.
 */
import React, { useLayoutEffect } from 'react';
import { OHIFCornerstoneViewport } from '@ohif/extension-cornerstone';
import { useViewportRefs, useSystem } from '@ohif/core';

function XNATCornerstoneViewport(props: React.ComponentProps<typeof OHIFCornerstoneViewport>) {
  const { viewportOptions } = props;
  const viewportId = viewportOptions?.viewportId;
  const { servicesManager } = useSystem();
  const { getViewportElement } = useViewportRefs();
  const { cornerstoneViewportService } = servicesManager.services;

  // useLayoutEffect runs synchronously after refs are set, before child's useEffect.
  // This ensures enableViewport runs before loadViewportData->setViewportData.
  useLayoutEffect(() => {
    if (!viewportId) return;
    const element = getViewportElement(viewportId);
    if (element) {
      cornerstoneViewportService.enableViewport(
        viewportId,
        element as HTMLDivElement
      );
    }
  }, [viewportId]);

  // OHIFCornerstoneViewport expects servicesManager in props (ViewportGrid does not pass it).
  // Inject it so child overlays and services work correctly.
  return <OHIFCornerstoneViewport {...props} servicesManager={servicesManager} />;
}

export default XNATCornerstoneViewport;
