import { vec3 } from 'gl-matrix';
import toNumber from '@ohif/core/src/utils/toNumber';
import sortInstancesByPosition from '@ohif/core/src/utils/sortInstancesByPosition';
import {
  hasPixelMeasurements,
  hasOrientation,
  hasPosition,
  _getPerpendicularDistance,
  _getSpacingIssue,
  reconstructionIssues,
  _isSameOrientation,
  constructableModalities,
} from '@ohif/core/src/utils/isDisplaySetReconstructable';
import { displaySetMessageCodes, displayServiceMessageList } from '@ohif/core';

/**
 * Calculates the scanAxisNormal based on a image orientation vector extract from a frame
 * @param {*} imageOrientation
 * @returns
 */
function calculateScanAxisNormal(imageOrientation) {
  const rowCosineVec = vec3.fromValues(
    imageOrientation[0],
    imageOrientation[1],
    imageOrientation[2]
  );
  const colCosineVec = vec3.fromValues(
    imageOrientation[3],
    imageOrientation[4],
    imageOrientation[5]
  );
  return vec3.cross(vec3.create(), rowCosineVec, colCosineVec);
}

/**
 * Checks if a series is reconstructable to a 3D volume.
 *
 * @param {Object[]} instances An array of `OHIFInstanceMetadata` objects.
 */
export default function validateInstances(
  instances: Array<any>,
  isReconstructable: boolean
): displayServiceMessageList {
  const messages = new displayServiceMessageList();
  if (!instances.length) {
    messages.addMessage(displaySetMessageCodes.NO_VALID_INSTANCES);
  }

  const firstInstance = instances[0];
  if (firstInstance.ImageType.includes('LOCALIZER')) {
    return messages;
  }

  const isMultiframe = firstInstance.NumberOfFrames > 1;
  const Modality = firstInstance.Modality;
  if (!constructableModalities.includes(Modality)) {
    return messages;
  }

  // Can't reconstruct if all instances don't have the ImagePositionPatient.
  if (
    !isMultiframe &&
    !instances.every(instance => instance.ImagePositionPatient)
  ) {
    messages.addMessage(displaySetMessageCodes.NO_POSITION_INFORMATION);
  }

  const sortedInstances = sortInstancesByPosition(instances);

  if (isMultiframe) {
    checkMultiFrame(sortedInstances[0], messages);
  } else {
    checkSingleFrames(sortedInstances, messages);
  }

  if (!isReconstructable) {
    messages.addMessage(displaySetMessageCodes.NOT_RECONSTRUCTABLE);
  }
  return messages;
}

/**
 * Check various multi frame issues. It calls OHIF core functions
 * @param {*} multiFrameInstance
 * @param {*} warnings
 */
function checkMultiFrame(
  multiFrameInstance,
  messages: displayServiceMessageList
): void {
  if (!hasPixelMeasurements(multiFrameInstance)) {
    messages.addMessage(
      displaySetMessageCodes.MULTIFRAME_NO_PIXEL_MEASUREMENTS
    );
  }

  if (!hasOrientation(multiFrameInstance)) {
    messages.addMessage(displaySetMessageCodes.MULTIFRAME_NO_ORIENTATION);
  }

  if (!hasPosition(multiFrameInstance)) {
    messages.addMessage(
      displaySetMessageCodes.MULTIFRAME_NO_POSITION_INFORMATION
    );
  }
}

/**
 * Checks if there is a position shift between consecutive frames
 * @param {*} previousPosition
 * @param {*} actualPosition
 * @param {*} scanAxisNormal
 * @param {*} averageSpacingBetweenFrames
 * @returns
 */
function _checkPositionShift(
  previousPosition,
  actualPosition,
  scanAxisNormal,
  averageSpacingBetweenFrames
) {
  // predicted position should be the previous position added by the multiplication
  // of the scanAxisNormal and the average spacing between frames
  const predictedPosition = vec3.scaleAndAdd(
    vec3.create(),
    previousPosition,
    scanAxisNormal,
    averageSpacingBetweenFrames
  );
  return (
    vec3.distance(actualPosition, predictedPosition) >
    averageSpacingBetweenFrames
  );
}

/**
 * Check if the frames in a series has different dimensions
 * @param {*} instances
 * @returns
 */
function checkSeriesDimensions(instances) {
  const firstImage = instances[0];
  const firstImageRows = toNumber(firstImage.Rows);
  const firstImageColumns = toNumber(firstImage.Columns);

  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const { Rows, Columns } = instance;

    if (Rows !== firstImageRows || Columns !== firstImageColumns) {
      return false;
    }
  }
  return true;
}

/**
 * Check if the series has frames with different samplesPerPixel
 * @param {*} instances
 * @returns
 */
function checkSeriesComponents(instances) {
  const firstImage = instances[0];
  const firstImageSamplesPerPixel = toNumber(firstImage.SamplesPerPixel);

  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const { SamplesPerPixel } = instance;

    if (SamplesPerPixel !== firstImageSamplesPerPixel) {
      return false;
    }
  }
  return true;
}

/**
 * Check is the series has frames with different orientations
 * @param {*} instances
 * @returns
 */
function checkSeriesOrientation(instances) {
  const firstImage = instances[0];
  const firstImageOrientationPatient = toNumber(
    firstImage.ImageOrientationPatient
  );

  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const imageOrientationPatient = toNumber(instance.ImageOrientationPatient);

    if (
      !_isSameOrientation(imageOrientationPatient, firstImageOrientationPatient)
    ) {
      return false;
    }
  }
  return true;
}
/**
 * Checks if a series has position shifts between consecutive frames
 * @param {*} instances
 * @returns
 */
function checkPositionShift(instances) {
  const firstImageOrientationPatient = toNumber(
    instances[0].ImageOrientationPatient
  );
  const scanAxisNormal = calculateScanAxisNormal(firstImageOrientationPatient);
  const firstImagePositionPatient = toNumber(instances[0].ImagePositionPatient);
  const lastIpp = toNumber(
    instances[instances.length - 1].ImagePositionPatient
  );

  const averageSpacingBetweenFrames =
    _getPerpendicularDistance(firstImagePositionPatient, lastIpp) /
    (instances.length - 1);

  let previousImagePositionPatient = firstImagePositionPatient;
  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const imagePositionPatient = toNumber(instance.ImagePositionPatient);

    if (
      _checkPositionShift(
        previousImagePositionPatient,
        imagePositionPatient,
        scanAxisNormal,
        averageSpacingBetweenFrames
      )
    ) {
      return false;
    }
    previousImagePositionPatient = imagePositionPatient;
  }
  return true;
}

/**
 * Checks if series has spacing issues
 * @param {*} instances
 * @param {*} warnings
 */
function checkSeriesSpacing(instances, messages) {
  const firstImagePositionPatient = toNumber(instances[0].ImagePositionPatient);
  const lastIpp = toNumber(
    instances[instances.length - 1].ImagePositionPatient
  );

  const averageSpacingBetweenFrames =
    _getPerpendicularDistance(firstImagePositionPatient, lastIpp) /
    (instances.length - 1);

  let previousImagePositionPatient = firstImagePositionPatient;

  const issuesFound = [];
  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const imagePositionPatient = toNumber(instance.ImagePositionPatient);

    const spacingBetweenFrames = _getPerpendicularDistance(
      imagePositionPatient,
      previousImagePositionPatient
    );

    const spacingIssue = _getSpacingIssue(
      spacingBetweenFrames,
      averageSpacingBetweenFrames
    );

    if (spacingIssue) {
      const issue = spacingIssue.issue;

      // avoid multiple warning of the same thing
      if (!issuesFound.includes(issue)) {
        issuesFound.push(issue);
        if (issue === reconstructionIssues.MISSING_FRAMES) {
          messages.addMessage(displaySetMessageCodes.MISSING_FRAMES);
        } else if (issue === reconstructionIssues.IRREGULAR_SPACING) {
          messages.addMessage(displaySetMessageCodes.IRREGULAR_SPACING);
        }
      }
      // we just want to find issues not how many
      if (issuesFound.length > 1) {
        break;
      }
    }
    previousImagePositionPatient = imagePositionPatient;
  }
}

/**
 * Runs various checks in a single frame series
 * @param {*} instances
 * @param {*} warnings
 */
function checkSingleFrames(instances, messages) {
  if (instances.length > 2) {
    if (!checkSeriesDimensions(instances)) {
      messages.addMessage(displaySetMessageCodes.INCONSISTENT_DIMENSIONS);
    }

    if (!checkSeriesComponents(instances)) {
      messages.addMessage(displaySetMessageCodes.INCONSISTENT_COMPONENTS);
    }

    if (!checkSeriesOrientation(instances)) {
      messages.addMessage(displaySetMessageCodes.INCONSISTENT_ORIENTATIONS);
    }

    if (!checkPositionShift(instances)) {
      messages.addMessage(
        displaySetMessageCodes.INCONSISTENT_POSITION_INFORMATION
      );
    }

    checkSeriesSpacing(instances, messages);
  }
}
