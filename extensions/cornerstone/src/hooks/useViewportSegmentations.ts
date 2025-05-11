import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { roundNumber } from '@ohif/core/src/utils';
import {
  SegmentationData,
  SegmentationRepresentation,
} from '../services/SegmentationService/SegmentationService';
import { useSystem } from '@ohif/core';
const excludedModalities = ['SM', 'OT', 'DOC', 'ECG'];

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
 * Represents the combination of segmentation data and its representation in a viewport.
 */
type ViewportSegmentationRepresentation = {
  segmentationsWithRepresentations: {
    representation: SegmentationRepresentation;
    segmentation: SegmentationData;
  }[];
  disabled: boolean;
};

/**
 * Custom hook that provides segmentation data and their representations for the active viewport.
 * @param options - The options object.
 * @param options.servicesManager - The services manager object.
 * @param options.subscribeToDataModified - Whether to subscribe to segmentation data modifications.
 * @param options.debounceTime - Debounce time in milliseconds for updates.
 * @returns An array of segmentation data and their representations for the active viewport.
 */
export function useViewportSegmentations({
  viewportId,
  subscribeToDataModified = false,
  debounceTime = 0,
}: {
  viewportId: string;
  subscribeToDataModified?: boolean;
  debounceTime?: number;
}): ViewportSegmentationRepresentation {
  const { servicesManager } = useSystem();
  const { segmentationService, viewportGridService, customizationService, displaySetService } =
    servicesManager.services;

  const [segmentationsWithRepresentations, setSegmentationsWithRepresentations] =
    useState<ViewportSegmentationRepresentation>({
      segmentationsWithRepresentations: [],
      disabled: false,
    });

  useEffect(() => {
    const update = () => {
      const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

      if (!displaySetUIDs?.length) {
        return;
      }

      const displaySet = displaySetService.getDisplaySetByUID(displaySetUIDs[0]);

      if (!displaySet) {
        return;
      }

      if (excludedModalities.includes(displaySet.Modality)) {
        setSegmentationsWithRepresentations(prev => ({
          segmentationsWithRepresentations: [],
          disabled: true,
        }));
        return;
      }

      const segmentations = segmentationService.getSegmentations();

      if (!segmentations?.length) {
        setSegmentationsWithRepresentations(prev => ({
          segmentationsWithRepresentations: [],
          disabled: false,
        }));
        return;
      }

      const representations = segmentationService.getSegmentationRepresentations(viewportId);

      const newSegmentationsWithRepresentations = representations.map(representation => {
        const segmentation = segmentationService.getSegmentation(representation.segmentationId);
        const mappedSegmentation = mapSegmentationToDisplay(segmentation, customizationService);
        return {
          representation,
          segmentation: mappedSegmentation,
        };
      });

      setSegmentationsWithRepresentations({
        segmentationsWithRepresentations: newSegmentationsWithRepresentations,
        disabled: false,
      });
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
    displaySetService,
    debounceTime,
    subscribeToDataModified,
    viewportId,
  ]);

  return segmentationsWithRepresentations;
}
