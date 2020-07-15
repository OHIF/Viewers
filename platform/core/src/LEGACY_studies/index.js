import { QIDO, WADO } from './services/';
import {
  deleteStudyMetadataPromise,
  retrieveStudyMetadata,
} from './retrieveStudyMetadata.js';

import getStudyBoxData from './getStudyBoxData';
import retrieveStudiesMetadata from './retrieveStudiesMetadata.js';
import searchStudies from './searchStudies';
import { sortStudy, sortStudySeries, sortStudyInstances, sortingCriteria } from './sortStudy';

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
  sortStudySeries,
  sortStudyInstances,
  sortingCriteria,
};

export default studies;
