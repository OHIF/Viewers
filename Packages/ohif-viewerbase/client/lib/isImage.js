import { sopClassDictionary } from './sopClassDictionary';

/**
 * Checks whether dicom files with specified SOP Class UID have image data
 * @param {string} sopClassUid - SOP Class UID to be checked
 * @returns {boolean} - true if it has image data
 */
export function isImage(sopClassUid) {
    if (sopClassUid === sopClassDictionary.ComputedRadiographyImageStorage
        || sopClassUid === sopClassDictionary.DigitalXRayImageStorageForPresentation
        || sopClassUid === sopClassDictionary.DigitalXRayImageStorageForProcessing
        || sopClassUid === sopClassDictionary.DigitalMammographyXRayImageStorageForPresentation
        || sopClassUid === sopClassDictionary.DigitalMammographyXRayImageStorageForProcessing
        || sopClassUid === sopClassDictionary.DigitalIntraOralXRayImageStorageForPresentation
        || sopClassUid === sopClassDictionary.DigitalIntraOralXRayImageStorageForProcessing
        || sopClassUid === sopClassDictionary.CTImageStorage
        || sopClassUid === sopClassDictionary.EnhancedCTImageStorage
        || sopClassUid === sopClassDictionary.LegacyConvertedEnhancedCTImageStorage
        || sopClassUid === sopClassDictionary.UltrasoundMultiframeImageStorage
        || sopClassUid === sopClassDictionary.MRImageStorage
        || sopClassUid === sopClassDictionary.EnhancedMRImageStorage
        || sopClassUid === sopClassDictionary.EnhancedMRColorImageStorage
        || sopClassUid === sopClassDictionary.LegacyConvertedEnhancedMRImageStorage
        || sopClassUid === sopClassDictionary.UltrasoundImageStorage
        || sopClassUid === sopClassDictionary.SecondaryCaptureImageStorage
        || sopClassUid === sopClassDictionary.MultiframeSingleBitSecondaryCaptureImageStorage
        || sopClassUid === sopClassDictionary.MultiframeGrayscaleByteSecondaryCaptureImageStorage
        || sopClassUid === sopClassDictionary.MultiframeGrayscaleWordSecondaryCaptureImageStorage
        || sopClassUid === sopClassDictionary.MultiframeTrueColorSecondaryCaptureImageStorage
        || sopClassUid === sopClassDictionary.XRayAngiographicImageStorage
        || sopClassUid === sopClassDictionary.EnhancedXAImageStorage
        || sopClassUid === sopClassDictionary.XRayRadiofluoroscopicImageStorage
        || sopClassUid === sopClassDictionary.EnhancedXRFImageStorage
        || sopClassUid === sopClassDictionary.XRay3DAngiographicImageStorage
        || sopClassUid === sopClassDictionary.XRay3DCraniofacialImageStorage
        || sopClassUid === sopClassDictionary.BreastTomosynthesisImageStorage
        || sopClassUid === sopClassDictionary.BreastProjectionXRayImageStorageForPresentation
        || sopClassUid === sopClassDictionary.BreastProjectionXRayImageStorageForProcessing
        || sopClassUid === sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForPresentation
        || sopClassUid === sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForProcessing
        || sopClassUid === sopClassDictionary.NuclearMedicineImageStorage
        || sopClassUid === sopClassDictionary.VLEndoscopicImageStorage
        || sopClassUid === sopClassDictionary.VideoEndoscopicImageStorage
        || sopClassUid === sopClassDictionary.VLMicroscopicImageStorage
        || sopClassUid === sopClassDictionary.VideoMicroscopicImageStorage
        || sopClassUid === sopClassDictionary.VLSlideCoordinatesMicroscopicImageStorage
        || sopClassUid === sopClassDictionary.VLPhotographicImageStorage
        || sopClassUid === sopClassDictionary.VideoPhotographicImageStorage
        || sopClassUid === sopClassDictionary.OphthalmicPhotography8BitImageStorage
        || sopClassUid === sopClassDictionary.OphthalmicPhotography16BitImageStorage
        || sopClassUid === sopClassDictionary.OphthalmicTomographyImageStorage
        || sopClassUid === sopClassDictionary.VLWholeSlideMicroscopyImageStorage
        || sopClassUid === sopClassDictionary.PositronEmissionTomographyImageStorage
        || sopClassUid === sopClassDictionary.EnhancedPETImageStorage
        || sopClassUid === sopClassDictionary.LegacyConvertedEnhancedPETImageStorage
        || sopClassUid === sopClassDictionary.RTImageStorage) {
        return true;
    }

    return false;
}
