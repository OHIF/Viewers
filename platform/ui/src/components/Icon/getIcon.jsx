import React from 'react';
// Icons
import active from './../../assets/icons/active.svg';
import cancel from './../../assets/icons/cancel.svg';
import chevronDown from './../../assets/icons/chevron-down.svg';
import chevronRight from './../../assets/icons/chevron-right.svg';
import infoLink from './../../assets/icons/info-link.svg';
import launchArrow from './../../assets/icons/launch-arrow.svg';
import launchInfo from './../../assets/icons/launch-info.svg';
import logoOhifSmall from './../../assets/icons/logo-ohif-small.svg';
import notificationwarningDiamond from './../../assets/icons/notificationwarning-diamond.svg';
import settings from './../../assets/icons/settings.svg';
import sorting from './../../assets/icons/sorting.svg';
import sortingActiveDown from './../../assets/icons/sorting-active-down.svg';
import sortingActiveUp from './../../assets/icons/sorting-active-up.svg';

const ICONS = {
  active: active,
  cancel: cancel,
  'chevron-down': chevronDown,
  'chevron-right': chevronRight,
  'info-link': infoLink,
  'launch-arrow': launchArrow,
  'launch-info': launchInfo,
  'logo-ohif-small': logoOhifSmall,
  'notificationwarning-diamond': notificationwarningDiamond,
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
