import log from '../../log';

export default function getPixelSpacingInformation(instance) {
  // See http://gdcm.sourceforge.net/wiki/index.php/Imager_Pixel_Spacing

  // TODO: Add manual calibration

  // TODO: Use ENUMS from dcmjs
  const projectionRadiographSOPClassUIDs = [
    '1.2.840.10008.5.1.4.1.1.1', //	CR Image Storage
    '1.2.840.10008.5.1.4.1.1.1.1', //	Digital X-Ray Image Storage – for Presentation
    '1.2.840.10008.5.1.4.1.1.1.1.1', //	Digital X-Ray Image Storage – for Processing
    '1.2.840.10008.5.1.4.1.1.1.2', //	Digital Mammography X-Ray Image Storage – for Presentation
    '1.2.840.10008.5.1.4.1.1.1.2.1', //	Digital Mammography X-Ray Image Storage – for Processing
    '1.2.840.10008.5.1.4.1.1.1.3', //	Digital Intra – oral X-Ray Image Storage – for Presentation
    '1.2.840.10008.5.1.4.1.1.1.3.1', //	Digital Intra – oral X-Ray Image Storage – for Processing
    '1.2.840.10008.5.1.4.1.1.12.1', //	X-Ray Angiographic Image Storage
    '1.2.840.10008.5.1.4.1.1.12.1.1', //	Enhanced XA Image Storage
    '1.2.840.10008.5.1.4.1.1.12.2', //	X-Ray Radiofluoroscopic Image Storage
    '1.2.840.10008.5.1.4.1.1.12.2.1', //	Enhanced XRF Image Storage
    '1.2.840.10008.5.1.4.1.1.12.3', // X-Ray Angiographic Bi-plane Image Storage	Retired
  ];

  const {
    PixelSpacing,
    ImagerPixelSpacing,
    SOPClassUID,
    PixelSpacingCalibrationType,
    PixelSpacingCalibrationDescription,
    EstimatedRadiographicMagnificationFactor,
  } = instance;
  const isProjection = projectionRadiographSOPClassUIDs.includes(SOPClassUID);

  const TYPES = {
    NOT_APPLICABLE: 'NOT_APPLICABLE',
    UNKNOWN: 'UNKNOWN',
    CALIBRATED: 'CALIBRATED',
    DETECTOR: 'DETECTOR',
  };

  if (isProjection && !ImagerPixelSpacing) {
    // If only Pixel Spacing is present, and this is a projection radiograph,
    // PixelSpacing should be used, but the user should be informed that
    // what it means is unknown
    return {
      PixelSpacing,
      type: TYPES.UNKNOWN,
      isProjection,
    };
  } else if (PixelSpacing && ImagerPixelSpacing && PixelSpacing === ImagerPixelSpacing) {
    // If Imager Pixel Spacing and Pixel Spacing are present and they have the same values,
    // then the user should be informed that the measurements are at the detector plane
    return {
      PixelSpacing,
      type: TYPES.DETECTOR,
      isProjection,
    };
  } else if (PixelSpacing && ImagerPixelSpacing && PixelSpacing !== ImagerPixelSpacing) {
    // If Imager Pixel Spacing and Pixel Spacing are present and they have different values,
    // then the user should be informed that these are "calibrated"
    // (in some unknown manner if Pixel Spacing Calibration Type and/or
    // Pixel Spacing Calibration Description are absent)
    return {
      PixelSpacing,
      type: TYPES.CALIBRATED,
      isProjection,
      PixelSpacingCalibrationType,
      PixelSpacingCalibrationDescription,
    };
  } else if (!PixelSpacing && ImagerPixelSpacing) {
    let CorrectedImagerPixelSpacing = ImagerPixelSpacing;
    if (EstimatedRadiographicMagnificationFactor) {
      // Note that in IHE Mammo profile compliant displays, the value of Imager Pixel Spacing is required to be corrected by
      // Estimated Radiographic Magnification Factor and the user informed of that.
      // TODO: should this correction be done before all of this logic?
      CorrectedImagerPixelSpacing = ImagerPixelSpacing.map(
        pixelSpacing => pixelSpacing / EstimatedRadiographicMagnificationFactor
      );
    } else {
      if (!instance._loggedSpacingMessage) {
        log.info(
          'EstimatedRadiographicMagnificationFactor was not present. Unable to correct ImagerPixelSpacing.'
        );
        instance._loggedSpacingMessage = true;
      }
    }

    return {
      PixelSpacing: CorrectedImagerPixelSpacing,
      isProjection,
    };
  } else if (isProjection === false && !ImagerPixelSpacing) {
    // If only Pixel Spacing is present, and this is not a projection radiograph,
    // we can stop here
    return {
      PixelSpacing,
      type: TYPES.NOT_APPLICABLE,
      isProjection,
    };
  }

  log.info(
    'Unknown combination of PixelSpacing and ImagerPixelSpacing identified. Unable to determine spacing.'
  );
}
