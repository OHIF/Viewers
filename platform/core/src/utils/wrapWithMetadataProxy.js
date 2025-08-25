const metadataFieldsToWrap = [
  'ImagePositionPatient',
  'ImageOrientationPatient',
  'PixelSpacing',
  // more fields as necessary
];
const METADATA_PROXY_FLAG = Symbol('isMetadataProxy');

/**
 * Wraps a DICOM metadata instance object with a Proxy to allow custom access behavior
 * for a specific set of metadata fields (`metadataFieldsToWrap`).
 *
 * If a requested field is in `metadataFieldsToWrap`:
 *   - It first tries to return the value from the current instance.
 *   - If not found, it attempts to retrieve the value from the `_parentInstance`.
 *   - If still not found, it checks `_parentInstance._shared`.
 *   - If none exist, it returns `undefined`.
 *
 * For all other properties, it behaves like a regular property access.
 *
 * This allows graceful fallback access for DICOM metadata values that might be spread
 * across nested or shared metadata structures.
 *
 * @param {Object} instance - The target instance object to wrap.
 * @returns {Proxy} A proxy-wrapped instance with custom field resolution behavior.
 */
function wrapWithMetadataProxy(instance) {
  // Skip wrapping if already wrapped
  if (instance?.[METADATA_PROXY_FLAG]) {
    return instance;
  }

  const proxy = new Proxy(instance, {
    get(target, prop, receiver) {
      // Apply custom fallback logic only for fields explicitly listed in metadataFieldsToWrap
      if (typeof prop === 'string' && metadataFieldsToWrap.includes(prop)) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        if (target._parentInstance && prop in target._parentInstance) {
          return target._parentInstance[prop];
        }
        if (target._parentInstance?._shared && prop in target._parentInstance._shared) {
          return target._parentInstance._shared[prop];
        }
        return undefined;
      }

      // For all other fields, return the default behavior
      return Reflect.get(target, prop, receiver);
    },
  });

  // Mark this proxy to avoid double wrapping
  proxy[METADATA_PROXY_FLAG] = true;

  return proxy;
}

export default wrapWithMetadataProxy;
