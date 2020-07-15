import { QIDO, WADO } from './services/';
import {
  deleteStudyMetadataPromise,
  retrieveStudyMetadata,
} from './retrieveStudyMetadata.js';

import getStudyBoxData from './getStudyBoxData';
import retrieveStudiesMetadata from './retrieveStudiesMetadata.js';
import searchStudies from './searchStudies';
import sortStudy from './sortStudy';

const studies = {
  services: {
    QIDO,
    WADO,
  },
  loadingDict: {},
  retrieveStudyMetadata,
  deleteStudyMetadataPromise,
  retrieveStudiesMetadata,
  getStudyBoxData,
  searchStudies,
  sortStudy,
};

export default studies;
