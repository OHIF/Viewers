import pubSubServiceInterface from '../_shared/pubSubServiceInterface';
import StudyMetadata from './StudyMetadata';
import EVENTS from './EVENTS';

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
  return _model.studies.find(
    aStudy => aStudy.StudyInstanceUID === StudyInstanceUID
  );
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

const BaseImplementation = {
  EVENTS,
  listeners: {},
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
  addStudy(study) {
    const { StudyInstanceUID } = study;

    let existingStudy = _model.studies.find(
      study => study.StudyInstanceUID === StudyInstanceUID
    );

    if (!existingStudy) {
      const newStudy = new StudyMetadata(StudyInstanceUID);

      newStudy.PatientID = study.PatientID;
      newStudy.PatientName = study.PatientName;
      newStudy.StudyDate = study.StudyDate;
      newStudy.ModalitiesInStudy = study.ModalitiesInStudy;
      newStudy.StudyDescription = study.StudyDescription;
      newStudy.AccessionNumber = study.AccessionNumber;
      newStudy.NumInstances = study.NumInstances; // todo: Correct naming?

      _model.studies.push(newStudy);
    }
  },
  getStudy: _getStudy,
  getSeries: _getSeries,
  getInstance: _getInstance,
};

const DicomMetadataStore = Object.assign(
  {},
  BaseImplementation,
  pubSubServiceInterface
);

// TODO => Add instances
//_addInstance(input) // arraybuffer, or other stuff

export { DicomMetadataStore };
export default DicomMetadataStore;
