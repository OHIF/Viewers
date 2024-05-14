import React from 'react';
// Icons

import arrowDown from './../../assets/icons/arrow-down.svg';
import arrowLeft from './../../assets/icons/arrow-left.svg';
import arrowRight from './../../assets/icons/arrow-right.svg';
import arrowLeftSmall from './../../assets/icons/arrow-left-small.svg';
import arrowRightSmall from './../../assets/icons/arrow-right-small.svg';
import calendar from './../../assets/icons/calendar.svg';
import cancel from './../../assets/icons/cancel.svg';
import clipboard from './../../assets/icons/clipboard.svg';
import close from './../../assets/icons/closeIcon.svg';
import dottedCircle from './../../assets/icons/dotted-circle.svg';
import circledCheckmark from './../../assets/icons/circled-checkmark.svg';
import chevronDown from './../../assets/icons/chevron-down.svg';
import chevronLeft from './../../assets/icons/chevron-left.svg';
import chevronMenu from './../../assets/icons/chevron-menu.svg';
import chevronNext from './../../assets/icons/chevron-next.svg';
import chevronPrev from './../../assets/icons/chevron-prev.svg';
import chevronRight from './../../assets/icons/chevron-right.svg';
import contentNext from './../../assets/icons/content-next.svg';
import contentPrev from './../../assets/icons/content-prev.svg';
import eyeVisible from './../../assets/icons/eye-visible.svg';
import eyeHidden from './../../assets/icons/eye-hidden.svg';
import exclamation from './../../assets/icons/exclamation.svg';
import externalLink from './../../assets/icons/external-link.svg';
import groupLayers from './../../assets/icons/group-layers.svg';
import info from './../../assets/icons/info.svg';
import infoAction from './../../assets/icons/info-action.svg';
import infoLink from './../../assets/icons/info-link.svg';
import launchArrow from './../../assets/icons/launch-arrow.svg';
import launchInfo from './../../assets/icons/launch-info.svg';
import link from './../../assets/icons/tool-stack-image-sync.svg';
import listBullets from './../../assets/icons/list-bullets.svg';
import lock from './../../assets/icons/lock.svg';
import logoOhifSmall from './../../assets/icons/logo-ohif-small.svg';
import logoDarkBackGround from './../../assets/icons/ohif-logo-color-darkbg.svg';
import magnifier from './../../assets/icons/magnifier.svg';
import notificationwarningDiamond from './../../assets/icons/notificationwarning-diamond.svg';
import pencil from './../../assets/icons/pencil.svg';
import powerOff from './../../assets/icons/power-off.svg';
import profile from './../../assets/icons/profile.svg';
import pushLeft from './../../assets/icons/push-left.svg';
import pushRight from './../../assets/icons/push-right.svg';
import settings from './../../assets/icons/settings.svg';
import sidePanelCloseLeft from './../../assets/icons/side-panel-close-left.svg';
import sidePanelCloseRight from './../../assets/icons/side-panel-close-right.svg';
import sorting from './../../assets/icons/sorting.svg';
import sortingActiveDown from './../../assets/icons/sorting-active-down.svg';
import sortingActiveUp from './../../assets/icons/sorting-active-up.svg';
import statusAlertWarning from './../../assets/icons/status-alert-warning.svg';
import statusAlert from './../../assets/icons/status-alert.svg';
import statusLocked from './../../assets/icons/status-locked.svg';
import statusTracked from './../../assets/icons/status-tracked.svg';
import statusUntracked from './../../assets/icons/status-untracked.svg';
import tracked from './../../assets/icons/tracked.svg';
import unlink from './../../assets/icons/unlink.svg';
import checkboxChecked from './../../assets/icons/checkbox-checked.svg';
import checkboxUnchecked from './../../assets/icons/checkbox-unchecked.svg';
import iconAlertOutline from './../../assets/icons/icons-alert-outline.svg';
import iconAlertSmall from './../../assets/icons/icon-alert-small.svg';
import iconClose from './../../assets/icons/icon-close.svg';
import iconClearField from './../../assets/icons/icon-clear-field.svg';
import iconNextInactive from './../../assets/icons/icon-next-inactive.svg';
import iconNext from './../../assets/icons/icon-next.svg';
import iconPlay from './../../assets/icons/icon-play.svg';
import iconPause from './../../assets/icons/icon-pause.svg';
import iconPrevInactive from './../../assets/icons/icon-prev-inactive.svg';
import iconPrev from './../../assets/icons/icon-prev.svg';
import iconSearch from './../../assets/icons/icon-search.svg';
import iconStatusAlert from './../../assets/icons/icon-status-alert.svg';
import iconTransferring from './../../assets/icons/icon-transferring.svg';
import iconUpload from './../../assets/icons/icon-upload.svg';
import navigationPanelRightHide from './../../assets/icons/navigation-panel-right-hide.svg';
import navigationPanelRightReveal from './../../assets/icons/navigation-panel-right-reveal.svg';
import tabLinear from './../../assets/icons/tab-linear.svg';
import tabPatientInfo from './../../assets/icons/tab-patient-info.svg';
import tabROIThreshold from './../../assets/icons/tab-roi-threshold.svg';
import tabSegmentation from './../../assets/icons/tab-segmentation.svg';
import tabStudies from './../../assets/icons/tab-studies.svg';
import uiArrowDown from './../../assets/icons/ui-arrow-down.svg';
import uiArrowUp from './../../assets/icons/ui-arrow-up.svg';
import uiArrowLeft from './../../assets/icons/ui-arrow-left.svg';
import uiArrowRight from './../../assets/icons/ui-arrow-right.svg';
import loadingOHIFMark from './../../assets/icons/loading-ohif-mark.svg';
import notificationsInfo from './../../assets/icons/notifications-info.svg';
import notificationsWarning from './../../assets/icons/notifications-warning.svg';
import notificationsError from './../../assets/icons/notifications-error.svg';
import notificationsSuccess from './../../assets/icons/notifications-success.svg';
import nextArrow from './../../assets/icons/next-arrow.svg';
import prevArrow from './../../assets/icons/prev-arrow.svg';
import viewportStatusTracked from './../../assets/icons/viewport-status-tracked.svg';

/** Tools */
import toggleDicomOverlay from './../../assets/icons/tool-toggle-dicom-overlay.svg';
import toolZoom from './../../assets/icons/tool-zoom.svg';
import toolCapture from './../../assets/icons/tool-capture.svg';
import toolLayout from './../../assets/icons/tool-layout-default.svg';
import toolMore from './../../assets/icons/tool-more-menu.svg';
import toolMove from './../../assets/icons/tool-move.svg';
import toolWindow from './../../assets/icons/tool-window-level.svg';
import toolAnnotate from './../../assets/icons/tool-annotate.svg';
import toolBidirectional from './../../assets/icons/tool-bidirectional.svg';
import toolElipse from './../../assets/icons/tool-measure-elipse.svg';
import toolCircle from './../../assets/icons/tool-circle.svg';
import toolLength from './../../assets/icons/tool-length.svg';
import toolStackScroll from './../../assets/icons/tool-stack-scroll.svg';
import toolMagnify from './../../assets/icons/tool-quick-magnify.svg';
import toolFlipHorizontal from './../../assets/icons/tool-flip-horizontal.svg';
import toolInvert from './../../assets/icons/tool-invert.svg';
import toolRotateRight from './../../assets/icons/tool-rotate-right.svg';
import toolCine from './../../assets/icons/tool-cine.svg';
import toolCrosshair from './../../assets/icons/tool-crosshair.svg';
import toolProbe from './../../assets/icons/focus-frame-target.svg';
import toolAngle from './../../assets/icons/tool-angle.svg';
import toolReset from './../../assets/icons/tool-reset.svg';
import toolRectangle from './../../assets/icons/tool-rectangle.svg';
import toolFusionColor from './../../assets/icons/tool-fusion-color.svg';
import toolCreateThreshold from './../../assets/icons/tool-create-threshold.svg';
import toolCalibration from './../../assets/icons/tool-calibrate.svg';
import toolFreehand from './../../assets/icons/tool-freehand.svg';
import toolFreehandPolygon from './../../assets/icons/tool-freehand-polygon.svg';
import toolPolygon from './../../assets/icons/tool-polygon.svg';
import toolBrush from './../../assets/icons/tool-brush.svg';
import toolEraser from './../../assets/icons/tool-eraser.svg';
import toolScissorRect from './../../assets/icons/tool-scissor-rect.svg';
import toolScissorCircle from './../../assets/icons/tool-scissor-circle.svg';
import toolPaintFill from './../../assets/icons/tool-paint-fill.svg';
import editPatient from './../../assets/icons/edit-patient.svg';
import panelGroupMore from './../../assets/icons/panel-group-more.svg';
import panelGroupOpenClose from './../../assets/icons/panel-group-open-close.svg';
import rowAdd from './../../assets/icons/row-add.svg';
import rowEdit from './../../assets/icons/row-edit.svg';
import rowHidden from './../../assets/icons/row-hidden.svg';
import rowShown from './../../assets/icons/row-shown.svg';
import rowLock from './../../assets/icons/row-lock.svg';
import rowUnlock from './../../assets/icons/row-unlock.svg';
import iconMPR from './../../assets/icons/icon-mpr-alt.svg';
import checkboxDefault from './../../assets/icons/checkbox-default.svg';
import checkboxActive from './../../assets/icons/checkbox-active.svg';
import referenceLines from './../../assets/icons/tool-reference-lines.svg';
import chevronDownNew from './../../assets/icons/icon-disclosure-close.svg';
import chevronLeftNew from './../../assets/icons/icon-disclosure-open.svg';
import settingsBars from './../../assets/icons/icon-display-settings.svg';
import iconAdd from './../../assets/icons/icon-add.svg';
import iconRename from './../../assets/icons/icon-rename.svg';
import iconDelete from './../../assets/icons/icon-delete.svg';
import iconMoreMenu from './../../assets/icons/icon-more-menu.svg';
import iconToolBrush from './../../assets/icons/tool-seg-brush.svg';
import iconToolEraser from './../../assets/icons/tool-seg-eraser.svg';
import iconToolScissor from './../../assets/icons/icon-tool-scissor.svg';
import iconToolShape from './../../assets/icons/tool-seg-shape.svg';
import iconToolThreshold from './../../assets/icons/tool-seg-threshold.svg';
import viewportWindowLevel from './../../assets/icons/viewport-window-level.svg';
import dicomTagBrowser from './../../assets/icons/tool-dicom-tag-browser.svg';
import iconToolFreehandRoi from './../../assets/icons/tool-freehand-roi.svg';
import iconToolLivewire from './../../assets/icons/tool-magnetic-roi.svg';
import iconToolSplineRoi from './../../assets/icons/tool-spline-roi.svg';
import iconToolUltrasoundBidirectional from './../../assets/icons/tool-ultrasound-bidirectional.svg';
import iconToolLoupe from './../../assets/icons/tool-magnify.svg';
/** Old OHIF */
import oldTrash from './../../assets/icons/old-trash.svg';
import oldPlay from './../../assets/icons/old-play.svg';
import oldStop from './../../assets/icons/old-stop.svg';

/** ColorLut */
import iconColorLUT from './../../assets/icons/icon-color-lut.svg';

/** New Patient Info Toolbar */
import iconChevronPatient from './../../assets/icons/icon-chevron-patient.svg';
import iconPatient from './../../assets/icons/icon-patient.svg';
import iconSettings from './../../assets/icons/icon-settings.svg';
import iconToolbarBack from './../../assets/icons/icon-toolbar-back.svg';
import iconMultiplePatients from './../../assets/icons/icon-multiple-patients.svg';

/** Volume Rendering */
import CTAAA from './../../assets/icons/CT-AAA.png';
import CTAAA2 from './../../assets/icons/CT-AAA2.png';
import CTAir from './../../assets/icons/CT-Air.png';
import CTBone from './../../assets/icons/CT-Bone.png';
import CTBones from './../../assets/icons/CT-Bones.png';
import CTCardiac from './../../assets/icons/CT-Cardiac.png';
import CTCardiac2 from './../../assets/icons/CT-Cardiac2.png';
import CTCardiac3 from './../../assets/icons/CT-Cardiac3.png';
import CTChestContrastEnhanced from './../../assets/icons/CT-Chest-Contrast-Enhanced.png';
import CTChestVessels from './../../assets/icons/CT-Chest-Vessels.png';
import CTCoronaryArteries from './../../assets/icons/CT-Coronary-Arteries.png';
import CTCoronaryArteries2 from './../../assets/icons/CT-Coronary-Arteries-2.png';
import CTCoronaryArteries3 from './../../assets/icons/CT-Coronary-Arteries-3.png';
import CTCroppedVolumeBone from './../../assets/icons/CT-Cropped-Volume-Bone.png';
import CTFat from './../../assets/icons/CT-Fat.png';
import CTLiverVasculature from './../../assets/icons/CT-Liver-Vasculature.png';
import CTLung from './../../assets/icons/CT-Lung.png';
import CTMIP from './../../assets/icons/CT-MIP.png';
import CTMuscle from './../../assets/icons/CT-Muscle.png';
import CTPulmonaryArteries from './../../assets/icons/CT-Pulmonary-Arteries.png';
import CTSoftTissue from './../../assets/icons/CT-Soft-Tissue.png';
import DTIFABrain from './../../assets/icons/DTI-FA-Brain.png';
import MRAngio from './../../assets/icons/MR-Angio.png';
import MRDefault from './../../assets/icons/MR-Default.png';
import MRMIP from './../../assets/icons/MR-MIP.png';
import MRT2Brain from './../../assets/icons/MR-T2-Brain.png';
import VolumeRendering from './../../assets/icons/VolumeRendering.png';
import actionNewDialog from './../../assets/icons/action-new-dialog.svg';

/** LAYOUT */

import layoutAdvanced3DFourUp from './../../assets/icons/layout-advanced-3d-four-up.svg';
import layoutAdvanced3DMain from './../../assets/icons/layout-advanced-3d-main.svg';
import layoutAdvanced3DOnly from './../../assets/icons/layout-advanced-3d-only.svg';
import layoutAdvanced3DPrimary from './../../assets/icons/layout-advanced-3d-primary.svg';
import layoutAdvancedAxialPrimary from './../../assets/icons/layout-advanced-axial-primary.svg';
import layoutAdvancedMPR from './../../assets/icons/layout-advanced-mpr.svg';
import layoutCommon1x1 from './../../assets/icons/layout-common-1x1.svg';
import layoutCommon1x2 from './../../assets/icons/layout-common-1x2.svg';
import layoutCommon2x2 from './../../assets/icons/layout-common-2x2.svg';
import layoutCommon2x3 from './../../assets/icons/layout-common-2x3.svg';
import iconToolRotate from './../../assets/icons/tool-3d-rotate.svg';

//
import tab4D from './../../assets/icons/tab-4d.svg';

/** New investigational use */
import investigationalUse from './../../assets/icons/illustration-investigational-use.svg';

const ICONS = {
  'arrow-down': arrowDown,
  'arrow-left': arrowLeft,
  'arrow-right': arrowRight,
  'arrow-left-small': arrowLeftSmall,
  'arrow-right-small': arrowRightSmall,
  calendar: calendar,
  cancel: cancel,
  clipboard: clipboard,
  close: close,
  'dotted-circle': dottedCircle,
  'circled-checkmark': circledCheckmark,
  'chevron-down': chevronDown,
  'chevron-left': chevronLeft,
  'chevron-menu': chevronMenu,
  'chevron-next': chevronNext,
  'chevron-prev': chevronPrev,
  'chevron-right': chevronRight,
  'content-next': contentNext,
  'content-prev': contentPrev,
  'eye-visible': eyeVisible,
  'eye-hidden': eyeHidden,
  'external-link': externalLink,
  'group-layers': groupLayers,
  info: info,
  'icon-alert-outline': iconAlertOutline,
  'icon-alert-small': iconAlertSmall,
  'icon-clear-field': iconClearField,
  'icon-close': iconClose,
  'icon-play': iconPlay,
  'icon-pause': iconPause,
  'icon-search': iconSearch,
  'icon-status-alert': iconStatusAlert,
  'icon-transferring': iconTransferring,
  'info-action': infoAction,
  'info-link': infoLink,
  'launch-arrow': launchArrow,
  'launch-info': launchInfo,
  link: link,
  'list-bullets': listBullets,
  lock: lock,
  'logo-ohif-small': logoOhifSmall,
  'logo-dark-background': logoDarkBackGround,
  magnifier: magnifier,
  exclamation: exclamation,
  'notificationwarning-diamond': notificationwarningDiamond,
  pencil: pencil,
  'power-off': powerOff,
  profile: profile,
  'push-left': pushLeft,
  'push-right': pushRight,
  settings: settings,
  'side-panel-close-left': sidePanelCloseLeft,
  'side-panel-close-right': sidePanelCloseRight,
  'sorting-active-down': sortingActiveDown,
  'sorting-active-up': sortingActiveUp,
  'status-alert': statusAlert,
  'status-alert-warning': statusAlertWarning,
  'status-locked': statusLocked,
  'status-tracked': statusTracked,
  'status-untracked': statusUntracked,
  sorting: sorting,
  tracked: tracked,
  unlink: unlink,
  'panel-group-more': panelGroupMore,
  'panel-group-open-close': panelGroupOpenClose,
  'row-add': rowAdd,
  'row-edit': rowEdit,
  'row-hidden': rowHidden,
  'row-shown': rowShown,
  'row-lock': rowLock,
  'row-unlock': rowUnlock,
  'checkbox-checked': checkboxChecked,
  'checkbox-unchecked': checkboxUnchecked,
  'loading-ohif-mark': loadingOHIFMark,
  'notifications-info': notificationsInfo,
  'notifications-error': notificationsError,
  'notifications-success': notificationsSuccess,
  'notifications-warning': notificationsWarning,

  /** Tools */
  'toggle-dicom-overlay': toggleDicomOverlay,
  'tool-zoom': toolZoom,
  'tool-capture': toolCapture,
  'tool-layout': toolLayout,
  'tool-more-menu': toolMore,
  'tool-move': toolMove,
  'tool-window-level': toolWindow,
  'tool-annotate': toolAnnotate,
  'tool-bidirectional': toolBidirectional,
  'tool-ellipse': toolElipse,
  'tool-circle': toolCircle,
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
  'tool-calibration': toolCalibration,
  'tool-point': toolCircle,
  'tool-freehand-line': toolFreehand,
  'tool-freehand-polygon': toolFreehandPolygon,
  'tool-polygon': toolPolygon,
  'tool-3d-rotate': iconToolRotate,
  'edit-patient': editPatient,
  'icon-mpr': iconMPR,
  'icon-next-inactive': iconNextInactive,
  'icon-next': iconNext,
  'icon-prev-inactive': iconPrevInactive,
  'icon-prev': iconPrev,
  'icon-upload': iconUpload,
  'navigation-panel-right-hide': navigationPanelRightHide,
  'navigation-panel-right-reveal': navigationPanelRightReveal,
  'tab-linear': tabLinear,
  'tab-patient-info': tabPatientInfo,
  'tab-roi-threshold': tabROIThreshold,
  'tab-segmentation': tabSegmentation,
  'tab-studies': tabStudies,
  'ui-arrow-down': uiArrowDown,
  'ui-arrow-up': uiArrowUp,
  'ui-arrow-left': uiArrowLeft,
  'ui-arrow-right': uiArrowRight,
  'checkbox-default': checkboxDefault,
  'checkbox-active': checkboxActive,
  'tool-referenceLines': referenceLines,
  'chevron-left-new': chevronLeftNew,
  'chevron-down-new': chevronDownNew,
  'settings-bars': settingsBars,
  'icon-rename': iconRename,
  'icon-add': iconAdd,
  'icon-delete': iconDelete,
  'icon-more-menu': iconMoreMenu,
  'icon-tool-brush': iconToolBrush,
  'icon-tool-eraser': iconToolEraser,
  'icon-tool-scissor': iconToolScissor,
  'icon-tool-shape': iconToolShape,
  'icon-tool-threshold': iconToolThreshold,
  'next-arrow': nextArrow,
  'prev-arrow': prevArrow,
  'viewport-status-tracked': viewportStatusTracked,
  'viewport-window-level': viewportWindowLevel,
  'dicom-tag-browser': dicomTagBrowser,
  /** New Tools */
  'icon-tool-freehand-roi': iconToolFreehandRoi,
  'icon-tool-livewire': iconToolLivewire,
  'icon-tool-spline-roi': iconToolSplineRoi,
  'icon-tool-ultrasound-bidirectional': iconToolUltrasoundBidirectional,
  'icon-tool-loupe': iconToolLoupe,
  /** Old OHIF */
  'old-trash': oldTrash,
  'old-play': oldPlay,
  'old-stop': oldStop,
  /** ColorLut */
  'icon-color-lut': iconColorLUT,
  /** New Patient Info Toolbar */
  'icon-chevron-patient': iconChevronPatient,
  'icon-patient': iconPatient,
  'icon-settings': iconSettings,
  'icon-toolbar-back': iconToolbarBack,
  'icon-multiple-patients': iconMultiplePatients,
  /** Volume Rendering */
  'CT-AAA': CTAAA,
  'CT-AAA2': CTAAA2,
  'CT-Air': CTAir,
  'CT-Bone': CTBone,
  'CT-Bones': CTBones,
  'CT-Cardiac': CTCardiac,
  'CT-Cardiac2': CTCardiac2,
  'CT-Cardiac3': CTCardiac3,
  'CT-Chest-Contrast-Enhanced': CTChestContrastEnhanced,
  'CT-Chest-Vessels': CTChestVessels,
  'CT-Coronary-Arteries': CTCoronaryArteries,
  'CT-Coronary-Arteries-2': CTCoronaryArteries2,
  'CT-Coronary-Arteries-3': CTCoronaryArteries3,
  'CT-Cropped-Volume-Bone': CTCroppedVolumeBone,
  'CT-Fat': CTFat,
  'CT-Liver-Vasculature': CTLiverVasculature,
  'CT-Lung': CTLung,
  'CT-MIP': CTMIP,
  'CT-Muscle': CTMuscle,
  'CT-Pulmonary-Arteries': CTPulmonaryArteries,
  'CT-Soft-Tissue': CTSoftTissue,
  'DTI-FA-Brain': DTIFABrain,
  'MR-Angio': MRAngio,
  'MR-Default': MRDefault,
  'MR-MIP': MRMIP,
  'MR-T2-Brain': MRT2Brain,
  VolumeRendering: VolumeRendering,
  'action-new-dialog': actionNewDialog,
  /** LAYOUT */
  'layout-advanced-3d-four-up': layoutAdvanced3DFourUp,
  'layout-advanced-3d-main': layoutAdvanced3DMain,
  'layout-advanced-3d-only': layoutAdvanced3DOnly,
  'layout-advanced-3d-primary': layoutAdvanced3DPrimary,
  'layout-advanced-axial-primary': layoutAdvancedAxialPrimary,
  'layout-advanced-mpr': layoutAdvancedMPR,
  'layout-common-1x1': layoutCommon1x1,
  'layout-common-1x2': layoutCommon1x2,
  'layout-common-2x2': layoutCommon2x2,
  'layout-common-2x3': layoutCommon2x3,
  'tab-4d': tab4D,

  /** New investigational use */
  'illustration-investigational-use': investigationalUse,
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
  const icon = ICONS[key];

  if (!key || !icon) {
    return React.createElement('div', null, 'Missing Icon');
  }

  if (typeof icon === 'string' && icon.endsWith('.png')) {
    return React.createElement('img', { src: icon, ...props });
  } else {
    return React.createElement(icon, props);
  }
}

export { getIcon, ICONS, addIcon };
