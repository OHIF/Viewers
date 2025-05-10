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
        const measurementCount = measurementDisplaySet.measurements.length;
        let newMeasurementSelected = measurementSelected;
        newMeasurementSelected += direction;
        if (newMeasurementSelected >= measurementCount) {
          newMeasurementSelected = 0;
        } else if (newMeasurementSelected < 0) {
          newMeasurementSelected = measurementCount - 1;
        }

        setMeasurementSelected(newMeasurementSelected);
        const measurement = measurementDisplaySet.measurements[newMeasurementSelected];
        cornerstoneViewport.setViewReference({
          referencedImageId: measurement.imageId,
        });
      }

      if (isTracked) {
        const currentIndex = trackedMeasurementUIDs.indexOf(
          trackedMeasurementUIDs[measurementSelected]
        );
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < trackedMeasurementUIDs.length) {
          setMeasurementSelected(newIndex);
          measurementService.jumpToMeasurement(viewportId, trackedMeasurementUIDs[newIndex]);
        }
      }
    },
    [
      viewportId,
      cornerstoneViewport,
      measurementSelected,
      setMeasurementSelected,
      measurementService,
      isTracked,
      trackedMeasurementUIDs,
      viewportDisplaySets,
    ]
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

  return (
    <ViewportActionArrows
      onArrowsClick={handleNavigate}
      className="h-6"
    />
  );
}

export default NavigationComponent;
