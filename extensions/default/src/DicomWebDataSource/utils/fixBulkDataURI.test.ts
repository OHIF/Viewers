import { fixBulkDataURI } from './fixBulkDataURI';

const instance = { StudyInstanceUID: '1.2.3', SeriesInstanceUID: '4.5.6' };
const absRoot = 'https://viewer.example.com/dicomweb';
const relRoot = '/dicomweb';

function fix(BulkDataURI: string, config: Record<string, unknown> = {}) {
  const value = { BulkDataURI };
  fixBulkDataURI(value, instance, { wadoRoot: absRoot, ...config });
  return value.BulkDataURI;
}

describe('fixBulkDataURI', () => {
  it('leaves an absolute URI unchanged without configuration', () => {
    expect(fix('http://pacs.example.com/bulk/1')).toBe('http://pacs.example.com/bulk/1');
  });

  it('applies transform to an absolute URI', () => {
    const bulkDataURI = { transform: (uri: string) => uri.replace(/^http:/, 'https:') };
    expect(fix('http://pacs.example.com/bulk/1', { bulkDataURI })).toBe(
      'https://pacs.example.com/bulk/1'
    );
  });

  it.each([
    [absRoot, 'https://viewer.example.com/pacs/bulk/1'],
    [relRoot, '/pacs/bulk/1'],
  ])('resolves a transform result of /path against wadoRoot %s', (wadoRoot, expected) => {
    const bulkDataURI = {
      transform: (uri: string) => uri.replace('http://pacs.example.com', '/pacs'),
    };
    expect(fix('http://pacs.example.com/bulk/1', { wadoRoot, bulkDataURI })).toBe(expected);
  });

  it('applies transform to a /path URI with a relative wadoRoot', () => {
    const bulkDataURI = { transform: (uri: string) => `/pacs${uri}` };
    expect(fix('/bulk/1', { wadoRoot: relRoot, bulkDataURI })).toBe('/pacs/bulk/1');
  });

  it.each([
    [absRoot, 'https://viewer.example.com/orthanc/dicom-web/bulk/1'],
    [relRoot, '/orthanc/dicom-web/bulk/1'],
  ])('replaces startsWith with prefixWith for wadoRoot %s', (wadoRoot, expected) => {
    const bulkDataURI = { startsWith: 'http://localhost/', prefixWith: '/orthanc/' };
    expect(fix('http://localhost/dicom-web/bulk/1', { wadoRoot, bulkDataURI })).toBe(expected);
  });

  it.each([
    [absRoot, 'https://viewer.example.com/bulk/1'],
    [relRoot, '/bulk/1'],
  ])('resolves /path against wadoRoot %s', (wadoRoot, expected) => {
    expect(fix('/bulk/1', { wadoRoot })).toBe(expected);
  });

  it.each([
    ['bulkdata/1', undefined, `${absRoot}/studies/1.2.3/bulkdata/1`],
    ['series/4.5.6/bulk/1', undefined, `${absRoot}/studies/1.2.3/series/4.5.6/bulk/1`],
    [
      'instances/7.8.9/bulk/1',
      undefined,
      `${absRoot}/studies/1.2.3/series/4.5.6/instances/7.8.9/bulk/1`,
    ],
    ['bulk/1', undefined, `${absRoot}/studies/1.2.3/series/4.5.6/bulk/1`],
    ['bulk/1', 'studies', `${absRoot}/studies/1.2.3/bulk/1`],
  ])('resolves relative %s with relativeResolution %s', (uri, relativeResolution, expected) => {
    expect(fix(uri, { bulkDataURI: { relativeResolution } })).toBe(expected);
  });
});
