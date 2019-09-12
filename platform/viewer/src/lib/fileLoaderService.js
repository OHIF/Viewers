import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dcmjs from 'dcmjs';
import DicomLoaderService from './dicomLoaderService';

class FileLoader {
  fileType;
  loadFile(file, imageId) {}
  getDataset(image) {}
  getStudies(dataset, imageId) {}
}

const PDFFileLoader = new (class extends FileLoader {
  fileType = 'application/pdf';
  loadFile(file, imageId) {
    return cornerstoneWADOImageLoader.wadouri.loadFileRequest(imageId);
  }

  getDataset(image) {
    const dataset = {};
    dataset.imageId = image.imageId;
    return dataset;
  }

  getStudies(dataset, imageId) {
    return this.getDefaultStudy(imageId);
  }

  getDefaultStudy(imageId) {
    const study = {
      studyInstanceUid: '',
      studyDate: '',
      studyTime: '',
      accessionNumber: '',
      referringPhysicianName: '',
      patientName: '',
      patientId: '',
      patientBirthdate: '',
      patientSex: '',
      studyId: '',
      studyDescription: '',
      seriesList: [
        {
          seriesInstanceUid: '',
          seriesDescription: '',
          seriesNumber: '',
          instances: [
            {
              sopInstanceUid: '',
              sopClassUid: '1.2.840.10008.5.1.4.1.1.104.1',
              rows: '',
              columns: '',
              numberOfFrames: 0,
              instanceNumber: 1,
              getImageId: () => imageId,
              isLocalFile: true,
            },
          ],
        },
      ],
    };

    return study;
  }
})();

const DICOMFileLoader = new (class extends FileLoader {
  fileType = 'application/dicom';
  loadFile(file, imageId) {
    return cornerstone.loadAndCacheImage(imageId);
  }

  getDataset(image) {
    const arrayBuffer = image.data.byteArray.buffer;
    const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
    const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
      dicomData.dict
    );
    dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(
      dicomData.meta
    );

    dataset.imageId = image.imageId;

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

class FileLoaderService extends FileLoader {
  fileType;
  loader;
  constructor(file) {
    super();
    const fileType = file && file.type;
    this.loader = this.getLoader(fileType);
    this.fileType = this.loader.fileType;
  }

  static getDicomData(dataset, studies) {
    return DicomLoaderService.getDicomData(dataset, studies);
  }

  static groupSeries(studies) {
    const groupBy = (list, groupByKey, listKey) => {
      let nonKeyCounter = 1;

      return list.reduce((acc, obj) => {
        let key = obj[groupByKey];
        const list = obj[listKey];

        // in case key not found, group it using counter
        key = !!key ? key : '' + nonKeyCounter++;

        if (!acc[key]) {
          acc[key] = { ...obj };
          acc[key][listKey] = [];
        }

        acc[key][listKey].push(...list);

        return acc;
      }, {});
    };

    const studiesGrouped = Object.values(
      groupBy(studies, 'studyInstanceUid', 'seriesList')
    );

    const result = studiesGrouped.map(studyGroup => {
      const seriesGrouped = groupBy(
        studyGroup.seriesList,
        'seriesInstanceUid',
        'instances'
      );
      studyGroup.seriesList = Object.values(seriesGrouped);

      return studyGroup;
    });

    return result;
  }

  addFile(file) {
    return cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
  }

  loadFile(file, imageId) {
    return this.loader.loadFile(file, imageId);
  }

  getDataset(image) {
    return this.loader.getDataset(image);
  }

  getStudies(dataset, imageId) {
    return this.loader.getStudies(dataset, imageId);
  }

  getLoader(fileType) {
    if (fileType === 'application/pdf') {
      return PDFFileLoader;
    } else if (fileType === 'application/dicom' || fileType === '') {
      return DICOMFileLoader;
    } else {
      throw new Error('Unknown file type');
    }
  }
}

export default FileLoaderService;
