import { TextEncoder, TextDecoder } from 'util';
import {
  decodeNumericBulkData,
  resolvePETPrivateScalarBulkData,
} from './resolvePETPrivateScalarBulkData';

// jsdom does not expose TextEncoder/TextDecoder; the Node util implementations
// are spec-compatible and match what browsers provide at runtime.
Object.assign(globalThis, { TextEncoder, TextDecoder });

const textBuffer = (s: string): ArrayBuffer => new TextEncoder().encode(s).buffer;
const float32Buffer = (n: number): ArrayBuffer => new Float32Array([n]).buffer;
const float64Buffer = (n: number): ArrayBuffer => new Float64Array([n]).buffer;

describe('decodeNumericBulkData', () => {
  it('decodes a space-padded DS string (Philips SUVScaleFactor)', () => {
    // The actual bytes returned by Orthanc for (7053,1000): "0.00038 "
    expect(decodeNumericBulkData(textBuffer('0.00038 '))).toBeCloseTo(0.00038, 8);
  });

  it('decodes a plain DS string', () => {
    expect(decodeNumericBulkData(textBuffer('1.881732'))).toBeCloseTo(1.881732, 6);
  });

  it('decodes scientific notation', () => {
    expect(decodeNumericBulkData(textBuffer('3.8e-4'))).toBeCloseTo(0.00038, 8);
  });

  it('takes the first value of a multi-valued DS string', () => {
    expect(decodeNumericBulkData(textBuffer('1.5\\2.5'))).toBe(1.5);
  });

  it('decodes a 4-byte little-endian FL value', () => {
    expect(decodeNumericBulkData(float32Buffer(0.00038))).toBeCloseTo(0.00038, 7);
  });

  it('decodes an 8-byte little-endian FD value', () => {
    expect(decodeNumericBulkData(float64Buffer(0.00038))).toBeCloseTo(0.00038, 12);
  });

  it('accepts a typed-array view, not just an ArrayBuffer', () => {
    expect(decodeNumericBulkData(new Uint8Array(textBuffer('2.0')))).toBe(2);
  });

  it('returns undefined for an empty buffer', () => {
    expect(decodeNumericBulkData(new ArrayBuffer(0))).toBeUndefined();
  });

  it('returns undefined for non-numeric text', () => {
    expect(decodeNumericBulkData(textBuffer('not-a-number'))).toBeUndefined();
  });

  it('returns undefined for null / undefined / non-buffer input', () => {
    expect(decodeNumericBulkData(null)).toBeUndefined();
    expect(decodeNumericBulkData(undefined)).toBeUndefined();
    expect(decodeNumericBulkData({ BulkDataURI: 'http://x' })).toBeUndefined();
  });
});

describe('resolvePETPrivateScalarBulkData', () => {
  const SUV_TAG = '70531000';
  const AC_TAG = '70531009';

  it('resolves a Philips bulkdata tag to a number via retrieveBulkData', async () => {
    const instance: Record<string, unknown> = {
      Modality: 'PT',
      [SUV_TAG]: {
        BulkDataURI: 'http://x/bulk/70531000',
        retrieveBulkData: jest.fn().mockResolvedValue(textBuffer('0.00038 ')),
      },
    };

    await resolvePETPrivateScalarBulkData([instance]);

    expect(instance[SUV_TAG]).toBeCloseTo(0.00038, 8);
  });

  it('resolves both Philips scalar tags', async () => {
    const instance: Record<string, unknown> = {
      Modality: 'PT',
      [SUV_TAG]: {
        BulkDataURI: 'http://x/1',
        retrieveBulkData: jest.fn().mockResolvedValue(textBuffer('0.00038')),
      },
      [AC_TAG]: {
        BulkDataURI: 'http://x/2',
        retrieveBulkData: jest.fn().mockResolvedValue(textBuffer('1.881732')),
      },
    };

    await resolvePETPrivateScalarBulkData([instance]);

    expect(instance[SUV_TAG]).toBeCloseTo(0.00038, 8);
    expect(instance[AC_TAG]).toBeCloseTo(1.881732, 6);
  });

  it('uses the cached value.Value without fetching again', async () => {
    const retrieveBulkData = jest.fn();
    const instance: Record<string, unknown> = {
      Modality: 'PT',
      [SUV_TAG]: { BulkDataURI: 'http://x', Value: textBuffer('0.5'), retrieveBulkData },
    };

    await resolvePETPrivateScalarBulkData([instance]);

    expect(instance[SUV_TAG]).toBe(0.5);
    expect(retrieveBulkData).not.toHaveBeenCalled();
  });

  it('ignores non-PT instances', async () => {
    const retrieveBulkData = jest.fn().mockResolvedValue(textBuffer('0.5'));
    const value = { BulkDataURI: 'http://x', retrieveBulkData };
    const instance: Record<string, unknown> = { Modality: 'CT', [SUV_TAG]: value };

    await resolvePETPrivateScalarBulkData([instance]);

    expect(instance[SUV_TAG]).toBe(value);
    expect(retrieveBulkData).not.toHaveBeenCalled();
  });

  it('leaves an already-numeric value untouched', async () => {
    const instance: Record<string, unknown> = { Modality: 'PT', [SUV_TAG]: 0.00038 };
    await resolvePETPrivateScalarBulkData([instance]);
    expect(instance[SUV_TAG]).toBe(0.00038);
  });

  it('leaves the value untouched when bulkdata cannot be fetched (no retrieveBulkData)', async () => {
    const value = { BulkDataURI: 'http://x' };
    const instance: Record<string, unknown> = { Modality: 'PT', [SUV_TAG]: value };

    await resolvePETPrivateScalarBulkData([instance]);

    expect(instance[SUV_TAG]).toBe(value);
  });

  it('does not throw and leaves the value when retrieveBulkData rejects', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const value = {
      BulkDataURI: 'http://x',
      retrieveBulkData: jest.fn().mockRejectedValue(new Error('request failed')),
    };
    const instance: Record<string, unknown> = { Modality: 'PT', [SUV_TAG]: value };

    await expect(resolvePETPrivateScalarBulkData([instance])).resolves.toBeUndefined();
    expect(instance[SUV_TAG]).toBe(value);
    warn.mockRestore();
  });

  it('is a no-op for empty / non-array input', async () => {
    await expect(resolvePETPrivateScalarBulkData([])).resolves.toBeUndefined();
    await expect(
      resolvePETPrivateScalarBulkData(undefined as unknown as unknown[])
    ).resolves.toBeUndefined();
  });
});
