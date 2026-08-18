import dcmjs from 'dcmjs';

export const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';

export const DICOM_WRITE_OPTIONS = {
  allowInvalidVRLength: false,
  // `fragmentMultiframe` only governs whether a SINGLE frame is split across
  // multiple fragments (dcmjs splits frames larger than its 20KB fragment size).
  // It does NOT merge frames: in an encapsulated (compressed) transfer syntax
  // every frame is always written as its own fragment, preceded by the Basic
  // Offset Table; in an uncompressed syntax pixel data is never fragmented at
  // all. Keeping this `false` therefore yields exactly one fragment per frame
  // for compressed SEG — the conformant layout — without splitting large frames.
  fragmentMultiframe: false,
};

/** OHIF runtime fields — not DICOM tags; must not be enumerable for dcmjs datasetToDict. */
export const RUNTIME_INSTANCE_PROPERTY_KEYS = [
  'url',
  'wadorsuri',
  'wadouri',
  'wadoRoot',
  'wadoUri',
  'wadoUriRoot',
  'imageRendering',
  'imageId',
  '_parentInstance',
  'frameNumber',
] as const;

/**
 * Attaches OHIF runtime data on an instance without enumerable keys (safe for dcmjs datasetToDict).
 */
export function setNonEnumerableInstanceProperty(
  instance: Record<string, unknown>,
  key: string,
  value: unknown
) {
  Object.defineProperty(instance, key, {
    value,
    enumerable: false,
    writable: true,
    configurable: true,
  });
}

/**
 * Re-defines any existing enumerable runtime properties as non-enumerable (keeps values).
 */
export function makeExistingPropertiesNonEnumerable(instance: Record<string, unknown>) {
  for (const key of RUNTIME_INSTANCE_PROPERTY_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(instance, key)) {
      continue;
    }

    const descriptor = Object.getOwnPropertyDescriptor(instance, key);

    if (!descriptor || descriptor.enumerable === false) {
      continue;
    }

    setNonEnumerableInstanceProperty(instance, key, descriptor.value);
  }
}

export function getDatasetTransferSyntaxUID(dataset) {
  const fromMeta = dataset?._meta?.TransferSyntaxUID;

  if (typeof fromMeta === 'string') {
    return fromMeta;
  }

  if (Array.isArray(fromMeta?.Value)) {
    return fromMeta.Value[0];
  }

  if (typeof dataset?.TransferSyntaxUID === 'string') {
    return dataset.TransferSyntaxUID;
  }

  return EXPLICIT_VR_LITTLE_ENDIAN;
}

function applyTransferSyntaxToFileMeta(dicomDict, transferSyntaxUID) {
  if (!transferSyntaxUID || !dicomDict?.meta) {
    return;
  }

  // Ensure meta object exists
  if (!dicomDict.meta) {
    dicomDict.meta = {};
  }

  // Hex key only: DicomMessage.write treats every meta key as a tag string, so a
  // naturalized key like 'TransferSyntaxUID' would be parsed via parseInt(..., 16)
  // into tag (0000,0000) and written as a garbage element in group 2.
  dicomDict.meta['00020010'] = { vr: 'UI', Value: [transferSyntaxUID] };

  // Ensure other required meta attributes are present
  if (!dicomDict.meta['00020001']) {
    dicomDict.meta['00020001'] = { vr: 'OB', Value: [Buffer.from([0x00, 0x01])] }; // File Meta Information Version
  }
  
  // Fix SOP Class UID for SEG files - use standard 1.2.840.10008.5.1.4.1.1.66.4 instead of 66.7
  if (!dicomDict.meta['00020002']) {
    dicomDict.meta['00020002'] = { vr: 'UI', Value: ['1.2.840.10008.5.1.4.1.1.66.4'] }; // Standard Segmentation Storage UID
  } else if (dicomDict.meta['00020002'].Value[0] === '1.2.840.10008.5.1.4.1.1.66.7') {
    console.log('applyTransferSyntaxToFileMeta - Fixing incorrect SOP Class UID from 66.7 to 66.4');
    dicomDict.meta['00020002'].Value[0] = '1.2.840.10008.5.1.4.1.1.66.4';
  }
}

export function datasetToDicomPart10Buffer(dataset) {
  console.log('datasetToDicomPart10Buffer - input dataset:', {
    hasReferencedSeriesSequence: !!dataset.ReferencedSeriesSequence,
    ReferencedSeriesSequence: dataset.ReferencedSeriesSequence,
    Modality: dataset.Modality,
    SOPInstanceUID: dataset.SOPInstanceUID,
    PatientID: dataset.PatientID,
    PatientName: dataset.PatientName
  });

  // Save important fields before conversion
  const referencedSeriesSequence = dataset.ReferencedSeriesSequence;
  const patientID = dataset.PatientID;
  const patientName = dataset.PatientName;

  makeExistingPropertiesNonEnumerable(dataset);
  const transferSyntaxUID = getDatasetTransferSyntaxUID(dataset);
  const dicomDict = dcmjs.data.datasetToDict(dataset);

  console.log('datasetToDicomPart10Buffer - dicomDict keys:', Object.keys(dicomDict));
  console.log('datasetToDicomPart10Buffer - dicomDict has meta:', !!dicomDict.meta);
  console.log('datasetToDicomPart10Buffer - dicomDict meta keys:', dicomDict.meta ? Object.keys(dicomDict.meta) : 'no meta');
  console.log('datasetToDicomPart10Buffer - dicomDict has ReferencedSeriesSequence:', !!dicomDict['0020111a']);
  console.log('datasetToDicomPart10Buffer - dicomDict has PatientID:', !!dicomDict['00100020']);
  console.log('datasetToDicomPart10Buffer - dicomDict has PatientName:', !!dicomDict['00100010']);

  // Ensure meta object exists
  if (!dicomDict.meta) {
    console.log('datasetToDicomPart10Buffer - creating meta object');
    dicomDict.meta = {};
  }

  // Manually add ReferencedSeriesSequence if it was lost during conversion
  if (referencedSeriesSequence && !dicomDict['0020111a']) {
    console.log('datasetToDicomPart10Buffer - manually adding ReferencedSeriesSequence to dicomDict');
    dicomDict['0020111a'] = {
      vr: 'SQ',
      Value: [{
        '0020000e': { vr: 'UI', Value: [referencedSeriesSequence.SeriesInstanceUID] },
        '00001114': {
          vr: 'SQ',
          Value: referencedSeriesSequence.ReferencedInstanceSequence.map(ref => ({
            '00081150': { vr: 'UI', Value: [ref.ReferencedSOPClassUID] },
            '00081155': { vr: 'UI', Value: [ref.ReferencedSOPInstanceUID] }
          }))
        }
      }]
    };
    console.log('datasetToDicomPart10Buffer - ReferencedSeriesSequence added successfully');
  }

  // Ensure PatientID is present (critical for hospital systems)
  if (patientID && !dicomDict['00100020']) {
    console.log('datasetToDicomPart10Buffer - adding missing PatientID:', patientID);
    dicomDict['00100020'] = { vr: 'LO', Value: [patientID] };
  } else if (!patientID && !dicomDict['00100020']) {
    console.log('datasetToDicomPart10Buffer - warning: PatientID is missing, using StudyInstanceUID as fallback');
    dicomDict['00100020'] = { vr: 'LO', Value: [dataset.StudyInstanceUID || 'ANONYMOUS'] };
  }

  // Ensure PatientName is present
  if (patientName && !dicomDict['00100010']) {
    console.log('datasetToDicomPart10Buffer - adding missing PatientName:', patientName);
    dicomDict['00100010'] = { vr: 'PN', Value: [patientName] };
  } else if (!patientName && !dicomDict['00100010']) {
    console.log('datasetToDicomPart10Buffer - warning: PatientName is missing, using anonymous');
    dicomDict['00100010'] = { vr: 'PN', Value: [{ Alphabetic: 'Anonymous^Patient' }] };
  }

  applyTransferSyntaxToFileMeta(dicomDict, transferSyntaxUID);
  const buffer = dicomDict.write(DICOM_WRITE_OPTIONS);

  console.log('datasetToDicomPart10Buffer - buffer:', buffer);
  console.log('datasetToDicomPart10Buffer - buffer type:', typeof buffer);
  console.log('datasetToDicomPart10Buffer - buffer size:', buffer?.length);

  return buffer;
}

export function datasetToDicomBlob(dataset) {
  const part10Buffer = datasetToDicomPart10Buffer(dataset);
  return new Blob([part10Buffer], { type: 'application/dicom' });
}

export function writeDicomDictToPart10Buffer(dicomDict) {
  return dicomDict.write(DICOM_WRITE_OPTIONS);
}
