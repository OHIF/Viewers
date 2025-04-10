import makeCancelable from '../../../utils/makeCancelable';

import { projects } from './projects.js';
import { ITCRdemo_subjects } from './ITCRdemo/subjects.js';

import { ITCRdemo_XNAT_JPETTS_S00011_experiments } from './ITCRdemo/XNAT_JPETTS_S00011/experiments.js';
import {
  ITCRdemo_XNAT_JPETTS_S00012_experiments_XNAT_JPETTS_E00014_assessors,
  RoiCollection_hjVJT41_AhToh2NyqZN,
  RoiCollection_hjVJT41_804wDCwJDLv,
} from './ITCRdemo/XNAT_JPETTS_S00011/XNAT_JPETTS_E00014/assessors.js';

import { ITCRdemo_XNAT_JPETTS_S00012_experiments } from './ITCRdemo/XNAT_JPETTS_S00012/experiments.js';

import { TESTViewer_subjects } from './TEST_Viewer/subjects.js';

import { TEST_Viewer_XNAT_JPETTS_S00021_experiments } from './TEST_Viewer/XNAT_JPETTS_S00032/experiments.js';

const uriToJson = {
  'data/archive/projects/?format=json': projects,
  'data/archive/projects/ITCRdemo/subjects?format=json': ITCRdemo_subjects,
  'data/archive/projects/ITCRdemo/subjects/XNAT_JPETTS_S00011/experiments?format=json': ITCRdemo_XNAT_JPETTS_S00011_experiments,
  'data/archive/projects/ITCRdemo/subjects/XNAT_JPETTS_S00011/experiments/XNAT_JPETTS_E00014/assessors?format=json': ITCRdemo_XNAT_JPETTS_S00012_experiments_XNAT_JPETTS_E00014_assessors,
  'data/archive/projects/ITCRdemo/subjects/XNAT_JPETTS_S00011/experiments/XNAT_JPETTS_E00014/assessors/RoiCollection_hjVJT41_AhToh2NyqZN?format=json': RoiCollection_hjVJT41_AhToh2NyqZN,
  'data/archive/projects/ITCRdemo/subjects/XNAT_JPETTS_S00011/experiments/XNAT_JPETTS_E00014/assessors/RoiCollection_hjVJT41_804wDCwJDLv?format=json': RoiCollection_hjVJT41_804wDCwJDLv,
  'data/archive/projects/ITCRdemo/subjects/XNAT_JPETTS_S00012/experiments?format=json': ITCRdemo_XNAT_JPETTS_S00012_experiments,
  'data/archive/projects/TEST_Viewer/subjects?format=json': TESTViewer_subjects,
  'data/archive/projects/TEST_Viewer/subjects/XNAT_JPETTS_S00032/experiments?format=json': TEST_Viewer_XNAT_JPETTS_S00021_experiments,
};

export default function(uri) {
  return makeCancelable(
    new Promise((resolve, reject) => {
      setTimeout(function() {
        resolve(JSON.parse(uriToJson[uri]));
      }, 20);
    })
  );
}
