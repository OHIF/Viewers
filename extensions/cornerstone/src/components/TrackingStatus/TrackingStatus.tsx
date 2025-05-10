import React, { useState, useCallback, useEffect } from 'react';
import { useSystem } from '@ohif/core/src';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
import { BaseVolumeViewport } from '@cornerstonejs/core';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';

/**
 * TrackingStatus displays the status and actionable buttons for viewports containing
 * special displaySets (SR, SEG, RTSTRUCT) or when tracking measurements
 */
function TrackingStatus({ viewportId }: { viewportId: string }) {
  const { servicesManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;
  const { trackedMeasurementsService } = servicesManager.services as AppTypes.Services;

  const { backgroundDisplaySet } = useViewportDisplaySets(viewportId);
  const [isTracked, setIsTracked] = useState(false);

  const updateIsTracked = useCallback(
    trackedSeries => {
      if (!trackedSeries?.length || !backgroundDisplaySet?.SeriesInstanceUID) {
        if (isTracked) {
          setIsTracked(false);
        }
        return;
      }

      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      const SeriesInstanceUID = backgroundDisplaySet.SeriesInstanceUID;

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

      const seriesIsTracked = trackedSeries.includes(SeriesInstanceUID);
      if (seriesIsTracked !== isTracked) {
        setIsTracked(seriesIsTracked);
      }
    },
    [isTracked, viewportId, backgroundDisplaySet, cornerstoneViewportService]
  );

  // Subscribe to tracked series changes using the service
  useEffect(() => {
    if (!trackedMeasurementsService) {
      return;
    }

    // Initial check
    updateIsTracked(trackedMeasurementsService.getTrackedSeries());

    // Subscribe to series changes
    const subscriptions = [
      trackedMeasurementsService.subscribe(
        trackedMeasurementsService.EVENTS.TRACKED_SERIES_CHANGED,
        ({ trackedSeries }) => {
          updateIsTracked(trackedSeries);
        }
      ),

      trackedMeasurementsService.subscribe(
        trackedMeasurementsService.EVENTS.SERIES_ADDED,
        ({ trackedSeries }) => {
          updateIsTracked(trackedSeries);
        }
      ),

      trackedMeasurementsService.subscribe(
        trackedMeasurementsService.EVENTS.SERIES_REMOVED,
        ({ trackedSeries }) => {
          updateIsTracked(trackedSeries);
        }
      ),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [trackedMeasurementsService, updateIsTracked]);

  if (!isTracked) {
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
