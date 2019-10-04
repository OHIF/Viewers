export default function isDisplaySetReconstructable(series, instances) {
  debugger;

  // Can't reconstruct if we only have one image.
  if (instances.length === 1) {
    return false;
  }

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
      return false;
    }
  }

  // Check if frame spacing is approximately equal within a tolerance.
  // TODO: Can we really do this when missing slices are really common?
  // - You probably still want to view the series if we have slices missing, but
  // - its impossible to tell the difference between missing slices and a multi
  // - slice thickness reconstruction (could check if the difference is a
  // multiple of the first to second frame slice spacing, but that is degenerate with
  // particular  )
  // Slicer throws a warning and still lets you open the scan, maybe we should do the same.
  if (instances.length > 2) {
    const firstIpp = _getImagePositionPatient(firstImage);
    const lastIpp = _getImagePositionPatient(instances[instances.length - 1]);
    const averageSpacingBetweenFrames =
      _getPerpindicularDistance(firstIpp, lastIpp) / (instances.length - 1);

    let previousIpp = firstIpp;

    for (let i = 1; i < instances.length; i++) {
      const instance = instances[i];
      const ipp = _getImagePositionPatient(instance);

      const spacingBetweenFrames = _getPerpindicularDistance(ipp, previousIpp);

      if (
        !_equalWithinTolerance(
          spacingBetweenFrames,
          averageSpacingBetweenFrames
        )
      ) {
        return false;
      }

      previousIpp = ipp;
    }
  }

  return true;
}

const tolerance = 0.1;

function _equalWithinTolerance(spacing, averageSpacing) {
  return a < b * (1 + tolerance) && a > b * (1 - tolerance);
  /*
  const equalWithinTolerance =
    a < b * (1 + tolerance) && a > b * (1 - tolerance);

  if (equalWithinTolerance) {
    return true;
  }

  const multipleOfAverageSpacing = (spacing/averageSpacing);

  return;
  */
}

function _getImagePositionPatient(instance) {
  return instance
    .getTagValue('x00200032')
    .split('\\')
    .map(element => Number(element));
}

function _getPerpindicularDistance(a, b) {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
      Math.pow(a[1] - b[1], 2) +
      Math.pow(a[2] - b[2], 2)
  );
}
