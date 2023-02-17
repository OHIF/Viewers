import dcmjs from 'dcmjs';
const { DicomMessage, DicomMetaDictionary } = dcmjs.data;
const dicomlab2RGB = dcmjs.data.Colors.dicomlab2RGB;

export default async function loadRTStruct(
  extensionManager,
  rtStructDisplaySet,
  referencedDisplaySet,
  headers
) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.common'
  );

  const { dicomLoaderService } = utilityModule.exports;
  const imageIdSopInstanceUidPairs = _getImageIdSopInstanceUidPairsForDisplaySet(
    referencedDisplaySet
  );

  // Set here is loading is asynchronous.
  // If this function throws its set back to false.
  rtStructDisplaySet.isLoaded = true;

  const segArrayBuffer = await dicomLoaderService.findDicomDataPromise(
    rtStructDisplaySet,
    null,
    headers
  );

  const dicomData = DicomMessage.readFile(segArrayBuffer);
  const rtStructDataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
  rtStructDataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);

  const {
    StructureSetROISequence,
    ROIContourSequence,
    RTROIObservationsSequence,
    StructureSetLabel,
  } = rtStructDataset;

  // Define our structure set entry and add it to the rtstruct module state.
  const structureSet = {
    StructureSetLabel,
    SeriesInstanceUID: rtStructDataset.SeriesInstanceUID,
    ROIContours: [],
    visible: true,
  };

  for (let i = 0; i < ROIContourSequence.length; i++) {
    const ROIContour = ROIContourSequence[i];
    const { ContourSequence } = ROIContour;

    if (!ContourSequence) {
      continue;
    }

    const isSupported = false;

    const ContourSequenceArray = _toArray(ContourSequence);

    const contourPoints = [];
    for (let c = 0; c < ContourSequenceArray.length; c++) {
      const {
        ContourImageSequence,
        ContourData,
        NumberOfContourPoints,
        ContourGeometricType,
      } = ContourSequenceArray[c];

      const sopInstanceUID = ContourImageSequence.ReferencedSOPInstanceUID;
      const imageId = _getImageId(imageIdSopInstanceUidPairs, sopInstanceUID);

      if (!imageId) {
        continue;
      }
      let isSupported = false;

      const points = [];
      for (let p = 0; p < NumberOfContourPoints * 3; p += 3) {
        points.push({
          x: ContourData[p],
          y: ContourData[p + 1],
          z: ContourData[p + 2],
        });
      }

      switch (ContourGeometricType) {
        case 'CLOSED_PLANAR':
        case 'OPEN_PLANAR':
        case 'POINT':
          isSupported = true;

          break;
        default:
          continue;
      }

      contourPoints.push({
        numberOfPoints: NumberOfContourPoints,
        points,
        type: ContourGeometricType,
        isSupported,
      });
    }

    _setROIContourMetadata(
      structureSet,
      StructureSetROISequence,
      RTROIObservationsSequence,
      ROIContour,
      contourPoints,
      isSupported
    );
  }
  return structureSet;
}

const _getImageId = (imageIdSopInstanceUidPairs, sopInstanceUID) => {
  const imageIdSopInstanceUidPairsEntry = imageIdSopInstanceUidPairs.find(
    imageIdSopInstanceUidPairsEntry =>
      imageIdSopInstanceUidPairsEntry.sopInstanceUID === sopInstanceUID
  );

  return imageIdSopInstanceUidPairsEntry
    ? imageIdSopInstanceUidPairsEntry.imageId
    : null;
};

function _getImageIdSopInstanceUidPairsForDisplaySet(referencedDisplaySet) {
  return referencedDisplaySet.images.map(image => {
    return {
      imageId: image.imageId,
      sopInstanceUID: image.SOPInstanceUID,
    };
  });
}

function _setROIContourMetadata(
  structureSet,
  StructureSetROISequence,
  RTROIObservationsSequence,
  ROIContour,
  contourPoints,
  isSupported
) {
  const StructureSetROI = StructureSetROISequence.find(
    structureSetROI =>
      structureSetROI.ROINumber === ROIContour.ReferencedROINumber
  );

  const ROIContourData = {
    ROINumber: StructureSetROI.ROINumber,
    ROIName: StructureSetROI.ROIName,
    ROIGenerationAlgorithm: StructureSetROI.ROIGenerationAlgorithm,
    ROIDescription: StructureSetROI.ROIDescription,
    isSupported,
    contourPoints,
    visible: true,
  };

  _setROIContourDataColor(ROIContour, ROIContourData);

  if (RTROIObservationsSequence) {
    // If present, add additional RTROIObservations metadata.
    _setROIContourRTROIObservations(
      ROIContourData,
      RTROIObservationsSequence,
      ROIContour.ReferencedROINumber
    );
  }

  structureSet.ROIContours.push(ROIContourData);
}

function _setROIContourDataColor(ROIContour, ROIContourData) {
  let { ROIDisplayColor, RecommendedDisplayCIELabValue } = ROIContour;

  if (!ROIDisplayColor && RecommendedDisplayCIELabValue) {
    // If ROIDisplayColor is absent, try using the RecommendedDisplayCIELabValue color.
    ROIDisplayColor = dicomlab2RGB(RecommendedDisplayCIELabValue);
  }

  if (ROIDisplayColor) {
    ROIContourData.colorArray = [...ROIDisplayColor];
  }
}

function _setROIContourRTROIObservations(
  ROIContourData,
  RTROIObservationsSequence,
  ROINumber
) {
  const RTROIObservations = RTROIObservationsSequence.find(
    RTROIObservations => RTROIObservations.ReferencedROINumber === ROINumber
  );

  if (RTROIObservations) {
    // Deep copy so we don't keep the reference to the dcmjs dataset entry.
    const {
      ObservationNumber,
      ROIObservationDescription,
      RTROIInterpretedType,
      ROIInterpreter,
    } = RTROIObservations;

    ROIContourData.RTROIObservations = {
      ObservationNumber,
      ROIObservationDescription,
      RTROIInterpretedType,
      ROIInterpreter,
    };
  }
}

function _toArray(objOrArray) {
  return Array.isArray(objOrArray) ? objOrArray : [objOrArray];
}
