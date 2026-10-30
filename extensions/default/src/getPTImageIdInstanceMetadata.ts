import OHIF, { utils } from '@ohif/core';
import { asArrayFirst, asMultiValueArray, getPrivateTagValue } from '@cornerstonejs/utils';

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
    // A DICOMweb source can write the values as one backslash-joined value.
    CorrectedImage: asMultiValueArray(dicomMetaData.CorrectedImage),
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

  // Only finite numbers; see readPhilipsFactor.
  const suvScaleFactor = readPhilipsFactor(dicomMetaData, 0x00);
  const activityConcentrationScaleFactor = readPhilipsFactor(dicomMetaData, 0x09);
  if (suvScaleFactor !== undefined || activityConcentrationScaleFactor !== undefined) {
    const philipsPETPrivateGroup: PhilipsPETPrivateGroup = {
      SUVScaleFactor: suvScaleFactor,
      ActivityConcentrationScaleFactor: activityConcentrationScaleFactor,
    };
    instanceMetadata.PhilipsPETPrivateGroup = philipsPETPrivateGroup;
  }

  // GE post-injection date time (0009,xx0D), creator GEMS_PETD_01.
  const gePostInjectionDateTime = asArrayFirst(
    getPrivateTagValue(dicomMetaData, 0x0009, 'GEMS_PETD_01', 0x0d)
  );
  if (gePostInjectionDateTime != null) {
    instanceMetadata.GEPrivatePostInjectionDateTime = gePostInjectionDateTime;
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
 * Reads a factor of the Philips PET private group (7053,xxEE), creator
 * `Philips PET Private Group`: element 0x00 is the SUV Scale Factor, and 0x09
 * the Activity Concentration Scale Factor. `getPrivateTagValue` reads the dcmjs
 * 1.0 block, which survives the copy of a multi-frame instance
 * (`combineFrameInstance`), and the hex-key form. dcmjs 1.0 gives the value as a
 * list. `utils.resolveBulkDataTags` resolves a bulk data value during
 * ingestion; a value that is still an object gives `undefined`.
 */
function readPhilipsFactor(instance: object, element: number): number | undefined {
  return coerceNumber(
    asArrayFirst(getPrivateTagValue(instance, 0x7053, 'Philips PET Private Group', element))
  );
}

/**
 * Coerces a naturalized DICOM value into a finite number, or returns undefined.
 *
 * Delegates to OHIF's `utils.toNumber` and then requires a finite scalar, so an
 * object value - such as an unresolved bulkdata reference `{ BulkDataURI }` or
 * an array - becomes undefined. This is the final backstop ensuring such a value
 * can never reach calculate-suv (which treats it as truthy and silently corrupts
 * the SUV factors). Bulkdata is meant to be resolved upstream during ingestion
 * (see utils.resolveBulkDataTags); this guard catches anything that slips
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
