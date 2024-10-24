import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { roundNumber } from '@ohif/core/src/utils';
import {
  SegmentationData,
  SegmentationRepresentation,
} from '../services/SegmentationService/SegmentationService';

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
        const readableText = readableTextMap?.[key];

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

/**
 * Represents the combination of segmentation data and its representation in a viewport.
 */
type ViewportSegmentationRepresentation = {
  representation: SegmentationRepresentation;
  segmentation: SegmentationData;
};

/**
 * Custom hook that provides segmentation data and their representations for the active viewport.
 * @param options - The options object.
 * @param options.servicesManager - The services manager object.
 * @param options.subscribeToDataModified - Whether to subscribe to segmentation data modifications.
 * @param options.debounceTime - Debounce time in milliseconds for updates.
 * @returns An array of segmentation data and their representations for the active viewport.
 */
export function useActiveViewportSegmentationRepresentations({
  servicesManager,
  subscribeToDataModified = false,
  debounceTime = 0,
}: withAppTypes<{ debounceTime?: number }>): ViewportSegmentationRepresentation[] {
  const { segmentationService, viewportGridService, customizationService } =
    servicesManager.services;
  const [segmentationsWithRepresentations, setSegmentationsWithRepresentations] = useState<
    ViewportSegmentationRepresentation[]
  >([]);

  useEffect(() => {
    const update = () => {
      const viewportId = viewportGridService.getActiveViewportId();
      const segmentations = segmentationService.getSegmentations();

      if (!segmentations?.length) {
        setSegmentationsWithRepresentations([]);
        return;
      }

      const representations = segmentationService.getSegmentationRepresentations(viewportId);

      const tempSegmentationsWithRepresentations: ViewportSegmentationRepresentation[] = [];
      for (const representation of representations) {
        const segmentation = segmentationService.getSegmentation(representation.segmentationId);
        const mappedSegmentation = mapSegmentationToDisplay(segmentation, customizationService);

        tempSegmentationsWithRepresentations.push({
          representation,
          segmentation: mappedSegmentation,
        });
      }

      setSegmentationsWithRepresentations(tempSegmentationsWithRepresentations);
    };

    const debouncedUpdate = debounceTime > 0 ? debounce(update, debounceTime) : update;

    update();

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
  }, [
    segmentationService,
    viewportGridService,
    customizationService,
    debounceTime,
    subscribeToDataModified,
  ]);

  return segmentationsWithRepresentations;
}
