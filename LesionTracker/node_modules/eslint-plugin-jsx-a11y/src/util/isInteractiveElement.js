import { getProp, getPropValue, getLiteralPropValue } from 'jsx-ast-utils';
import getTabIndex from './getTabIndex';
import DOMElements from './attributes/DOM.json';

// Map of tagNames to functions that return whether that element is interactive or not.
const interactiveMap = {
  a: (attributes) => {
    const href = getPropValue(getProp(attributes, 'href'));
    const tabIndex = getTabIndex(getProp(attributes, 'tabIndex'));
    return href !== undefined || tabIndex !== undefined;
  },
  // This is same as `a` interactivity function
  area: attributes => interactiveMap.a(attributes),
  button: () => true,
  input: (attributes) => {
    const typeAttr = getLiteralPropValue(getProp(attributes, 'type'));
    return typeAttr ? typeAttr.toUpperCase() !== 'HIDDEN' : true;
  },
  option: () => true,
  select: () => true,
  textarea: () => true,
};

/**
 * Returns boolean indicating whether the given element is
 * interactive on the DOM or not. Usually used when an element
 * has a dynamic handler on it and we need to discern whether or not
 * it's intention is to be interacted with on the DOM.
 */
const isInteractiveElement = (tagName, attributes) => {
  // Do not test higher level JSX components, as we do not know what
  // low-level DOM element this maps to.
  if (Object.keys(DOMElements).indexOf(tagName) === -1) {
    return true;
  }

  if ({}.hasOwnProperty.call(interactiveMap, tagName) === false) {
    return false;
  }

  return interactiveMap[tagName](attributes);
};

export default isInteractiveElement;
