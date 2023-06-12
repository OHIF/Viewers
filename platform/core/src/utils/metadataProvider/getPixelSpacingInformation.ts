import CalibrationTypes from './CalibrationTypes';
import log from '../../log';

let logOnce = true;

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

export default function getPixelSpacingInformation(instance) {
  // See http://gdcm.sourceforge.net/wiki/index.php/Imager_Pixel_Spacing

  // TODO: Add manual calibration

  const {
    PixelSpacing: pixelSpacing,
    ImagerPixelSpacing,
    SOPClassUID,
    PixelSpacingCalibrationType,
    PixelSpacingCalibrationDescription,
    EstimatedRadiographicMagnificationFactor,
    SequenceOfUltrasoundRegions,
  } = instance;
  const isProjection = projectionRadiographSOPClassUIDs.includes(SOPClassUID);

  if (isProjection && !ImagerPixelSpacing) {
    // If only Pixel Spacing is present, and this is a projection radiograph,
    // PixelSpacing should be used, but the user should be informed that
    // what it means is unknown
    return {
      pixelSpacing,
      type: CalibrationTypes.UNKNOWN,
      isProjection,
    };
  } else if (
    pixelSpacing &&
    ImagerPixelSpacing &&
    pixelSpacing === ImagerPixelSpacing
  ) {
    // If Imager Pixel Spacing and Pixel Spacing are present and they have the same values,
    // then the user should be informed that the measurements are at the detector plane
    return {
      pixelSpacing,
      type: CalibrationTypes.PROJECTION,
      isProjection,
    };
  } else if (
    pixelSpacing &&
    ImagerPixelSpacing &&
    pixelSpacing !== ImagerPixelSpacing
  ) {
    // If Imager Pixel Spacing and Pixel Spacing are present and they have different values,
    // then the user should be informed that these are "calibrated"
    // (in some unknown manner if Pixel Spacing Calibration Type and/or
    // Pixel Spacing Calibration Description are absent)
    return {
      pixelSpacing,
      type: CalibrationTypes.ERMF,
      isProjection,
      PixelSpacingCalibrationType,
      PixelSpacingCalibrationDescription,
    };
  } else if (!pixelSpacing && ImagerPixelSpacing) {
    let CorrectedImagerPixelSpacing = ImagerPixelSpacing;
    if (EstimatedRadiographicMagnificationFactor) {
      // Note that in IHE Mammo profile compliant displays, the value of Imager Pixel Spacing is required to be corrected by
      // Estimated Radiographic Magnification Factor and the user informed of that.
      // TODO: should this correction be done before all of this logic?
      CorrectedImagerPixelSpacing = ImagerPixelSpacing.map(
        pixelSpacing => pixelSpacing / EstimatedRadiographicMagnificationFactor
      );
    } else {
      if (logOnce) {
        log.info(
          'EstimatedRadiographicMagnificationFactor was not present. Unable to correct ImagerPixelSpacing.'
        );
        logOnce = false;
      }
    }

    return {
      pixelSpacing: CorrectedImagerPixelSpacing,
      isProjection,
      type: CalibrationTypes.ERMF,
    };
  } else if (SequenceOfUltrasoundRegions) {
    const { PhysicalDeltaX, PhysicalDeltaY } = SequenceOfUltrasoundRegions[0];
    const USPixelSpacing = [PhysicalDeltaX * 10, PhysicalDeltaY * 10];

    return {
      pixelSpacing: USPixelSpacing,
      type: CalibrationTypes.REGION,
      sequenceOfUltrasoundRegions: SequenceOfUltrasoundRegions,
    };
  } else if (isProjection === false && !ImagerPixelSpacing) {
    // If only Pixel Spacing is present, and this is not a projection radiograph,
    // we can stop here
    return {
      pixelSpacing,
      type: CalibrationTypes.NOT_APPLICABLE,
      isProjection,
    };
  }

  log.info(
    'Unknown combination of PixelSpacing and ImagerPixelSpacing identified. Unable to determine spacing.'
  );
  return {
    pixelSpacing,
    type: CalibrationTypes.ERROR,
  };
}
