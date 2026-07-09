import { TextEncoder, TextDecoder } from 'util';
import dcmjs from 'dcmjs';
import {
  DICOM_WRITE_OPTIONS,
  datasetToDicomPart10Buffer,
  writeDicomDictToPart10Buffer,
} from './dicomWriter';

// jsdom does not expose TextEncoder/TextDecoder, which dcmjs's buffer streams need.
if (typeof (global as { TextEncoder?: unknown }).TextEncoder === 'undefined') {
  (global as { TextEncoder?: unknown }).TextEncoder = TextEncoder;
}
if (typeof (global as { TextDecoder?: unknown }).TextDecoder === 'undefined') {
  (global as { TextDecoder?: unknown }).TextDecoder = TextDecoder;
}

const RLE_LOSSLESS = '1.2.840.10008.1.2.5';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';
const IMPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2';
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

/**
 * Byte-level walk of the file meta group. Returns the meta element tags in file
 * order and asserts that FileMetaInformationGroupLength spans them exactly.
 */
function readFileMetaTags(arrayBuffer: ArrayBuffer) {
  const dv = new DataView(arrayBuffer);

  // Preamble(128) + 'DICM'(4), then (0002,0000) UL <groupLength> must come first.
  expect(dv.getUint16(132, true)).toBe(0x0002);
  expect(dv.getUint16(134, true)).toBe(0x0000);
  const groupLength = dv.getUint32(140, true);
  const end = 144 + groupLength;

  const tags: string[] = [];
  let p = 144;
  while (p < end) {
    const group = dv.getUint16(p, true);
    const element = dv.getUint16(p + 2, true);
    const vr = String.fromCharCode(dv.getUint8(p + 4), dv.getUint8(p + 5));

    // File meta is always Explicit VR Little Endian.
    let length: number;
    if (['OB', 'OW', 'OF', 'SQ', 'UT', 'UN'].includes(vr)) {
      length = dv.getUint32(p + 8, true);
      p += 12 + length;
    } else {
      length = dv.getUint16(p + 6, true);
      p += 8 + length;
    }

    tags.push(
      `${group.toString(16).padStart(4, '0')}${element.toString(16).padStart(4, '0')}`
    );
  }

  // The declared group length covers the meta elements exactly — a garbage
  // element counted into it (or omitted from it) would break this.
  expect(p).toBe(end);

  return tags;
}

function makeNaturalizedDataset(meta) {
  return {
    _meta: meta,
    SOPClassUID: '1.2.840.10008.5.1.4.1.1.88.33',
    SOPInstanceUID: '1.2.3.4.5',
    StudyInstanceUID: '1.2.3.4',
    SeriesInstanceUID: '1.2.3.4.1',
    Modality: 'SR',
    PatientID: 'TEST-PATIENT',
  };
}

describe('datasetToDicomPart10Buffer file meta', () => {
  it('writes only group-0002 elements (no garbage (0000,0000) tag) into the file meta', () => {
    const dataset = makeNaturalizedDataset({
      TransferSyntaxUID: { vr: 'UI', Value: [EXPLICIT_VR_LITTLE_ENDIAN] },
    });

    const buffer = datasetToDicomPart10Buffer(dataset);

    const tags = readFileMetaTags(buffer);
    expect(tags.length).toBeGreaterThan(0);
    tags.forEach(tag => expect(tag.startsWith('0002')).toBe(true));
    // Elements must appear in ascending tag order within group 2.
    expect(tags).toEqual([...tags].sort());

    const reread = dcmjs.data.DicomMessage.readFile(buffer);
    const metaKeys = Object.keys(reread.meta);
    expect(metaKeys).not.toContain('00000000');
    metaKeys.forEach(key => expect(key.startsWith('0002')).toBe(true));
    expect(reread.meta['00020010'].Value).toEqual([EXPLICIT_VR_LITTLE_ENDIAN]);
  });

  it('honors a plain-string _meta.TransferSyntaxUID that dcmjs alone would default away', () => {
    // dcmjs datasetToDict only reads the object form (_meta.TransferSyntaxUID.Value[0])
    // and silently falls back to Explicit VR LE for a plain string — the hex-key
    // assignment in applyTransferSyntaxToFileMeta is what preserves it.
    const dataset = makeNaturalizedDataset({
      TransferSyntaxUID: IMPLICIT_VR_LITTLE_ENDIAN,
    });

    const buffer = datasetToDicomPart10Buffer(dataset);

    const tags = readFileMetaTags(buffer);
    tags.forEach(tag => expect(tag.startsWith('0002')).toBe(true));

    const reread = dcmjs.data.DicomMessage.readFile(buffer);
    expect(Object.keys(reread.meta)).not.toContain('00000000');
    expect(reread.meta['00020010'].Value).toEqual([IMPLICIT_VR_LITTLE_ENDIAN]);
    // The dataset body survives a round trip under the preserved syntax.
    expect(reread.dict['00080018'].Value).toEqual(['1.2.3.4.5']);
  });
});
