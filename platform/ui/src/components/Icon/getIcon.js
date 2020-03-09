import React from 'react';
import adjust from './icons/adjust.svg';
// Icons
import active from './icons/active.svg';
import cancel from './icons/cancel.svg';
import chevronDown from './icons/chevron-down.svg';
import chevronRight from './icons/chevron-right.svg';
import inactive from './icons/inactive.svg';
import infoLink from './icons/info-link.svg';
import launchArrow from './icons/launch-arrow.svg';
import launchInfo from './icons/launch-info.svg';
import settings from './icons/settings.svg';
import sortingActiveDown from './icons/sorting-active-down.svg';
import sortingActiveUp from './icons/sorting-active-up.svg';
import sorting from './icons/sorting.svg';

const ICONS = {
  active: active,
  cancel: cancel,
  'chevron-down': chevronDown,
  'chevron-right': chevronRight,
  inactive: inactive,
  'info-link': infoLink,
  'launch-arrow': launchArrow,
  'launch-info': launchInfo,
  settings: settings,
  'sorting-active-down': sortingActiveDown,
  'sorting-active-up': sortingActiveUp,
  sorting: sorting,
};

/**
 * Return the matching SVG Icon as a React Component.
 * Results in an inlined SVG Element. If there's no match,
 * return `null`
 */
export default function getIcon(key, props) {
  if (!key || !ICONS[key]) {
    return React.createElement('div', null, 'Missing Icon');
  }

  return React.createElement(ICONS[key], props);
}

export { ICONS };
