import { metaData } from '@cornerstonejs/core';
import { LengthTool, utilities } from '@cornerstonejs/tools';
import { classes } from '@ohif/core';

import callInputDialog from '../utils/callInputDialog';
import getActiveViewportEnabledElement from '../utils/getActiveViewportEnabledElement';

const { calibrateImageSpacing } = utilities;
const metadataProvider = classes.MetadataProvider;

/**
 * Calibration Line tool works almost the same as the Line tool, but used for
 * image length calibration.
 */
class CalibrationLineTool extends LengthTool {
  static toolName = 'CalibrationLine';

  _renderingViewport: any;
  _lengthToolRenderAnnotation = this.renderAnnotation;

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    const { viewport } = enabledElement;
    this._renderingViewport = viewport;
    return this._lengthToolRenderAnnotation(enabledElement, svgDrawingHelper);
  };

  _getTextLines(data, targetId) {
    const [canvasPoint1, canvasPoint2] = data.handles.points.map(p =>
      this._renderingViewport.worldToCanvas(p)
    );
    // for display, round to 2 decimal points
    const lengthPx =
      Math.round(calculateLength2(canvasPoint1, canvasPoint2) * 100) / 100;

    const textLines = [`${lengthPx}px`];

    return textLines;
  }
}

function calculateLength2(point1, point2) {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateLength3(pos1, pos2) {
  const dx = pos1[0] - pos2[0];
  const dy = pos1[1] - pos2[1];
  const dz = pos1[2] - pos2[2];

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export default CalibrationLineTool;

export function onCompletedCalibrationLine(servicesManager, csToolsEvent) {
  const { uiDialogService, viewportGridService } = servicesManager.services;

  // calculate length (mm) with the current Pixel Spacing
  const annotationAddedEventDetail = csToolsEvent.detail;
  const {
    annotation: { metadata, data: annotationData },
  } = annotationAddedEventDetail;
  const { referencedImageId: imageId } = metadata;
  const enabledElement = getActiveViewportEnabledElement(viewportGridService);
  const { viewport } = enabledElement;

  const length =
    Math.round(
      calculateLength3(
        annotationData.handles.points[0],
        annotationData.handles.points[1]
      ) * 100
    ) / 100;

  // calculate the currently applied pixel spacing on the viewport
  const calibratedPixelSpacing = metaData.get(
    'calibratedPixelSpacing',
    imageId
  );
  const imagePlaneModule = metaData.get('imagePlaneModule', imageId);
  const currentRowPixelSpacing =
    calibratedPixelSpacing?.[0] || imagePlaneModule?.rowPixelSpacing || 1;
  const currentColumnPixelSpacing =
    calibratedPixelSpacing?.[1] || imagePlaneModule?.columnPixelSpacing || 1;

  /**
   * calibration action handler
   *
   **/
  const adjustCalibration = newLength => {
    const spacingScale = newLength / length;
    const rowSpacing = spacingScale * currentRowPixelSpacing;
    const colSpacing = spacingScale * currentColumnPixelSpacing;

    const renderingEngine = viewport.getRenderingEngine();

    // trigger resize of the viewport to adjust the world/pixel mapping
    calibrateImageSpacing(imageId, renderingEngine, rowSpacing, colSpacing);

    // NOTE: in the StackViewport, if the row and colum pixel spacing from
    // 'calibratedPixelSpacing' and the 'imagePlaneModule' metadata are different,
    // it triggers the "IMAGE_SPACING_CALIBRATED" event, which applies calibration
    // multiple times to the annotations.
    // So, let's override imagePlaneModule.
    // This override should happen in the next event cycle, as the rendering is
    // going on after above function call.
    setTimeout(() => {
      metadataProvider.addCustomMetadata(imageId, 'imagePlaneModule', {
        ...imagePlaneModule,
        // backup original rowPixelSpacing and columnPixelSpacing
        origRowPixelSpacing:
          imagePlaneModule.origRowPixelSpacing ||
          imagePlaneModule.rowPixelSpacing ||
          1,
        origColumnPixelSpacing:
          imagePlaneModule.origColumnPixelSpacing ||
          imagePlaneModule.columnPixelSpacing ||
          1,
        // override rowPixelSpacing and columPixelSpacing
        rowPixelSpacing: rowSpacing,
        columnPixelSpacing: colSpacing,
      });
    }, 0);
  };

  // Display calibration dialog, which requires the user to enter the actual
  // physical length of the drawn calibration line.
  return new Promise((resolve, reject) => {
    if (!uiDialogService) {
      reject('UIDialogService is not initiated');
      return;
    }

    callInputDialog(
      uiDialogService,
      {
        text: '',
        label: `${length}`,
      },
      (value, id) => {
        if (id === 'save') {
          adjustCalibration(Number.parseFloat(value));
          resolve(true);
        } else {
          reject('cancel');
        }
      },
      false,
      {
        dialogTitle: 'Calibration',
        inputLabel: 'Actual Physical distance (mm)',

        // the input value must be a number
        validateFunc: val => {
          try {
            const v = Number.parseFloat(val);
            return !isNaN(v) && v !== 0.0;
          } catch {
            return false;
          }
        },
      }
    );
  });
}
