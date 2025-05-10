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
  const { isTracked, hasMeasurements } = useMeasurementTracking({ viewportId });

  // Get segmentation information
  const { segmentationsWithRepresentations } = useViewportSegmentations({
    viewportId,
  });

  const hasSegmentations = segmentationsWithRepresentations.length > 0;

  // prefer segment navigation if available
  const navigationMode = hasSegmentations ? 'segment' : hasMeasurements ? 'measurement' : null;

  const handleMeasurementNavigation = useCallback(
    (direction: number) => {
      //   let newMeasurementSelected = measurementSelected;
      //   newMeasurementSelected += direction;
      //   if (newMeasurementSelected >= measurementCount) {
      //     newMeasurementSelected = 0;
      //   } else if (newMeasurementSelected < 0) {
      //     newMeasurementSelected = measurementCount - 1;
      //   }
      //   setTrackingIdentifiers(newMeasurementSelected);
      //   updateViewport(newMeasurementSelected);
      // },
    },
    [viewportId, segmentationService, measurementService, isTracked]
  );

  const handleSegmentNavigation = useCallback(
    (direction: number) => {
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

  // Only render if we need navigation
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

export default NavigationComponent;
