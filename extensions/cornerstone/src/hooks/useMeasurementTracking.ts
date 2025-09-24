import { useState, useEffect, useCallback } from 'react';
import { useSystem } from '@ohif/core/src';
import { useViewportDisplaySets } from './useViewportDisplaySets';
import { BaseVolumeViewport } from '@cornerstonejs/core';

/**
 * Hook that provides measurement tracking information for a viewport
 *
 * @param options - The hook options
 * @param options.viewportId - The ID of the viewport to track
 * @returns An object containing the tracking state, related information, and tracked measurement UIDs
 */
export function useMeasurementTracking({ viewportId }: { viewportId: string }) {
  const { servicesManager } = useSystem();
  const { cornerstoneViewportService, trackedMeasurementsService, measurementService } =
    servicesManager.services;

  const { backgroundDisplaySet } = useViewportDisplaySets(viewportId);

  // Tracking states
  const [isTracked, setIsTracked] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [trackedMeasurementUIDs, setTrackedMeasurementUIDs] = useState<string[]>([]);

  const updateTrackedMeasurements = useCallback(() => {
    if (!measurementService || !backgroundDisplaySet?.SeriesInstanceUID || !isTracked) {
      setTrackedMeasurementUIDs([]);
      return;
    }

    const seriesInstanceUID = backgroundDisplaySet.SeriesInstanceUID;

    const seriesMeasurements = measurementService.getMeasurements(
      measurement => measurement.referenceSeriesUID === seriesInstanceUID
    );

    const uids = seriesMeasurements.map(measurement => measurement.uid);
    setTrackedMeasurementUIDs(uids);
  }, [measurementService, backgroundDisplaySet, isTracked]);

  const updateIsTracked = useCallback(() => {
    if (!trackedMeasurementsService || !backgroundDisplaySet?.SeriesInstanceUID) {
      setIsTracked(false);
      return;
    }

    const trackedSeries = trackedMeasurementsService.getTrackedSeries();

    if (!trackedSeries?.length) {
      setIsTracked(false);
      return;
    }

    const viewport = cornerstoneViewportService?.getCornerstoneViewport(viewportId);
    const SeriesInstanceUID = backgroundDisplaySet.SeriesInstanceUID;

    if (viewport instanceof BaseVolumeViewport) {
      const currentImageId = viewport?.getCurrentImageId();

      if (!currentImageId) {
        setIsTracked(false);
        return;
      }
    }

    const seriesIsTracked = trackedSeries.includes(SeriesInstanceUID);
    setIsTracked(seriesIsTracked);
  }, [viewportId, backgroundDisplaySet, cornerstoneViewportService, trackedMeasurementsService]);

  // Update tracked measurements whenever tracking state changes
  useEffect(() => {
    updateTrackedMeasurements();
  }, [isTracked, updateTrackedMeasurements]);

  useEffect(() => {
    if (!trackedMeasurementsService) {
      return;
    }

    setIsLocked(trackedMeasurementsService.isTrackingEnabled());
    updateIsTracked();

    const subscriptions = [
      trackedMeasurementsService.subscribe(trackedMeasurementsService.EVENTS.TRACKING_ENABLED, () =>
        setIsLocked(true)
      ),
      trackedMeasurementsService.subscribe(
        trackedMeasurementsService.EVENTS.TRACKING_DISABLED,
        () => setIsLocked(false)
      ),

      trackedMeasurementsService.subscribe(
        trackedMeasurementsService.EVENTS.TRACKED_SERIES_CHANGED,
        () => updateIsTracked()
      ),
      trackedMeasurementsService.subscribe(trackedMeasurementsService.EVENTS.SERIES_ADDED, () =>
        updateIsTracked()
      ),
      trackedMeasurementsService.subscribe(trackedMeasurementsService.EVENTS.SERIES_REMOVED, () =>
        updateIsTracked()
      ),
    ];

    // Subscribe to measurement service events to update trackedMeasurementUIDs
    if (measurementService) {
      [
        measurementService.EVENTS.MEASUREMENT_ADDED,
        measurementService.EVENTS.RAW_MEASUREMENT_ADDED,
        measurementService.EVENTS.MEASUREMENT_UPDATED,
        measurementService.EVENTS.MEASUREMENT_REMOVED,
        measurementService.EVENTS.MEASUREMENTS_CLEARED,
      ].forEach(eventType => {
        subscriptions.push(
          measurementService.subscribe(eventType, () => updateTrackedMeasurements())
        );
      });
    }

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [trackedMeasurementsService, measurementService, updateIsTracked, updateTrackedMeasurements]);

  return {
    isTracked,
    isLocked,
    seriesInstanceUID: backgroundDisplaySet?.SeriesInstanceUID,
    trackedMeasurementUIDs,
  };
}

export default useMeasurementTracking;
