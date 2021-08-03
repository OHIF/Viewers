// https://github.com/facebook/prop-types/issues/69

export const TypedArrayProp = {
  any: (props, propName, componentName) => {
    let obj = props[propName];
    if (
      !(
        obj instanceof Float64Array ||
        obj instanceof Float32Array ||
        obj instanceof Int32Array ||
        obj instanceof Int16Array ||
        obj instanceof Int8Array ||
        obj instanceof Uint32Array ||
        obj instanceof Uint16Array ||
        obj instanceof Uint8Array ||
        obj instanceof Uint8ClampedArray
      )
    ) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected a typed array.'
      );
    }
  },

  float64: (props, propName, componentName) => {
    if (!(props[propName] instanceof Float64Array)) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected a Float64Array.'
      );
    }
  },

  float32: (props, propName, componentName) => {
    if (!(props[propName] instanceof Float32Array)) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected a Float32Array.'
      );
    }
  },

  float: (props, propName, componentName) => {
    if (
      !(
        props[propName] instanceof Float64Array ||
        props[propName] instanceof Float32Array
      )
    ) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected a Float32Array or Float64Array.'
      );
    }
  },

  int32: (props, propName, componentName) => {
    if (!(props[propName] instanceof Int32Array)) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected an Int32Array.'
      );
    }
  },

  int16: (props, propName, componentName) => {
    if (!(props[propName] instanceof Int16Array)) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected an In16Array.'
      );
    }
  },

  int8: (props, propName, componentName) => {
    if (!(props[propName] instanceof Int8Array)) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected an Int8Array.'
      );
    }
  },

  int: (props, propName, componentName) => {
    if (
      !(
        props[propName] instanceof Int32Array ||
        props[propName] instanceof Int16Array ||
        props[propName] instanceof Int8Array
      )
    ) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected an Int32Array, In16Array, or Int8Array.'
      );
    }
  },

  uint32: (props, propName, componentName) => {
    if (!(props[propName] instanceof Uint32Array)) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected a Uint32Array.'
      );
    }
  },

  uint16: (props, propName, componentName) => {
    if (!(props[propName] instanceof Uint16Array)) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected a Uint16Array.'
      );
    }
  },

  uint8: (props, propName, componentName) => {
    if (!(props[propName] instanceof Uint8Array)) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected a Uint8Array.'
      );
    }
  },

  uint8clamped: (props, propName, componentName) => {
    if (!(props[propName] instanceof Uint8ClampedArray)) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected a Uint8ClampedArray.'
      );
    }
  },

  uint: (props, propName, componentName) => {
    if (
      !(
        props[propName] instanceof Uint32Array ||
        props[propName] instanceof Uint16Array ||
        props[propName] instanceof Uint8Array ||
        props[propName] instanceof Uint8ClampedArray
      )
    ) {
      return new Error(
        'Invalid prop `' +
          propName +
          '` supplied to' +
          ' `' +
          componentName +
          '`. Expected a Uint32Array, Uint16Array, Uint8Array, or Uint8ClampedArray.'
      );
    }
  }
};

export { TypedArrayProp as default };
