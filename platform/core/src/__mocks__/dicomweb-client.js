// import { api } from 'dicomweb-client'

const api = {
  DICOMwebClient: jest.fn().mockImplementation(function() {
    this.retrieveStudyMetadata = jest.fn().mockResolvedValue([]);
    this.retrieveSeriesMetadata = jest.fn(function(options) {
      const { studyInstanceUID, seriesInstanceUID } = options;
      return Promise.resolve([{ studyInstanceUID, seriesInstanceUID }]);
    });
  }),
};

export default {
  api,
};

export { api };
