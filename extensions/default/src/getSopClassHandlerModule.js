import { isImage } from '@ohif/core/src/utils/isImage';
import ImageSet from '@ohif/core/src/classes/ImageSet';
import isDisplaySetReconstructable from '@ohif/core/src/utils/isDisplaySetReconstructable';
import id from './id';

const sopClassHandlerName = 'stack';

const isMultiFrame = instance => {
  return instance.NumberOfFrames > 1;
};

const makeDisplaySet = instances => {
  const instance = instances[0];
  const imageSet = new ImageSet(instances);

  // set appropriate attributes to image set...
  imageSet.setAttributes({
    displaySetInstanceUID: imageSet.uid, // create a local alias for the imageSet UID
    SeriesDate: instance.SeriesDate,
    SeriesTime: instance.SeriesTime,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    StudyInstanceUID: instance.StudyInstanceUID,
    SeriesNumber: instance.SeriesNumber,
    FrameRate: instance.FrameTime,
    SeriesDescription: instance.SeriesDescription,
    Modality: instance.Modality,
    isMultiFrame: isMultiFrame(instance),
    numImageFrames: instances.length,
    SOPClassHandlerId: `${id}.sopClassHandlerModule.${sopClassHandlerName}`,
  });

  // Sort the images in this series if needed
  const shallSort = true; //!OHIF.utils.ObjectPath.get(Meteor, 'settings.public.ui.sortSeriesByIncomingOrder');
  if (shallSort) {
    imageSet.sortBy((a, b) => {
      // Sort by InstanceNumber (0020,0013)
      return (
        (parseInt(a.InstanceNumber) || 0) - (parseInt(b.InstanceNumber) || 0)
      );
    });
  }

  // Include the first image instance number (after sorted)
  /*imageSet.setAttribute(
    'instanceNumber',
    imageSet.getImage(0).InstanceNumber
  );*/

  /*const isReconstructable = isDisplaySetReconstructable(series, instances);

  imageSet.isReconstructable = isReconstructable.value;

  if (isReconstructable.missingFrames) {
    // TODO -> This is currently unused, but may be used for reconstructing
    // Volumes with gaps later on.
    imageSet.missingFrames = isReconstructable.missingFrames;
  }*/

  return imageSet;
};

const isSingleImageModality = modality => {
  return modality === 'CR' || modality === 'MG' || modality === 'DX';
};

function getSopClassUids(instances) {
  const uniqueSopClassUidsInSeries = new Set();
  instances.forEach(instance => {
    uniqueSopClassUidsInSeries.add(instance.SOPClassUID);
  });
  const sopClassUids = Array.from(uniqueSopClassUidsInSeries);

  return sopClassUids;
}

/**
 * Basic SOPClassHandler:
 * - For all Image types that are stackable, create
 *   a displaySet with a stack of images
 *
 * @param {Array} sopClassHandlerModules List of SOP Class Modules
 * @param {SeriesMetadata} series The series metadata object from which the display sets will be created
 * @returns {Array} The list of display sets created for the given series object
 */
function getDisplaySetsFromSeries(instances) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const displaySets = [];
  const sopClassUids = getSopClassUids(instances);

  // Search through the instances (InstanceMetadata object) of this series
  // Split Multi-frame instances and Single-image modalities
  // into their own specific display sets. Place the rest of each
  // series into another display set.
  const stackableInstances = [];
  instances.forEach(instance => {
    // All imaging modalities must have a valid value for sopClassUid (x00080016) or rows (x00280010)
    if (!isImage(instance.SOPClassUID) && !instance.Rows) {
      return;
    }

    let displaySet;

    if (isMultiFrame(instance)) {
      displaySet = makeDisplaySet([instance]);

      displaySet.setAttributes({
        sopClassUids,
        isClip: true,
        numImageFrames: instance.NumberOfFrames,
        instanceNumber: instance.InstanceNumber,
        acquisitionDatetime: instance.AcquisitionDateTime,
      });
      displaySets.push(displaySet);
    } else if (isSingleImageModality(instance.modality)) {
      displaySet = makeDisplaySet([instance]);
      displaySet.setAttributes({
        sopClassUids,
        instanceNumber: instance.InstanceNumber,
        acquisitionDatetime: instance.AcquisitionDateTime,
      });
      displaySets.push(displaySet);
    } else {
      stackableInstances.push(instance);
    }
  });

  if (stackableInstances.length) {
    const displaySet = makeDisplaySet(stackableInstances);
    displaySet.setAttribute('studyInstanceUid', instances[0].StudyInstanceUID);
    displaySet.setAttributes({
      sopClassUids,
    });
    displaySets.push(displaySet);
  }

  return displaySets;
}

// TODO: Remove since we have roughly the same thing in dcmjs
const sopClassDictionary = {
  ComputedRadiographyImageStorage: '1.2.840.10008.5.1.4.1.1.1',
  DigitalXRayImageStorageForPresentation: '1.2.840.10008.5.1.4.1.1.1.1',
  DigitalXRayImageStorageForProcessing: '1.2.840.10008.5.1.4.1.1.1.1.1',
  DigitalMammographyXRayImageStorageForPresentation:
    '1.2.840.10008.5.1.4.1.1.1.2',
  DigitalMammographyXRayImageStorageForProcessing:
    '1.2.840.10008.5.1.4.1.1.1.2.1',
  DigitalIntraOralXRayImageStorageForPresentation:
    '1.2.840.10008.5.1.4.1.1.1.3',
  DigitalIntraOralXRayImageStorageForProcessing:
    '1.2.840.10008.5.1.4.1.1.1.3.1',
  CTImageStorage: '1.2.840.10008.5.1.4.1.1.2',
  EnhancedCTImageStorage: '1.2.840.10008.5.1.4.1.1.2.1',
  LegacyConvertedEnhancedCTImageStorage: '1.2.840.10008.5.1.4.1.1.2.2',
  UltrasoundMultiframeImageStorage: '1.2.840.10008.5.1.4.1.1.3.1',
  MRImageStorage: '1.2.840.10008.5.1.4.1.1.4',
  EnhancedMRImageStorage: '1.2.840.10008.5.1.4.1.1.4.1',
  MRSpectroscopyStorage: '1.2.840.10008.5.1.4.1.1.4.2',
  EnhancedMRColorImageStorage: '1.2.840.10008.5.1.4.1.1.4.3',
  LegacyConvertedEnhancedMRImageStorage: '1.2.840.10008.5.1.4.1.1.4.4',
  UltrasoundImageStorage: '1.2.840.10008.5.1.4.1.1.6.1',
  EnhancedUSVolumeStorage: '1.2.840.10008.5.1.4.1.1.6.2',
  SecondaryCaptureImageStorage: '1.2.840.10008.5.1.4.1.1.7',
  MultiframeSingleBitSecondaryCaptureImageStorage:
    '1.2.840.10008.5.1.4.1.1.7.1',
  MultiframeGrayscaleByteSecondaryCaptureImageStorage:
    '1.2.840.10008.5.1.4.1.1.7.2',
  MultiframeGrayscaleWordSecondaryCaptureImageStorage:
    '1.2.840.10008.5.1.4.1.1.7.3',
  MultiframeTrueColorSecondaryCaptureImageStorage:
    '1.2.840.10008.5.1.4.1.1.7.4',
  Sop12LeadECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.1',
  GeneralECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.2',
  AmbulatoryECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.3',
  HemodynamicWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.2.1',
  CardiacElectrophysiologyWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.3.1',
  BasicVoiceAudioWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.4.1',
  GeneralAudioWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.4.2',
  ArterialPulseWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.5.1',
  RespiratoryWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.6.1',
  GrayscaleSoftcopyPresentationStateStorage: '1.2.840.10008.5.1.4.1.1.11.1',
  ColorSoftcopyPresentationStateStorage: '1.2.840.10008.5.1.4.1.1.11.2',
  PseudoColorSoftcopyPresentationStateStorage: '1.2.840.10008.5.1.4.1.1.11.3',
  BlendingSoftcopyPresentationStateStorage: '1.2.840.10008.5.1.4.1.1.11.4',
  XAXRFGrayscaleSoftcopyPresentationStateStorage:
    '1.2.840.10008.5.1.4.1.1.11.5',
  XRayAngiographicImageStorage: '1.2.840.10008.5.1.4.1.1.12.1',
  EnhancedXAImageStorage: '1.2.840.10008.5.1.4.1.1.12.1.1',
  XRayRadiofluoroscopicImageStorage: '1.2.840.10008.5.1.4.1.1.12.2',
  EnhancedXRFImageStorage: '1.2.840.10008.5.1.4.1.1.12.2.1',
  XRay3DAngiographicImageStorage: '1.2.840.10008.5.1.4.1.1.13.1.1',
  XRay3DCraniofacialImageStorage: '1.2.840.10008.5.1.4.1.1.13.1.2',
  BreastTomosynthesisImageStorage: '1.2.840.10008.5.1.4.1.1.13.1.3',
  BreastProjectionXRayImageStorageForPresentation:
    '1.2.840.10008.5.1.4.1.1.13.1.4',
  BreastProjectionXRayImageStorageForProcessing:
    '1.2.840.10008.5.1.4.1.1.13.1.5',
  IntravascularOpticalCoherenceTomographyImageStorageForPresentation:
    '1.2.840.10008.5.1.4.1.1.14.1',
  IntravascularOpticalCoherenceTomographyImageStorageForProcessing:
    '1.2.840.10008.5.1.4.1.1.14.2',
  NuclearMedicineImageStorage: '1.2.840.10008.5.1.4.1.1.20',
  RawDataStorage: '1.2.840.10008.5.1.4.1.1.66',
  SpatialRegistrationStorage: '1.2.840.10008.5.1.4.1.1.66.1',
  SpatialFiducialsStorage: '1.2.840.10008.5.1.4.1.1.66.2',
  DeformableSpatialRegistrationStorage: '1.2.840.10008.5.1.4.1.1.66.3',
  SegmentationStorage: '1.2.840.10008.5.1.4.1.1.66.4',
  SurfaceSegmentationStorage: '1.2.840.10008.5.1.4.1.1.66.5',
  RealWorldValueMappingStorage: '1.2.840.10008.5.1.4.1.1.67',
  SurfaceScanMeshStorage: '1.2.840.10008.5.1.4.1.1.68.1',
  SurfaceScanPointCloudStorage: '1.2.840.10008.5.1.4.1.1.68.2',
  VLEndoscopicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.1',
  VideoEndoscopicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.1.1',
  VLMicroscopicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.2',
  VideoMicroscopicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.2.1',
  VLSlideCoordinatesMicroscopicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.3',
  VLPhotographicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.4',
  VideoPhotographicImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.4.1',
  OphthalmicPhotography8BitImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.5.1',
  OphthalmicPhotography16BitImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.5.2',
  StereometricRelationshipStorage: '1.2.840.10008.5.1.4.1.1.77.1.5.3',
  OphthalmicTomographyImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.5.4',
  VLWholeSlideMicroscopyImageStorage: '1.2.840.10008.5.1.4.1.1.77.1.6',
  LensometryMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.1',
  AutorefractionMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.2',
  KeratometryMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.3',
  SubjectiveRefractionMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.4',
  VisualAcuityMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.5',
  SpectaclePrescriptionReportStorage: '1.2.840.10008.5.1.4.1.1.78.6',
  OphthalmicAxialMeasurementsStorage: '1.2.840.10008.5.1.4.1.1.78.7',
  IntraocularLensCalculationsStorage: '1.2.840.10008.5.1.4.1.1.78.8',
  MacularGridThicknessandVolumeReport: '1.2.840.10008.5.1.4.1.1.79.1',
  OphthalmicVisualFieldStaticPerimetryMeasurementsStorage:
    '1.2.840.10008.5.1.4.1.1.80.1',
  OphthalmicThicknessMapStorage: '1.2.840.10008.5.1.4.1.1.81.1',
  CornealTopographyMapStorage: '1.2.840.10008.5.1.4.1.1.82.1',
  BasicTextSR: '1.2.840.10008.5.1.4.1.1.88.11',
  EnhancedSR: '1.2.840.10008.5.1.4.1.1.88.22',
  ComprehensiveSR: '1.2.840.10008.5.1.4.1.1.88.33',
  Comprehensive3DSR: '1.2.840.10008.5.1.4.1.1.88.34',
  ProcedureLog: '1.2.840.10008.5.1.4.1.1.88.40',
  MammographyCADSR: '1.2.840.10008.5.1.4.1.1.88.50',
  KeyObjectSelection: '1.2.840.10008.5.1.4.1.1.88.59',
  ChestCADSR: '1.2.840.10008.5.1.4.1.1.88.65',
  XRayRadiationDoseSR: '1.2.840.10008.5.1.4.1.1.88.67',
  RadiopharmaceuticalRadiationDoseSR: '1.2.840.10008.5.1.4.1.1.88.68',
  ColonCADSR: '1.2.840.10008.5.1.4.1.1.88.69',
  ImplantationPlanSRDocumentStorage: '1.2.840.10008.5.1.4.1.1.88.70',
  EncapsulatedPDFStorage: '1.2.840.10008.5.1.4.1.1.104.1',
  EncapsulatedCDAStorage: '1.2.840.10008.5.1.4.1.1.104.2',
  PositronEmissionTomographyImageStorage: '1.2.840.10008.5.1.4.1.1.128',
  EnhancedPETImageStorage: '1.2.840.10008.5.1.4.1.1.130',
  LegacyConvertedEnhancedPETImageStorage: '1.2.840.10008.5.1.4.1.1.128.1',
  BasicStructuredDisplayStorage: '1.2.840.10008.5.1.4.1.1.131',
  RTImageStorage: '1.2.840.10008.5.1.4.1.1.481.1',
  RTDoseStorage: '1.2.840.10008.5.1.4.1.1.481.2',
  RTStructureSetStorage: '1.2.840.10008.5.1.4.1.1.481.3',
  RTBeamsTreatmentRecordStorage: '1.2.840.10008.5.1.4.1.1.481.4',
  RTPlanStorage: '1.2.840.10008.5.1.4.1.1.481.5',
  RTBrachyTreatmentRecordStorage: '1.2.840.10008.5.1.4.1.1.481.6',
  RTTreatmentSummaryRecordStorage: '1.2.840.10008.5.1.4.1.1.481.7',
  RTIonPlanStorage: '1.2.840.10008.5.1.4.1.1.481.8',
  RTIonBeamsTreatmentRecordStorage: '1.2.840.10008.5.1.4.1.1.481.9',
  RTBeamsDeliveryInstructionStorage: '1.2.840.10008.5.1.4.34.7',
  GenericImplantTemplateStorage: '1.2.840.10008.5.1.4.43.1',
  ImplantAssemblyTemplateStorage: '1.2.840.10008.5.1.4.44.1',
  ImplantTemplateGroupStorage: '1.2.840.10008.5.1.4.45.1',
};

const sopClassUids = [
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
  sopClassDictionary.VLWholeSlideMicroscopyImageStorage,
  sopClassDictionary.PositronEmissionTomographyImageStorage,
  sopClassDictionary.EnhancedPETImageStorage,
  sopClassDictionary.LegacyConvertedEnhancedPETImageStorage,
  sopClassDictionary.RTImageStorage,
];

function getSopClassHandlerModule() {
  return [
    {
      name: sopClassHandlerName,
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}

export default getSopClassHandlerModule;
