import React from 'react';
// Svgs
import { ReactComponent as logoXylexa } from './../../assets/svgs/logo-full-white.svg';

const SVGS = {
  'logo-xylexa': logoXylexa,
};

/**
 * Return the matching SVG as a React Component.
 * Results in an inlined SVG Element. If there's no match,
 * return `null`
 */
export default function getSvg(key, props) {
  if (!key || !SVGS[key]) {
    return React.createElement('div', null, 'Missing SVG');
  }

  return React.createElement(SVGS[key], props);
}

export { SVGS };
