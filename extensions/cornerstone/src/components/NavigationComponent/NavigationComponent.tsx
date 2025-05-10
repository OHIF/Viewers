import React, { useCallback, useState } from 'react';
import { ViewportActionArrows } from '@ohif/ui-next';
import { useSystem } from '@ohif/core/src';
import { utils } from '../..';
import { useViewportSegmentations } from '../../hooks';
import { useMeasurementTracking } from '../../hooks/useMeasurementTracking';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

/**
 * NavigationComponent provides navigation controls for viewports containing
 * special displaySets (SR, SEG, RTSTRUCT) to navigate between segments or measurements
 */
function NavigationComponent({ viewportId }: { viewportId: string }) {
  const { servicesManager } = useSystem();
  const { segmentationService, cornerstoneViewportService, measurementService } =
    servicesManager.services;

  // Get tracking information
  const { isTracked, trackedMeasurementUIDs } = useMeasurementTracking({ viewportId });
  const { viewportDisplaySets } = useViewportDisplaySets(viewportId);
  const [measurementSelected, setMeasurementSelected] = useState(0);
  const isSRDisplaySet = viewportDisplaySets.some(displaySet => displaySet?.Modality === 'SR');
  const cornerstoneViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

  // Get segmentation information
  const { segmentationsWithRepresentations } = useViewportSegmentations({
    viewportId,
  });

  const hasSegmentations = segmentationsWithRepresentations.length > 0;

  // prefer segment navigation if available
  const navigationMode = hasSegmentations
    ? 'segment'
    : isSRDisplaySet
      ? 'measurement'
      : isTracked
        ? 'measurement'
        : null;

  const handleMeasurementNavigation = useCallback(
    (direction: number) => {
      const measurementDisplaySet = viewportDisplaySets.find(
        displaySet => displaySet?.Modality === 'SR'
      );

      if (measurementDisplaySet) {
        const measurements = measurementDisplaySet.measurements;
        if (measurements.length <= 0) {
          return;
        }

        const newIndex = getNextIndex(measurementSelected, direction, measurements.length);
        setMeasurementSelected(newIndex);

        const measurement = measurements[newIndex];
        cornerstoneViewport.setViewReference({
          referencedImageId: measurement.imageId,
        });
        return;
      }

      if (isTracked && trackedMeasurementUIDs.length > 0) {
        const newIndex = getNextIndex(
          measurementSelected,
          direction,
          trackedMeasurementUIDs.length
        );
        setMeasurementSelected(newIndex);
        measurementService.jumpToMeasurement(viewportId, trackedMeasurementUIDs[newIndex]);
      }
    },
    [
      viewportId,
      cornerstoneViewport,
      measurementSelected,
      measurementService,
      isTracked,
      trackedMeasurementUIDs,
      viewportDisplaySets,
    ]
  );

  const handleSegmentNavigation = useCallback(
    (direction: number) => {
      if (!segmentationsWithRepresentations.length) {
        return;
      }

      const segmentationId = segmentationsWithRepresentations[0].segmentation.segmentationId;

      utils.handleSegmentChange({
        direction,
        segmentationId,
        viewportId,
        selectedSegmentObjectIndex: 0,
        segmentationService,
      });
    },
    [segmentationsWithRepresentations, viewportId, segmentationService]
  );

  // Handle navigation between segments/measurements
  const handleNavigate = useCallback(
    (direction: number) => {
      if (navigationMode === 'segment') {
        handleSegmentNavigation(direction);
      } else if (navigationMode === 'measurement') {
        handleMeasurementNavigation(direction);
      }
    },
    [navigationMode, handleSegmentNavigation, handleMeasurementNavigation]
  );

  // Only render if we have a navigation mode
  if (!navigationMode) {
    return null;
  }

  return (
    <ViewportActionArrows
      onArrowsClick={handleNavigate}
      className="h-6"
    />
  );
}

/**
 * Calculate the next index with circular navigation support
 * @param currentIndex Current index position
 * @param direction Direction of movement (1 for next, -1 for previous)
 * @param totalItems Total number of items to navigate through
 * @returns The next index with wrap-around support
 */
function getNextIndex(currentIndex: number, direction: number, totalItems: number): number {
  if (totalItems <= 0) {
    return 0;
  }

  // Use modulo to handle circular navigation
  let nextIndex = (currentIndex + direction) % totalItems;

  // Handle negative index when going backwards from index 0
  if (nextIndex < 0) {
    nextIndex = totalItems - 1;
  }

  return nextIndex;
}

export default NavigationComponent;
