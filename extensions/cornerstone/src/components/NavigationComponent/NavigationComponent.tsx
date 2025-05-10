import React, { useCallback } from 'react';
import { ViewportActionArrows } from '@ohif/ui-next';
import { useSystem } from '@ohif/core/src';
import { utils } from '../..';

/**
 * NavigationComponent provides navigation controls for viewports containing
 * special displaySets (SR, SEG, RTSTRUCT) to navigate between segments or measurements
 */
function NavigationComponent({ viewportId }: { viewportId: string }) {
  const { servicesManager } = useSystem();
  const { segmentationService, measurementService } = servicesManager.services;

  // Handle navigation between segments/measurements
  const handleNavigate = useCallback(
    (direction: number) => {
      const { Modality } = specialDisplaySet;

      if (Modality === 'SEG') {
        // Handle SEG navigation
        utils.handleSegmentChange({
          direction,
          segDisplaySet: specialDisplaySet,
          viewportId,
          selectedSegmentObjectIndex: 0, // The segmentation service will find the correct segment
          segmentationService,
        });
      } else if (Modality === 'RTSTRUCT') {
        // Handle RTSTRUCT navigation (same as SEG)
        utils.handleSegmentChange({
          direction,
          segDisplaySet: specialDisplaySet,
          viewportId,
          selectedSegmentObjectIndex: 0,
          segmentationService,
        });
      } else if (Modality === 'SR') {
        // Handle SR navigation - we'll use the display set's onMeasurementChange if it exists
        // otherwise try to use the measurement service
        if (typeof specialDisplaySet.onMeasurementChange === 'function') {
          specialDisplaySet.onMeasurementChange(direction);
        } else {
          // Try to navigate using measurement service as fallback
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
        }
      }
    },
    [specialDisplaySet, viewportId, segmentationService, measurementService]
  );

  return (
    <ViewportActionArrows
      onArrowsClick={handleNavigate}
      className="h-6"
    />
  );
}

export default NavigationComponent;
