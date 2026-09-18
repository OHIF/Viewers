/**
 * Decode a multiplexed Int16 buffer into per-channel arrays.
 * Layout: sample0ch0, sample0ch1 ... sample0chN, sample1ch0, …
 * Note: DICOM ECG data is canonically SS (signed short). The sampleInterpretation
 * field is forwarded to ECGViewport for its own use; the raw buffer is always
 * treated as Int16 because Cornerstone ECGViewport expects Int16Array[].
 */
export function decodeInt16Multiplex(
  buffer: ArrayBuffer,
  numberOfChannels: number,
  numberOfSamples: number
): Int16Array[] {
  const src = new Int16Array(buffer);
  const channels: Int16Array[] = [];
  for (let ch = 0; ch < numberOfChannels; ch++) {
    const out = new Int16Array(numberOfSamples);
    for (let s = 0; s < numberOfSamples; s++) {
      out[s] = src[s * numberOfChannels + ch];
    }
    channels.push(out);
  }
  return channels;
}

/**
 * Decode a base64 InlineBinary string into a raw ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

export type EcgModule = {
  numberOfWaveformChannels: number;
  numberOfWaveformSamples: number;
  samplingFrequency: number;
  waveformBitsAllocated: number;
  waveformSampleInterpretation: string;
  multiplexGroupLabel: string;
  channelDefinitionSequence: Array<{ channelSourceSequence: { codeMeaning: string } }>;
  waveformData: { retrieveBulkData: () => Promise<Int16Array[]> };
};

/**
 * Parse the naturalized DICOM instance's WaveformSequence and build the ecgModule
 * that Cornerstone's ECGViewport.setEcg() expects via
 * metaData.get(MetadataModules.ECG, imageId).
 *
 * Returns null if the instance has no WaveformSequence.
 */
export function buildEcgModule(
  instance: any,
  userAuthenticationService?: any
): EcgModule | null {
  const waveformGroups = instance?.WaveformSequence;
  if (!waveformGroups?.length) {
    return null;
  }

  // Use the first (and typically only) multiplex group
  const group = waveformGroups[0];

  const numberOfChannels = group.NumberOfWaveformChannels ?? 0;
  const numberOfSamples = group.NumberOfWaveformSamples ?? 0;
  const samplingFrequency = group.SamplingFrequency ?? 1;
  const bitsAllocated = group.WaveformBitsAllocated ?? 16;
  const sampleInterpretation = group.WaveformSampleInterpretation ?? 'SS';
  const multiplexGroupLabel = group.MultiplexGroupLabel ?? '';

  const channelDefinitionSequence = (group.ChannelDefinitionSequence ?? []).map(ch => ({
    channelSourceSequence: {
      codeMeaning:
        ch?.ChannelSourceSequence?.[0]?.CodeMeaning ??
        ch?.ChannelSourceSequence?.[0]?.codeMeaning ??
        '',
    },
  }));

  const retrieveBulkData = async (): Promise<Int16Array[]> => {
    const waveformData = group.WaveformData;

    if (!waveformData) {
      console.warn('[ECGViewport] No WaveformData found on instance');
      return [];
    }

    let buffer: ArrayBuffer;

    if (waveformData.InlineBinary) {
      buffer = base64ToArrayBuffer(waveformData.InlineBinary);
    } else if (waveformData.BulkDataURI) {
      const headers: Record<string, string> = {
        Accept: 'application/octet-stream',
      };
      const authHeader = userAuthenticationService?.getAuthorizationHeader?.();
      if (authHeader) {
        Object.assign(headers, authHeader);
      }

      const response = await fetch(waveformData.BulkDataURI, { headers });
      if (!response.ok) {
        throw new Error(
          `[ECGViewport] Failed to fetch waveform BulkDataURI: ${response.status}`
        );
      }
      buffer = await response.arrayBuffer();
    } else {
      console.warn('[ECGViewport] WaveformData has no InlineBinary or BulkDataURI');
      return [];
    }

    return decodeInt16Multiplex(buffer, numberOfChannels, numberOfSamples);
  };

  return {
    numberOfWaveformChannels: numberOfChannels,
    numberOfWaveformSamples: numberOfSamples,
    samplingFrequency,
    waveformBitsAllocated: bitsAllocated,
    waveformSampleInterpretation: sampleInterpretation,
    multiplexGroupLabel,
    channelDefinitionSequence,
    waveformData: { retrieveBulkData },
  };
}
