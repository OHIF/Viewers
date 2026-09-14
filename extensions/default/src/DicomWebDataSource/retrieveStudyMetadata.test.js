import {
  deleteStudyMetadataPromise,
  _getStudyMetadataPromiseCache,
} from './retrieveStudyMetadata.js';

const STUDY = '1.2.840.113619.2.55.3.1234';
const OTHER_STUDY = '9.9.9';

describe('deleteStudyMetadataPromise', () => {
  beforeEach(() => {
    _getStudyMetadataPromiseCache().clear();
  });

  // Promises are cached under `<data source name>:<StudyInstanceUID>`, but every
  // caller holds only the study UID. Looking the bare UID up as a key matched
  // nothing, so storing a derived artifact never invalidated anything and a
  // re-retrieve returned the pre-save promise.
  it('removes the promise cached under the data source qualified key', () => {
    const cache = _getStudyMetadataPromiseCache();
    cache.set(`dicomweb:${STUDY}`, 'stale');

    deleteStudyMetadataPromise(STUDY);

    expect(cache.has(`dicomweb:${STUDY}`)).toBe(false);
  });

  it('removes the study from every data source that cached it', () => {
    const cache = _getStudyMetadataPromiseCache();
    cache.set(`dicomweb:${STUDY}`, 'stale');
    cache.set(`dicomwebproxy:${STUDY}`, 'stale');

    deleteStudyMetadataPromise(STUDY);

    expect(cache.size).toBe(0);
  });

  it('leaves other studies cached', () => {
    const cache = _getStudyMetadataPromiseCache();
    cache.set(`dicomweb:${STUDY}`, 'stale');
    cache.set(`dicomweb:${OTHER_STUDY}`, 'keep');

    deleteStudyMetadataPromise(STUDY);

    expect(cache.has(`dicomweb:${OTHER_STUDY}`)).toBe(true);
  });

  // A study whose UID is a suffix of another must not be caught by the match.
  it('does not remove a study whose UID merely ends with the same digits', () => {
    const cache = _getStudyMetadataPromiseCache();
    cache.set(`dicomweb:${STUDY}`, 'stale');
    cache.set(`dicomweb:77${STUDY}`, 'keep');

    deleteStudyMetadataPromise(STUDY);

    expect(cache.has(`dicomweb:77${STUDY}`)).toBe(true);
  });

  it('still removes an unqualified key, for any caller that cached one', () => {
    const cache = _getStudyMetadataPromiseCache();
    cache.set(STUDY, 'stale');

    deleteStudyMetadataPromise(STUDY);

    expect(cache.has(STUDY)).toBe(false);
  });

  it('does nothing without a study', () => {
    const cache = _getStudyMetadataPromiseCache();
    cache.set(`dicomweb:${STUDY}`, 'keep');

    deleteStudyMetadataPromise(undefined);

    expect(cache.size).toBe(1);
  });
});
