import dcmjs from 'dcmjs';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import FileLoader from './fileLoader';
import OHIF from '@ohif/core';

const metadataProvider = OHIF.cornerstone.metadataProvider;

const DICOMFileLoader = new (class extends FileLoader {
  fileType = 'application/dicom';
  loadFile(file, imageId) {
    return cornerstoneWADOImageLoader.wadouri.loadFileRequest(imageId);
  }

  getDataset(image, imageId) {
    let dataset = {};
    try {
      const dicomData = dcmjs.data.DicomMessage.readFile(image);

      dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
        dicomData.dict
      );

      metadataProvider.addInstance(dataset);

      dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(
        dicomData.meta
      );
    } catch (e) {
      console.error('Error reading dicom file', e);
    }
    // Set imageId on dataset to be consumed later on
    dataset.imageId = imageId;

    return dataset;
  }

  getStudies(dataset, imageId) {
    return this.getStudyFromDataset(dataset);
  }

  getStudyFromDataset(dataset = {}) {
    const {
      StudyInstanceUID,
      StudyDate,
      StudyTime,
      AccessionNumber,
      ReferringPhysicianName,
      PatientName,
      PatientID,
      PatientBirthDate,
      PatientSex,
      StudyID,
      StudyDescription,
      SeriesInstanceUID,
      SeriesDescription,
      SeriesNumber,
      imageId,
    } = dataset;

    const instance = {
      metadata: dataset,
      url: imageId,
    };

    const series = {
      SeriesInstanceUID: SeriesInstanceUID,
      SeriesDescription: SeriesDescription,
      SeriesNumber: SeriesNumber,
      instances: [instance],
    };

    const study = {
      StudyInstanceUID,
      StudyDate,
      StudyTime,
      AccessionNumber,
      ReferringPhysicianName,
      PatientName,
      PatientID,
      PatientBirthDate,
      PatientSex,
      StudyID,
      StudyDescription,
      /*
      TODO: in case necessary to uncomment this block, double check every property
      numberOfStudyRelatedSeries: NumberOfStudyRelatedSeries || DICOMWeb.getString(dataset['00201206']),
      numberOfStudyRelatedInstances: NumberOfStudyRelatedInstances || DICOMWeb.getString(dataset['00201208']),
      Modality: Modality || DICOMWeb.getString(dataset['00080060']),
      ModalitiesInStudy: ModalitiesInStudy || DICOMWeb.getString(dataset['00080061']),
      modalities:
      */
      series: [series],
    };

    return study;
  }
})();

export default DICOMFileLoader;
