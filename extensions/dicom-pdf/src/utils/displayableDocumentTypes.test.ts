import {
  getDisplayableDocumentType,
  matchesDocumentSignature,
  normalizeDocumentMimeType,
} from './displayableDocumentTypes';

const bufferFrom = (bytes: number[]) => new Uint8Array(bytes).buffer;

describe('normalizeDocumentMimeType', () => {
  it('lower-cases and strips parameters', () => {
    expect(normalizeDocumentMimeType('Text/HTML; charset=UTF-8')).toBe('text/html');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeDocumentMimeType('  application/pdf  ')).toBe('application/pdf');
  });

  it('returns undefined for missing or empty values', () => {
    expect(normalizeDocumentMimeType(undefined)).toBeUndefined();
    expect(normalizeDocumentMimeType('')).toBeUndefined();
    expect(normalizeDocumentMimeType('   ')).toBeUndefined();
    expect(normalizeDocumentMimeType(42 as unknown as string)).toBeUndefined();
  });
});

describe('getDisplayableDocumentType', () => {
  it('renders pdf through <object>, which cannot be sandboxed', () => {
    const documentType = getDisplayableDocumentType('application/pdf');

    expect(documentType).toMatchObject({ mimeType: 'application/pdf', strategy: 'object' });
    expect(documentType?.sandbox).toBeUndefined();
  });

  it('renders html through a fully restricted sandboxed iframe', () => {
    expect(getDisplayableDocumentType('text/html')).toMatchObject({
      mimeType: 'text/html',
      strategy: 'iframe',
      sandbox: '',
    });
  });

  it('folds application/html onto text/html', () => {
    expect(getDisplayableDocumentType('application/html')).toMatchObject({
      mimeType: 'text/html',
      strategy: 'iframe',
    });
  });

  it('folds non-standard pdf spellings onto application/pdf', () => {
    for (const alias of ['application/x-pdf', 'application/acrobat', 'text/pdf']) {
      expect(getDisplayableDocumentType(alias)).toMatchObject({
        mimeType: 'application/pdf',
        strategy: 'object',
      });
    }
  });

  it('resolves types that carry parameters', () => {
    expect(getDisplayableDocumentType('text/html;charset=iso-8859-1')).toMatchObject({
      mimeType: 'text/html',
    });
  });

  it('rejects types that are not on the allowlist', () => {
    for (const mimeType of [
      'application/octet-stream',
      'image/svg+xml',
      'application/javascript',
      'text/rtf',
      'application/msword',
      undefined,
      '',
    ]) {
      expect(getDisplayableDocumentType(mimeType)).toBeUndefined();
    }
  });
});

describe('matchesDocumentSignature', () => {
  const pdf = getDisplayableDocumentType('application/pdf');
  const html = getDisplayableDocumentType('text/html');

  it('accepts a payload that starts with the type magic number', () => {
    // "%PDF-1.4"
    const payload = bufferFrom([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

    expect(matchesDocumentSignature(pdf, payload)).toBe(true);
  });

  // "%PDF-1.4"
  const pdfHeader = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34];

  it('accepts a pdf whose header follows a UTF-8 BOM', () => {
    const payload = bufferFrom([0xef, 0xbb, 0xbf, ...pdfHeader]);

    expect(matchesDocumentSignature(pdf, payload)).toBe(true);
  });

  it('accepts a pdf whose header starts at the last searched offset', () => {
    // Mainstream readers scan roughly the first 1024 bytes for "%PDF-", so a
    // header this far in is still a file they open.
    const payload = bufferFrom([...new Array(1024).fill(0x20), ...pdfHeader]);

    expect(matchesDocumentSignature(pdf, payload)).toBe(true);
  });

  it('rejects a pdf whose header starts past the search window', () => {
    const payload = bufferFrom([...new Array(1025).fill(0x20), ...pdfHeader]);

    expect(matchesDocumentSignature(pdf, payload)).toBe(false);
  });

  it('rejects a payload declared as pdf that is actually html', () => {
    // "<html>"
    const payload = bufferFrom([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e]);

    expect(matchesDocumentSignature(pdf, payload)).toBe(false);
  });

  it('rejects a payload shorter than the signature', () => {
    expect(matchesDocumentSignature(pdf, bufferFrom([0x25, 0x50]))).toBe(false);
    expect(matchesDocumentSignature(pdf, bufferFrom([]))).toBe(false);
  });

  it('accepts any payload for types with no reliable magic number', () => {
    expect(matchesDocumentSignature(html, bufferFrom([0x3c, 0x68]))).toBe(true);
    expect(matchesDocumentSignature(html, bufferFrom([]))).toBe(true);
  });
});
