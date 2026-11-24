import { isOriginAllowed } from './isOriginAllowed';

describe('isOriginAllowed', () => {
  const url = new URL('https://cdn.example.com/plugins/a.js');

  it('allows the origin of a full-URL entry', () => {
    expect(isOriginAllowed(url, ['https://cdn.example.com/some/path/'])).toBe(true);
  });

  it('treats a different port as a different origin', () => {
    expect(isOriginAllowed(url, ['https://cdn.example.com:8443'])).toBe(false);
  });

  it('skips a malformed entry instead of failing', () => {
    expect(isOriginAllowed(url, ['%%%', 'https://cdn.example.com'])).toBe(true);
  });

  it('allows nothing when the list is empty', () => {
    expect(isOriginAllowed(url, [])).toBe(false);
  });
});
