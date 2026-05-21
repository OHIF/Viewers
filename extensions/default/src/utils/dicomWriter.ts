import dcmjs from 'dcmjs';

export const DICOM_WRITE_OPTIONS = {
  allowInvalidVRLength: false,
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

function getDatasetTransferSyntaxUID(dataset) {
  const meta = dataset?._meta;

  if (!meta) {
    return undefined;
  }

  const entry = meta.TransferSyntaxUID;

  if (Array.isArray(entry?.Value)) {
    return entry.Value[0];
  }

  if (typeof entry === 'string') {
    return entry;
  }

  return undefined;
}

function applyTransferSyntaxToFileMeta(dicomDict, transferSyntaxUID) {
  if (!transferSyntaxUID || !dicomDict?.meta) {
    return;
  }

  const entry = { vr: 'UI', Value: [transferSyntaxUID] };
  dicomDict.meta.TransferSyntaxUID = entry;
  dicomDict.meta['00020010'] = entry;
}

export function datasetToDicomPart10Buffer(dataset) {
  makeExistingPropertiesNonEnumerable(dataset);
  const transferSyntaxUID = getDatasetTransferSyntaxUID(dataset);
  const dicomDict = dcmjs.data.datasetToDict(dataset);
  applyTransferSyntaxToFileMeta(dicomDict, transferSyntaxUID);
  return dicomDict.write(DICOM_WRITE_OPTIONS);
}

export function datasetToDicomBlob(dataset) {
  const part10Buffer = datasetToDicomPart10Buffer(dataset);
  return new Blob([part10Buffer], { type: 'application/dicom' });
}

export function writeDicomDictToPart10Buffer(dicomDict) {
  return dicomDict.write(DICOM_WRITE_OPTIONS);
}
