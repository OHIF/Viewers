/**
 * fieldProxies has the set of fields which are proxied on a per-field basis
 * to the child element.
 */
export const fieldProxies = [
  'ImagePositionPatient',
  'ImageOrientationPatient',
  'PixelSpacing',
  // more fields as necessary
];

const METADATA_PROXY_FLAG = Symbol('isMetadataProxy');

/** The value of `field` in the first macro item of the shared functional groups that has it. */
function sharedValue(instance, field) {
  const groups = instance.SharedFunctionalGroupsSequence?.[0] ?? {};
  for (const sequence of Object.values(groups)) {
    const value = sequence?.[0]?.[field];
    if (value !== undefined) {
      return value;
    }
  }
}

/**
 * Adds proxy properties for a limited number of values which are sometimes
 * defined in multiframe instance data.
 *
 * If a requested field is in `fieldProxies` and the instance has no own value,
 * the getter returns the value of the shared functional groups, or `undefined`.
 * A write defines a plain own value on the object that is written to, so a write
 * to a frame view (an `Object.create` child of the instance) does not change the instance.
 *
 * For all other properties, it behaves like a regular property access.
 *
 * @param {Object} instance - The target instance object to wrap.
 * @returns {Object} The same instance, with the proxy fields.
 */
export function addProxyFields(instance) {
  // Skip wrapping if already wrapped
  if (!instance || instance[METADATA_PROXY_FLAG]) {
    return instance;
  }

  for (const fieldProxy of fieldProxies) {
    if (fieldProxy in instance) {
      continue;
    }
    Object.defineProperty(instance, fieldProxy, {
      configurable: true,
      enumerable: true,
      get: () => sharedValue(instance, fieldProxy),
      set(value) {
        Object.defineProperty(this, fieldProxy, {
          configurable: true,
          writable: true,
          enumerable: true,
          value,
        });
      },
    });
  }

  // Mark this proxy to avoid double wrapping
  Object.defineProperty(instance, METADATA_PROXY_FLAG, { value: true });

  return instance;
}

export default addProxyFields;
