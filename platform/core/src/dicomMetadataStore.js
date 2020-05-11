import {
  createStudyFromSOPInstanceList,
  addInstancesToStudy,
} from './studies/services/wado/studyInstanceHelpers';

import displaySetManager from './displaySetManager';

class StudyMetadata {
  constructor(StudyInstanceUID) {
    this.StudyInstanceUID = StudyInstanceUID;
    this.series = [];
  }

  addSeries(instances) {
    this.series.push(new SeriesMetadata(instances));
  }
}

class SeriesMetadata {
  constructor(instances) {
    const { SeriesInstanceUID } = instances[0];
    this.SeriesInstanceUID = SeriesInstanceUID;
    this.instances = instances;
  }
}

const _model = {
  studies: [],
  //   studies: [{
  //     seriesLists: [
  //         {
  //         // Series in study from dicom web server 1 (or different backend 1)
  //             series: [{
  //                 instances: [{
  //                     ...instanceMetadata // Naturalized DICOM.
  //                 }],
  //                 ...seriesMetadata
  //             }],
  //             clientName
  //         },
  //         {
  //         // Series in study from dicom web server 2 (or different backend 2)
  //         },
  //     ],
  //     ...studyMetadata,
  // }]
};

function _getStudy(StudyInstanceUID) {
  return _model.studies.find(StudyInstanceUID);
}

function _getSeries(StudyInstanceUID, SeriesInstanceUID) {
  const study = _getStudy(StudyInstanceUID);

  if (!study) {
    return;
  }

  return study.series.find(
    aSeries => aSeries.SeriesInstanceUID === SeriesInstanceUID
  );
}

function _getInstance(StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID) {
  const series = _getSeries(StudyInstanceUID, SeriesInstanceUID);

  if (!series) {
    return;
  }

  return series.instances.find(
    instance => instance.SOPInstanceUID === SOPInstanceUID
  );
}

const dicomMetadataStore = {
  addInstances(instances) {
    const { StudyInstanceUID } = instances[0];

    let study = _model.studies.find(
      study => study.StudyInstanceUID === StudyInstanceUID
    );

    if (!study) {
      _model.studies.push(new StudyMetadata(StudyInstanceUID));

      study = _model.studies[_model.studies.length - 1];
    }

    study.addSeries(instances);
  },
  getStudy: _getStudy,
  getSeries: _getSeries,
  getInstance: _getInstance,
};

//

// TODO => Add instances
//_addInstance(input) // arraybuffer, or other stuff

export { dicomMetadataStore };
export default dicomMetadataStore;
