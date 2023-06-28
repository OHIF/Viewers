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

function addWarning(warnings, warning) {
  if (!warnings.includes(warning)) {
    warnings.push(warning);
    return true;
  }
  return false;
}
/**
 * Checks if a series is reconstructable to a 3D volume.
 *
 * @param {Object[]} instances An array of `OHIFInstanceMetadata` objects.
 */
export default function validateInstances(instances, isReconstructable) {
  const warnings = [];
  if (!instances.length) {
    addWarning(warnings, 'No valid instances found in series.');
  }

  const firstInstance = instances[0];
  if (firstInstance.ImageType.includes('LOCALIZER')) {
    return warnings;
  }

  const isMultiframe = firstInstance.NumberOfFrames > 1;
  const Modality = firstInstance.Modality;
  if (!constructableModalities.includes(Modality)) {
    return warnings;
  }

  // Can't reconstruct if all instances don't have the ImagePositionPatient.
  if (
    !isMultiframe &&
    !instances.every(instance => instance.ImagePositionPatient)
  ) {
    addWarning(warnings, 'Series has missing position information.');
  }

  const sortedInstances = sortInstancesByPosition(instances);

  if (isMultiframe) {
    checkMultiFrame(sortedInstances[0], warnings);
  } else {
    checkSingleFrame(sortedInstances, warnings);
  }

  if (!isReconstructable) {
    warnings.push('Series is not a reconstructable 3D volume.');
  }
  return warnings;
}

function checkMultiFrame(multiFrameInstance, warnings) {
  // If we don't have the PixelMeasuresSequence, then the pixel spacing and
  // slice thickness isn't specified or is changing and we can't reconstruct
  // the dataset.
  if (!hasPixelMeasurements(multiFrameInstance)) {
    addWarning(
      warnings,
      "Multiframe series don't have pixel measurement information."
    );
  }

  if (!hasOrientation(multiFrameInstance)) {
    addWarning(
      warnings,
      "Multiframe series don't have orientation information."
    );
  }

  if (!hasPosition(multiFrameInstance)) {
    addWarning(warnings, "Multiframe series don't have position information.");
  }
}

function checkPositionShift(
  previousPosition,
  actualPosition,
  normal,
  averageSpacingBetweenFrames
) {
  const predictedPosition = vec3.scaleAndAdd(
    vec3.create(),
    previousPosition,
    normal,
    averageSpacingBetweenFrames
  );
  return (
    vec3.distance(actualPosition, predictedPosition) >
    averageSpacingBetweenFrames
  );
}

function checkSingleFrame(instances, warnings) {
  const firstImage = instances[0];
  const firstImageRows = toNumber(firstImage.Rows);
  const firstImageColumns = toNumber(firstImage.Columns);
  const firstImageSamplesPerPixel = toNumber(firstImage.SamplesPerPixel);
  const firstImageOrientationPatient = toNumber(
    firstImage.ImageOrientationPatient
  );
  const firstImagePositionPatient = toNumber(firstImage.ImagePositionPatient);
  const rowCosineVec = vec3.fromValues(
    firstImageOrientationPatient[0],
    firstImageOrientationPatient[1],
    firstImageOrientationPatient[2]
  );
  const colCosineVec = vec3.fromValues(
    firstImageOrientationPatient[3],
    firstImageOrientationPatient[4],
    firstImageOrientationPatient[5]
  );
  const scanAxisNormal = vec3.cross(vec3.create(), rowCosineVec, colCosineVec);
  // TODO check warning insert in for

  // Can't reconstruct if we:
  // -- Have a different dimensions within a displaySet.
  // -- Have a different number of components within a displaySet.
  // -- Have different orientations within a displaySet.
  if (instances.length > 2) {
    for (let i = 1; i < instances.length; i++) {
      const instance = instances[i];
      const { Rows, Columns, SamplesPerPixel } = instance;
      const imageOrientationPatient = toNumber(
        instance.ImageOrientationPatient
      );

      if (Rows !== firstImageRows || Columns !== firstImageColumns) {
        addWarning(warnings, 'Series has different dimensions between frames.');
      }

      if (SamplesPerPixel !== firstImageSamplesPerPixel) {
        addWarning(
          warnings,
          'Series has frames with different number of components.'
        );
      }

      if (
        !_isSameOrientation(
          imageOrientationPatient,
          firstImageOrientationPatient
        )
      ) {
        addWarning(warnings, 'Series has frames with different orientations.');
      }
    }
  }

  // Check if frame spacing is approximately equal within a spacingTolerance.
  // If spacing is on a uniform grid but we are missing frames,
  // Allow reconstruction, but pass back the number of missing frames.
  if (instances.length > 2) {
    const lastIpp = toNumber(
      instances[instances.length - 1].ImagePositionPatient
    );

    // We can't reconstruct if we are missing ImagePositionPatient values
    if (!firstImagePositionPatient || !lastIpp) {
      addWarning(warnings, 'Series has missing position information.');
    }

    const averageSpacingBetweenFrames =
      _getPerpendicularDistance(firstImagePositionPatient, lastIpp) /
      (instances.length - 1);

    let previousImagePositionPatient = firstImagePositionPatient;

    const issuesFound = [];
    for (let i = 1; i < instances.length; i++) {
      const instance = instances[i];
      // Todo: get metadata from OHIF.MetadataProvider
      const imagePositionPatient = toNumber(instance.ImagePositionPatient);

      const spacingBetweenFrames = _getPerpendicularDistance(
        imagePositionPatient,
        previousImagePositionPatient
      );

      if (
        checkPositionShift(
          previousImagePositionPatient,
          imagePositionPatient,
          scanAxisNormal,
          averageSpacingBetweenFrames
        )
      ) {
        addWarning(warnings, 'Series has inconsistent position information.');
      }
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
            addWarning(warnings, 'Series has missing frames.');
          } else if (issue === reconstructionIssues.IRREGULAR_SPACING) {
            addWarning(warnings, 'Series has irregular spacing.');
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
}
