/**
 * A static registry of DICOM tags whose values must be resolved from bulkdata
 * into plain numbers during metadata ingestion, before INSTANCES_ADDED fires.
 *
 * Background: some servers return small scalar values - notably the Philips
 * SUV Scale Factor (7053,1000) and Activity Concentration Scale Factor
 * (7053,1009) - as bulkdata rather than inline. dcmjs `naturalizeDataset` then
 * leaves them as `{ BulkDataURI: '...' }` objects, in the private block of
 * dcmjs 1.0 (`'7053:Philips PET Private Group'.x00`) or under the hex key.
 * Downstream consumers (e.g. SUV scaling via calculate-suv) expect numbers and
 * silently corrupt when handed an object, so data sources resolve the
 * registered tags eagerly so that every subscriber reads a fully-resolved
 * number.
 *
 * The registry is intentionally not tied to any data source: it is a static
 * list that any data source can consume via `resolveBulkDataTags`, and that
 * extensions can extend via `registerResolvedBulkDataTags`.
 *
 * Resolution reuses the `retrieveBulkData` method that data sources bind onto
 * each bulkdata value; when it is absent the value is left untouched and
 * consumers fall back gracefully.
 */
import { findPrivateTag } from '@cornerstonejs/utils';
import type { PrivateTagLocation } from '@cornerstonejs/utils';

/** A tag to resolve: the 8-digit hex tag, and the private creator of a private tag. */
export type ResolvedBulkDataTag = { tag: string; creator?: string };

const PHILIPS_PET = 'Philips PET Private Group';

// Upper-case hex tag -> private creator (undefined for a tag with no creator).
// Seeded with the Philips PET Private Group scalar tags; both are VR DS in the
// standard Philips definition, but the VR is auto-detected (see decode below)
// because servers occasionally encode them as FL/FD.
const resolvedBulkDataTags = new Map<string, string | undefined>([
  ['70531000', PHILIPS_PET], // Philips SUV Scale Factor
  ['70531009', PHILIPS_PET], // Philips Activity Concentration Scale Factor
]);

/**
 * Registers additional tags to be resolved from bulkdata during metadata
 * ingestion: an 8-digit hex tag (`'00091001'`), or `{ tag, creator }` for a
 * private tag. With a creator, the tag is found by its group, its creator and
 * its element number (`getPrivateTagValue` rules), so the xx block digits of
 * the hex tag do not matter, and the value is found in a dcmjs 1.0 private
 * block also after a copy of the instance.
 */
export function registerResolvedBulkDataTags(
  tags: string | ResolvedBulkDataTag | Array<string | ResolvedBulkDataTag>
): void {
  const list = Array.isArray(tags) ? tags : [tags];
  for (const entry of list) {
    const { tag, creator } = typeof entry === 'string' ? { tag: entry, creator: undefined } : entry;
    if (typeof tag === 'string' && tag.length) {
      resolvedBulkDataTags.set(tag.toUpperCase(), creator);
    }
  }
}

/**
 * Returns the tags currently registered for eager bulkdata resolution.
 */
export function getResolvedBulkDataTags(): string[] {
  return [...resolvedBulkDataTags.keys()];
}

function toUint8(raw: unknown): Uint8Array | undefined {
  // Check views first: ArrayBuffer.isView is realm-agnostic.
  if (ArrayBuffer.isView(raw)) {
    const view = raw as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  // `instanceof ArrayBuffer` is realm-specific, so fall back to a tag check so
  // that buffers created in another realm (workers, tests) are still handled.
  if (
    raw instanceof ArrayBuffer ||
    Object.prototype.toString.call(raw) === '[object ArrayBuffer]'
  ) {
    return new Uint8Array(raw as ArrayBuffer);
  }
  return undefined;
}

// A DS/IS value is printable ASCII (digits, sign, decimal point, exponent,
// backslash separator, spaces, null padding); raw FL/FD bytes generally are
// not. This lets us auto-detect the encoding without trusting a VR field, which
// dcmjs drops when a value is delivered as bulkdata.
function isPrintableNumeric(bytes: Uint8Array): boolean {
  if (bytes.length === 0) {
    return false;
  }
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    const isDigit = b >= 0x30 && b <= 0x39; // 0-9
    const isAllowed =
      b === 0x2b || // +
      b === 0x2d || // -
      b === 0x2e || // .
      b === 0x45 || // E
      b === 0x65 || // e
      b === 0x5c || // backslash (multi-value separator)
      b === 0x20 || // space (padding)
      b === 0x00; // null (padding)
    if (!isDigit && !isAllowed) {
      return false;
    }
  }
  return true;
}

function decodeText(bytes: Uint8Array): number | undefined {
  // `String.trim()` strips ASCII/Unicode whitespace but NOT NUL (0x00), which
  // `isPrintableNumeric` treats as valid padding, so strip NULs explicitly -
  // otherwise a NUL-padded value like "0.00038\0" survives as NaN.
  const text = new TextDecoder().decode(bytes).replace(/\0+/g, '').trim();
  // DS/IS may be multi-valued (backslash-delimited); take the first value.
  const first = text.split('\\')[0].trim();
  if (!first) {
    return undefined;
  }
  const n = Number(first);
  return Number.isFinite(n) ? n : undefined;
}

function decodeBinaryFloat(bytes: Uint8Array): number | undefined {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let n: number | undefined;
  if (bytes.byteLength === 4) {
    n = dv.getFloat32(0, /* littleEndian */ true);
  } else if (bytes.byteLength === 8) {
    n = dv.getFloat64(0, /* littleEndian */ true);
  }
  return n !== undefined && Number.isFinite(n) ? n : undefined;
}

/**
 * Decodes a bulkdata buffer into a single number. The VR is not available on a
 * naturalized bulkdata value (dcmjs drops it), so the encoding is auto-detected:
 * printable-ASCII payloads are decoded as DS/IS text, otherwise the bytes are
 * read as little-endian IEEE-754 (FL = 4 bytes, FD = 8 bytes).
 */
export function decodeNumericBulkData(raw: unknown): number | undefined {
  const bytes = toUint8(raw);
  if (!bytes || bytes.byteLength === 0) {
    return undefined;
  }
  if (isPrintableNumeric(bytes)) {
    return decodeText(bytes);
  }
  return decodeBinaryFloat(bytes) ?? decodeText(bytes);
}

async function resolveValueToNumber(value): Promise<number | undefined> {
  // retrieveBulkData caches the resolved buffer on value.Value, so prefer it.
  let buffer = value.Value;
  if (buffer == null && typeof value.retrieveBulkData === 'function') {
    buffer = await value.retrieveBulkData();
  }
  if (buffer == null) {
    return undefined;
  }
  return decodeNumericBulkData(buffer);
}

/**
 * The place of a registered tag in an instance: with a creator, the element of
 * that creator (the dcmjs 1.0 block or the hex-key form, see `findPrivateTag`);
 * otherwise, or when the creator is absent, the hex key in either casing.
 */
function locateTag(instance, tag: string, creator?: string): PrivateTagLocation {
  const location = creator && findPrivateTag(instance, tag.slice(0, 4), creator, tag.slice(6, 8));
  if (location) {
    return location;
  }
  return { container: instance, key: tag in instance ? tag : tag.toLowerCase() };
}

/**
 * Resolves, in place, the registered bulkdata tags on a single naturalized
 * instance. No-op for values that are already numbers or that have no
 * resolvable bulkdata. The number is written where the value was found, so a
 * value in a dcmjs 1.0 private block stays in the block and survives a copy.
 */
async function resolveInstance(instance): Promise<void> {
  if (!instance) {
    return;
  }

  await Promise.all(
    [...resolvedBulkDataTags].map(async ([tag, creator]) => {
      const { container, key } = locateTag(instance, tag, creator);
      const value = container[key];
      // Inline (already a number) or absent: nothing to resolve.
      if (value == null || typeof value !== 'object') {
        return;
      }
      try {
        const num = await resolveValueToNumber(value);
        if (num !== undefined) {
          container[key] = num;
        }
      } catch (error) {
        console.warn(`resolveBulkDataTags: failed to resolve tag ${tag}`, error);
      }
    })
  );
}

/**
 * Resolves the registered bulkdata tags across a set of naturalized
 * instances, mutating them in place.
 */
export async function resolveBulkDataTags(instances): Promise<void> {
  if (!Array.isArray(instances) || !instances.length) {
    return;
  }
  await Promise.all(instances.map(resolveInstance));
}

export default resolveBulkDataTags;
