import { sopClassDictionary } from './sopClassDictionary';
import { isImage } from './isImage';

/**
 * Naturalize SOP Class UID which do not have image data
 * @param {string} SOPClassUID - SOP Class UID to be converted
 * @returns {string} - human readable name
 */
export const naturalizeSOPClassUID = SOPClassUID => {
  let naturalizedName = '';
  if (!SOPClassUID) return naturalizedName;
  if (!isImage) return naturalizedName;

  if (sopClassDictionary.MRSpectroscopyStorage === SOPClassUID) {
    naturalizedName = 'MRSpectroscopy';
  } else if (sopClassDictionary.EnhancedUSVolumeStorage === SOPClassUID) {
    naturalizedName = 'EnhancedUSVolume';
  } else if (sopClassDictionary.Sop12LeadECGWaveformStorage === SOPClassUID) {
    naturalizedName = 'Sop12LeadECGWaveform';
  } else if (sopClassDictionary.GeneralECGWaveformStorage === SOPClassUID) {
    naturalizedName = 'GeneralECGWaveform';
  } else if (sopClassDictionary.AmbulatoryECGWaveformStorage === SOPClassUID) {
    naturalizedName = 'AECAmbulatoryECGWaveformGW';
  } else if (sopClassDictionary.HemodynamicWaveformStorage === SOPClassUID) {
    naturalizedName = 'HemodynamicWaveform';
  } else if (
    sopClassDictionary.CardiacElectrophysiologyWaveformStorage === SOPClassUID
  ) {
    naturalizedName = 'CardiacElectrophysiologyWaveform';
  } else if (
    sopClassDictionary.BasicVoiceAudioWaveformStorage === SOPClassUID
  ) {
    naturalizedName = 'BasicVoiceAudioWaveform';
  } else if (sopClassDictionary.GeneralAudioWaveformStorage === SOPClassUID) {
    naturalizedName = 'GGeneralAudioWaveformAW';
  } else if (sopClassDictionary.ArterialPulseWaveformStorage === SOPClassUID) {
    naturalizedName = 'APArterialPulseWaveformW';
  } else if (sopClassDictionary.RespiratoryWaveformStorage === SOPClassUID) {
    naturalizedName = 'RespiratoryWaveform';
  } else if (
    sopClassDictionary.GrayscaleSoftcopyPresentationStateStorage === SOPClassUID
  ) {
    naturalizedName = 'GrayscaleSoftcopyPresentationState';
  } else if (
    sopClassDictionary.ColorSoftcopyPresentationStateStorage === SOPClassUID
  ) {
    naturalizedName = 'ColorSoftcopyPresentationState';
  } else if (
    sopClassDictionary.PseudoColorSoftcopyPresentationStateStorage ===
    SOPClassUID
  ) {
    naturalizedName = 'PseudoColorSoftcopyPresentationState';
  } else if (
    sopClassDictionary.BlendingSoftcopyPresentationStateStorage === SOPClassUID
  ) {
    naturalizedName = 'BlendingSoftcopyPresentationState';
  } else if (
    sopClassDictionary.XAXRFGrayscaleSoftcopyPresentationStateStorage ===
    SOPClassUID
  ) {
    naturalizedName = 'XAXRFGrayscaleSoftcopyPresentationState';
  } else if (sopClassDictionary.RawDataStorage === SOPClassUID) {
    naturalizedName = 'RawData';
  } else if (sopClassDictionary.SpatialRegistrationStorage === SOPClassUID) {
    naturalizedName = 'SpatialRegistration';
  } else if (sopClassDictionary.SpatialFiducialsStorage === SOPClassUID) {
    naturalizedName = 'SpatialFiducials';
  } else if (
    sopClassDictionary.DeformableSpatialRegistrationStorage === SOPClassUID
  ) {
    naturalizedName = 'DeformableSpatialRegistration';
  } else if (sopClassDictionary.SegmentationStorage === SOPClassUID) {
    naturalizedName = 'SEG';
  } else if (sopClassDictionary.SurfaceSegmentationStorage === SOPClassUID) {
    naturalizedName = 'SurfaceSEG';
  } else if (sopClassDictionary.RealWorldValueMappingStorage === SOPClassUID) {
    naturalizedName = 'RealWorldValueMapping';
  } else if (sopClassDictionary.SurfaceScanMeshStorage === SOPClassUID) {
    naturalizedName = 'SurfaceScanMesh';
  } else if (sopClassDictionary.SurfaceScanPointCloudStorage === SOPClassUID) {
    naturalizedName = 'SurfaceScanPointCloud';
  } else if (
    sopClassDictionary.StereometricRelationshipStorage === SOPClassUID
  ) {
    naturalizedName = 'StereometricRelationship';
  } else if (sopClassDictionary.LensometryMeasurementsStorage === SOPClassUID) {
    naturalizedName = 'LensometryMeasurements';
  } else if (
    sopClassDictionary.AutorefractionMeasurementsStorage === SOPClassUID
  ) {
    naturalizedName = 'AutorefractionMeasurements';
  } else if (
    sopClassDictionary.KeratometryMeasurementsStorage === SOPClassUID
  ) {
    naturalizedName = 'KeratometryMeasurements';
  } else if (
    sopClassDictionary.SubjectiveRefractionMeasurementsStorage === SOPClassUID
  ) {
    naturalizedName = 'SubjectiveRefractionMeasurements';
  } else if (
    sopClassDictionary.VisualAcuityMeasurementsStorage === SOPClassUID
  ) {
    naturalizedName = 'VisualAcuityMeasurements';
  } else if (
    sopClassDictionary.SpectaclePrescriptionReportStorage === SOPClassUID
  ) {
    naturalizedName = 'SpectaclePrescriptionReport';
  } else if (
    sopClassDictionary.OphthalmicAxialMeasurementsStorage === SOPClassUID
  ) {
    naturalizedName = 'OphthalmicAxialMeasurements';
  } else if (
    sopClassDictionary.IntraocularLensCalculationsStorage === SOPClassUID
  ) {
    naturalizedName = 'IntraocularLensCalculations';
  } else if (
    sopClassDictionary.MacularGridThicknessandVolumeReport === SOPClassUID
  ) {
    naturalizedName = 'MacularGridThicknessandVolume';
  } else if (
    sopClassDictionary.OphthalmicVisualFieldStaticPerimetryMeasurementsStorage ===
    SOPClassUID
  ) {
    naturalizedName = 'OphthalmicVisualFieldStaticPerimetryMeasurements';
  } else if (sopClassDictionary.OphthalmicThicknessMapStorage === SOPClassUID) {
    naturalizedName = 'OphthalmicThicknessMap';
  } else if (sopClassDictionary.CornealTopographyMapStorage === SOPClassUID) {
    naturalizedName = 'CornealTopographyMap';
  } else if (sopClassDictionary.BasicTextSR === SOPClassUID) {
    naturalizedName = 'BasicTextSR';
  } else if (sopClassDictionary.EnhancedSR === SOPClassUID) {
    naturalizedName = 'EnhancedSR';
  } else if (sopClassDictionary.ComprehensiveSR === SOPClassUID) {
    naturalizedName = 'ComprehensiveSR';
  } else if (sopClassDictionary.Comprehensive3DSR === SOPClassUID) {
    naturalizedName = 'Comprehensive3DSR';
  } else if (sopClassDictionary.ProcedureLog === SOPClassUID) {
    naturalizedName = 'ProcedureLog';
  } else if (sopClassDictionary.MammographyCADSR === SOPClassUID) {
    naturalizedName = 'MammographyCADSR';
  } else if (sopClassDictionary.KeyObjectSelection === SOPClassUID) {
    naturalizedName = 'KeyObject';
  } else if (sopClassDictionary.ChestCADSR === SOPClassUID) {
    naturalizedName = 'ChestCADSR';
  } else if (sopClassDictionary.XRayRadiationDoseSR === SOPClassUID) {
    naturalizedName = 'XRayRadiationDoseSR';
  } else if (
    sopClassDictionary.RadiopharmaceuticalRadiationDoseSR === SOPClassUID
  ) {
    naturalizedName = 'RadiopharmaceuticalRadiationDoseSR';
  } else if (sopClassDictionary.ColonCADSR === SOPClassUID) {
    naturalizedName = 'ColonCADSR';
  } else if (
    sopClassDictionary.ImplantationPlanSRDocumentStorage === SOPClassUID
  ) {
    naturalizedName = 'ImplantationPlanSRDocument';
  } else if (sopClassDictionary.EncapsulatedPDFStorage === SOPClassUID) {
    naturalizedName = 'EncapsulatedPDF';
  } else if (sopClassDictionary.EncapsulatedCDAStorage === SOPClassUID) {
    naturalizedName = 'EncapsulatedCDA';
  } else if (sopClassDictionary.BasicStructuredDisplayStorage === SOPClassUID) {
    naturalizedName = 'BasicStructuredDisplay';
  } else if (sopClassDictionary.RTDoseStorage === SOPClassUID) {
    naturalizedName = 'RTDose';
  } else if (sopClassDictionary.RTStructureSetStorage === SOPClassUID) {
    naturalizedName = 'RTStructureSet';
  } else if (sopClassDictionary.RTBeamsTreatmentRecordStorage === SOPClassUID) {
    naturalizedName = 'RTBeamsTreatmentRecord';
  } else if (sopClassDictionary.RTPlanStorage === SOPClassUID) {
    naturalizedName = 'RTPlan';
  } else if (
    sopClassDictionary.RTBrachyTreatmentRecordStorage === SOPClassUID
  ) {
    naturalizedName = 'RTBrachyTreatmentRecord';
  } else if (
    sopClassDictionary.RTTreatmentSummaryRecordStorage === SOPClassUID
  ) {
    naturalizedName = 'RTTreatmentSummaryRecord';
  } else if (sopClassDictionary.RTIonPlanStorage === SOPClassUID) {
    naturalizedName = 'RTIonPlan';
  } else if (
    sopClassDictionary.RTIonBeamsTreatmentRecordStorage === SOPClassUID
  ) {
    naturalizedName = 'RTIonBeamsTreatmentRecord';
  } else if (
    sopClassDictionary.RTBeamsDeliveryInstructionStorage === SOPClassUID
  ) {
    naturalizedName = 'RTBeamsDeliveryInstruction';
  } else if (sopClassDictionary.GenericImplantTemplateStorage === SOPClassUID) {
    naturalizedName = 'GenericImplantTemplate';
  } else if (
    sopClassDictionary.ImplantAssemblyTemplateStorage === SOPClassUID
  ) {
    naturalizedName = 'ImplantAssemblyTemplate';
  } else if (sopClassDictionary.ImplantTemplateGroupStorage === SOPClassUID) {
    naturalizedName = 'ImplantTemplateGroup';
  }

  return naturalizedName;
};
