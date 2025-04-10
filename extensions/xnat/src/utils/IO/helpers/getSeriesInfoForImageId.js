import * as cornerstone from '@cornerstonejs/core'
import { utils } from '@ohif/core';

const { studyMetadataManager } = utils;

const _getDisplaySet = ({ StudyInstanceUID, displaySetInstanceUID }) => {
  const studies = studyMetadataManager.all();
  const studyMetadata = studies.find(
    study =>
      study.getStudyInstanceUID() === StudyInstanceUID &&
      study.displaySets.some(
        ds => ds.displaySetInstanceUID === displaySetInstanceUID
      )
  );
  const displaySet = studyMetadata.findDisplaySet(
    displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
  );
  return displaySet;
};

const _getPatientName = patientName => {
  if (patientName) {
    if (patientName.hasOwnProperty('Alphabetic')) {
      return patientName.Alphabetic;
    } else {
      return patientName;
    }
  } else {
    return '';
  }
};

export default function getSeriesInfoForImageId(viewportData) {
  const displaySet = _getDisplaySet(viewportData);

  const { images } = displaySet;

  const firstImage = images[0];
  const firstImageId = firstImage.getImageId();

  const instance = cornerstone.metaData.get('instance', firstImageId);

  const SoftwareVersions = Array.isArray(instance.SoftwareVersions)
    ? instance.SoftwareVersions.join('\\')
    : instance.SoftwareVersions;

  const seriesInfo = {
    studyInstanceUid: instance.StudyInstanceUID,
    seriesInstanceUid: instance.SeriesInstanceUID,
    seriesNumber: instance.SeriesNumber,
    modality: instance.Modality,
    startDate: instance.SeriesDate,
    startTime: instance.SeriesTime,
    sopClassUid: instance.SOPClassUID,
    // TODO: Need to supply this metadata
    person: {
      name: _getPatientName(instance.PatientName),
      id: instance.PatientID || '',
      birthDate: instance.PatientBirthDate || '',
      sex: instance.PatientSex || '',
      ethnicGroup: instance.EthnicGroup || '',
    },
    equipment: {
      manufacturerName: instance.Manufacturer || '',
      manufacturerModelName: instance.ManufacturerModelName || '',
      softwareVersion: SoftwareVersions || '',
    },
  };

  let sopInstanceUids = [];

  for (let i = 0; i < images.length; i++) {
    // ToDo: imageIds provided instead of instanceUIDs. Is sopInstanceUids used at all?
    sopInstanceUids.push(images[i].getImageId());
  }

  seriesInfo.sopInstanceUids = sopInstanceUids;

  // seriesInfo = {
  //   studyInstanceUid: metaData.study.studyInstanceUid,
  //   seriesInstanceUid: metaData.series.seriesInstanceUid,
  //   modality:
  //     metaData.series.modality ||
  //     metadataProvider.getFromDataSet(image.data, 'string', 'x00080060'),
  //   startDate:
  //     metaData.series.seriesDate ||
  //     metadataProvider.getFromDataSet(image.data, 'string', 'x00080021'),
  //   startTime:
  //     metaData.series.seriesTime ||
  //     metadataProvider.getFromDataSet(image.data, 'string', 'x00080031'),
  //   sopClassUid: metaData.instance.sopClassUid,
  //   sopInstanceUids: [],
  //   person: {
  //     name: metaData.patient.name,
  //     id:
  //       metaData.patient.id ||
  //       metadataProvider.getFromDataSet(image.data, 'string', 'x00100020'),
  //     birthDate:
  //       metaData.patient.birthDate ||
  //       metadataProvider.getFromDataSet(image.data, 'string', 'x00100030'),
  //     sex:
  //       metaData.patient.sex ||
  //       metadataProvider.getFromDataSet(image.data, 'string', 'x00100040'),
  //     ethnicGroup: metadataProvider.getFromDataSet(
  //       image.data,
  //       'string',
  //       'x00102160'
  //     ),
  //   },
  //   equipment: {
  //     manufacturerName: metadataProvider.getFromDataSet(
  //       image.data,
  //       'string',
  //       'x00080070'
  //     ),
  //     manufacturerModelName: metadataProvider.getFromDataSet(
  //       image.data,
  //       'string',
  //       'x00081090'
  //     ),
  //     softwareVersion: metadataProvider.getFromDataSet(
  //       image.data,
  //       'string',
  //       'x00181020'
  //     ),
  //   },
  // };

  return seriesInfo;
}
