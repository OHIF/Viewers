import { TextEncoder, TextDecoder } from 'util';
import dcmjs from 'dcmjs';
import { DICOM_WRITE_OPTIONS, writeDicomDictToPart10Buffer } from './dicomWriter';

// jsdom does not expose TextEncoder/TextDecoder, which dcmjs's buffer streams need.
if (typeof (global as { TextEncoder?: unknown }).TextEncoder === 'undefined') {
  (global as { TextEncoder?: unknown }).TextEncoder = TextEncoder;
}
if (typeof (global as { TextDecoder?: unknown }).TextDecoder === 'undefined') {
  (global as { TextDecoder?: unknown }).TextDecoder = TextDecoder;
}

const RLE_LOSSLESS = '1.2.840.10008.1.2.5';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';
const PIXEL_DATA_TAG = '7FE00010';

// Use frames larger than dcmjs's 20KB fragment size so that, if a frame were
// ever split, we'd see more than one fragment per frame.
const FRAME_BYTES = 30000;

function makeDicomDict(transferSyntaxUID, vr, pixelDataValue) {
  const dict = new dcmjs.data.DicomDict({
    '00020010': { vr: 'UI', Value: [transferSyntaxUID] },
    '00020002': { vr: 'UI', Value: ['1.2.840.10008.5.1.4.1.1.66.4'] },
    '00020003': { vr: 'UI', Value: ['1.2.3.4.5'] },
  });
  dict.upsertTag(PIXEL_DATA_TAG, vr, pixelDataValue);
  return dict;
}

/**
 * Locates the PixelData element in a Part-10 buffer and, when it is encapsulated,
 * walks the encapsulated items (Basic Offset Table + fragments).
 */
function inspectPixelData(arrayBuffer) {
  const dv = new DataView(arrayBuffer);

  // Skip the 128-byte preamble + "DICM", then read the file-meta group length
  // from (0002,0000) UL to find where the dataset begins.
  const metaGroupLength = dv.getUint32(140, true);
  let offset = 144 + metaGroupLength;

  // PixelData (7FE0,0010), explicit VR (OB/OW) — long form: VR(2) + reserved(2) + length(4).
  const group = dv.getUint16(offset, true);
  const element = dv.getUint16(offset + 2, true);
  if (group !== 0x7fe0 || element !== 0x0010) {
    throw new Error(
      `Expected PixelData at offset ${offset}, found ${group.toString(16)},${element.toString(16)}`
    );
  }

  const length = dv.getUint32(offset + 8, true);
  if (length !== 0xffffffff) {
    return { encapsulated: false, length };
  }

  // Encapsulated: first item is the Basic Offset Table, then one item per fragment,
  // terminated by the Sequence Delimitation Item (FFFE,E0DD).
  let p = offset + 12;
  const itemSizes: number[] = [];

  while (p + 8 <= dv.byteLength) {
    const itemGroup = dv.getUint16(p, true);
    const itemElement = dv.getUint16(p + 2, true);
    const itemLength = dv.getUint32(p + 4, true);
    p += 8;

    if (itemGroup === 0xfffe && itemElement === 0xe0dd) {
      break; // sequence delimiter
    }
    if (itemGroup !== 0xfffe || itemElement !== 0xe000) {
      throw new Error(`Unexpected item tag at ${p - 8}`);
    }

    itemSizes.push(itemLength);
    p += itemLength;
  }

  // itemSizes[0] is the Basic Offset Table; the rest are frame fragments.
  return {
    encapsulated: true,
    totalItems: itemSizes.length,
    basicOffsetTableSize: itemSizes[0],
    fragmentSizes: itemSizes.slice(1),
  };
}

describe('dicomWriter DICOM_WRITE_OPTIONS fragmentation', () => {
  it('writes exactly one fragment per frame (plus the Basic Offset Table) for compressed pixel data', () => {
    const frames = [new Uint8Array(FRAME_BYTES).buffer, new Uint8Array(FRAME_BYTES).buffer];
    const dict = makeDicomDict(RLE_LOSSLESS, 'OB', frames);

    const buffer = writeDicomDictToPart10Buffer(dict);
    const result = inspectPixelData(buffer);

    expect(result.encapsulated).toBe(true);
    // 1 Basic Offset Table item + 1 fragment per frame.
    expect(result.totalItems).toBe(frames.length + 1);
    expect(result.fragmentSizes).toHaveLength(frames.length);
    // Each frame stayed in a single fragment despite exceeding the 20KB fragment size.
    result.fragmentSizes.forEach(size => expect(size).toBe(FRAME_BYTES));
  });

  it('does not fragment uncompressed pixel data', () => {
    const pixelData = new Uint16Array(FRAME_BYTES).buffer;
    const dict = makeDicomDict(EXPLICIT_VR_LITTLE_ENDIAN, 'OW', [pixelData]);

    const buffer = writeDicomDictToPart10Buffer(dict);
    const result = inspectPixelData(buffer);

    expect(result.encapsulated).toBe(false);
    expect(result.length).toBe(pixelData.byteLength);
  });

  it('confirms fragmentMultiframe:false is what prevents a single large frame from splitting', () => {
    // Control: with fragmentMultiframe enabled, a >20KB frame splits into multiple
    // fragments — proving DICOM_WRITE_OPTIONS.fragmentMultiframe:false is meaningful.
    const frames = [new Uint8Array(FRAME_BYTES).buffer];
    const dict = makeDicomDict(RLE_LOSSLESS, 'OB', frames);

    const buffer = dict.write({ ...DICOM_WRITE_OPTIONS, fragmentMultiframe: true });
    const result = inspectPixelData(buffer);

    expect(result.encapsulated).toBe(true);
    expect(result.fragmentSizes.length).toBeGreaterThan(1);
  });
});
