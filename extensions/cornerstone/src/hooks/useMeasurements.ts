import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { useSystem } from '@ohif/core';
function mapMeasurementToDisplay(measurement, displaySetService) {
  const { referenceSeriesUID } = measurement;

  const displaySets = displaySetService.getDisplaySetsForSeries(referenceSeriesUID);

  if (!displaySets[0]?.instances) {
    throw new Error('The tracked measurements panel should only be tracking "stack" displaySets.');
  }

  const { findingSites, finding, label: baseLabel, displayText: baseDisplayText } = measurement;

  const firstSite = findingSites?.[0];
  const label = baseLabel || finding?.text || firstSite?.text || '(empty)';

  // Initialize displayText with the structure used in Length.ts and CobbAngle.ts
  const displayText = {
    primary: [],
    secondary: baseDisplayText?.secondary || [],
  };

  // Add baseDisplayText to primary if it exists
  if (baseDisplayText) {
    displayText.primary.push(...baseDisplayText.primary);
  }

  // Add finding sites to primary
  if (findingSites) {
    findingSites.forEach(site => {
      if (site?.text && site.text !== label) {
        displayText.primary.push(site.text);
      }
    });
  }

  // Add finding to primary if it's different from the label
  if (finding && finding.text && finding.text !== label) {
    displayText.primary.push(finding.text);
  }

  return {
    ...measurement,
    displayText,
    label,
  };
}

/**
 * A custom hook that provides mapped measurements based on the given services and filters.
 *
 * @param {Object} servicesManager - The services manager object.
 * @param {Object} options - The options for filtering and mapping measurements.
 * @param {Function} options.measurementFilter - Optional function to filter measurements.
 * @param {Object} options.valueTypes - The value types for mapping measurements.
 * @returns {Array} An array of mapped and filtered measurements.
 */
export function useMeasurements({ measurementFilter } = { measurementFilter: () => true }) {
  const { servicesManager } = useSystem();
  const { measurementService, displaySetService } = servicesManager.services;
  const [displayMeasurements, setDisplayMeasurements] = useState([]);

  useEffect(() => {
    const updateDisplayMeasurements = () => {
      const measurements = measurementService.getMeasurements(measurementFilter);
      const mappedMeasurements = measurements.map(m =>
        mapMeasurementToDisplay(m, displaySetService)
      );
      setDisplayMeasurements(prevMeasurements => {
        if (JSON.stringify(prevMeasurements) !== JSON.stringify(mappedMeasurements)) {
          return mappedMeasurements;
        }
        return prevMeasurements;
      });
    };

    const debouncedUpdate = debounce(updateDisplayMeasurements, 100);

    updateDisplayMeasurements();

    const events = [
      measurementService.EVENTS.MEASUREMENT_ADDED,
      measurementService.EVENTS.RAW_MEASUREMENT_ADDED,
      measurementService.EVENTS.MEASUREMENT_UPDATED,
      measurementService.EVENTS.MEASUREMENT_REMOVED,
      measurementService.EVENTS.MEASUREMENTS_CLEARED,
    ];

    const subscriptions = events.map(
      evt => measurementService.subscribe(evt, debouncedUpdate).unsubscribe
    );

    return () => {
      subscriptions.forEach(unsub => unsub());
      debouncedUpdate.cancel();
    };
  }, [measurementService, measurementFilter, displaySetService]);

  return displayMeasurements;
}
