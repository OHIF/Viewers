/**
 * Constants and configuration for SOP Class Handler
 * Extracted from getSopClassHandlerModule.tsx
 */

import { utils } from '@ohif/core';

const { sopClassDictionary } = utils;

// Volume loader schemes
export const DEFAULT_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingImageVolume';
export const DYNAMIC_VOLUME_LOADER_SCHEME = 'cornerstoneStreamingDynamicImageVolume';

// SOP Class Handler name
export const sopClassHandlerName = 'xnatSopClassHandler';

// Supported SOP Class UIDs - all imaging modalities and related SOP classes
export const sopClassUids = [
    // X-Ray imaging
    sopClassDictionary.ComputedRadiographyImageStorage,
    sopClassDictionary.DigitalXRayImageStorageForPresentation,
    sopClassDictionary.DigitalXRayImageStorageForProcessing,
    sopClassDictionary.DigitalMammographyXRayImageStorageForPresentation,
    sopClassDictionary.DigitalMammographyXRayImageStorageForProcessing,
    sopClassDictionary.DigitalIntraOralXRayImageStorageForPresentation,
    sopClassDictionary.DigitalIntraOralXRayImageStorageForProcessing,

    // CT imaging
    sopClassDictionary.CTImageStorage,
    sopClassDictionary.EnhancedCTImageStorage,
    sopClassDictionary.LegacyConvertedEnhancedCTImageStorage,

    // Ultrasound imaging
    sopClassDictionary.UltrasoundMultiframeImageStorage,
    sopClassDictionary.UltrasoundImageStorage,
    sopClassDictionary.UltrasoundImageStorageRET,

    // MR imaging
    sopClassDictionary.MRImageStorage,
    sopClassDictionary.EnhancedMRImageStorage,
    sopClassDictionary.EnhancedMRColorImageStorage,
    sopClassDictionary.LegacyConvertedEnhancedMRImageStorage,

    // Secondary capture
    sopClassDictionary.SecondaryCaptureImageStorage,
    sopClassDictionary.MultiframeSingleBitSecondaryCaptureImageStorage,
    sopClassDictionary.MultiframeGrayscaleByteSecondaryCaptureImageStorage,
    sopClassDictionary.MultiframeGrayscaleWordSecondaryCaptureImageStorage,
    sopClassDictionary.MultiframeTrueColorSecondaryCaptureImageStorage,

    // Angiography and fluoroscopy
    sopClassDictionary.XRayAngiographicImageStorage,
    sopClassDictionary.EnhancedXAImageStorage,
    sopClassDictionary.XRayRadiofluoroscopicImageStorage,
    sopClassDictionary.EnhancedXRFImageStorage,
    sopClassDictionary.XRay3DAngiographicImageStorage,
    sopClassDictionary.XRay3DCraniofacialImageStorage,

    // Breast imaging
    sopClassDictionary.BreastTomosynthesisImageStorage,
    sopClassDictionary.BreastProjectionXRayImageStorageForPresentation,
    sopClassDictionary.BreastProjectionXRayImageStorageForProcessing,

    // Optical coherence tomography
    sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForPresentation,
    sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForProcessing,

    // Ophthalmic imaging
    sopClassDictionary.OphthalmicPhotography8BitImageStorage,
    sopClassDictionary.OphthalmicPhotography16BitImageStorage,
    sopClassDictionary.OphthalmicPhotography16BitImageStorage,
    sopClassDictionary.OphthalmicTomographyImageStorage,

    // Microscopy
    sopClassDictionary.VLWholeSlideMicroscopyImageStorage,
    sopClassDictionary.VLSlideCoordinatesMicroscopicImageStorage,
    sopClassDictionary.VLPhotographicImageStorage,

    // Video imaging
    sopClassDictionary.VideoEndoscopicImageStorage,
    sopClassDictionary.VideoMicroscopicImageStorage,
    sopClassDictionary.VideoPhotographicImageStorage,

    // Nuclear medicine
    sopClassDictionary.NuclearMedicineImageStorage,
    sopClassDictionary.ParametricMapStorage,

    // Other SOP Classes that are not images but we are going to list them here
    // so we can discover them and show them in the series list
    sopClassDictionary.RTStructureSetStorage,
    sopClassDictionary.RTDoseStorage,
    sopClassDictionary.RTPlanStorage,
    sopClassDictionary.RTIonPlanStorage,
    sopClassDictionary.RTIonBeamsTreatmentRecordStorage,
    sopClassDictionary.RTBrachyTreatmentRecordStorage,
    sopClassDictionary.RTTreatmentSummaryRecordStorage,
    sopClassDictionary.ComprehensiveSRStorage,
    sopClassDictionary.Comprehensive3DSRStorage,
    sopClassDictionary.ExtensibleSRStorage,
    sopClassDictionary.LegacyEnhancedSRStorage,
    sopClassDictionary.EnhancedSRStorage,
    sopClassDictionary.PDFStorage,
    sopClassDictionary.SegmentationStorage,
    // to be added in future
    // sopClassDictionary.SurfaceSegmentationStorage,
];
