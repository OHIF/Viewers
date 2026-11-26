import { loadDisplayableDocument } from './loadDisplayableDocument';

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const HTML_BYTES = new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e]);

const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

/** An instance whose EncapsulatedDocument carries inline base64 content. */
const inlineInstance = (bytes: Uint8Array) => ({
  EncapsulatedDocument: { vr: 'OB', InlineBinary: toBase64(bytes) },
});

/** An instance whose EncapsulatedDocument is fetched through the data source. */
const bulkDataInstance = (bytes: Uint8Array) => {
  const value: Record<string, unknown> = { vr: 'OB', BulkDataURI: 'http://pacs.example/bulk/1' };
  value.retrieveBulkData = jest.fn().mockResolvedValue(bytes.buffer);
  return { EncapsulatedDocument: value };
};

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

/** Captures the Blob handed to createObjectURL so its type can be asserted. */
let createdBlobs: Blob[] = [];

beforeEach(() => {
  createdBlobs = [];
  URL.createObjectURL = jest.fn((blob: Blob) => {
    createdBlobs.push(blob);
    return `blob:mock/${createdBlobs.length}`;
  }) as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = jest.fn() as unknown as typeof URL.revokeObjectURL;
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  jest.restoreAllMocks();
});

describe('loadDisplayableDocument', () => {
  it('uses inline content when the metadata carries it', async () => {
    const instance = inlineInstance(PDF_BYTES);

    const result = await loadDisplayableDocument({ instance, mimeType: 'application/pdf' });

    expect(result.ok).toBe(true);
    expect(createdBlobs).toHaveLength(1);
    expect(createdBlobs[0].type).toBe('application/pdf');
  });

  it('uses inline content that the parser already decoded', async () => {
    const instance = { EncapsulatedDocument: [PDF_BYTES.buffer] };

    const result = await loadDisplayableDocument({ instance, mimeType: 'application/pdf' });

    expect(result.ok).toBe(true);
    expect(createdBlobs[0].type).toBe('application/pdf');
  });

  it('falls back to the data source bulkdata retrieve', async () => {
    const instance = bulkDataInstance(PDF_BYTES);

    const result = await loadDisplayableDocument({ instance, mimeType: 'application/pdf' });

    expect(result.ok).toBe(true);
    expect(instance.EncapsulatedDocument.retrieveBulkData).toHaveBeenCalledWith({
      mediaType: 'application/pdf',
    });
  });

  it('prefers the buffer retrieveBulkData already cached on the value', async () => {
    const instance = bulkDataInstance(PDF_BYTES);
    instance.EncapsulatedDocument.Value = PDF_BYTES.buffer;

    const result = await loadDisplayableDocument({ instance, mimeType: 'application/pdf' });

    expect(result.ok).toBe(true);
    expect(instance.EncapsulatedDocument.retrieveBulkData).not.toHaveBeenCalled();
  });

  it('requests the canonical media type, not the declared spelling', async () => {
    const instance = bulkDataInstance(HTML_BYTES);

    await loadDisplayableDocument({ instance, mimeType: 'application/html' });

    expect(instance.EncapsulatedDocument.retrieveBulkData).toHaveBeenCalledWith({
      mediaType: 'text/html',
    });
    expect(createdBlobs[0].type).toBe('text/html');
  });

  it('ignores the declared spelling and uses the canonical type for the Blob', async () => {
    const result = await loadDisplayableDocument({
      instance: inlineInstance(HTML_BYTES),
      mimeType: 'application/html',
    });

    expect(result).toMatchObject({ ok: true });
    expect(createdBlobs[0].type).toBe('text/html');

    if (result.ok) {
      expect(result.documentType.strategy).toBe('iframe');
      expect(result.documentType.sandbox).toBe('');
    }
  });

  it('refuses a type that is not on the allowlist without retrieving', async () => {
    const instance = bulkDataInstance(PDF_BYTES);

    const result = await loadDisplayableDocument({
      instance,
      mimeType: 'application/octet-stream',
    });

    expect(result).toEqual({
      ok: false,
      reason: 'unsupported-type',
      mimeType: 'application/octet-stream',
    });
    expect(instance.EncapsulatedDocument.retrieveBulkData).not.toHaveBeenCalled();
  });

  it('refuses html content that claims to be a pdf', async () => {
    const result = await loadDisplayableDocument({
      instance: inlineInstance(HTML_BYTES),
      mimeType: 'application/pdf',
    });

    expect(result).toEqual({
      ok: false,
      reason: 'signature-mismatch',
      mimeType: 'application/pdf',
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('reports a failed retrieve', async () => {
    const instance = bulkDataInstance(PDF_BYTES);
    instance.EncapsulatedDocument.retrieveBulkData = jest.fn().mockRejectedValue(new Error('boom'));

    const result = await loadDisplayableDocument({ instance, mimeType: 'application/pdf' });

    expect(result).toEqual({ ok: false, reason: 'retrieve-failed' });
  });

  it('reports an empty payload as a failed retrieve', async () => {
    const instance = bulkDataInstance(new Uint8Array([]));

    const result = await loadDisplayableDocument({ instance, mimeType: 'application/pdf' });

    expect(result).toEqual({ ok: false, reason: 'retrieve-failed' });
  });

  it('reports a value with no inline content and no bulkdata retrieve', async () => {
    const instance = { EncapsulatedDocument: { vr: 'OB' } };

    const result = await loadDisplayableDocument({ instance, mimeType: 'application/pdf' });

    expect(result).toEqual({ ok: false, reason: 'retrieve-failed' });
  });

  it('reports a missing tag without retrieving', async () => {
    const result = await loadDisplayableDocument({ instance: {}, mimeType: 'application/pdf' });

    expect(result).toEqual({ ok: false, reason: 'retrieve-failed' });
  });

  it('reports an aborted load and creates no object url', async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await loadDisplayableDocument(
      { instance: inlineInstance(PDF_BYTES), mimeType: 'application/pdf' },
      { signal: controller.signal }
    );

    expect(result).toEqual({ ok: false, reason: 'aborted' });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('revokes only once however many times revoke is called', async () => {
    const result = await loadDisplayableDocument({
      instance: inlineInstance(PDF_BYTES),
      mimeType: 'application/pdf',
    });

    if (!result.ok) {
      throw new Error('expected the document to load');
    }

    result.revoke();
    result.revoke();

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});
