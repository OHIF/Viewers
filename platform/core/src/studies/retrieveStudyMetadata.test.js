import { retrieveStudyMetadata } from './retrieveStudyMetadata.js';

const fakeDicomWebServer = {};

// Testing Promises: https://jestjs.io/docs/en/asynchronous#promises
describe('retrieveStudyMetadata.js', () => {
  it('throws an exception if no server parameter is provided', () => {
    const callWithNoServer = () => {
      retrieveStudyMetadata(null, 'fake-study-instance-uid');
    };

    expect(callWithNoServer).toThrow(Error);
  });

  it('throws an exception if no studyInstanceUid parameter is provided', () => {
    const callWithNoStudyInstanceUid = () => {
      retrieveStudyMetadata(fakeDicomWebServer, null);
    };

    expect(callWithNoStudyInstanceUid).toThrow(Error);
  });

  it('caches and returns the same promise for identical studyInstanceUIDs', () => {
    const firstPromise = retrieveStudyMetadata(
      fakeDicomWebServer,
      'fake-study-instance-uid'
    );
    const secondPromise = retrieveStudyMetadata(
      fakeDicomWebServer,
      'fake-study-instance-uid'
    );

    expect(firstPromise).toBe(secondPromise);
  });
});
