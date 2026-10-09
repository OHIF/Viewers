import { utils } from '@ohif/core';

const { isImage, sopClassDictionary } = utils;

/**
 * The SOP classes the stack SOP class handler claims.
 *
 * This is the handler's registration list AND the ownership test used by the
 * split rules, so the two can never disagree about which instances belong to
 * the stack path.  SOP classes with a dedicated extension (SEG, RT Structure
 * Set, Parametric Map, whole-slide, SR, PDF, ...) are deliberately absent —
 * their handlers claim them instead.
 */
export const STACK_SOP_CLASS_UIDS = [
  sopClassDictionary.ComputedRadiographyImageStorage,
  sopClassDictionary.DigitalXRayImageStorageForPresentation,
  sopClassDictionary.DigitalXRayImageStorageForProcessing,
  sopClassDictionary.DigitalMammographyXRayImageStorageForPresentation,
  sopClassDictionary.DigitalMammographyXRayImageStorageForProcessing,
  sopClassDictionary.DigitalIntraOralXRayImageStorageForPresentation,
  sopClassDictionary.DigitalIntraOralXRayImageStorageForProcessing,
  sopClassDictionary.CTImageStorage,
  sopClassDictionary.EnhancedCTImageStorage,
  sopClassDictionary.LegacyConvertedEnhancedCTImageStorage,
  sopClassDictionary.UltrasoundMultiframeImageStorage,
  sopClassDictionary.MRImageStorage,
  sopClassDictionary.EnhancedMRImageStorage,
  sopClassDictionary.EnhancedMRColorImageStorage,
  sopClassDictionary.LegacyConvertedEnhancedMRImageStorage,
  sopClassDictionary.UltrasoundImageStorage,
  sopClassDictionary.UltrasoundImageStorageRET,
  sopClassDictionary.SecondaryCaptureImageStorage,
  sopClassDictionary.MultiframeSingleBitSecondaryCaptureImageStorage,
  sopClassDictionary.MultiframeGrayscaleByteSecondaryCaptureImageStorage,
  sopClassDictionary.MultiframeGrayscaleWordSecondaryCaptureImageStorage,
  sopClassDictionary.MultiframeTrueColorSecondaryCaptureImageStorage,
  sopClassDictionary.XRayAngiographicImageStorage,
  sopClassDictionary.EnhancedXAImageStorage,
  sopClassDictionary.XRayRadiofluoroscopicImageStorage,
  sopClassDictionary.EnhancedXRFImageStorage,
  sopClassDictionary.XRay3DAngiographicImageStorage,
  sopClassDictionary.XRay3DCraniofacialImageStorage,
  sopClassDictionary.BreastTomosynthesisImageStorage,
  sopClassDictionary.CornealTopographyMapStorage,
  sopClassDictionary.BreastProjectionXRayImageStorageForPresentation,
  sopClassDictionary.BreastProjectionXRayImageStorageForProcessing,
  sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForPresentation,
  sopClassDictionary.IntravascularOpticalCoherenceTomographyImageStorageForProcessing,
  sopClassDictionary.NuclearMedicineImageStorage,
  sopClassDictionary.VLEndoscopicImageStorage,
  sopClassDictionary.VideoEndoscopicImageStorage,
  sopClassDictionary.VLMicroscopicImageStorage,
  sopClassDictionary.VideoMicroscopicImageStorage,
  sopClassDictionary.VLSlideCoordinatesMicroscopicImageStorage,
  sopClassDictionary.VLPhotographicImageStorage,
  sopClassDictionary.VideoPhotographicImageStorage,
  sopClassDictionary.OphthalmicPhotography8BitImageStorage,
  sopClassDictionary.OphthalmicPhotography16BitImageStorage,
  sopClassDictionary.OphthalmicTomographyImageStorage,
  // Handled by another sop class module
  // sopClassDictionary.VLWholeSlideMicroscopyImageStorage,
  sopClassDictionary.PositronEmissionTomographyImageStorage,
  sopClassDictionary.EnhancedPETImageStorage,
  sopClassDictionary.LegacyConvertedEnhancedPETImageStorage,
  sopClassDictionary.RTImageStorage,
  sopClassDictionary.EnhancedUSVolumeStorage,
  sopClassDictionary.RTDoseStorage,
];

// `UltrasoundImageStorageRET` has no entry in `sopClassDictionary`, so the
// registration list has always carried an `undefined` here. Filtering keeps an
// instance with no SOPClassUID from matching `isStackSopClass` by accident.
const STACK_SOP_CLASS_UID_SET = new Set(STACK_SOP_CLASS_UIDS.filter(Boolean));

/** Is this SOP class one the stack SOP class handler owns? */
export const isStackSopClass = (sopClassUID?: string): boolean =>
  !!sopClassUID && STACK_SOP_CLASS_UID_SET.has(sopClassUID);

/**
 * The legacy stack handler's instance gate, as a single predicate.
 *
 * The legacy path applies it in two stages: `DisplaySetService` routes a series
 * to the handler by SOP class, then `getDisplaySetsFromSeries` drops instances
 * that are neither a known image SOP class nor carry `Rows`.  Split rules run
 * BEFORE any SOP class routing, so they have to apply both stages themselves —
 * the SOP class check is what keeps them from claiming SEG / RT Dose / Parametric
 * Map instances, which carry `Rows` like any other multiframe image object.
 */
export const isStackHandledInstance = (instance: {
  SOPClassUID?: string;
  Rows?: unknown;
}): boolean =>
  isStackSopClass(instance.SOPClassUID) && (isImage(instance.SOPClassUID) || !!instance.Rows);
