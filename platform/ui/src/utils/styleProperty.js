// https://github.com/swederik/dragula/blob/ccc15d75186f5168e7abadbe3077cf12dab09f8b/styleProperty.js

const browserProps = {};

function eachVendor(prop, fn) {
  const prefixes = ['Webkit', 'Moz', 'ms', 'O'];
  fn(prop);
  for (let i = 0; i < prefixes.length; i++) {
    fn(prefixes[i] + prop.charAt(0).toUpperCase() + prop.slice(1));
  }
}

function check(property, testValue) {
  const sandbox = document.createElement('iframe');
  const element = document.createElement('p');

  document.body.appendChild(sandbox);
  sandbox.contentDocument.body.appendChild(element);
  const support = set(element, property, testValue);

  // We have to do this because remove() is not supported by IE11 and below
  sandbox.parentElement.removeChild(sandbox);
  return support;
}

function checkComputed(el, prop) {
  const computed = window.getComputedStyle(el).getPropertyValue(prop);
  return computed !== void 0 && computed.length > 0 && computed !== 'none';
}

function set(el, prop, value) {
  let match = false;

  if (browserProps[prop] === void 0) {
    eachVendor(prop, function(vendorProp) {
      if (el.style[vendorProp] !== void 0 && match === false) {
        el.style[vendorProp] = value;
        if (checkComputed(el, vendorProp)) {
          match = true;
          browserProps[prop] = vendorProp;
        }
      }
    });
  } else {
    el.style[browserProps[prop]] = value;
    return true;
  }

  return match;
}

const styleProperty = {
  check,
  set,
};

export default styleProperty;
