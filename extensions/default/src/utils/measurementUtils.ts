import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';

function mapMeasurementToDisplay(measurement, displaySetService) {
  const { referenceSeriesUID } = measurement;

  const displaySets = displaySetService.getDisplaySetsForSeries(referenceSeriesUID);

  if (!displaySets[0]?.instances) {
    throw new Error('The tracked measurements panel should only be tracking "stack" displaySets.');
  }

  const {
    displayText: baseDisplayText,
    uid,
    label: baseLabel,
    type,
    selected,
    findingSites,
    finding,
    referencedImageId,
  } = measurement;

  const firstSite = findingSites?.[0];
  const label = baseLabel || finding?.text || firstSite?.text || '(empty)';
  let displayText = baseDisplayText || [];
  if (findingSites) {
    const siteText = [];
    findingSites.forEach(site => {
      if (site?.text !== label) {
        siteText.push(site.text);
      }
    });
    displayText = [...siteText, ...displayText];
  }
  if (finding && finding?.text !== label) {
    displayText = [finding.text, ...displayText];
  }

  return {
    uid,
    label,
    baseLabel,
    measurementType: type,
    displayText,
    baseDisplayText,
    isActive: selected,
    finding,
    findingSites,
    referencedImageId,
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
export function useMeasurements(servicesManager, { measurementFilter }) {
  const { measurementService, displaySetService } = servicesManager.services;
  const [displayMeasurements, setDisplayMeasurements] = useState([]);

  useEffect(() => {
    const updateDisplayMeasurements = () => {
      debugger;
      let measurements = measurementService.getMeasurements();
      if (measurementFilter) {
        measurements = measurements.filter(measurementFilter);
      }
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
