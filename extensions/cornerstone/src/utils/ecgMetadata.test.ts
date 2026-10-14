import { utilities as csMetadataUtilities } from '@cornerstonejs/metadata';
import { buildEcgModule } from './ecgMetadata';

jest.mock('@cornerstonejs/metadata', () => {
  const actual = jest.requireActual('@cornerstonejs/metadata');
  const { buildEcgModuleFromInstance } = actual.utilities;
  return {
    ...actual,
    utilities: { ...actual.utilities, buildEcgModuleFromInstance: jest.fn(buildEcgModuleFromInstance) },
  };
});

// Two channels, two samples, interleaved: ch0=[1, -2], ch1=[3, 4].
const SAMPLES = new Int16Array([1, 3, -2, 4]);

const makeInstance = WaveformData => ({
  WaveformSequence: [
    {
      NumberOfWaveformChannels: 2,
      NumberOfWaveformSamples: 2,
      SamplingFrequency: 500,
      WaveformBitsAllocated: 16,
      WaveformSampleInterpretation: 'SS',
      MultiplexGroupLabel: '12 Lead ECG',
      ChannelDefinitionSequence: [
        { ChannelSourceSequence: [{ CodeMeaning: 'Lead I' }] },
        { ChannelSourceSequence: [{ CodeMeaning: 'Lead II' }] },
      ],
      WaveformData,
    },
  ],
});

const channelsOf = (channels: Int16Array[]) => channels.map(channel => Array.from(channel));

describe('buildEcgModule', () => {
  it('returns null when WaveformSequence is absent', () => {
    expect(buildEcgModule({})).toBeNull();
    expect(buildEcgModule({ WaveformSequence: [] })).toBeNull();
  });

  it('returns the waveform attributes and the lead names', () => {
    const module = buildEcgModule(makeInstance({}));

    expect(module!.numberOfWaveformChannels).toBe(2);
    expect(module!.numberOfWaveformSamples).toBe(2);
    expect(module!.samplingFrequency).toBe(500);
    expect(module!.multiplexGroupLabel).toBe('12 Lead ECG');
    expect(module!.channelDefinitionSequence[0].channelSourceSequence.codeMeaning).toBe('Lead I');
  });

  it('decodes InlineBinary data', async () => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(SAMPLES.buffer)));
    const module = buildEcgModule(makeInstance({ InlineBinary: base64 }));

    expect(channelsOf(await module!.waveformData.retrieveBulkData())).toEqual([
      [1, -2],
      [3, 4],
    ]);
  });

  it('decodes the bytes that the data source retrieveBulkData returns', async () => {
    const retrieveBulkData = jest.fn().mockResolvedValue(SAMPLES.buffer.slice(0));
    const module = buildEcgModule(
      makeInstance({ BulkDataURI: 'http://example.com/waveform', retrieveBulkData })
    );

    expect(channelsOf(await module!.waveformData.retrieveBulkData())).toEqual([
      [1, -2],
      [3, 4],
    ]);
    expect(retrieveBulkData).toHaveBeenCalledTimes(1);
  });

  it('decodes a typed array from the data source retrieveBulkData', async () => {
    const bytes = new Uint8Array(SAMPLES.buffer.slice(0));
    const module = buildEcgModule(
      makeInstance({ BulkDataURI: 'x', retrieveBulkData: jest.fn().mockResolvedValue(bytes) })
    );

    expect(channelsOf(await module!.waveformData.retrieveBulkData())).toEqual([
      [1, -2],
      [3, 4],
    ]);
  });

  it('uses the cached Value and does not fetch again on a re-mount', async () => {
    const retrieveBulkData = jest.fn();
    const module = buildEcgModule(
      makeInstance({ BulkDataURI: 'x', Value: SAMPLES.buffer.slice(0), retrieveBulkData })
    );

    await module!.waveformData.retrieveBulkData();
    expect(channelsOf(await module!.waveformData.retrieveBulkData())).toEqual([
      [1, -2],
      [3, 4],
    ]);
    expect(retrieveBulkData).not.toHaveBeenCalled();
  });

  it('gives the auth headers to the Cornerstone bulkdata fetch', () => {
    const builder = csMetadataUtilities.buildEcgModuleFromInstance as jest.Mock;
    const authHeader = { Authorization: 'Bearer token' };
    buildEcgModule(makeInstance({ BulkDataURI: 'x' }), {
      getAuthorizationHeader: () => authHeader,
    });

    const options = builder.mock.lastCall[2] as { getHeaders: () => unknown };
    expect(options.getHeaders()).toBe(authHeader);
  });

  it('reads lead names from a lowercase codeMeaning', () => {
    const instance = makeInstance({});
    instance.WaveformSequence[0].ChannelDefinitionSequence[0].ChannelSourceSequence = [
      { codeMeaning: 'Lead I' } as never,
    ];

    const module = buildEcgModule(instance);

    expect(module!.channelDefinitionSequence[0].channelSourceSequence.codeMeaning).toBe('Lead I');
  });

  it('passes the lead code value, which a trace layout uses to find a lead', () => {
    const instance = makeInstance({});
    instance.WaveformSequence[0].ChannelDefinitionSequence[1].ChannelSourceSequence = [
      { CodeValue: '5.6.3-9-2', CodingSchemeDesignator: 'SCPECG', CodeMeaning: 'Lead II' } as never,
    ];

    const source = buildEcgModule(instance)!.channelDefinitionSequence[1].channelSourceSequence as {
      codeValue?: string;
      codingSchemeDesignator?: string;
    };

    expect(source.codeValue).toBe('5.6.3-9-2');
    expect(source.codingSchemeDesignator).toBe('SCPECG');
  });
});
