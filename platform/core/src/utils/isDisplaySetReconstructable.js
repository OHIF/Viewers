import toNumber from './toNumber';
import sortInstancesByPosition from './sortInstancesByPosition';

// TODO: Is 10% a reasonable spacingTolerance for spacing?
const spacingTolerance = 0.2;
const iopTolerance = 0.01;

/**
 * Checks if a series is reconstructable to a 3D volume.
 *
 * @param {Object[]} instances An array of `OHIFInstanceMetadata` objects.
 */
export default function isDisplaySetReconstructable(instances) {
  if (!instances.length) {
    return { value: false };
  }

  const firstInstance = instances[0];

  const Modality = firstInstance.Modality;
  const isMultiframe = firstInstance.NumberOfFrames > 1;

  if (!constructableModalities.includes(Modality)) {
    return { value: false };
  }

  // Can't reconstruct if we only have one image.
  if (!isMultiframe && instances.length === 1) {
    return { value: false };
  }

  // Can't reconstruct if all instances don't have the ImagePositionPatient.
  if (!instances.every(instance => !!instance.ImagePositionPatient)) {
    return { value: false };
  }

  const sortedInstances = sortInstancesByPosition(instances);

  if (isMultiframe) {
    return processMultiframe(sortedInstances[0]);
  } else {
    return processSingleframe(sortedInstances);
  }
}

function processMultiframe(multiFrameInstance) {
  const {
    PerFrameFunctionalGroupsSequence,
    SharedFunctionalGroupsSequence,
  } = multiFrameInstance;

  // If we don't have the PixelMeasuresSequence, then the pixel spacing and
  // slice thickness isn't specified or is changing and we can't reconstruct
  // the dataset.
  if (
    !SharedFunctionalGroupsSequence ||
    !SharedFunctionalGroupsSequence[0].PixelMeasuresSequence
  ) {
    return { value: false };
  }

  // Check that the orientation is either shared or with the allowed
  // difference amount
  const {
    PlaneOrientationSequence: sharedOrientation,
  } = SharedFunctionalGroupsSequence;

  if (!sharedOrientation) {
    const {
      PlaneOrientationSequence: firstOrientation,
    } = PerFrameFunctionalGroupsSequence[0];

    if (!firstOrientation) {
      console.log('No orientation information');
      return { value: false };
    }
    // TODO - check orientation consistency
  }

  const frame0 = PerFrameFunctionalGroupsSequence[0];
  const firstPosition =
    frame0.PlanePositionSequence || frame0.CTPositionSequence;
  if (!firstPosition) {
    console.log('No image position information, not reconstructable');
    return { value: false };
  }
  // TODO - check spacing consistency

  return { value: true };
}

function processSingleframe(instances) {
  const firstImage = instances[0];
  const firstImageRows = toNumber(firstImage.Rows);
  const firstImageColumns = toNumber(firstImage.Columns);
  const firstImageSamplesPerPixel = toNumber(firstImage.SamplesPerPixel);
  const firstImageOrientationPatient = toNumber(
    firstImage.ImageOrientationPatient
  );
  const firstImagePositionPatient = toNumber(firstImage.ImagePositionPatient);

  // Can't reconstruct if we:
  // -- Have a different dimensions within a displaySet.
  // -- Have a different number of components within a displaySet.
  // -- Have different orientations within a displaySet.
  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const {
      Rows,
      Columns,
      SamplesPerPixel,
      ImageOrientationPatient,
    } = instance;

    const imageOrientationPatient = toNumber(ImageOrientationPatient);

    if (
      Rows !== firstImageRows ||
      Columns !== firstImageColumns ||
      SamplesPerPixel !== firstImageSamplesPerPixel ||
      !_isSameOrientation(imageOrientationPatient, firstImageOrientationPatient)
    ) {
      return { value: false };
    }
  }

  let missingFrames = 0;

  // Check if frame spacing is approximately equal within a spacingTolerance.
  // If spacing is on a uniform grid but we are missing frames,
  // Allow reconstruction, but pass back the number of missing frames.
  if (instances.length > 2) {
    const lastIpp = toNumber(
      instances[instances.length - 1].ImagePositionPatient
    );

    // We can't reconstruct if we are missing ImagePositionPatient values
    if (!firstImagePositionPatient || !lastIpp) {
      return { value: false };
    }

    const averageSpacingBetweenFrames =
      _getPerpendicularDistance(firstImagePositionPatient, lastIpp) /
      (instances.length - 1);

    let previousImagePositionPatient = firstImagePositionPatient;

    for (let i = 1; i < instances.length; i++) {
      const instance = instances[i];
      // Todo: get metadata from OHIF.MetadataProvider
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

        if (issue === reconstructionIssues.MISSING_FRAMES) {
          missingFrames += spacingIssue.missingFrames;
        } else if (issue === reconstructionIssues.IRREGULAR_SPACING) {
          return { value: false };
        }
      }

      previousImagePositionPatient = imagePositionPatient;
    }
  }

  return { value: true, missingFrames };
}

function _isSameOrientation(iop1, iop2) {
  if (iop1 === undefined || !iop2 === undefined) {
    return;
  }

  return (
    Math.abs(iop1[0] - iop2[0]) < iopTolerance &&
    Math.abs(iop1[1] - iop2[1]) < iopTolerance &&
    Math.abs(iop1[2] - iop2[2]) < iopTolerance
  );
}

/**
 * Checks for spacing issues.
 *
 * @param {number} spacing The spacing between two frames.
 * @param {number} averageSpacing The average spacing between all frames.
 *
 * @returns {Object} An object containing the issue and extra information if necessary.
 */
function _getSpacingIssue(spacing, averageSpacing) {
  const equalWithinTolerance =
    Math.abs(spacing - averageSpacing) < averageSpacing * spacingTolerance;

  if (equalWithinTolerance) {
    return;
  }

  const multipleOfAverageSpacing = spacing / averageSpacing;

  const numberOfSpacings = Math.round(multipleOfAverageSpacing);

  const errorForEachSpacing =
    Math.abs(spacing - numberOfSpacings * averageSpacing) / numberOfSpacings;

  if (errorForEachSpacing < spacingTolerance * averageSpacing) {
    return {
      issue: reconstructionIssues.MISSING_FRAMES,
      missingFrames: numberOfSpacings - 1,
    };
  }

  return { issue: reconstructionIssues.IRREGULAR_SPACING };
}

function _getPerpendicularDistance(a, b) {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
      Math.pow(a[1] - b[1], 2) +
      Math.pow(a[2] - b[2], 2)
  );
}

const constructableModalities = ['MR', 'CT', 'PT', 'NM'];
const reconstructionIssues = {
  MISSING_FRAMES: 'missingframes',
  IRREGULAR_SPACING: 'irregularspacing',
};
