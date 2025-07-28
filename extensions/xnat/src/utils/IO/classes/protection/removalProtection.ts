// Import utility functions
import { getMeasurementSource } from '../utils/measurementSourceUtils';
import { identityMapping } from '../utils/identityMapping';

// Track recently imported measurements to prevent immediate removal
export const recentlyImportedMeasurements = new Set();

// Intercept measurement removal events to prevent premature removal
export function setupRemovalProtection(measurementService) {
  // Store measurements that are being protected
  const protectedMeasurements = new Map();

  // Subscribe to measurement removal events
  const unsubscribe = measurementService.subscribe(
    measurementService.EVENTS.MEASUREMENT_REMOVED,
    (eventData) => {
      const { measurement: measurementId } = eventData;

      if (recentlyImportedMeasurements.has(measurementId)) {
        // Get the stored measurement data for re-adding
        const storedMeasurement = protectedMeasurements.get(measurementId);
        if (storedMeasurement) {
          // Re-add the measurement to the service
          try {
            // Get the source for re-adding
            const source = getMeasurementSource(measurementService);

            // Re-add the measurement using the stored data
            measurementService.addRawMeasurement(
              source,
              storedMeasurement.toolName,
              storedMeasurement.rawData,
              identityMapping
            );
          } catch (error) {
            console.error(`❌ Failed to re-add measurement ${measurementId}:`, error);
          }
        } else {
          console.warn(`No stored data found for measurement ${measurementId}`);
        }
      }
    }
  );

  // Track display text restoration attempts to prevent infinite loops
  const displayTextRestorationAttempts = new Map();

  // Subscribe to measurement update events to preserve display text
  const unsubscribeUpdate = measurementService.subscribe(
    measurementService.EVENTS.MEASUREMENT_UPDATED,
    (eventData) => {
      const { measurement } = eventData;
      const measurementId = measurement.uid;

      if (recentlyImportedMeasurements.has(measurementId)) {
        const storedMeasurement = protectedMeasurements.get(measurementId);
        if (storedMeasurement && storedMeasurement.displayText) {
          // Check if we've already tried to restore this measurement too many times
          const attempts = displayTextRestorationAttempts.get(measurementId) || 0;
          if (attempts >= 3) {
            return;
          }

          // Check if display text was reset or changed
          const currentDisplayText = measurement.displayText;
          const storedDisplayText = storedMeasurement.displayText;

          // If display text was reset or is empty, restore it
          // For ArrowAnnotate, we want to preserve the label as the primary text
          const needsRestoration = !currentDisplayText ||
            !currentDisplayText.primary ||
            currentDisplayText.primary.length === 0 ||
            (currentDisplayText.primary.length === 1 && currentDisplayText.primary[0] === '');

          // For ArrowAnnotate, if the primary text is the label, that's actually correct
          const isArrowAnnotateWithLabel = measurement.toolName === 'ArrowAnnotate' &&
            currentDisplayText?.primary?.length === 1 &&
            currentDisplayText.primary[0] === measurement.label;

          if (needsRestoration && !isArrowAnnotateWithLabel) {
            displayTextRestorationAttempts.set(measurementId, attempts + 1);

            // Only directly modify the measurement object to avoid triggering update events
            if (measurement.displayText) {
              measurement.displayText.primary = [...storedDisplayText.primary];
              measurement.displayText.secondary = [...storedDisplayText.secondary];
            }
          }
        }
      }
    }
  );

  // Also subscribe to RAW_MEASUREMENT_ADDED events to catch when measurements are re-added
  const unsubscribeRawAdded = measurementService.subscribe(
    measurementService.EVENTS.RAW_MEASUREMENT_ADDED,
    (eventData) => {
      const { measurement } = eventData;
      const measurementId = measurement.uid;

      if (recentlyImportedMeasurements.has(measurementId)) {
        const storedMeasurement = protectedMeasurements.get(measurementId);
        if (storedMeasurement && storedMeasurement.displayText) {
          // Check if we've already tried to restore this measurement too many times
          const attempts = displayTextRestorationAttempts.get(measurementId) || 0;
          if (attempts >= 3) {
            return;
          }

          // Check if display text needs restoration
          const currentDisplayText = measurement.displayText;
          const storedDisplayText = storedMeasurement.displayText;

          // For ArrowAnnotate, we want to preserve the label as the primary text
          const needsRestoration = !currentDisplayText ||
            !currentDisplayText.primary ||
            currentDisplayText.primary.length === 0 ||
            (currentDisplayText.primary.length === 1 && currentDisplayText.primary[0] === '');

          // For ArrowAnnotate, if the primary text is the label, that's actually correct
          const isArrowAnnotateWithLabel = measurement.toolName === 'ArrowAnnotate' &&
            currentDisplayText?.primary?.length === 1 &&
            currentDisplayText.primary[0] === measurement.label;

          if (needsRestoration && !isArrowAnnotateWithLabel) {
            displayTextRestorationAttempts.set(measurementId, attempts + 1);

            // Only directly modify the measurement object to avoid triggering update events
            if (measurement.displayText) {
              measurement.displayText.primary = [...storedDisplayText.primary];
              measurement.displayText.secondary = [...storedDisplayText.secondary];
            }
          }
        }
      }
    }
  );

  // Create a combined unsubscribe function
  const combinedUnsubscribe = () => {
    try {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      if (unsubscribeUpdate && typeof unsubscribeUpdate === 'function') {
        unsubscribeUpdate();
      }
      if (unsubscribeRawAdded && typeof unsubscribeRawAdded === 'function') {
        unsubscribeRawAdded();
      }
    } catch (error) {
      console.error(`Error during unsubscribe:`, error);
    }
  };

  // Return both unsubscribe functions and the protectedMeasurements map
  return {
    unsubscribe: combinedUnsubscribe,
    protectedMeasurements
  };
} 