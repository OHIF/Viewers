import { loadDisplayableDocument } from './loadDisplayableDocument';

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const HTML_BYTES = new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e]);

const originalFetch = global.fetch;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

const mockFetch = (bytes: Uint8Array, ok = true, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    arrayBuffer: jest.fn().mockResolvedValue(bytes.buffer),
  }) as unknown as typeof fetch;
};

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
  global.fetch = originalFetch;
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  jest.restoreAllMocks();
});

describe('loadDisplayableDocument', () => {
  it('re-wraps the payload in a Blob of the canonical type', async () => {
    mockFetch(PDF_BYTES);

    const result = await loadDisplayableDocument({
      url: 'http://pacs.example/doc',
      mimeType: 'application/pdf',
    });

    expect(result.ok).toBe(true);
    expect(createdBlobs).toHaveLength(1);
    expect(createdBlobs[0].type).toBe('application/pdf');
  });

  it('ignores the declared spelling and uses the canonical type for the Blob', async () => {
    mockFetch(HTML_BYTES);

    const result = await loadDisplayableDocument({
      url: 'http://pacs.example/doc',
      mimeType: 'application/html',
    });

    expect(result).toMatchObject({ ok: true });
    expect(createdBlobs[0].type).toBe('text/html');

    if (result.ok) {
      expect(result.documentType.strategy).toBe('iframe');
      expect(result.documentType.sandbox).toBe('');
    }
  });

  it('refuses a type that is not on the allowlist without fetching', async () => {
    mockFetch(PDF_BYTES);

    const result = await loadDisplayableDocument({
      url: 'http://pacs.example/doc',
      mimeType: 'application/octet-stream',
    });

    expect(result).toEqual({
      ok: false,
      reason: 'unsupported-type',
      mimeType: 'application/octet-stream',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('refuses html content that claims to be a pdf', async () => {
    mockFetch(HTML_BYTES);

    const result = await loadDisplayableDocument({
      url: 'http://pacs.example/doc',
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
    mockFetch(PDF_BYTES, false, 404);

    const result = await loadDisplayableDocument({
      url: 'http://pacs.example/doc',
      mimeType: 'application/pdf',
    });

    expect(result).toEqual({ ok: false, reason: 'fetch-failed' });
  });

  it('reports a missing url without fetching', async () => {
    mockFetch(PDF_BYTES);

    const result = await loadDisplayableDocument({ url: undefined, mimeType: 'application/pdf' });

    expect(result).toEqual({ ok: false, reason: 'fetch-failed' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('reports an aborted load and revokes nothing', async () => {
    mockFetch(PDF_BYTES);
    const controller = new AbortController();
    controller.abort();

    const result = await loadDisplayableDocument({
      url: 'http://pacs.example/doc',
      mimeType: 'application/pdf',
      signal: controller.signal,
    });

    expect(result).toEqual({ ok: false, reason: 'aborted' });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('revokes only once however many times revoke is called', async () => {
    mockFetch(PDF_BYTES);

    const result = await loadDisplayableDocument({
      url: 'http://pacs.example/doc',
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
