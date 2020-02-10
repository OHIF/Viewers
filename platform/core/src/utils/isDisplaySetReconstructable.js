/**
 * Checks if a series is reconstructable to a 3D volume.
 *
 * @param {Object} series The `OHIFSeriesMetadata` object.
 * @param {Object[]} instances The `OHIFInstanceMetadata` object
 */
export default function isDisplaySetReconstructable(series, instances) {
  // Can't reconstruct if we only have one image.

  const modality = series._data.modality; // TODO -> Is there a better way to get this?
  const isMultiframe = instances[0].getRawValue('x00280008') > 1;

  if (!constructableModalities.includes(modality)) {
    return { value: false };
  }

  if (!isMultiframe && instances.length === 1) {
    return { values: false };
  }

  if (isMultiframe) {
    return processMultiframe(instances[0]);
  } else {
    return processSingleframe(instances);
  }
}

function processMultiframe(instance) {
  //TODO: deal with multriframe checks! return true for now.
  return { value: true };
}

function processSingleframe(instances) {
  const firstImage = instances[0];
  const firstImageRows = firstImage.getTagValue('x00280010');
  const firstImageColumns = firstImage.getTagValue('x00280011');
  const firstImageSamplesPerPixel = firstImage.getTagValue('x00280002');
  // Note: No need to unpack iop, can compare string form.
  const firstImageOrientationPatient = firstImage.getTagValue('x00200037');

  // Can't reconstruct if we:
  // -- Have a different dimensions within a displaySet.
  // -- Have a different number of components within a displaySet.
  // -- Have different orientations within a displaySet.
  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const rows = instance.getTagValue('x00280010');
    const columns = instance.getTagValue('x00280011');
    const samplesPerPixel = instance.getTagValue('x00280002');
    const imageOrientationPatient = instance.getTagValue('x00200037');

    if (
      rows !== firstImageRows ||
      columns !== firstImageColumns ||
      samplesPerPixel !== firstImageSamplesPerPixel ||
      imageOrientationPatient !== firstImageOrientationPatient
    ) {
      return { value: false };
    }
  }

  let missingFrames = 0;

  // Check if frame spacing is approximately equal within a tolerance.
  // If spacing is on a uniform grid but we are missing frames,
  // Allow reconstruction, but pass back the number of missing frames.
  if (instances.length > 2) {
    const firstIpp = _getImagePositionPatient(firstImage);
    const lastIpp = _getImagePositionPatient(instances[instances.length - 1]);

    // We can't reconstruct if we are missing imagePositionPatient values
    if (!firstIpp || !lastIpp) {
      return { value: false };
    }

    const averageSpacingBetweenFrames =
      _getPerpendicularDistance(firstIpp, lastIpp) / (instances.length - 1);

    let previousIpp = firstIpp;

    for (let i = 1; i < instances.length; i++) {
      const instance = instances[i];
      const ipp = _getImagePositionPatient(instance);

      const spacingBetweenFrames = _getPerpendicularDistance(ipp, previousIpp);
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

      previousIpp = ipp;
    }
  }

  return { value: true, missingFrames };
}

// TODO: Is 10% a reasonable tolerance for spacing?
const tolerance = 0.1;

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
    Math.abs(spacing - averageSpacing) < averageSpacing * tolerance;

  if (equalWithinTolerance) {
    return;
  }

  const multipleOfAverageSpacing = spacing / averageSpacing;

  const numberOfSpacings = Math.round(multipleOfAverageSpacing);

  const errorForEachSpacing =
    Math.abs(spacing - numberOfSpacings * averageSpacing) / numberOfSpacings;

  if (errorForEachSpacing < tolerance * averageSpacing) {
    return {
      issue: reconstructionIssues.MISSING_FRAMES,
      missingFrames: numberOfSpacings - 1,
    };
  }

  return { issue: reconstructionIssues.IRREGULAR_SPACING };
}

function _getImagePositionPatient(instance) {
  const tagValue = instance
    .getTagValue('x00200032');
  if (!tagValue) {
    return;
  }

  return tagValue
    .split('\\')
    .map(element => Number(element));
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
