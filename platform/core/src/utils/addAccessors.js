const handler = {
  /**
   * Get a proxied value from the array or property value
   * Note that the property value get works even if you update the underlying object.
   * Also, return true of proxy.__isProxy in order to distinguish proxies and not double proxy them.
   */
  get: (target, prop) => {
    if (prop == '__isProxy') {
      return true;
    }
    if (prop in target) {
      return target[prop];
    }
    return target[0][prop];
  },

  set: (obj, prop, value) => {
    if (typeof prop === 'number' || prop in obj) {
      obj[prop] = value;
    } else {
      obj[0][prop] = value;
    }
    return true;
  },
};

/**
 * Add a proxy object for sqZero or the src[0] element if sqZero is unspecified, AND
 * src is an array of length 1.
 *
 * If sqZero isn't passed in, then assume this is a create call on the destination object
 * itself, by:
 * 1. If not an object, return dest
 * 2. If an array of length != 1, return dest
 * 3. If an array, use dest[0] as sqZero
 * 4. Use dest as sqZero
 *
 * @example
 * src = [{a:5,b:'string', c:null}]
 * addAccessors(src)
 * src.c = 'outerChange'
 * src[0].b='innerChange'
 *
 * assert src.a===5
 * assert src[0].c === 'outerChange'
 * assert src.b === 'innerChange'
 */
const addAccessors = (dest, sqZero) => {
  if (dest.__isProxy) {
    return dest;
  }
  let itemZero = sqZero;
  if (itemZero === undefined) {
    if (typeof dest !== 'object') {
      return dest;
    }
    if (Array.isArray(dest) && dest.length !== 1) {
      return dest;
    }
    itemZero = Array.isArray(dest) ? dest[0] : dest;
  }
  const ret = [itemZero];
  return new Proxy(ret, handler);
};

export default addAccessors;
