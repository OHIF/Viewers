import { utilities as csMetadataUtilities } from '@cornerstonejs/metadata';

export type EcgModule = NonNullable<
  ReturnType<typeof csMetadataUtilities.buildEcgModuleFromInstance>
>;

type BuildEcgModuleFromInstance = (
  instance: Record<string, unknown>,
  imageId?: string,
  // Released @cornerstonejs/metadata versions ignore this argument.
  options?: { getHeaders?: () => Record<string, string> | undefined }
) => EcgModule | null;

const buildEcgModuleFromInstance = (...args: Parameters<BuildEcgModuleFromInstance>) =>
  (csMetadataUtilities.buildEcgModuleFromInstance as BuildEcgModuleFromInstance)(...args);

/** Returns the items of a naturalized sequence: an array, an array-like, or one item. */
function toList(value: any): any[] {
  if (!value) {
    return [];
  }
  return typeof value.length === 'number' ? Array.from(value) : [value];
}

/** Returns the first item of a naturalized value, but keeps binary data whole. */
function firstItem(value: any): any {
  if (!value || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return value;
  }
  return typeof value.length === 'number' ? value[0] : value;
}

/** Copies the bytes of a typed array into an ArrayBuffer, which every Cornerstone version decodes. */
function toArrayBuffer(bytes: unknown): unknown {
  return ArrayBuffer.isView(bytes)
    ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    : bytes;
}

async function decodeBulkData(group: any, waveformData: any): Promise<Int16Array[]> {
  let bytes = waveformData.Value;
  if (bytes === undefined) {
    bytes = await waveformData.retrieveBulkData();
  }
  const loaded = { WaveformSequence: [{ ...group, WaveformData: toArrayBuffer(bytes) }] };
  const decoded = buildEcgModuleFromInstance(loaded);
  if (!decoded) {
    throw new Error('[ECGViewport] Failed to decode the waveform bulkdata');
  }
  return decoded.waveformData.retrieveBulkData();
}

/**
 * Parse the naturalized DICOM instance's WaveformSequence and build the ecgModule
 * that Cornerstone's ECGViewport.setEcg() expects via
 * metaData.get(MetadataModules.ECG, imageId).
 *
 * Cornerstone decodes the waveform. When the data source attached a
 * `retrieveBulkData` to `WaveformData`, that method fetches the bytes, so the
 * data source handles multipart/related, auth and relative bulkdata URIs.
 * The bytes come from `WaveformData.Value` when the data source already
 * cached them there. The decoded channels are kept, so a re-mount of the
 * same display set does not fetch or decode again; a failed load is retried.
 *
 * Returns null if the instance has no WaveformSequence.
 */
export function buildEcgModule(instance: any, userAuthenticationService?: any): EcgModule | null {
  if (!instance?.WaveformSequence?.length) {
    return null;
  }

  const ecgModule = buildEcgModuleFromInstance(instance, instance.imageId, {
    getHeaders: () => userAuthenticationService?.getAuthorizationHeader?.(),
  });
  if (!ecgModule) {
    return null;
  }

  const group = firstItem(instance.WaveformSequence);
  const channelDefinitions = toList(group.ChannelDefinitionSequence);
  // Works around a Cornerstone bug: buildEcgModuleFromInstance reads only an
  // upper-case CodeMeaning, and drops CodeValue and CodingSchemeDesignator.
  // No released Cornerstone viewport reads the lead code yet, so only the unit
  // test covers it.
  ecgModule.channelDefinitionSequence.forEach((definition, index) => {
    const source = definition.channelSourceSequence as Record<string, string> | undefined;
    const raw = firstItem(channelDefinitions[index]?.ChannelSourceSequence);
    if (!source || !raw) {
      return;
    }
    source.codeMeaning ||= raw.codeMeaning ?? raw.CodeMeaning ?? '';
    source.codeValue ??= raw.CodeValue ?? raw.codeValue;
    source.codingSchemeDesignator ??= raw.CodingSchemeDesignator ?? raw.codingSchemeDesignator;
  });

  const waveformData = firstItem(group.WaveformData ?? group.waveformData);
  if (typeof waveformData?.retrieveBulkData === 'function') {
    let channels: Promise<Int16Array[]> | undefined;
    ecgModule.waveformData.retrieveBulkData = () => {
      channels ??= decodeBulkData(group, waveformData).catch(error => {
        channels = undefined;
        throw error;
      });
      return channels;
    };
  }

  return ecgModule;
}
