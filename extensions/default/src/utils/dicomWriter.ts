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
