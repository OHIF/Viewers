// ICR/XNAT icons
import xnatOhifLogo from './icons/xnat-ohif-logo.svg';
import xnatIcrLogo from './icons/xnat-icr-logo.svg';
import xnatSettings from './icons/xnat-settings.svg';
import xnatAnnotations from './icons/xnat-annotations.svg';
import xnatContour from './icons/xnat-contour.svg';
import xnatMask from './icons/xnat-mask.svg';
import xnatContourFreehand from './icons/xnat-contour-freehand-draw.svg';
import xnatContourFreehandSculpt from './icons/xnat-contour-freehand-sculpt.svg';
import xnatMaskManual from './icons/xnat-mask-manual.svg';
import xnatMaskSmartCt from './icons/xnat-mask-smart-ct.svg';
import xnatMaskAuto from './icons/xnat-mask-auto.svg';
import xnatTreeMinus from './icons/xnat-tree-minus.svg';
import xnatTreePlus from './icons/xnat-tree-plus.svg';
import xnatTreeShow from './icons/xnat-tree-show.svg';
import xnatCancel from './icons/xnat-cancel.svg';
import xnatImport from './icons/xnat-import.svg';
import xnatExport from './icons/xnat-export.svg';
import xnatHelp from './icons/xnat-help.svg';
import xnatBrushEraser from './icons/xnat-mask-brush-eraser.svg';
import xnatUndo from './icons/xnat-undo.svg';
import xnatRedo from './icons/xnat-redo.svg';
import xnatImageComposition from './icons/xnat-image-composition.svg';
import xnatColormap from './icons/xnat-colormap.svg';
import xnatOpacity from './icons/xnat-opacity.svg';
import xnatContrastRange from './icons/xnat-contrast-range.svg';
import xnatRefresh from './icons/xnat-refresh.svg';

import Loader from './Loader/Loader';

import { sliderUtils, ReactSlider } from './rangeSliders';

const XNATICONS = {
  'xnat-ohif-logo': xnatOhifLogo,
  'xnat-icr-logo': xnatIcrLogo,
  'xnat-settings': xnatSettings,
  'xnat-annotations': xnatAnnotations,
  'xnat-contour': xnatContour,
  'xnat-mask': xnatMask,
  'xnat-contour-freehand': xnatContourFreehand,
  'xnat-contour-freehand-sculpt': xnatContourFreehandSculpt,
  'xnat-mask-manual': xnatMaskManual,
  'xnat-mask-smart-ct': xnatMaskSmartCt,
  'xnat-mask-auto': xnatMaskAuto,
  'xnat-tree-plus': xnatTreePlus,
  'xnat-tree-minus': xnatTreeMinus,
  'xnat-tree-show': xnatTreeShow,
  'xnat-cancel': xnatCancel,
  'xnat-import': xnatImport,
  'xnat-export': xnatExport,
  'xnat-help': xnatHelp,
  'xnat-brush-eraser': xnatBrushEraser,
  'xnat-undo': xnatUndo,
  'xnat-redo': xnatRedo,
  'xnat-image-composition': xnatImageComposition,
  'xnat-colormap': xnatColormap,
  'xnat-opacity': xnatOpacity,
  'xnat-contrast-range': xnatContrastRange,
  'xnat-refresh': xnatRefresh,
};

export { XNATICONS, Loader, sliderUtils, ReactSlider };
