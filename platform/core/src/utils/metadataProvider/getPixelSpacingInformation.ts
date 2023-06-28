import CalibrationTypes from './CalibrationTypes';

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

const differentErmf = (ermf1, ermf2) =>
  ermf1 > 1 && ermf2 > 1 && Math.abs(ermf1 - ermf2) > 0.0005;

const calculateErmfSpacing = (pixelSpacing, imagerSpacing) => {
  if (!pixelSpacing || !imagerSpacing) return null;
  const ermf = imagerSpacing[0] / pixelSpacing[0];
  return ermf > 1.01 ? ermf : null;
};

const calculateErmfDistance = (sid, sod) => (sid > sod ? sid / sod : null);

export default function getPixelSpacingInformation(instance) {
  // See http://gdcm.sourceforge.net/wiki/index.php/Imager_Pixel_Spacing

  // TODO: Add manual calibration

  const {
    PixelSpacing: pixelSpacing,
    ImagerPixelSpacing,
    SOPClassUID,
    EstimatedRadiographicMagnificationFactor: ermfValue,
    DistanceSourceToPatient,
    DistanceSourceToDetector,
    SequenceOfUltrasoundRegions,
  } = instance;
  const isProjection = projectionRadiographSOPClassUIDs.includes(SOPClassUID);

  if (isProjection) {
    if (!ImagerPixelSpacing) {
      // If only Pixel Spacing is present, and this is a projection radiograph,
      // PixelSpacing should be used, but the user should be informed that
      // what it means is unknown
      return {
        pixelSpacing,
        type: CalibrationTypes.UNKNOWN,
        isProjection,
      };
    }

    const ermfSpacing = calculateErmfSpacing(pixelSpacing, ImagerPixelSpacing);
    const ermfDistance = calculateErmfDistance(
      DistanceSourceToDetector,
      DistanceSourceToPatient
    );
    if (
      differentErmf(ermfSpacing, ermfDistance) ||
      differentErmf(ermfSpacing, ermfValue) ||
      differentErmf(ermfDistance, ermfValue)
    ) {
      const message = `ERMF calculations differ: spacing ${ermfSpacing} distance ${ermfDistance} value ${ermfValue}`;
      console.warn(message);
      return {
        pixelSpacing: ImagerPixelSpacing || pixelSpacing,
        type: CalibrationTypes.ERROR,
        message,
      };
    }

    const scale = ermfSpacing || ermfValue || ermfDistance;
    if (scale > 1.01) {
      return {
        pixelSpacing: ImagerPixelSpacing.map(it => it / scale),
        scale,
        type: CalibrationTypes.ERMF,
      };
    }

    // If Imager Pixel Spacing and Pixel Spacing are present and they have the same values,
    // then the user should be informed that the measurements are at the detector plane
    return {
      pixelSpacing: pixelSpacing || ImagerPixelSpacing,
      type: CalibrationTypes.PROJECTION,
      isProjection,
    };
  }

  if (SequenceOfUltrasoundRegions) {
    const { PhysicalDeltaX, PhysicalDeltaY } = SequenceOfUltrasoundRegions[0];
    const USPixelSpacing = [PhysicalDeltaX * 10, PhysicalDeltaY * 10];

    return {
      pixelSpacing: USPixelSpacing,
      type: CalibrationTypes.REGION,
      sequenceOfUltrasoundRegions: SequenceOfUltrasoundRegions,
    };
  }
  // If only Pixel Spacing is present, and this is not a projection radiograph,
  // we can stop here
  return {
    pixelSpacing,
    type: CalibrationTypes.NOT_APPLICABLE,
    isProjection,
  };
}
