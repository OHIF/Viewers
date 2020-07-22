import React from 'react';
// Icons

import arrowDown from './../../assets/icons/arrow-down.svg';
import calendar from './../../assets/icons/calendar.svg';
import cancel from './../../assets/icons/cancel.svg';
import clipboard from './../../assets/icons/clipboard.svg';
import close from './../../assets/icons/close.svg';
import dottedCircle from './../../assets/icons/dotted-circle.svg';
import circledCheckmark from './../../assets/icons/circled-checkmark.svg';
import chevronDown from './../../assets/icons/chevron-down.svg';
import chevronLeft from './../../assets/icons/chevron-left.svg';
import chevronRight from './../../assets/icons/chevron-right.svg';
import eyeVisible from './../../assets/icons/eye-visible.svg';
import eyeHidden from './../../assets/icons/eye-hidden.svg';
import externalLink from './../../assets/icons/external-link.svg';
import groupLayers from './../../assets/icons/group-layers.svg';
import info from './../../assets/icons/info.svg';
import infoLink from './../../assets/icons/info-link.svg';
import launchArrow from './../../assets/icons/launch-arrow.svg';
import launchInfo from './../../assets/icons/launch-info.svg';
import link from './../../assets/icons/link.svg';
import listBullets from './../../assets/icons/list-bullets.svg';
import lock from './../../assets/icons/lock.svg';
import logoOhifSmall from './../../assets/icons/logo-ohif-small.svg';
import magnifier from './../../assets/icons/magnifier.svg';
import notificationwarningDiamond from './../../assets/icons/notificationwarning-diamond.svg';
import pencil from './../../assets/icons/pencil.svg';
import profile from './../../assets/icons/profile.svg';
import pushLeft from './../../assets/icons/push-left.svg';
import pushRight from './../../assets/icons/push-right.svg';
import settings from './../../assets/icons/settings.svg';
import sorting from './../../assets/icons/sorting.svg';
import sortingActiveDown from './../../assets/icons/sorting-active-down.svg';
import sortingActiveUp from './../../assets/icons/sorting-active-up.svg';
import tracked from './../../assets/icons/tracked.svg';
import unlink from './../../assets/icons/unlink.svg';

/** Tools */
import toolZoom from './../../assets/icons/tool-zoom.svg';
import toolCapture from './../../assets/icons/tool-capture.svg';
import toolLayout from './../../assets/icons/tool-layout.svg';
import toolMore from './../../assets/icons/tool-more-menu.svg';
import toolMove from './../../assets/icons/tool-move.svg';
import toolWindow from './../../assets/icons/tool-window-level.svg';
import toolAnnotate from './../../assets/icons/tool-annotate.svg';
import toolBidirectional from './../../assets/icons/tool-bidirectional.svg';
import toolElipse from './../../assets/icons/tool-elipse.svg';
import toolLength from './../../assets/icons/tool-length.svg';

/** Old OHIF */
import oldBars from './../../assets/icons/old-bars.svg';
import oldCircle from './../../assets/icons/old-circle.svg';
import oldEllipseH from './../../assets/icons/old-ellipse-h.svg';
import oldInvert from './../../assets/icons/old-invert.svg';
import oldRotateRight from './../../assets/icons/old-rotate-right.svg';
import oldYoutube from './../../assets/icons/old-youtube.svg';
import oldDotCircle from './../../assets/icons/old-dot-circle.svg';
import oldAngleLeft from './../../assets/icons/old-angle-left.svg';
import oldReset from './../../assets/icons/old-reset.svg';
import oldCircleO from './../../assets/icons/old-circle-o.svg';
import oldTrash from './../../assets/icons/old-trash.svg';

const ICONS = {
  'arrow-down': arrowDown,
  calendar: calendar,
  cancel: cancel,
  clipboard: clipboard,
  close: close,
  'dotted-circle': dottedCircle,
  'circled-checkmark': circledCheckmark,
  'chevron-down': chevronDown,
  'chevron-left': chevronLeft,
  'chevron-right': chevronRight,
  'eye-visible': eyeVisible,
  'eye-hidden': eyeHidden,
  'external-link': externalLink,
  'group-layers': groupLayers,
  info: info,
  'info-link': infoLink,
  'launch-arrow': launchArrow,
  'launch-info': launchInfo,
  link: link,
  'list-bullets': listBullets,
  lock: lock,
  'logo-ohif-small': logoOhifSmall,
  magnifier: magnifier,
  'notificationwarning-diamond': notificationwarningDiamond,
  pencil: pencil,
  profile: profile,
  'push-left': pushLeft,
  'push-right': pushRight,
  settings: settings,
  'sorting-active-down': sortingActiveDown,
  'sorting-active-up': sortingActiveUp,
  sorting: sorting,
  tracked: tracked,
  unlink: unlink,

  /** Tools */
  'tool-zoom': toolZoom,
  'tool-capture': toolCapture,
  'tool-layout': toolLayout,
  'tool-more-menu': toolMore,
  'tool-move': toolMove,
  'tool-window-level': toolWindow,
  'tool-annotate': toolAnnotate,
  'tool-bidirectional': toolBidirectional,
  'tool-elipse': toolElipse,
  'tool-length': toolLength,

  /** Old OHIF */
  'old-bars': oldBars,
  'old-circle': oldCircle,
  'old-ellipse-h': oldEllipseH,
  'old-invert': oldInvert,
  'old-rotate-right': oldRotateRight,
  'old-youtube': oldYoutube,
  'old-dot-circle': oldDotCircle,
  'old-angle-left': oldAngleLeft,
  'old-reset': oldReset,
  'old-circle-o': oldCircleO,
  'old-trash': oldTrash,
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
