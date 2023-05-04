import dcmjs from 'dcmjs';
const { DicomMessage, DicomMetaDictionary } = dcmjs.data;
const dicomlab2RGB = dcmjs.data.Colors.dicomlab2RGB;

async function checkAndLoadContourData(instance, datasource) {
  if (!instance || !instance.ROIContourSequence) {
    return Promise.reject('Invalid instance object or ROIContourSequence');
  }

  const promises = [];
  let counter = 0;

  for (const ROIContour of instance.ROIContourSequence) {
    if (!ROIContour || !ROIContour.ContourSequence) {
      return Promise.reject('Invalid ROIContour or ContourSequence');
    }

    for (const Contour of ROIContour.ContourSequence) {
      if (!Contour || !Contour.ContourData) {
        return Promise.reject('Invalid Contour or ContourData');
      }

      const contourData = Contour.ContourData;
      counter++;
      if (Array.isArray(contourData)) {
        promises.push(Promise.resolve(contourData));
      } else if (contourData && contourData.BulkDataURI) {
        const bulkDataURI = contourData.BulkDataURI;

        if (
          !datasource ||
          !datasource.retrieve ||
          !datasource.retrieve.bulkDataURI
        ) {
          return Promise.reject(
            'Invalid datasource object or retrieve function'
          );
        }

        const bulkDataPromise = datasource.retrieve.bulkDataURI({
          BulkDataURI: bulkDataURI,
          StudyInstanceUID: instance.StudyInstanceUID,
          SeriesInstanceUID: instance.SeriesInstanceUID,
          SOPInstanceUID: instance.SOPInstanceUID,
        });

        promises.push(bulkDataPromise);
      } else {
        return Promise.reject(`Invalid ContourData: ${contourData}`);
      }
    }
  }
  const flattenedPromises = promises.flat();
  const resolvedPromises = await Promise.allSettled(flattenedPromises);

  // Modify contourData and replace it in its corresponding ROIContourSequence's Contour's contourData
  let index = 0;
  instance.ROIContourSequence.forEach((ROIContour, roiIndex) => {
    ROIContour.ContourSequence.forEach((Contour, contourIndex) => {
      const promise = resolvedPromises[index++];

      if (promise.status === 'fulfilled') {
        const uint8Array = new Uint8Array(promise.value);
        const textDecoder = new TextDecoder();
        const dataUint8Array = textDecoder.decode(uint8Array);
        if (
          typeof dataUint8Array === 'string' &&
          dataUint8Array.includes('\\')
        ) {
          const numSlashes = (dataUint8Array.match(/\\/g) || []).length;
          let startIndex = 0;
          let endIndex = dataUint8Array.indexOf('\\', startIndex);
          let numbersParsed = 0;
          const ContourData = [];

          while (numbersParsed !== numSlashes + 1) {
            const str = dataUint8Array.substring(startIndex, endIndex);
            let value = parseFloat(str);

            ContourData.push(value);
            startIndex = endIndex + 1;
            endIndex = dataUint8Array.indexOf('\\', startIndex);
            endIndex === -1 ? (endIndex = dataUint8Array.length) : endIndex;
            numbersParsed++;
          }
          Contour.ContourData = ContourData;
        } else {
          Contour.ContourData = [];
        }
      } else {
        console.error(promise.reason);
      }
    });
  });
}

export default async function loadRTStruct(
  extensionManager,
  rtStructDisplaySet,
  referencedDisplaySet,
  headers
) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.common'
  );
  const dataSource = extensionManager.getActiveDataSource()[0];
  const { useBulkDataURI } = dataSource.getConfig?.() || {};

  const { dicomLoaderService } = utilityModule.exports;
  const imageIdSopInstanceUidPairs = _getImageIdSopInstanceUidPairsForDisplaySet(
    referencedDisplaySet
  );

  // Set here is loading is asynchronous.
  // If this function throws its set back to false.
  rtStructDisplaySet.isLoaded = true;
  let instance = rtStructDisplaySet.instance;

  if (!useBulkDataURI) {
    const segArrayBuffer = await dicomLoaderService.findDicomDataPromise(
      rtStructDisplaySet,
      null,
      headers
    );

    const dicomData = DicomMessage.readFile(segArrayBuffer);
    const rtStructDataset = DicomMetaDictionary.naturalizeDataset(
      dicomData.dict
    );
    rtStructDataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);
    instance = rtStructDataset;
  } else {
    await checkAndLoadContourData(instance, dataSource);
  }

  const {
    StructureSetROISequence,
    ROIContourSequence,
    RTROIObservationsSequence,
  } = instance;

  // Define our structure set entry and add it to the rtstruct module state.
  const structureSet = {
    StructureSetLabel: instance.StructureSetLabel,
    SeriesInstanceUID: instance.SeriesInstanceUID,
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
