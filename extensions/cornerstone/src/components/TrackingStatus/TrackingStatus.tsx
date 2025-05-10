import React, { useContext, useState, useCallback } from 'react';
import { useSystem } from '@ohif/core/src';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
import { BaseVolumeViewport } from '@cornerstonejs/core';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
const MEASUREMENT_TRACKING_EXTENSION_ID = '@ohif/extension-measurement-tracking';

/**
 * TrackingStatus displays the status and actionable buttons for viewports containing
 * special displaySets (SR, SEG, RTSTRUCT) or when tracking measurements
 */
function TrackingStatus({ viewportId }: { viewportId: string }) {
  const { extensionManager, servicesManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;

  const { backgroundDisplaySet } = useViewportDisplaySets(viewportId);
  const [isTracked, setIsTracked] = useState(false);

  // Check if measurement tracking is active
  const hasMeasurementTrackingExtension = extensionManager.registeredExtensionIds.includes(
    MEASUREMENT_TRACKING_EXTENSION_ID
  );

  // Access tracking state if available
  let trackedMeasurements;

  const updateIsTracked = useCallback(
    trackedSeries => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      const SeriesInstanceUID = backgroundDisplaySet?.SeriesInstanceUID;

      if (viewport instanceof BaseVolumeViewport) {
        // A current image id will only exist for volume viewports that can have measurements tracked.
        // Typically these are those volume viewports for the series of acquisition.
        const currentImageId = viewport?.getCurrentImageId();

        if (!currentImageId) {
          if (isTracked) {
            setIsTracked(false);
          }
          return;
        }
      }

      if (trackedSeries.includes(SeriesInstanceUID) !== isTracked) {
        setIsTracked(!isTracked);
      }
    },
    [isTracked, viewportId, backgroundDisplaySet, cornerstoneViewportService]
  );

  if (hasMeasurementTrackingExtension) {
    const contextModule = extensionManager.getModuleEntry(
      '@ohif/extension-measurement-tracking.contextModule.TrackedMeasurementsContext'
    );

    if (contextModule?.context) {
      const tracked = useContext(contextModule.context);
      trackedMeasurements = tracked?.[0];

      // Check if tracking is active (has tracked series)
      const trackedSeries = trackedMeasurements?.context?.trackedSeries;
      updateIsTracked(trackedSeries);
    }
  }

  if (!hasMeasurementTrackingExtension || !isTracked) {
    return null;
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Icons.StatusTracking className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div>Tracking</div>
        </TooltipContent>
      </Tooltip>
    </>
  );
}

export default TrackingStatus;
