import React from 'react';
// Icons
import arrowDown from './../../assets/icons/arrow-down.svg';
import seriesActive from './../../assets/icons/series-active.svg';
import seriesInactive from './../../assets/icons/series-inactive.svg';
import calendar from './../../assets/icons/calendar.svg';
import cancel from './../../assets/icons/cancel.svg';
import chevronDown from './../../assets/icons/chevron-down.svg';
import chevronLeft from './../../assets/icons/chevron-left.svg';
import chevronRight from './../../assets/icons/chevron-right.svg';
import infoLink from './../../assets/icons/info-link.svg';
import launchArrow from './../../assets/icons/launch-arrow.svg';
import launchInfo from './../../assets/icons/launch-info.svg';
import logoOhifSmall from './../../assets/icons/logo-ohif-small.svg';
import magnifier from './../../assets/icons/magnifier.svg';
import notificationwarningDiamond from './../../assets/icons/notificationwarning-diamond.svg';
import settings from './../../assets/icons/settings.svg';
import sorting from './../../assets/icons/sorting.svg';
import sortingActiveDown from './../../assets/icons/sorting-active-down.svg';
import sortingActiveUp from './../../assets/icons/sorting-active-up.svg';

/** Tools */
import toolZoom from './../../assets/icons/tool-zoom.svg';
import toolCapture from './../../assets/icons/tool-capture.svg';
import toolLayout from './../../assets/icons/tool-layout.svg';
import toolMore from './../../assets/icons/tool-more-menu.svg';
import toolMove from './../../assets/icons/tool-move.svg';
import toolWindow from './../../assets/icons/tool-window-level.svg';

const ICONS = {
  'arrow-down': arrowDown,
  'series-active': seriesActive,
  'series-inactive': seriesInactive,
  calendar: calendar,
  cancel: cancel,
  'chevron-down': chevronDown,
  'chevron-left': chevronLeft,
  'chevron-right': chevronRight,
  'info-link': infoLink,
  'launch-arrow': launchArrow,
  'launch-info': launchInfo,
  'logo-ohif-small': logoOhifSmall,
  magnifier: magnifier,
  'notificationwarning-diamond': notificationwarningDiamond,
  settings: settings,
  'sorting-active-down': sortingActiveDown,
  'sorting-active-up': sortingActiveUp,
  sorting: sorting,

  /** Tools */
  'tool-zoom': toolZoom,
  'tool-capture': toolCapture,
  'tool-layout': toolLayout,
  'tool-more-menu': toolMore,
  'tool-move': toolMove,
  'tool-window-level': toolWindow,
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
