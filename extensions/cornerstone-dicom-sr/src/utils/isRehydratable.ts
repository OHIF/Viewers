import { adaptersSR } from '@cornerstonejs/adapters';

const { MeasurementReport } = adaptersSR.Cornerstone3D;

/**
 * Checks if the given `displaySet`can be rehydrated into the `measurementService`.
 *
 * @param {object} displaySet The SR `displaySet` to check.
 * @param {object[]} mappings The CornerstoneTools 4 mappings to the `measurementService`.
 * @returns {boolean} True if the SR can be rehydrated into the `measurementService`.
 */
export default function isRehydratable(displaySet, mappings) {
  if (!mappings || !mappings.length) {
    return false;
  }

  const mappingDefinitions = new Set<string>();
  for (const m of mappings) {
    mappingDefinitions.add(m.annotationType);
  }

  const { measurements } = displaySet;

  for (let i = 0; i < measurements.length; i++) {
    const { TrackingIdentifier } = measurements[i] || {};
    if (!TrackingIdentifier) {
      console.warn('No tracking identifier for measurement ', measurements[i]);
      continue;
    }
    const adapter = MeasurementReport.getAdapterForTrackingIdentifier(TrackingIdentifier);
    const hydratable = adapter && mappingDefinitions.has(adapter.toolType);

    if (hydratable) {
      return true;
    }
    console.log('Measurement is not rehydratable', TrackingIdentifier, measurements[i]);
  }

  console.log('No measurements found which were rehydratable');
  return false;
}
