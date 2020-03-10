/**
 * Checks if a series is reconstructable to a 3D volume.
 *
 * @param {Object[]} instances An array of `OHIFInstanceMetadata` objects.
 */
export default function isDisplaySetReconstructable(instances) {
  if (!instances.length) {
    return { value: false };
  }

  const firstInstance = instances[0].getData().metadata;

  const Modality = firstInstance.Modality;
  const isMultiframe = firstInstance.NumberOfFrames > 1;

  if (!constructableModalities.includes(Modality)) {
    return { value: false };
  }

  // Can't reconstruct if we only have one image.
  if (!isMultiframe && instances.length === 1) {
    return { value: false };
  }

  if (isMultiframe) {
    return processMultiframe(instances[0]);
  } else {
    return processSingleframe(instances);
  }
}

function processMultiframe(instance) {
  //TODO: deal with multriframe checks! return false for now as can't reconstruct.
  return { value: false };
}

function processSingleframe(instances) {
  const firstImage = instances[0].getData().metadata;
  const firstImageRows = firstImage.Rows;
  const firstImageColumns = firstImage.Columns;
  const firstImageSamplesPerPixel = firstImage.SamplesPerPixel;
  const firstImageOrientationPatient = firstImage.ImageOrientationPatient;
  const firstImagePositionPatient = firstImage.ImagePositionPatient;

  // Can't reconstruct if we:
  // -- Have a different dimensions within a displaySet.
  // -- Have a different number of components within a displaySet.
  // -- Have different orientations within a displaySet.
  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i].getData().metadata;
    const {
      Rows,
      Columns,
      SamplesPerPixel,
      ImageOrientationPatient,
    } = instance;

    if (
      Rows !== firstImageRows ||
      Columns !== firstImageColumns ||
      SamplesPerPixel !== firstImageSamplesPerPixel ||
      !_isSameOrientation(ImageOrientationPatient, firstImageOrientationPatient)
    ) {
      return { value: false };
    }
  }

  let missingFrames = 0;

  // Check if frame spacing is approximately equal within a spacingTolerance.
  // If spacing is on a uniform grid but we are missing frames,
  // Allow reconstruction, but pass back the number of missing frames.
  if (instances.length > 2) {
    const lastIpp = instances[instances.length - 1].getData().metadata
      .ImagePositionPatient;

    // We can't reconstruct if we are missing ImagePositionPatient values
    if (!firstImagePositionPatient || !lastIpp) {
      return { value: false };
    }

    const averageSpacingBetweenFrames =
      _getPerpendicularDistance(firstImagePositionPatient, lastIpp) /
      (instances.length - 1);

    let previousImagePositionPatient = firstImagePositionPatient;

    for (let i = 1; i < instances.length; i++) {
      const instance = instances[i].getData().metadata;
      const { ImagePositionPatient } = instance;

      const spacingBetweenFrames = _getPerpendicularDistance(
        ImagePositionPatient,
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

      previousImagePositionPatient = ImagePositionPatient;
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

// TODO: Is 10% a reasonable spacingTolerance for spacing?
const spacingTolerance = 0.1;
const iopTolerance = 0.01;

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
