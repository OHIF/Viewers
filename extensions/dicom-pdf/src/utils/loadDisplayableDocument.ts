import {
  DisplayableDocumentType,
  getDisplayableDocumentType,
  matchesDocumentSignature,
} from './displayableDocumentTypes';

export type DocumentLoadFailureReason =
  | 'unsupported-type'
  | 'signature-mismatch'
  | 'retrieve-failed'
  | 'aborted';

export type LoadedDocument =
  | {
      ok: true;
      url: string;
      documentType: DisplayableDocumentType;
      revoke: () => void;
    }
  | {
      ok: false;
      reason: DocumentLoadFailureReason;
      mimeType?: string;
    };

type LoadDisplayableDocumentParams = {
  instance?: Record<string, unknown>;
  mimeType?: string;
  tag?: string;
};

type LoadDisplayableDocumentOptions = {
  signal?: AbortSignal;
};

/**
 * Resolves an encapsulated document into something safe to embed.
 *
 * The payload comes from the instance the same way every other bulkdata value
 * does: inline content when the metadata carries it, otherwise the data
 * source's own `retrieveBulkData`, which the data source binds onto the value
 * and which caches the resolved buffer on `value.Value`. This is the path the
 * video display sets take, so authentication, bulkdata URI resolution and
 * caching all behave identically here.
 *
 * The bytes are then wrapped in a Blob whose type comes from the allowlist
 * rather than from the instance. That is the type guarantee: after this point
 * neither MIMETypeOfEncapsulatedDocument nor the origin server's Content-Type
 * has any say in how the browser interprets the payload, so a document cannot
 * be steered into being parsed as something it is not.
 */
export async function loadDisplayableDocument(
  { instance, mimeType, tag = 'EncapsulatedDocument' }: LoadDisplayableDocumentParams,
  { signal }: LoadDisplayableDocumentOptions = {}
): Promise<LoadedDocument> {
  const documentType = getDisplayableDocumentType(mimeType);

  if (!documentType) {
    return { ok: false, reason: 'unsupported-type', mimeType };
  }

  const value = instance?.[tag];

  if (!value) {
    return { ok: false, reason: 'retrieve-failed' };
  }

  if (signal?.aborted) {
    return { ok: false, reason: 'aborted' };
  }

  let payload: ArrayBuffer | undefined;

  try {
    payload = await readDocumentBytes(value, documentType.mimeType);
  } catch (error) {
    console.warn('Failed to retrieve encapsulated document', error);
    return { ok: false, reason: 'retrieve-failed' };
  }

  if (!payload?.byteLength) {
    return { ok: false, reason: 'retrieve-failed' };
  }

  if (signal?.aborted) {
    return { ok: false, reason: 'aborted' };
  }

  if (!matchesDocumentSignature(documentType, payload)) {
    return { ok: false, reason: 'signature-mismatch', mimeType: documentType.mimeType };
  }

  const objectUrl = URL.createObjectURL(new Blob([payload], { type: documentType.mimeType }));

  if (signal?.aborted) {
    URL.revokeObjectURL(objectUrl);
    return { ok: false, reason: 'aborted' };
  }

  return {
    ok: true,
    url: objectUrl,
    documentType,
    revoke: createRevokeOnce(objectUrl),
  };
}

/**
 * Reads the document bytes off a naturalized bulkdata value, preferring
 * whatever is already in hand. Mirrors the resolution order in
 * `resolveBulkDataTags`, which is how the rest of the app reads bulkdata.
 */
async function readDocumentBytes(value, mimeType: string): Promise<ArrayBuffer | undefined> {
  // Inline content delivered as base64 in the metadata.
  if (value.InlineBinary) {
    return base64ToArrayBuffer(value.InlineBinary);
  }

  // Inline content that the parser already decoded, e.g. `[ArrayBuffer]`.
  if (Array.isArray(value)) {
    return toArrayBuffer(value[0]);
  }

  // retrieveBulkData caches the resolved buffer here, so prefer it over
  // re-requesting the payload.
  if (value.Value) {
    return toArrayBuffer(Array.isArray(value.Value) ? value.Value[0] : value.Value);
  }

  // Otherwise ask the data source, exactly as any other bulkdata value does.
  if (typeof value.retrieveBulkData === 'function') {
    const retrieved = await value.retrieveBulkData({ mediaType: mimeType });
    return toArrayBuffer(retrieved);
  }

  return undefined;
}

function toArrayBuffer(raw): ArrayBuffer | undefined {
  // Check views first: ArrayBuffer.isView is realm-agnostic.
  if (ArrayBuffer.isView(raw)) {
    const view = raw as ArrayBufferView;
    return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
  }

  // `instanceof ArrayBuffer` is realm-specific, so fall back to a tag check so
  // that buffers created in another realm (workers, tests) are still handled.
  if (
    raw instanceof ArrayBuffer ||
    Object.prototype.toString.call(raw) === '[object ArrayBuffer]'
  ) {
    return raw as ArrayBuffer;
  }

  return undefined;
}

/**
 * Decodes base64 inline content to bytes. `utils.b64toBlob` produces a Blob,
 * but the signature check needs the bytes before a Blob is created - and the
 * Blob has to be built from the allowlist type, not from a declared one.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function createRevokeOnce(objectUrl: string) {
  let revoked = false;

  return () => {
    if (revoked) {
      return;
    }

    URL.revokeObjectURL(objectUrl);
    revoked = true;
  };
}
