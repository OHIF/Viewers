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
export default function isDisplaySetReconstructable(instances, appConfig) {
  if (!instances.length) {
    return { value: false };
  }
  const firstInstance = instances[0];

  const isMultiframe = firstInstance.NumberOfFrames > 1;

  if (appConfig) {
    const rows = toNumber(firstInstance.Rows);
    const columns = toNumber(firstInstance.Columns);

    if (rows > appConfig.max3DTextureSize || columns > appConfig.max3DTextureSize) {
      return { value: false };
    }
  }
  // We used to check is reconstructable modalities here, but the logic is removed
  // in favor of the calculation by metadata (orientation and positions)

  // Can't reconstruct if we only have one image.
  if (!isMultiframe && instances.length === 1) {
    return { value: false };
  }

  // Can't reconstruct if all instances don't have the ImagePositionPatient.
  if (!isMultiframe && !instances.every(instance => instance.ImagePositionPatient)) {
    return { value: false };
  }

  const sortedInstances = sortInstancesByPosition(instances);

  return isMultiframe ? processMultiframe(sortedInstances[0]) : processSingleframe(sortedInstances);
}

function hasPixelMeasurements(multiFrameInstance) {
  const perFrameSequence = multiFrameInstance.PerFrameFunctionalGroupsSequence?.[0];
  const sharedSequence = multiFrameInstance.SharedFunctionalGroupsSequence;

  return (
    Boolean(perFrameSequence?.PixelMeasuresSequence) ||
    Boolean(sharedSequence?.PixelMeasuresSequence) ||
    Boolean(
      multiFrameInstance.PixelSpacing &&
        (multiFrameInstance.SliceThickness || multiFrameInstance.SpacingBetweenFrames)
    )
  );
}

function hasOrientation(multiFrameInstance) {
  const sharedSequence = multiFrameInstance.SharedFunctionalGroupsSequence;
  const perFrameSequence = multiFrameInstance.PerFrameFunctionalGroupsSequence?.[0];

  return (
    Boolean(sharedSequence?.PlaneOrientationSequence) ||
    Boolean(perFrameSequence?.PlaneOrientationSequence) ||
    Boolean(
      multiFrameInstance.ImageOrientationPatient ||
        multiFrameInstance.DetectorInformationSequence?.[0]?.ImageOrientationPatient
    )
  );
}

function hasPosition(multiFrameInstance) {
  const perFrameSequence = multiFrameInstance.PerFrameFunctionalGroupsSequence?.[0];

  return (
    Boolean(perFrameSequence?.PlanePositionSequence) ||
    Boolean(perFrameSequence?.CTPositionSequence) ||
    Boolean(
      multiFrameInstance.ImagePositionPatient ||
        multiFrameInstance.DetectorInformationSequence?.[0]?.ImagePositionPatient
    )
  );
}

function isNMReconstructable(multiFrameInstance) {
  const imageSubType = multiFrameInstance.ImageType?.[2];
  return imageSubType === 'RECON TOMO' || imageSubType === 'RECON GATED TOMO';
}

function processMultiframe(multiFrameInstance) {
  // If we don't have the PixelMeasuresSequence, then the pixel spacing and
  // slice thickness isn't specified or is changing and we can't reconstruct
  // the dataset.
  if (!hasPixelMeasurements(multiFrameInstance)) {
    return { value: false };
  }

  if (!hasOrientation(multiFrameInstance)) {
    console.log('No image orientation information, not reconstructable');
    return { value: false };
  }

  if (!hasPosition(multiFrameInstance)) {
    console.log('No image position information, not reconstructable');
    return { value: false };
  }

  if (multiFrameInstance.Modality.includes('NM') && !isNMReconstructable(multiFrameInstance)) {
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
  const firstImageOrientationPatient = toNumber(firstImage.ImageOrientationPatient);
  const firstImagePositionPatient = toNumber(firstImage.ImagePositionPatient);

  // Can't reconstruct if we:
  // -- Have a different dimensions within a displaySet.
  // -- Have a different number of components within a displaySet.
  // -- Have different orientations within a displaySet.
  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const { Rows, Columns, SamplesPerPixel, ImageOrientationPatient } = instance;

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
  let averageSpacingBetweenFrames;

  // Check if frame spacing is approximately equal within a spacingTolerance.
  // If spacing is on a uniform grid but we are missing frames,
  // Allow reconstruction, but pass back the number of missing frames.
  if (instances.length > 2) {
    const lastIpp = toNumber(instances[instances.length - 1].ImagePositionPatient);

    // We can't reconstruct if we are missing ImagePositionPatient values
    if (!firstImagePositionPatient || !lastIpp) {
      return { value: false };
    }

    averageSpacingBetweenFrames =
      _getPerpendicularDistance(firstImagePositionPatient, lastIpp) / (instances.length - 1);

    let previousImagePositionPatient = firstImagePositionPatient;

    for (let i = 1; i < instances.length; i++) {
      const instance = instances[i];
      // Todo: get metadata from OHIF.MetadataProvider
      const imagePositionPatient = toNumber(instance.ImagePositionPatient);

      const spacingBetweenFrames = _getPerpendicularDistance(
        imagePositionPatient,
        previousImagePositionPatient
      );
      const spacingIssue = _getSpacingIssue(spacingBetweenFrames, averageSpacingBetweenFrames);

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

  return { value: true, averageSpacingBetweenFrames };
}

function _isSameOrientation(iop1, iop2) {
  if (iop1 === undefined || iop2 === undefined) {
    return;
  }

  return (
    Math.abs(iop1[0] - iop2[0]) < iopTolerance &&
    Math.abs(iop1[1] - iop2[1]) < iopTolerance &&
    Math.abs(iop1[2] - iop2[2]) < iopTolerance &&
    Math.abs(iop1[3] - iop2[3]) < iopTolerance &&
    Math.abs(iop1[4] - iop2[4]) < iopTolerance &&
    Math.abs(iop1[5] - iop2[5]) < iopTolerance
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
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
}

const constructableModalities = ['MR', 'CT', 'PT', 'NM'];
const reconstructionIssues = {
  MISSING_FRAMES: 'missingframes',
  IRREGULAR_SPACING: 'irregularspacing',
};

export {
  hasPixelMeasurements,
  hasOrientation,
  hasPosition,
  isNMReconstructable,
  _isSameOrientation,
  _getSpacingIssue,
  _getPerpendicularDistance,
  reconstructionIssues,
  constructableModalities,
};
