import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { roundNumber } from '@ohif/core/src/utils';
import { SegmentationData } from '../services/SegmentationService/SegmentationService';
import { useSystem } from '@ohif/core';

function mapSegmentationToDisplay(segmentation, customizationService) {
  const { label, segments } = segmentation;

  // Get the readable text mapping once
  const readableTextMap = customizationService.getCustomization('panelSegmentation.readableText');

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
 * Custom hook that provides segmentation data.
 * @param options - The options object.
 * @param options.servicesManager - The services manager object.
 * @param options.subscribeToDataModified - Whether to subscribe to segmentation data modifications.
 * @param options.debounceTime - Debounce time in milliseconds for updates.
 * @returns An array of segmentation data.
 */
export function useSegmentations(options?: {
  subscribeToDataModified?: boolean;
  debounceTime?: number;
}): SegmentationData[] {
  const { subscribeToDataModified = false, debounceTime = 0 } = options || {};
  const { servicesManager } = useSystem();
  const { segmentationService, customizationService } = servicesManager.services;

  const [segmentations, setSegmentations] = useState<SegmentationData[]>([]);

  useEffect(() => {
    const update = () => {
      const segmentations = segmentationService.getSegmentations();

      if (!segmentations?.length) {
        setSegmentations([]);
        return;
      }

      const mappedSegmentations = segmentations.map(segmentation =>
        mapSegmentationToDisplay(segmentation, customizationService)
      );

      setSegmentations(mappedSegmentations);
    };

    const debouncedUpdate =
      debounceTime > 0 ? debounce(update, debounceTime, { leading: true, trailing: true }) : update;

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
  }, [segmentationService, customizationService, debounceTime, subscribeToDataModified]);

  return segmentations;
}
