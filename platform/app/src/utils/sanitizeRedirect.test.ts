import { sanitizeSameOriginRedirect } from './sanitizeRedirect';

describe('sanitizeSameOriginRedirect', () => {
  const origin = 'https://viewer.example.com';

  it('returns the same href back for an absolute same-origin URL', () => {
    expect(sanitizeSameOriginRedirect('https://viewer.example.com/worklist?a=1', origin)).toBe(
      'https://viewer.example.com/worklist?a=1'
    );
  });

  it('resolves relative paths against the app origin', () => {
    expect(sanitizeSameOriginRedirect('/worklist', origin)).toBe(
      'https://viewer.example.com/worklist'
    );
  });

  it('rejects an absolute cross-origin URL', () => {
    expect(sanitizeSameOriginRedirect('https://evil.example.com/', origin)).toBeUndefined();
  });

  it('rejects a protocol-relative cross-origin URL', () => {
    expect(sanitizeSameOriginRedirect('//evil.example.com/x', origin)).toBeUndefined();
  });

  it('rejects javascript: scheme values', () => {
    expect(sanitizeSameOriginRedirect('javascript:alert(1)', origin)).toBeUndefined();
  });

  it('rejects null and empty values', () => {
    expect(sanitizeSameOriginRedirect(null, origin)).toBeUndefined();
    expect(sanitizeSameOriginRedirect('', origin)).toBeUndefined();
  });

  it('rejects lookalike hosts that merely start with the app host', () => {
    expect(
      sanitizeSameOriginRedirect('https://viewer.example.com.evil.com/', origin)
    ).toBeUndefined();
  });
});
