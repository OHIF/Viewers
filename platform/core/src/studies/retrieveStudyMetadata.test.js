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

  it('throws an exception if no StudyInstanceUID parameter is provided', () => {
    const callWithNoStudyInstanceUID = () => {
      retrieveStudyMetadata(fakeDicomWebServer, null);
    };

    expect(callWithNoStudyInstanceUID).toThrow(Error);
  });
});
