import * as dcmjs from 'dcmjs';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import FileLoader from './fileLoader';

const DICOMFileLoader = new (class extends FileLoader {
  fileType = 'application/dicom';
  loadFile(file, imageId) {
    return cornerstoneWADOImageLoader.wadouri.loadFileRequest(imageId);
  }

  getDataset(image, imageId) {
    const dicomData = dcmjs.data.DicomMessage.readFile(image);
    const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
      dicomData.dict
    );
    dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(
      dicomData.meta
    );

    dataset.imageId = image.imageId || imageId;

    return dataset;
  }

  getStudies(dataset, imageId) {
    return this.datasetsToStudies([dataset]);
  }

  datasetsToStudies(datasets) {
    const processDataSet = (
      uidsSet,
      propUid,
      _datasets,
      cb,
      _study,
      sourceUID
    ) => {
      Array.from(uidsSet).forEach(uidElement => {
        // find dataset
        const filteredDatasets = _datasets.filter(
          dataset => dataset[propUid] === uidElement
        );

        cb(filteredDatasets, _datasets, _study, uidElement, sourceUID);
      });
    };

    const studyCb = (filteredDatasets, datasets, _study, studyUID) => {
      const firstDataset = filteredDatasets[0];

      const study = {
        studyInstanceUid: firstDataset.StudyInstanceUID,
        studyDate: firstDataset.StudyDate,
        studyTime: firstDataset.StudyTime,
        accessionNumber: firstDataset.AccessionNumber,
        referringPhysicianName: firstDataset.ReferringPhysicianName,
        patientName: firstDataset.PatientName,
        patientId: firstDataset.PatientID,
        patientBirthdate: firstDataset.PatientBirthDate,
        patientSex: firstDataset.PatientSex,
        studyId: firstDataset.StudyID,
        studyDescription: firstDataset.StudyDescription,
        //numberOfStudyRelatedSeries: DICOMWeb.getString(study['00201206']),
        //numberOfStudyRelatedInstances: DICOMWeb.getString(study['00201208']),
        // modality: DICOMWeb.getString(study['00080060']),
        // modalitiesInStudy: DICOMWeb.getString(study['00080061']),
        //modalities:
        seriesList: [],
      };

      const SeriesInstanceUIDs = new Set();
      datasets.forEach(ds => {
        SeriesInstanceUIDs.add(ds.SeriesInstanceUID);
      });
      processDataSet(
        SeriesInstanceUIDs,
        'SeriesInstanceUID',
        datasets,
        seriesCb,
        study,
        studyUID
      );
      return study;
    };

    const seriesCb = (
      filteredDatasets,
      datasets,
      study,
      serieUID,
      studyUID
    ) => {
      const SOPInstanceUIDs = new Set();

      filteredDatasets.forEach(ds => {
        SOPInstanceUIDs.add(ds.SOPInstanceUID);

        study.seriesList.push({
          seriesInstanceUid: ds.SeriesInstanceUID,
          seriesDescription: ds.SeriesDescription,
          seriesNumber: ds.SeriesNumber,
          instances: [],
        });
      });

      processDataSet(
        SOPInstanceUIDs,
        'SOPInstanceUID',
        datasets,
        instanceCb,
        study,
        serieUID
      );
    };

    const instanceCb = (
      filteredDatasets,
      datasets,
      study,
      instanceUID,
      seriesUID
    ) => {
      const instance = filteredDatasets.find(
        a => a.SOPInstanceUID === instanceUID
      );
      const series = study.seriesList.find(
        a => a.seriesInstanceUid === seriesUID
      );

      series.instances.push({
        sopInstanceUid: instance.SOPInstanceUID,
        sopClassUid: instance.SOPClassUID,
        rows: instance.Rows,
        columns: instance.Columns,
        numberOfFrames: instance.NumberOfFrames,
        instanceNumber: instance.InstanceNumber,
        getImageId: () => instance.imageId, // TODO: Change getImageId to check for instance.imageId property first.
        /*imageType: DICOMWeb.getString(instance['00080008']),
          modality: DICOMWeb.getString(instance['00080060']),
          instanceNumber: DICOMWeb.getNumber(instance['00200013']),
          imagePositionPatient: DICOMWeb.getString(instance['00200032']),
          imageOrientationPatient: DICOMWeb.getString(instance['00200037']),
          frameOfReferenceUID: DICOMWeb.getString(instance['00200052']),
          sliceLocation: DICOMWeb.getNumber(instance['00201041']),
          samplesPerPixel: DICOMWeb.getNumber(instance['00280002']),
          photometricInterpretation: DICOMWeb.getString(instance['00280004']),
          planarConfiguration: DICOMWeb.getNumber(instance['00280006']),
          pixelSpacing: DICOMWeb.getString(instance['00280030']),
          pixelAspectRatio: DICOMWeb.getString(instance['00280034']),
          bitsAllocated: DICOMWeb.getNumber(instance['00280100']),
          bitsStored: DICOMWeb.getNumber(instance['00280101']),
          highBit: DICOMWeb.getNumber(instance['00280102']),
          pixelRepresentation: DICOMWeb.getNumber(instance['00280103']),
          smallestPixelValue: DICOMWeb.getNumber(instance['00280106']),
          largestPixelValue: DICOMWeb.getNumber(instance['00280107']),
          windowCenter: DICOMWeb.getString(instance['00281050']),
          windowWidth: DICOMWeb.getString(instance['00281051']),
          rescaleIntercept: DICOMWeb.getNumber(instance['00281052']),
          rescaleSlope: DICOMWeb.getNumber(instance['00281053']),
          rescaleType: DICOMWeb.getNumber(instance['00281054']),
          sourceImageInstanceUid: getSourceImageInstanceUid(instance),
          laterality: DICOMWeb.getString(instance['00200062']),
          viewPosition: DICOMWeb.getString(instance['00185101']),
          acquisitionDateTime: DICOMWeb.getString(instance['0008002A']),
          frameIncrementPointer: getFrameIncrementPointer(instance['00280009']),
          frameTime: DICOMWeb.getNumber(instance['00181063']),
          frameTimeVector: parseFloatArray(
            DICOMWeb.getString(instance['00181065'])
          ),
          sliceThickness: DICOMWeb.getNumber(instance['00180050']),
          spacingBetweenSlices: DICOMWeb.getString(instance['00180088']),
          lossyImageCompression: DICOMWeb.getString(instance['00282110']),
          derivationDescription: DICOMWeb.getString(instance['00282111']),
          lossyImageCompressionRatio: DICOMWeb.getString(instance['00282112']),
          lossyImageCompressionMethod: DICOMWeb.getString(instance['00282114']),
          echoNumber: DICOMWeb.getString(instance['00180086']),
          contrastBolusAgent: DICOMWeb.getString(instance['00180010']),
          radiopharmaceuticalInfo: getRadiopharmaceuticalInfo(instance),
          wadouri: WADOProxy.convertURL(wadouri, server),
          wadorsuri: WADOProxy.convertURL(wadorsuri, server),*/
      });
    };

    const StudyInstanceUIDs = new Set();
    datasets.forEach(ds => {
      StudyInstanceUIDs.add(ds.StudyInstanceUID || '');
    });

    const studies = [];
    processDataSet(
      StudyInstanceUIDs,
      'StudyInstanceUID',
      datasets,
      (filteredDatasets, datasets, _study, sourceUID) => {
        const study = studyCb(filteredDatasets, datasets, _study, sourceUID);
        studies.push(study);
      },
      {},
      undefined
    );

    return studies;
  }
})();

export default DICOMFileLoader;
