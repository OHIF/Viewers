import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { roundNumber } from '@ohif/core/src/utils';

function mapSegmentationToDisplay(segmentation, customizationService) {
  const { label, segments } = segmentation;

  // Get the readable text mapping once
  const { readableText: readableTextMap } = customizationService.getCustomization(
    'PanelSegmentation.readableText',
    {}
  );

  // Helper function to recursively map cachedStats to readable display text
  function mapStatsToDisplay(stats, indent = 0) {
    const primary = [];
    const indentation = '  '.repeat(indent);

    for (const key in stats) {
      if (Object.prototype.hasOwnProperty.call(stats, key)) {
        const value = stats[key];
        const readableText = readableTextMap[key];

        if (!readableText) {
          continue;
        }

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Add empty row before category (except for the first category)
          if (primary.length > 0) {
            primary.push('');
          }
          // Add category title
          primary.push(`${indentation}${readableText}`);
          // Recursively handle nested objects
          primary.push(...mapStatsToDisplay(value, indent + 1));
        } else {
          // For non-nested values, don't add empty rows
          primary.push(`${indentation}${readableText}: ${roundNumber(value, 2)}`);
        }
      }
    }

    return primary;
  }

  // Get customization for display text mapping
  const displayTextMapper = segment => {
    const defaultDisplay = {
      primary: [],
      secondary: [],
    };

    // If the segment has cachedStats, map it to readable text
    if (segment.cachedStats) {
      const primary = mapStatsToDisplay(segment.cachedStats);
      defaultDisplay.primary = primary;
    }

    return defaultDisplay;
  };

  const updatedSegments = {};

  Object.entries(segments).forEach(([segmentIndex, segment]) => {
    updatedSegments[segmentIndex] = {
      ...segment,
      displayText: displayTextMapper(segment),
    };
  });

  // Map the segments and apply the display text mapper
  return {
    ...segmentation,
    label,
    segments: updatedSegments,
  };
}

export function useSegmentations({
  servicesManager,
  subscribeToDataModified = false,
  debounceTime = 0,
}) {
  const { segmentationService, viewportGridService, customizationService } =
    servicesManager.services;
  const [segmentationsInfo, setSegmentationsInfo] = useState([]);

  useEffect(() => {
    const updateSegmentationsInfo = () => {
      const viewportId = viewportGridService.getActiveViewportId();
      const segmentations = segmentationService.getSegmentationsInfo({ viewportId });

      if (!segmentations?.length) {
        setSegmentationsInfo([]);
        return;
      }

      const mappedSegmentations = segmentations.map(({ segmentation, representation }) => {
        const mappedSegmentation = mapSegmentationToDisplay(segmentation, customizationService);
        return {
          segmentation: mappedSegmentation,
          representation,
        };
      });

      setSegmentationsInfo(mappedSegmentations);
    };

    const debouncedUpdate =
      debounceTime > 0 ? debounce(updateSegmentationsInfo, debounceTime) : updateSegmentationsInfo;

    updateSegmentationsInfo();

    const subscriptions = [
      segmentationService.subscribe(
        segmentationService.EVENTS.SEGMENTATION_MODIFIED,
        debouncedUpdate
      ),
      segmentationService.subscribe(
        segmentationService.EVENTS.SEGMENTATION_REMOVED,
        debouncedUpdate
      ),
      segmentationService.subscribe(
        segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
        debouncedUpdate
      ),
      viewportGridService.subscribe(
        viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
        debouncedUpdate
      ),
      viewportGridService.subscribe(viewportGridService.EVENTS.GRID_STATE_CHANGED, debouncedUpdate),
    ];

    if (subscribeToDataModified) {
      subscriptions.push(
        segmentationService.subscribe(
          segmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED,
          debouncedUpdate
        )
      );
    }

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
      if (debounceTime > 0) {
        debouncedUpdate.cancel();
      }
    };
  }, [segmentationService, viewportGridService, customizationService, debounceTime]);

  return segmentationsInfo;
}
