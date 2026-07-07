/**
 * A static registry of DICOM tags whose values must be resolved from bulkdata
 * into plain numbers during metadata ingestion, before INSTANCES_ADDED fires.
 *
 * Background: some servers return small scalar values - notably the Philips
 * SUV Scale Factor (7053,1000) and Activity Concentration Scale Factor
 * (7053,1009) - as bulkdata rather than inline. dcmjs `naturalizeDataset` then
 * leaves them as `{ BulkDataURI: '...' }` objects under their raw hex key.
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

// Tags that may arrive as bulkdata and must be resolved to numbers, keyed by
// the naturalized (comma-less) hex tag. Seeded with the Philips PET Private
// Group scalar tags; both are VR DS in the standard Philips definition, but
// the VR is auto-detected (see decode below) because servers occasionally
// encode them as FL/FD.
const resolvedBulkDataTags = new Set<string>([
  '70531000', // Philips SUV Scale Factor
  '70531009', // Philips Activity Concentration Scale Factor
]);

/**
 * Registers additional tags (naturalized comma-less hex form, e.g.
 * '70531000') to be resolved from bulkdata during metadata ingestion.
 */
export function registerResolvedBulkDataTags(tags: string | string[]): void {
  const list = Array.isArray(tags) ? tags : [tags];
  for (const tag of list) {
    if (typeof tag === 'string' && tag.length) {
      resolvedBulkDataTags.add(tag.toUpperCase());
    }
  }
}

/**
 * Returns the tags currently registered for eager bulkdata resolution.
 */
export function getResolvedBulkDataTags(): string[] {
  return [...resolvedBulkDataTags];
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
  const text = new TextDecoder().decode(bytes).trim();
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
 * Resolves, in place, the registered bulkdata tags on a single naturalized
 * instance. No-op for values that are already numbers or that have no
 * resolvable bulkdata.
 */
async function resolveInstance(instance): Promise<void> {
  if (!instance) {
    return;
  }

  await Promise.all(
    [...resolvedBulkDataTags].map(async tag => {
      // Registered tags are normalized to uppercase hex; naturalized datasets
      // key unknown private tags by their hex tag, so check both casings.
      const key = tag in instance ? tag : tag.toLowerCase();
      const value = instance[key];
      // Inline (already a number) or absent: nothing to resolve.
      if (value == null || typeof value !== 'object') {
        return;
      }
      try {
        const num = await resolveValueToNumber(value);
        if (num !== undefined) {
          instance[key] = num;
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
