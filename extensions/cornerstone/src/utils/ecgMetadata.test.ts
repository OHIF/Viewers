import { decodeInt16Multiplex, base64ToArrayBuffer, buildEcgModule } from './ecgMetadata';

// ---------------------------------------------------------------------------
// decodeInt16Multiplex
// ---------------------------------------------------------------------------
describe('decodeInt16Multiplex', () => {
  it('demultiplexes 2 channels correctly', () => {
    // Interleaved layout: [ch0_s0, ch1_s0, ch0_s1, ch1_s1, ch0_s2, ch1_s2]
    const interleaved = new Int16Array([10, 20, 30, 40, 50, 60]);
    const channels = decodeInt16Multiplex(interleaved.buffer, 2, 3);

    expect(channels).toHaveLength(2);
    expect(Array.from(channels[0])).toEqual([10, 30, 50]);
    expect(Array.from(channels[1])).toEqual([20, 40, 60]);
  });

  it('handles a single channel', () => {
    const data = new Int16Array([100, 200, 300]);
    const channels = decodeInt16Multiplex(data.buffer, 1, 3);

    expect(channels).toHaveLength(1);
    expect(Array.from(channels[0])).toEqual([100, 200, 300]);
  });

  it('handles negative values (signed short)', () => {
    const data = new Int16Array([-1000, -2000, -3000]);
    const channels = decodeInt16Multiplex(data.buffer, 1, 3);

    expect(Array.from(channels[0])).toEqual([-1000, -2000, -3000]);
  });

  it('returns empty arrays when numberOfChannels or numberOfSamples is 0', () => {
    const emptyBuffer = new Int16Array([]).buffer;

    expect(decodeInt16Multiplex(emptyBuffer, 0, 0)).toHaveLength(0);
    expect(decodeInt16Multiplex(emptyBuffer, 0, 10)).toHaveLength(0);
  });

  it('produces Int16Array instances for each channel', () => {
    const data = new Int16Array([1, 2]);
    const channels = decodeInt16Multiplex(data.buffer, 2, 1);

    expect(channels[0]).toBeInstanceOf(Int16Array);
    expect(channels[1]).toBeInstanceOf(Int16Array);
  });
});

// ---------------------------------------------------------------------------
// base64ToArrayBuffer
// ---------------------------------------------------------------------------
describe('base64ToArrayBuffer', () => {
  it('decodes a simple base64 string to the correct bytes', () => {
    // "ABC" in ASCII = [65, 66, 67]; base64 of that is 'QUJD'
    const buffer = base64ToArrayBuffer('QUJD');
    const bytes = new Uint8Array(buffer);

    expect(bytes).toHaveLength(3);
    expect(Array.from(bytes)).toEqual([65, 66, 67]);
  });

  it('round-trips an Int16Array through base64', () => {
    const original = new Int16Array([500, -300, 0, 32767]);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(original.buffer)));
    const recovered = new Int16Array(base64ToArrayBuffer(base64));

    expect(Array.from(recovered)).toEqual(Array.from(original));
  });

  it('returns an ArrayBuffer', () => {
    const result = base64ToArrayBuffer('AA=='); // single zero byte
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// buildEcgModule
// ---------------------------------------------------------------------------
describe('buildEcgModule', () => {
  const makeInstance = (overrides = {}) => ({
    WaveformSequence: [
      {
        NumberOfWaveformChannels: 12,
        NumberOfWaveformSamples: 5000,
        SamplingFrequency: 500,
        WaveformBitsAllocated: 16,
        WaveformSampleInterpretation: 'SS',
        MultiplexGroupLabel: '12 Lead ECG',
        ChannelDefinitionSequence: [
          { ChannelSourceSequence: [{ CodeMeaning: 'Lead I' }] },
          { ChannelSourceSequence: [{ CodeMeaning: 'Lead II' }] },
        ],
        WaveformData: { InlineBinary: btoa('\x00\x01') },
      },
    ],
    ...overrides,
  });

  it('returns null when WaveformSequence is absent', () => {
    expect(buildEcgModule({})).toBeNull();
    expect(buildEcgModule({ WaveformSequence: [] })).toBeNull();
  });

  it('returns a valid ecgModule for a complete instance', () => {
    const module = buildEcgModule(makeInstance());

    expect(module).not.toBeNull();
    expect(module!.numberOfWaveformChannels).toBe(12);
    expect(module!.numberOfWaveformSamples).toBe(5000);
    expect(module!.samplingFrequency).toBe(500);
    expect(module!.waveformBitsAllocated).toBe(16);
    expect(module!.waveformSampleInterpretation).toBe('SS');
    expect(module!.multiplexGroupLabel).toBe('12 Lead ECG');
    expect(module!.channelDefinitionSequence).toHaveLength(2);
    expect(module!.channelDefinitionSequence[0].channelSourceSequence.codeMeaning).toBe('Lead I');
    expect(typeof module!.waveformData.retrieveBulkData).toBe('function');
  });

  it('applies defaults for missing optional fields', () => {
    const instance = {
      WaveformSequence: [
        {
          // No explicit values — all defaults
          WaveformData: { InlineBinary: btoa('\x00\x00') },
        },
      ],
    };
    const module = buildEcgModule(instance);

    expect(module!.numberOfWaveformChannels).toBe(0);
    expect(module!.numberOfWaveformSamples).toBe(0);
    expect(module!.samplingFrequency).toBe(1);
    expect(module!.waveformBitsAllocated).toBe(16);
    expect(module!.waveformSampleInterpretation).toBe('SS');
    expect(module!.multiplexGroupLabel).toBe('');
    expect(module!.channelDefinitionSequence).toHaveLength(0);
  });

  it('retrieveBulkData decodes InlineBinary data correctly', async () => {
    const samples = new Int16Array([10, 20, 30]);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(samples.buffer)));

    const instance = {
      WaveformSequence: [
        {
          NumberOfWaveformChannels: 1,
          NumberOfWaveformSamples: 3,
          WaveformData: { InlineBinary: base64 },
        },
      ],
    };

    const module = buildEcgModule(instance);
    const channels = await module!.waveformData.retrieveBulkData();

    expect(channels).toHaveLength(1);
    expect(Array.from(channels[0])).toEqual([10, 20, 30]);
  });

  it('retrieveBulkData returns [] when WaveformData is absent', async () => {
    const instance = {
      WaveformSequence: [
        { NumberOfWaveformChannels: 1, NumberOfWaveformSamples: 1 },
      ],
    };
    const module = buildEcgModule(instance);
    const channels = await module!.waveformData.retrieveBulkData();

    expect(channels).toEqual([]);
  });

  it('retrieveBulkData fetches BulkDataURI with auth header when provided', async () => {
    const samples = new Int16Array([1, 2]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(samples.buffer),
    });

    const userAuthenticationService = {
      getAuthorizationHeader: () => ({ Authorization: 'Bearer token123' }),
    };
    const instance = {
      WaveformSequence: [
        {
          NumberOfWaveformChannels: 1,
          NumberOfWaveformSamples: 2,
          WaveformData: { BulkDataURI: 'http://example.com/waveform' },
        },
      ],
    };

    const module = buildEcgModule(instance, userAuthenticationService);
    await module!.waveformData.retrieveBulkData();

    expect(global.fetch).toHaveBeenCalledWith('http://example.com/waveform', {
      headers: {
        Accept: 'application/octet-stream',
        Authorization: 'Bearer token123',
      },
    });
  });

  it('retrieveBulkData throws when BulkDataURI response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });

    const instance = {
      WaveformSequence: [
        {
          WaveformData: { BulkDataURI: 'http://example.com/waveform' },
        },
      ],
    };

    const module = buildEcgModule(instance);
    await expect(module!.waveformData.retrieveBulkData()).rejects.toThrow('403');
  });
});
