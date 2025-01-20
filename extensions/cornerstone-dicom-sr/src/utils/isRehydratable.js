import { adaptersSR } from '@cornerstonejs/adapters';

const cornerstoneAdapters =
  adaptersSR.Cornerstone3D.MeasurementReport.CORNERSTONE_TOOL_CLASSES_BY_UTILITY_TYPE;

const supportedLegacyCornerstoneTags = ['cornerstoneTools@^4.0.0'];
const CORNERSTONE_3D_TAG = cornerstoneAdapters.CORNERSTONE_3D_TAG;

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

  const mappingDefinitions = mappings.map(m => m.annotationType);
  const { measurements } = displaySet;

  const adapterKeys = Object.keys(cornerstoneAdapters).filter(
    adapterKey =>
      typeof cornerstoneAdapters[adapterKey].isValidCornerstoneTrackingIdentifier === 'function'
  );

  const adapters = [];

  adapterKeys.forEach(key => {
    if (mappingDefinitions.includes(key)) {
      // Must have both a dcmjs adapter and a measurementService
      // Definition in order to be a candidate for import.
      adapters.push(cornerstoneAdapters[key]);
    }
  });

  for (let i = 0; i < measurements.length; i++) {
    const { TrackingIdentifier } = measurements[i] || {};
    const hydratable = adapters.some(adapter => {
      let [cornerstoneTag, toolName] = TrackingIdentifier.split(':');
      if (supportedLegacyCornerstoneTags.includes(cornerstoneTag)) {
        cornerstoneTag = CORNERSTONE_3D_TAG;
      }

      const mappedTrackingIdentifier = `${cornerstoneTag}:${toolName}`;

      return adapter.isValidCornerstoneTrackingIdentifier(mappedTrackingIdentifier);
    });

    if (hydratable) {
      return true;
    }
    console.log('Measurement is not rehydratable', TrackingIdentifier, measurements[i]);
  }

  console.log('No measurements found which were rehydratable');
  return false;
}
