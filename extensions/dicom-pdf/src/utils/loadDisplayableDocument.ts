import {
  DisplayableDocumentType,
  getDisplayableDocumentType,
  matchesDocumentSignature,
} from './displayableDocumentTypes';

export type DocumentLoadFailureReason =
  | 'unsupported-type'
  | 'signature-mismatch'
  | 'fetch-failed'
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
  url?: string | null;
  mimeType?: string;
  signal?: AbortSignal;
};

/**
 * Resolves a document URL into something safe to embed.
 *
 * The payload is always read into memory and re-wrapped in a Blob whose type
 * this module chooses from the allowlist. That is the type guarantee: after
 * this point neither MIMETypeOfEncapsulatedDocument nor the origin server's
 * Content-Type has any say in how the browser interprets the bytes, so a
 * document cannot be steered into being parsed as something it is not.
 *
 * Reading the whole payload is also what makes the signature check possible,
 * and it removes the origin server's framing headers from the picture. The
 * cost is that documents no longer stream or range-request; encapsulated
 * reports are small enough that this is a fair trade.
 */
export async function loadDisplayableDocument({
  url,
  mimeType,
  signal,
}: LoadDisplayableDocumentParams): Promise<LoadedDocument> {
  const documentType = getDisplayableDocumentType(mimeType);

  if (!documentType) {
    return { ok: false, reason: 'unsupported-type', mimeType };
  }

  if (!url) {
    return { ok: false, reason: 'fetch-failed' };
  }

  if (signal?.aborted) {
    return { ok: false, reason: 'aborted' };
  }

  let payload: ArrayBuffer;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      console.warn(`document fetch failed with status ${response.status}`);
      return { ok: false, reason: 'fetch-failed' };
    }

    payload = await response.arrayBuffer();
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') {
      return { ok: false, reason: 'aborted' };
    }

    console.warn('document fetch failed', error);
    return { ok: false, reason: 'fetch-failed' };
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
