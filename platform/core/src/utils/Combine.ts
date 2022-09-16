const handler = {
  get: (target, prop, receive) => {
    for (const obj of target) {
      if (prop in obj) {
        return obj[prop];
      }
    }
  },

  set: (target, prop, value) => {
    target[0][prop] = value;
    return true;
  },

  ownKeys: target => {
    const ret = {};
    for (const obj of target) {
      if (!obj) {
        continue;
      }
      for (const key of obj) {
        ret[key] = key;
      }
    }
    return Object.keys(ret);
  },
};

/**
 * Combine multiple objects into a single response object, just by "merging" the whole kit an caboodle.
 * @param args to proxy as though they were a hierarchy
 * @returns
 */
export default function Combine(...args) {
  return new Proxy(args, handler);
}
