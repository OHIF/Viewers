import { buildEcgModule } from './ecgMetadata';

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
});
