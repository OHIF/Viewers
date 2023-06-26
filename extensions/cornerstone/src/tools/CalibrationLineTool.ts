import { Types } from '@ohif/core';
import { metaData, Types as csTypes } from '@cornerstonejs/core';
import { LengthTool, utilities } from '@cornerstonejs/tools';
import callInputDialog from '../utils/callInputDialog';
import getActiveViewportEnabledElement from '../utils/getActiveViewportEnabledElement';

const { calibrateImageSpacing } = utilities;

/**
 * Calibration Line tool works almost the same as the
 */
export class CalibrationLineTool extends LengthTool {
  static toolName = 'CalibrationLine';

  _renderingViewport: any;
  _lengthToolRenderAnnotation = this.renderAnnotation;

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    const { viewport } = enabledElement;
    this._renderingViewport = viewport;
    return this._lengthToolRenderAnnotation(enabledElement, svgDrawingHelper);
  };

  _getTextLines(data, targetId: string): string[] {
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

export function getCalibrationLength(annotationData): number {
  const length =
    Math.round(
      calculateLength3(
        annotationData.handles.points[0],
        annotationData.handles.points[1]
      ) * 100
    ) / 100;
  return length;
}
export function setCalibration(imageId, renderingEngine, length, newLength) {
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
  const scale = length / newLength;

  // trigger resize of the viewport to adjust the world/pixel mapping
  console.log(
    '* setCalibration',
    imageId,
    length,
    newLength,
    scale,
  );
  calibrateImageSpacing(imageId, renderingEngine, scale);
}

export function onCompletedCalibrationLine(
  servicesManager: Types.ServicesManager,
  csToolsEvent
): void {
  const { uiDialogService, viewportGridService } = servicesManager.services;

  // calculate length (mm) with the current Pixel Spacing
  const annotationAddedEventDetail = csToolsEvent.detail;
  const {
    annotation: { metadata, data: annotationData },
  } = annotationAddedEventDetail;
  const { referencedImageId: imageId } = metadata;
  const enabledElement = getActiveViewportEnabledElement(viewportGridService);
  const { viewport } = enabledElement;
  const length = getCalibrationLength(annotationData);

  const adjustCalibration = setCalibration.bind(
    null,
    imageId,
    viewport.getRenderingEngine(),
    length
  );

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
