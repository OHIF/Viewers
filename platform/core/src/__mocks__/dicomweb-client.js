// import { api } from 'dicomweb-client'

const api = {
  DICOMwebClient: jest.fn().mockImplementation(() => {
    return {
      retrieveStudyMetadata: jest.fn().mockResolvedValue([]),
    };
  }),
};

export default {
  api,
};

export { api };
