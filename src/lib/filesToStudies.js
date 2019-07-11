import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dcmjs from 'dcmjs';

function datasetsToStudies(datasets) {
  const StudyInstanceUIDs = new Set();
  datasets.forEach(ds => {
    StudyInstanceUIDs.add(ds.StudyInstanceUID);
  });

  const studies = [];
  Array.from(StudyInstanceUIDs).forEach(studyInstanceUid => {
    const studyDatasets = datasets.filter(
      ds => ds.StudyInstanceUID === studyInstanceUid
    );
    const firstDataset = studyDatasets[0];
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
    studyDatasets.forEach(ds => {
      SeriesInstanceUIDs.add(ds.SeriesInstanceUID);
    });

    Array.from(SeriesInstanceUIDs).forEach(seriesInstanceUid => {
      const seriesDatasets = studyDatasets.filter(
        ds => ds.SeriesInstanceUID === seriesInstanceUid
      );

      const SOPInstanceUIDs = new Set();
      seriesDatasets.forEach(ds => {
        SOPInstanceUIDs.add(ds.SOPInstanceUID);

        study.seriesList.push({
          seriesInstanceUid: ds.SeriesInstanceUID,
          seriesDescription: ds.SeriesDescription,
          seriesNumber: ds.SeriesNumber,
          instances: [],
        });
      });

      Array.from(SOPInstanceUIDs).forEach(sopInstanceUid => {
        const instance = seriesDatasets.find(
          a => a.SOPInstanceUID === sopInstanceUid
        );
        const series = study.seriesList.find(
          a => a.seriesInstanceUid === seriesInstanceUid
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
      });
    });

    studies.push(study);
  });

  console.warn(studies);

  return studies;
}

export default async function filesToStudies(files) {
  const imagePromises = files.map(file => {
    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
    return cornerstone
      .loadAndCacheImage(imageId)
      .catch(error => console.warn(error));
  });

  const images = await Promise.all(imagePromises);
  const datasets = [];

  images.forEach(image => {
    if (!image || !image.data) {
      return;
    }

    const arrayBuffer = image.data.byteArray.buffer;
    const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
    const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
      dicomData.dict
    );
    dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(
      dicomData.meta
    );
    dataset.imageId = image.imageId;

    datasets.push(dataset);
  });

  return datasetsToStudies(datasets);
}
