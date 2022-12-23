import React from 'react';
// Icons

import arrowDown from './../../assets/icons/arrow-down.svg';
import arrowLeft from './../../assets/icons/arrow-left.svg';
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
import exclamation from './../../assets/icons/exclamation.svg';
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
import powerOff from './../../assets/icons/power-off.svg';
import profile from './../../assets/icons/profile.svg';
import pushLeft from './../../assets/icons/push-left.svg';
import pushRight from './../../assets/icons/push-right.svg';
import settings from './../../assets/icons/settings.svg';
import sorting from './../../assets/icons/sorting.svg';
import sortingActiveDown from './../../assets/icons/sorting-active-down.svg';
import sortingActiveUp from './../../assets/icons/sorting-active-up.svg';
import tracked from './../../assets/icons/tracked.svg';
import unlink from './../../assets/icons/unlink.svg';
import checkboxChecked from './../../assets/icons/checkbox-checked.svg';
import checkboxUnchecked from './../../assets/icons/checkbox-unchecked.svg';
import iconNextInactive from './../../assets/icons/icon-next-inactive.svg';
import iconNext from './../../assets/icons/icon-next.svg';
import iconPrevInactive from './../../assets/icons/icon-prev-inactive.svg';
import iconPrev from './../../assets/icons/icon-prev.svg';
import navigationPanelRightHide from './../../assets/icons/navigation-panel-right-hide.svg';
import navigationPanelRightReveal from './../../assets/icons/navigation-panel-right-reveal.svg';
import tabLinear from './../../assets/icons/tab-linear.svg';
import tabPatientInfo from './../../assets/icons/tab-patient-info.svg';
import tabROIThreshold from './../../assets/icons/tab-roi-threshold.svg';
import tabSegmentation from './../../assets/icons/tab-segmentation.svg';
import uiArrowDown from './../../assets/icons/ui-arrow-down.svg';
import uiArrowUp from './../../assets/icons/ui-arrow-up.svg';
import loadingOHIFMark from './../../assets/icons/loading-ohif-mark.svg';
import notificationsInfo from './../../assets/icons/notifications-info.svg';
import notificationsWarning from './../../assets/icons/notifications-warning.svg';
import notificationsError from './../../assets/icons/notifications-error.svg';
import notificationsSuccess from './../../assets/icons/notifications-success.svg';

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
import toolStackScroll from './../../assets/icons/tool-stack-scroll.svg';
import toolMagnify from './../../assets/icons/tool-magnify.svg';
import toolFlipHorizontal from './../../assets/icons/tool-flip-horizontal.svg';
import toolInvert from './../../assets/icons/tool-invert.svg';
import toolRotateRight from './../../assets/icons/tool-rotate-right.svg';
import toolCine from './../../assets/icons/tool-cine.svg';
import toolCrosshair from './../../assets/icons/tool-crosshair.svg';
import toolProbe from './../../assets/icons/tool-probe.svg';
import toolAngle from './../../assets/icons/tool-angle.svg';
import toolReset from './../../assets/icons/tool-reset.svg';
import toolRectangle from './../../assets/icons/tool-rectangle.svg';
import toolFusionColor from './../../assets/icons/tool-fusion-color.svg';
import toolCreateThreshold from './../../assets/icons/tool-create-threshold.svg';
import editPatient from './../../assets/icons/edit-patient.svg';
import panelGroupMore from './../../assets/icons/panel-group-more.svg';
import panelGroupOpenClose from './../../assets/icons/panel-group-open-close.svg';
import rowAdd from './../../assets/icons/row-add.svg';
import rowEdit from './../../assets/icons/row-edit.svg';
import rowHidden from './../../assets/icons/row-hidden.svg';
import rowHideAll from './../../assets/icons/row-hide-all.svg';
import rowHide from './../../assets/icons/row-hide.svg';
import rowLocked from './../../assets/icons/row-locked.svg';
import rowShowAll from './../../assets/icons/row-show-all.svg';
import rowUnhide from './../../assets/icons/row-unhide.svg';
import rowUnlocked from './../../assets/icons/row-unlocked.svg';
import iconMPR from './../../assets/icons/icon-mpr-alt.svg';
import checkboxDefault from './../../assets/icons/checkbox-default.svg';
import checkboxActive from './../../assets/icons/checkbox-active.svg';
import referenceLines from './../../assets/icons/reference-lines.svg';

/** Old OHIF */
import oldTrash from './../../assets/icons/old-trash.svg';
import oldPlay from './../../assets/icons/old-play.svg';
import oldStop from './../../assets/icons/old-stop.svg';

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
  'arrow-left': arrowLeft,
  'launch-arrow': launchArrow,
  'launch-info': launchInfo,
  link: link,
  'list-bullets': listBullets,
  lock: lock,
  'logo-ohif-small': logoOhifSmall,
  magnifier: magnifier,
  exclamation: exclamation,
  'notificationwarning-diamond': notificationwarningDiamond,
  pencil: pencil,
  'power-off': powerOff,
  profile: profile,
  'push-left': pushLeft,
  'push-right': pushRight,
  settings: settings,
  'sorting-active-down': sortingActiveDown,
  'sorting-active-up': sortingActiveUp,
  sorting: sorting,
  tracked: tracked,
  unlink: unlink,
  'panel-group-more': panelGroupMore,
  'panel-group-open-close': panelGroupOpenClose,
  'row-add': rowAdd,
  'row-edit': rowEdit,
  'row-hidden': rowHidden,
  'row-hide-all': rowHideAll,
  'row-hide': rowHide,
  'row-locked': rowLocked,
  'row-show-all': rowShowAll,
  'row-unhide': rowUnhide,
  'row-unlocked': rowUnlocked,
  'checkbox-checked': checkboxChecked,
  'checkbox-unchecked': checkboxUnchecked,
  'loading-ohif-mark': loadingOHIFMark,
  'notifications-info': notificationsInfo,
  'notifications-error': notificationsError,
  'notifications-success': notificationsSuccess,
  'notifications-warning': notificationsWarning,

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
  'tool-stack-scroll': toolStackScroll,
  'tool-magnify': toolMagnify,
  'tool-flip-horizontal': toolFlipHorizontal,
  'tool-invert': toolInvert,
  'tool-rotate-right': toolRotateRight,
  'tool-cine': toolCine,
  'tool-crosshair': toolCrosshair,
  'tool-probe': toolProbe,
  'tool-angle': toolAngle,
  'tool-reset': toolReset,
  'tool-rectangle': toolRectangle,
  'tool-fusion-color': toolFusionColor,
  'tool-create-threshold': toolCreateThreshold,
  'edit-patient': editPatient,
  'icon-mpr': iconMPR,
  'icon-next-inactive': iconNextInactive,
  'icon-next': iconNext,
  'icon-prev-inactive': iconPrevInactive,
  'icon-prev': iconPrev,
  'navigation-panel-right-hide': navigationPanelRightHide,
  'navigation-panel-right-reveal': navigationPanelRightReveal,
  'tab-linear': tabLinear,
  'tab-patient-info': tabPatientInfo,
  'tab-roi-threshold': tabROIThreshold,
  'tab-segmentation': tabSegmentation,
  'ui-arrow-down': uiArrowDown,
  'ui-arrow-up': uiArrowUp,
  'checkbox-default': checkboxDefault,
  'checkbox-active': checkboxActive,
  'tool-referenceLines': referenceLines,

  /** Old OHIF */
  'old-trash': oldTrash,
  'old-play': oldPlay,
  'old-stop': oldStop,
};

function addIcon(iconName, iconSVG) {
  if (ICONS[iconName]) {
    console.warn(`Icon ${iconName} already exists.`);
  }

  ICONS[iconName] = iconSVG;
}

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

export { getIcon, ICONS, addIcon };
