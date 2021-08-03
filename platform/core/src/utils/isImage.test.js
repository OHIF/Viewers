import { sopClassDictionary } from './sopClassDictionary';
import { isImage } from './isImage';

describe('isImage', () => {
  test('should return true when the image is of type sopClassDictionary.ComputedRadiographyImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.ComputedRadiographyImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.DigitalXRayImageStorageForPresentation', () => {
    const isImageStatus = isImage(
      sopClassDictionary.DigitalXRayImageStorageForPresentation
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.DigitalXRayImageStorageForProcessing', () => {
    const isImageStatus = isImage(
      sopClassDictionary.DigitalXRayImageStorageForProcessing
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.DigitalMammographyXRayImageStorageForPresentation', () => {
    const isImageStatus = isImage(
      sopClassDictionary.DigitalMammographyXRayImageStorageForPresentation
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.DigitalMammographyXRayImageStorageForProcessing', () => {
    const isImageStatus = isImage(
      sopClassDictionary.DigitalMammographyXRayImageStorageForProcessing
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.DigitalIntraOralXRayImageStorageForPresentation', () => {
    const isImageStatus = isImage(
      sopClassDictionary.DigitalIntraOralXRayImageStorageForPresentation
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.DigitalIntraOralXRayImageStorageForProcessing', () => {
    const isImageStatus = isImage(
      sopClassDictionary.DigitalIntraOralXRayImageStorageForProcessing
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.CTImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.CTImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.EnhancedCTImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.EnhancedCTImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.LegacyConvertedEnhancedCTImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.LegacyConvertedEnhancedCTImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.UltrasoundMultiframeImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.UltrasoundMultiframeImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.MRImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.MRImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.EnhancedMRImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.EnhancedMRImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.EnhancedMRColorImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.EnhancedMRColorImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.LegacyConvertedEnhancedMRImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.LegacyConvertedEnhancedMRImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.UltrasoundImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.UltrasoundImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.SecondaryCaptureImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.SecondaryCaptureImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.MultiframeSingleBitSecondaryCaptureImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.MultiframeSingleBitSecondaryCaptureImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.MultiframeGrayscaleByteSecondaryCaptureImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.MultiframeGrayscaleByteSecondaryCaptureImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.MultiframeGrayscaleWordSecondaryCaptureImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.MultiframeGrayscaleWordSecondaryCaptureImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.MultiframeTrueColorSecondaryCaptureImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.MultiframeTrueColorSecondaryCaptureImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.XRayAngiographicImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.XRayAngiographicImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.EnhancedXAImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.EnhancedXAImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.XRayRadiofluoroscopicImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.XRayRadiofluoroscopicImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.EnhancedXRFImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.EnhancedXRFImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.XRay3DAngiographicImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.XRay3DAngiographicImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.XRay3DCraniofacialImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.XRay3DCraniofacialImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.BreastTomosynthesisImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.BreastTomosynthesisImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.BreastProjectionXRayImageStorageForPresentation', () => {
    const isImageStatus = isImage(
      sopClassDictionary.BreastProjectionXRayImageStorageForPresentation
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.BreastProjectionXRayImageStorageForProcessing', () => {
    const isImageStatus = isImage(
      sopClassDictionary.BreastProjectionXRayImageStorageForProcessing
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForPresentation', () => {
    const isImageStatus = isImage(
      sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForPresentation
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForProcessing', () => {
    const isImageStatus = isImage(
      sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForProcessing
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.NuclearMedicineImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.NuclearMedicineImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.VLEndoscopicImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.VLEndoscopicImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.VideoEndoscopicImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.VideoEndoscopicImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.VLMicroscopicImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.VLMicroscopicImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.VideoMicroscopicImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.VideoMicroscopicImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.VLSlideCoordinatesMicroscopicImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.VLSlideCoordinatesMicroscopicImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.VLPhotographicImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.VLPhotographicImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.VideoPhotographicImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.VideoPhotographicImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.OphthalmicPhotography8BitImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.OphthalmicPhotography8BitImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.OphthalmicPhotography16BitImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.OphthalmicPhotography16BitImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.OphthalmicTomographyImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.OphthalmicTomographyImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.VLWholeSlideMicroscopyImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.VLWholeSlideMicroscopyImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.PositronEmissionTomographyImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.PositronEmissionTomographyImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.EnhancedPETImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.EnhancedPETImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.LegacyConvertedEnhancedPETImageStorage', () => {
    const isImageStatus = isImage(
      sopClassDictionary.LegacyConvertedEnhancedPETImageStorage
    );
    expect(isImageStatus).toBe(true);
  });

  test('should return true when the image is of type sopClassDictionary.RTImageStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.RTImageStorage);
    expect(isImageStatus).toBe(true);
  });

  test('should return false when the image is of type sopClassDictionary.SpatialFiducialsStorage', () => {
    const isImageStatus = isImage(sopClassDictionary.SpatialFiducialsStorage);
    expect(isImageStatus).toBe(false);
  });

  test('should return false when the image is undefined', () => {
    const isImageStatus = isImage(undefined);
    expect(isImageStatus).toBe(false);
  });

  test('should return false when the image is null', () => {
    const isImageStatus = isImage(null);
    expect(isImageStatus).toBe(false);
  });
});
