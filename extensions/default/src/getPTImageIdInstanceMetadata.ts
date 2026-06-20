import OHIF, { utils } from '@ohif/core';

import type { InstanceMetadata, PhilipsPETPrivateGroup } from '@cornerstonejs/calculate-suv';

const metadataProvider = OHIF.classes.MetadataProvider;

export default function getPTImageIdInstanceMetadata(imageId: string): InstanceMetadata {
  const dicomMetaData = metadataProvider.get('instance', imageId);

  if (!dicomMetaData) {
    throw new Error('dicom metadata are required');
  }

  const radiopharmaceuticalInfo = firstSequenceItem<Record<string, unknown>>(
    dicomMetaData.RadiopharmaceuticalInformationSequence
  );
  const radionuclideHalfLife = coerceNumber(radiopharmaceuticalInfo?.RadionuclideHalfLife);
  const radionuclideTotalDose = coerceNumber(radiopharmaceuticalInfo?.RadionuclideTotalDose);

  if (
    dicomMetaData.SeriesDate === undefined ||
    dicomMetaData.SeriesTime === undefined ||
    dicomMetaData.CorrectedImage === undefined ||
    dicomMetaData.Units === undefined ||
    !radiopharmaceuticalInfo ||
    radionuclideHalfLife === undefined ||
    radionuclideTotalDose === undefined ||
    dicomMetaData.DecayCorrection === undefined ||
    dicomMetaData.AcquisitionDate === undefined ||
    dicomMetaData.AcquisitionTime === undefined ||
    (radiopharmaceuticalInfo.RadiopharmaceuticalStartDateTime === undefined &&
      radiopharmaceuticalInfo.RadiopharmaceuticalStartTime === undefined)
  ) {
    throw new Error('required metadata are missing');
  }

  if (dicomMetaData.PatientWeight === undefined) {
    console.warn('PatientWeight missing from PT instance metadata');
  }

  const instanceMetadata: InstanceMetadata = {
    CorrectedImage: dicomMetaData.CorrectedImage,
    Units: dicomMetaData.Units,
    RadionuclideHalfLife: radionuclideHalfLife,
    RadionuclideTotalDose: radionuclideTotalDose,
    RadiopharmaceuticalStartDateTime: radiopharmaceuticalInfo.RadiopharmaceuticalStartDateTime,
    RadiopharmaceuticalStartTime: radiopharmaceuticalInfo.RadiopharmaceuticalStartTime,
    DecayCorrection: dicomMetaData.DecayCorrection,
    PatientWeight: coerceNumber(dicomMetaData.PatientWeight),
    SeriesDate: dicomMetaData.SeriesDate,
    SeriesTime: dicomMetaData.SeriesTime,
    AcquisitionDate: dicomMetaData.AcquisitionDate,
    AcquisitionTime: dicomMetaData.AcquisitionTime,
  };

  // Philips PET private group. Only populated with values that coerce to real
  // numbers; an unresolved bulkdata object yields undefined and is dropped so it
  // can never corrupt the SUV calculation. SUVScaleFactor is (7053,1000) and
  // ActivityConcentrationScaleFactor is (7053,1009). These are resolved from
  // bulkdata upstream during ingestion (resolvePETPrivateScalarBulkData).
  const suvScaleFactor = coerceNumber(dicomMetaData['70531000']);
  const activityConcentrationScaleFactor = coerceNumber(dicomMetaData['70531009']);
  if (suvScaleFactor !== undefined || activityConcentrationScaleFactor !== undefined) {
    const philipsPETPrivateGroup: PhilipsPETPrivateGroup = {
      SUVScaleFactor: suvScaleFactor,
      ActivityConcentrationScaleFactor: activityConcentrationScaleFactor,
    };
    instanceMetadata.PhilipsPETPrivateGroup = philipsPETPrivateGroup;
  }

  if (dicomMetaData['0009100d'] !== undefined) {
    instanceMetadata.GEPrivatePostInjectionDateTime = dicomMetaData['0009100d'];
  }

  const frameReferenceTime = coerceNumber(dicomMetaData.FrameReferenceTime);
  if (frameReferenceTime !== undefined) {
    instanceMetadata.FrameReferenceTime = frameReferenceTime;
  }

  const actualFrameDuration = coerceNumber(dicomMetaData.ActualFrameDuration);
  if (actualFrameDuration !== undefined) {
    instanceMetadata.ActualFrameDuration = actualFrameDuration;
  }

  if (dicomMetaData.PatientSex !== undefined) {
    instanceMetadata.PatientSex = dicomMetaData.PatientSex;
  }

  const patientSize = coerceNumber(dicomMetaData.PatientSize);
  if (patientSize !== undefined) {
    instanceMetadata.PatientSize = patientSize;
  }

  return instanceMetadata;
}

export { getPTImageIdInstanceMetadata };

/**
 * Coerces a naturalized DICOM value into a finite number, or returns undefined.
 *
 * Delegates to OHIF's `utils.toNumber` and then requires a finite scalar, so an
 * object value - such as an unresolved bulkdata reference `{ BulkDataURI }` or
 * an array - becomes undefined. This is the final backstop ensuring such a value
 * can never reach calculate-suv (which treats it as truthy and silently corrupts
 * the SUV factors). Bulkdata is meant to be resolved upstream during ingestion
 * (see resolvePETPrivateScalarBulkData); this guard catches anything that slips
 * through.
 */
function coerceNumber(value: unknown): number | undefined {
  const n = utils.toNumber(value);
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

/**
 * Returns the first item of a DICOM sequence, tolerating either the dcmjs
 * naturalized array shape or an already-flattened single-object shape.
 */
function firstSequenceItem<T = Record<string, unknown>>(seq: unknown): T | undefined {
  if (seq == null || typeof seq !== 'object') {
    return undefined;
  }
  return (Array.isArray(seq) ? seq[0] : seq) as T;
}
