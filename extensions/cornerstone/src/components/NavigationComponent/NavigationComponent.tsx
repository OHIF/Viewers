import React, { useCallback } from 'react';
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
  const { segmentationService, measurementService } = servicesManager.services;

  // Get tracking information
  const { isTracked } = useMeasurementTracking({ viewportId });

  // Get segmentation information
  const { segmentationsWithRepresentations } = useViewportSegmentations({
    viewportId,
  });

  const hasSegmentations = segmentationsWithRepresentations.length > 0;
  const needsNavigation = hasSegmentations || isTracked;

  const handleMeasurementNavigation = useCallback(
    (direction: number) => {
      const measurements = measurementService.getMeasurements();
      const activeMeasurement = measurementService.getActiveMeasurement(viewportId);

      if (measurements.length && activeMeasurement) {
        const activeIndex = measurements.findIndex(m => m.uid === activeMeasurement.uid);
        let newIndex = activeIndex + direction;

        // Handle looping through the measurements
        if (newIndex >= measurements.length) {
          newIndex = 0;
        } else if (newIndex < 0) {
          newIndex = measurements.length - 1;
        }

        const newMeasurement = measurements[newIndex];
        if (newMeasurement) {
          measurementService.jumpToMeasurement(viewportId, newMeasurement.uid);
        }
      }
    },
    [viewportId, segmentationService, measurementService, isTracked]
  );

  const handleSegmentNavigation = useCallback(
    (direction: number) => {
      // Try to navigate using measurement service as fallback
    },
    [viewportId, segmentationService, measurementService, isTracked]
  );

  // Handle navigation between segments/measurements
  const handleNavigate = useCallback(
    (direction: number) => {
      // Try to navigate using measurement service as fallback
    },
    [viewportId, segmentationService, measurementService, isTracked]
  );

  // Only render if we need navigation
  if (!needsNavigation) {
    return null;
  }

  return (
    <ViewportActionArrows
      onArrowsClick={handleNavigate}
      className="h-6"
    />
  );
}

export default NavigationComponent;
