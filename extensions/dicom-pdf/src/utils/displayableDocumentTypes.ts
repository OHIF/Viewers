/**
 * The set of encapsulated-document MIME types this extension is willing to put
 * in front of a user, and how each one is embedded.
 *
 * MIMETypeOfEncapsulatedDocument is supplied by whoever produced the instance,
 * so it is treated here as a claim to be checked rather than an instruction to
 * be followed. A type that is not on this list is not rendered at all.
 */

/**
 * How a document is embedded in the viewport.
 *
 * 'object' - <object>. The browsers' built-in PDF viewers refuse to run inside
 *   a sandboxed browsing context: in Chrome a PDF renders under no sandbox at
 *   all and under none of the token combinations, including the fully
 *   permissive `allow-scripts allow-same-origin`. PDFs therefore cannot be
 *   sandboxed, and their safety rests entirely on the type guarantee that
 *   loadDisplayableDocument applies (canonical Blob type + signature check).
 *
 * 'iframe' - <iframe sandbox>. Markup types render correctly inside a sandbox,
 *   so they get one. The default is the empty sandbox: no tokens, scripts
 *   inert, opaque origin, no access to the viewer's storage or DOM.
 */
export type DocumentEmbedStrategy = 'object' | 'iframe';

export type DisplayableDocumentType = {
  /** Canonical type forced onto the Blob handed to the browser. */
  mimeType: string;
  strategy: DocumentEmbedStrategy;
  /** sandbox attribute value; only meaningful for the 'iframe' strategy. */
  sandbox?: string;
  /** Magic number every payload of this type has to carry, when the type has a
   *  reliable one. Types without one rely on the sandbox instead. */
  signature?: number[];
  /** How far into the payload the signature is allowed to start. Absent means
   *  offset 0 - see PDF_SIGNATURE_SEARCH_LIMIT for why a type wants slack. */
  signatureSearchLimit?: number;
};

/**
 * Real files do not always put their magic number at byte 0, and readers that
 * accept them anyway are the reason such files exist in the wild.
 *
 * PDF: ISO 32000-1 requires "%PDF-" at the start of the file, but Adobe's own
 * implementation note relaxes this to anywhere within the first 1024 bytes, and
 * every mainstream reader follows suit. Producers that write a UTF-8 BOM, or
 * that prepend junk before the header, therefore produce files that open
 * everywhere except here. Matching the 1024-byte allowance keeps the check
 * doing its actual job - catching a payload that is not a PDF at all, which is
 * how a document declared as PDF but containing markup gets rejected - without
 * failing valid documents over leading bytes the renderer will skip anyway.
 */
const PDF_SIGNATURE_SEARCH_LIMIT = 1024;

/**
 * Canonical entries, keyed by canonical MIME type. Exported so downstream
 * deployments can extend the list; adding an entry means asserting both that
 * the browser renders that type inline and that the chosen strategy contains it.
 */
export const DISPLAYABLE_DOCUMENT_TYPES: Record<string, DisplayableDocumentType> = {
  'application/pdf': {
    mimeType: 'application/pdf',
    strategy: 'object',
    signature: [0x25, 0x50, 0x44, 0x46, 0x2d], // "%PDF-"
    signatureSearchLimit: PDF_SIGNATURE_SEARCH_LIMIT,
  },
  'text/html': {
    mimeType: 'text/html',
    strategy: 'iframe',
    sandbox: '',
  },
  'application/xhtml+xml': {
    mimeType: 'application/xhtml+xml',
    strategy: 'iframe',
    sandbox: '',
  },
  'text/xml': {
    mimeType: 'text/xml',
    strategy: 'iframe',
    sandbox: '',
  },
  'application/xml': {
    mimeType: 'application/xml',
    strategy: 'iframe',
    sandbox: '',
  },
  'text/plain': {
    mimeType: 'text/plain',
    strategy: 'iframe',
    sandbox: '',
  },
};

/**
 * Non-standard spellings seen in real instances, folded onto their canonical
 * entry. Accepting an alias is safe because the canonical entry decides both
 * the Blob type and the signature the payload has to satisfy.
 */
export const DOCUMENT_MIME_TYPE_ALIASES: Record<string, string> = {
  'application/html': 'text/html',
  'application/x-pdf': 'application/pdf',
  'application/acrobat': 'application/pdf',
  'text/pdf': 'application/pdf',
  'application/xhtml': 'application/xhtml+xml',
};

/**
 * Lower-cases and strips any parameters (`text/html; charset=utf-8`).
 */
export function normalizeDocumentMimeType(rawMimeType?: string): string | undefined {
  if (typeof rawMimeType !== 'string') {
    return undefined;
  }

  const normalized = rawMimeType.split(';')[0].trim().toLowerCase();

  return normalized || undefined;
}

/**
 * Resolves a declared MIME type to its allowlist entry, or undefined when the
 * type is not one this extension will display.
 */
export function getDisplayableDocumentType(
  rawMimeType?: string
): DisplayableDocumentType | undefined {
  const normalized = normalizeDocumentMimeType(rawMimeType);

  if (!normalized) {
    return undefined;
  }

  const canonical = DOCUMENT_MIME_TYPE_ALIASES[normalized] ?? normalized;

  return DISPLAYABLE_DOCUMENT_TYPES[canonical];
}

/**
 * Checks a payload against its type's magic number, allowing the signature to
 * start anywhere within `signatureSearchLimit` bytes of the payload. Types that
 * have no reliable signature pass, since for those the sandbox rather than the
 * content check is what contains the document.
 */
export function matchesDocumentSignature(
  documentType: DisplayableDocumentType,
  payload: ArrayBuffer
): boolean {
  const { signature, signatureSearchLimit = 0 } = documentType;

  if (!signature?.length) {
    return true;
  }

  if (payload.byteLength < signature.length) {
    return false;
  }

  // Only the window the signature could still start in needs reading, and it is
  // bounded, so an oversized document costs the same as a small one.
  const lastStart = Math.min(signatureSearchLimit, payload.byteLength - signature.length);
  const head = new Uint8Array(payload, 0, lastStart + signature.length);

  for (let start = 0; start <= lastStart; start++) {
    if (signature.every((byte, index) => head[start + index] === byte)) {
      return true;
    }
  }

  return false;
}
