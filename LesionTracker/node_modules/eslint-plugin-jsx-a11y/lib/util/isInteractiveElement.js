'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jsxAstUtils = require('jsx-ast-utils');

var _getTabIndex = require('./getTabIndex');

var _getTabIndex2 = _interopRequireDefault(_getTabIndex);

var _DOM = require('./attributes/DOM.json');

var _DOM2 = _interopRequireDefault(_DOM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Map of tagNames to functions that return whether that element is interactive or not.
var interactiveMap = {
  a: function a(attributes) {
    var href = (0, _jsxAstUtils.getPropValue)((0, _jsxAstUtils.getProp)(attributes, 'href'));
    var tabIndex = (0, _getTabIndex2.default)((0, _jsxAstUtils.getProp)(attributes, 'tabIndex'));
    return href !== undefined || tabIndex !== undefined;
  },
  // This is same as `a` interactivity function
  area: function area(attributes) {
    return interactiveMap.a(attributes);
  },
  button: function button() {
    return true;
  },
  input: function input(attributes) {
    var typeAttr = (0, _jsxAstUtils.getLiteralPropValue)((0, _jsxAstUtils.getProp)(attributes, 'type'));
    return typeAttr ? typeAttr.toUpperCase() !== 'HIDDEN' : true;
  },
  option: function option() {
    return true;
  },
  select: function select() {
    return true;
  },
  textarea: function textarea() {
    return true;
  }
};

/**
 * Returns boolean indicating whether the given element is
 * interactive on the DOM or not. Usually used when an element
 * has a dynamic handler on it and we need to discern whether or not
 * it's intention is to be interacted with on the DOM.
 */
var isInteractiveElement = function isInteractiveElement(tagName, attributes) {
  // Do not test higher level JSX components, as we do not know what
  // low-level DOM element this maps to.
  if (Object.keys(_DOM2.default).indexOf(tagName) === -1) {
    return true;
  }

  if ({}.hasOwnProperty.call(interactiveMap, tagName) === false) {
    return false;
  }

  return interactiveMap[tagName](attributes);
};

exports.default = isInteractiveElement;