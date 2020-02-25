import * as dcmjs from 'dcmjs';
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
      // SOPInstanceUID,
      // SOPClassUID,
      // Rows,
      // Columns,
      // NumberOfFrames,
      // InstanceNumber,
      imageId,
      //Modality,
    } = dataset;

    const instance = {
      data: dataset,
      url: imageId,
    };

    const series = {
      SeriesInstanceUID: SeriesInstanceUID,
      SeriesDescription: SeriesDescription,
      SeriesNumber: SeriesNumber,
      instances: [instance],
    };

    const study = {
      StudyInstanceUID: StudyInstanceUID,
      StudyDate: StudyDate,
      StudyTime: StudyTime,
      AccessionNumber: AccessionNumber,
      ReferringPhysicianName: ReferringPhysicianName,
      PatientName: PatientName,
      PatientId: PatientID,
      PatientBirthDate,
      PatientSex: PatientSex,
      StudyId: StudyID,
      StudyDescription: StudyDescription,
      /*
      TODO: in case necessary to uncomment this block, double check every property
      numberOfStudyRelatedSeries: NumberOfStudyRelatedSeries || DICOMWeb.getString(dataset['00201206']),
      numberOfStudyRelatedInstances: NumberOfStudyRelatedInstances || DICOMWeb.getString(dataset['00201208']),
      Modality: Modality || DICOMWeb.getString(dataset['00080060']),
      modalitiesInStudy: ModalitiesInStudy || DICOMWeb.getString(dataset['00080061']),
      modalities:
      */
      seriesList: [series],
    };

    console.log(imageId);

    return study;
  }
})();

export default DICOMFileLoader;
