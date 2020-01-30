import * as dcmjs from 'dcmjs';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import FileLoader from './fileLoader';

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
      /*
      NumberOfStudyRelatedSeries,
      NumberOfStudyRelatedInstances,
      Modality,
      ModalitiesInStudy,
      */
      SeriesInstanceUID,
      SeriesDescription,
      SeriesNumber,
      SOPInstanceUID,
      SOPClassUID,
      Rows,
      Columns,
      NumberOfFrames,
      InstanceNumber,
      imageId,
      Modality,
      /*ImageType,
        InstanceNumber,
        ImagePositionPatient,
        ImageOrientationPatient,
        FrameOfReferenceUID,
        SliceLocation,
        SamplesPerPixel,
        PhotometricInterpretation,
        PlanarConfiguration,
        PixelSpacing,
        PixelAspectRatio,
        BitsAllocated,
        BitsStored,
        HighBit,
        PixelRepresentation,
        SmallestPixelValue,
        LargestPixelValue,
        WindowCenter,
        WindowWidth,
        RescaleIntercept,
        RescaleSlope,
        RescaleType,
        Laterality,
        ViewPosition,
        AcquisitionDateTime,
        FrameIncrementPointer,
        FrameTime,
        FrameTimeVector,
        SliceThickness,
        SpacingBetweenSlices,
        LossyImageCompression,
        DerivationDescription,
        LossyImageCompressionRatio,
        LossyImageCompressionMethod,
        EchoNumber,
        ContrastBolusAgent,
        */
    } = dataset;

    const instance = {
      sopInstanceUid: SOPInstanceUID,
      sopClassUid: SOPClassUID,
      rows: Rows,
      columns: Columns,
      numberOfFrames: NumberOfFrames,
      instanceNumber: InstanceNumber,
      url: imageId,
      modality: Modality,
      /*
        TODO: in case necessary to uncoment this block, double check every property
        imageType: ImageType || DICOMWeb.getString(dataset['00080008']),
        instanceNumber: InstanceNumber || DICOMWeb.getNumber(dataset['00200013']),
        imagePositionPatient: ImagePositionPatient || DICOMWeb.getString(dataset['00200032']),
        imageOrientationPatient: ImageOrientationPatient || DICOMWeb.getString(dataset['00200037']),
        frameOfReferenceUID: FrameOfReferenceUID || DICOMWeb.getString(dataset['00200052']),
        sliceLocation: SliceLocation || DICOMWeb.getNumber(dataset['00201041']),
        samplesPerPixel: SamplesPerPixel || DICOMWeb.getNumber(dataset['00280002']),
        photometricInterpretation: PhotometricInterpretation || DICOMWeb.getString(dataset['00280004']),
        planarConfiguration: PlanarConfiguration || DICOMWeb.getNumber(dataset['00280006']),
        pixelSpacing: PixelSpacing || DICOMWeb.getString(dataset['00280030']),
        pixelAspectRatio: PixelAspectRatio || DICOMWeb.getString(dataset['00280034']),
        bitsAllocated: BitsAllocated || DICOMWeb.getNumber(dataset['00280100']),
        bitsStored: BitsStored || DICOMWeb.getNumber(dataset['00280101']),
        highBit: HighBit || DICOMWeb.getNumber(dataset['00280102']),
        pixelRepresentation: PixelRepresentation || DICOMWeb.getNumber(dataset['00280103']),
        smallestPixelValue: SmallestPixelValue || DICOMWeb.getNumber(dataset['00280106']),
        largestPixelValue: LargestPixelValue || DICOMWeb.getNumber(dataset['00280107']),
        windowCenter: WindowCenter || DICOMWeb.getString(dataset['00281050']),
        windowWidth: WindowWidth || DICOMWeb.getString(dataset['00281051']),
        rescaleIntercept: RescaleIntercept || DICOMWeb.getNumber(dataset['00281052']),
        rescaleSlope: RescaleSlope || DICOMWeb.getNumber(dataset['00281053']),
        rescaleType: RescaleType || DICOMWeb.getNumber(dataset['00281054']),
        sourceImageInstanceUid: getSourceImageInstanceUid(dataset),
        laterality: Laterality || DICOMWeb.getString(dataset['00200062']),
        viewPosition: ViewPosition || DICOMWeb.getString(dataset['00185101']),
        acquisitionDateTime: AcquisitionDateTime || DICOMWeb.getString(dataset['0008002A']),
        frameIncrementPointer: FrameIncrementPointer || getFrameIncrementPointer(dataset['00280009']),
        frameTime: FrameTime || DICOMWeb.getNumber(dataset['00181063']),
        frameTimeVector: FrameTimeVector || parseFloatArray(
          DICOMWeb.getString(dataset['00181065'])
        ),
        sliceThickness: SliceThickness || DICOMWeb.getNumber(dataset['00180050']),
        spacingBetweenSlices: SpacingBetweenSlices || DICOMWeb.getString(dataset['00180088']),
        lossyImageCompression: LossyImageCompression || DICOMWeb.getString(dataset['00282110']),
        derivationDescription: DerivationDescription || DICOMWeb.getString(dataset['00282111']),
        lossyImageCompressionRatio: LossyImageCompressionRatio || DICOMWeb.getString(dataset['00282112']),
        lossyImageCompressionMethod: LossyImageCompressionMethod || DICOMWeb.getString(dataset['00282114']),
        echoNumber: EchoNumber || DICOMWeb.getString(dataset['00180086']),
        contrastBolusAgent: ContrastBolusAgent || DICOMWeb.getString(dataset['00180010']),
        radiopharmaceuticalInfo: getRadiopharmaceuticalInfo(dataset),
        wadouri: WADOProxy.convertURL(wadouri, server),
        wadorsuri: WADOProxy.convertURL(wadorsuri, server),*/
    };

    const series = {
      seriesInstanceUid: SeriesInstanceUID,
      seriesDescription: SeriesDescription,
      seriesNumber: SeriesNumber,
      instances: [instance],
    };

    const study = {
      studyInstanceUid: StudyInstanceUID,
      studyDate: StudyDate,
      studyTime: StudyTime,
      accessionNumber: AccessionNumber,
      referringPhysicianName: ReferringPhysicianName,
      patientName: PatientName,
      patientId: PatientID,
      patientBirthdate: PatientBirthDate,
      patientSex: PatientSex,
      studyId: StudyID,
      studyDescription: StudyDescription,
      /*
      TODO: in case necessary to uncomment this block, double check every property
      numberOfStudyRelatedSeries: NumberOfStudyRelatedSeries || DICOMWeb.getString(dataset['00201206']),
      numberOfStudyRelatedInstances: NumberOfStudyRelatedInstances || DICOMWeb.getString(dataset['00201208']),
      modality: Modality || DICOMWeb.getString(dataset['00080060']),
      modalitiesInStudy: ModalitiesInStudy || DICOMWeb.getString(dataset['00080061']),
      modalities:
      */
      seriesList: [series],
    };

    return study;
  }
})();

export default DICOMFileLoader;
