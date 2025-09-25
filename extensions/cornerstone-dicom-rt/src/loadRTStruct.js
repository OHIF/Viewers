import dcmjs from 'dcmjs';
const { DicomMessage, DicomMetaDictionary } = dcmjs.data;
const dicomlab2RGB = dcmjs.data.Colors.dicomlab2RGB;

/**
 * Checks and loads contour data for RT Structure Set, handling both inline and bulk data URIs.
 * Processes ROIContourSequence to extract contour data and resolve any bulk data references.
 *
 * @async
 * @function checkAndLoadContourData
 * @param {Object} params - Parameters object
 * @param {Object} params.instance - Initial RT Structure instance
 * @param {Object} params.dataSource - Data source for retrieving bulk data
 * @param {Object} params.extensionManager - OHIF extension manager
 * @param {Object} params.rtStructDisplaySet - RT Structure display set
 * @param {Object} params.headers - HTTP headers for requests
 * @returns {Promise<Object>} Promise that resolves to the processed RT Structure instance with loaded contour data
 * @throws {Promise<string>} Rejects with error message if instance is invalid or data retrieval fails
 */
async function checkAndLoadContourData({
  instance: initialInstance,
  dataSource,
  extensionManager,
  rtStructDisplaySet,
  headers,
}) {
  let instance = initialInstance;
  if (!instance || !instance.ROIContourSequence) {
    instance = await getRTStructInstance({ extensionManager, rtStructDisplaySet, headers });
    if (!instance || !instance.ROIContourSequence) {
      return Promise.reject('Invalid instance object or ROIContourSequence');
    }
  }

  const promisesMap = new Map();

  for (const ROIContour of instance.ROIContourSequence) {
    const referencedROINumber = ROIContour.ReferencedROINumber;
    if (!ROIContour || !ROIContour.ContourSequence) {
      promisesMap.set(referencedROINumber, [Promise.resolve([])]);
      continue;
    }

    for (const Contour of ROIContour.ContourSequence) {
      if (!Contour || !Contour.ContourData) {
        return Promise.reject('Invalid Contour or ContourData');
      }

      const contourData = Contour.ContourData;

      if (Array.isArray(contourData)) {
        promisesMap.has(referencedROINumber)
          ? promisesMap.get(referencedROINumber).push(Promise.resolve(contourData))
          : promisesMap.set(referencedROINumber, [Promise.resolve(contourData)]);
      } else if (contourData && contourData.BulkDataURI) {
        const bulkDataURI = contourData.BulkDataURI;

        if (!dataSource || !dataSource.retrieve || !dataSource.retrieve.bulkDataURI) {
          return Promise.reject('Invalid dataSource object or retrieve function');
        }

        const bulkDataPromise = dataSource.retrieve.bulkDataURI({
          BulkDataURI: bulkDataURI,
          StudyInstanceUID: instance.StudyInstanceUID,
          SeriesInstanceUID: instance.SeriesInstanceUID,
          SOPInstanceUID: instance.SOPInstanceUID,
        });

        promisesMap.has(referencedROINumber)
          ? promisesMap.get(referencedROINumber).push(bulkDataPromise)
          : promisesMap.set(referencedROINumber, [bulkDataPromise]);
      } else {
        return Promise.reject(`Invalid ContourData: ${contourData}`);
      }
    }
  }

  const resolvedPromisesMap = new Map();
  for (const [key, promiseArray] of promisesMap.entries()) {
    resolvedPromisesMap.set(key, await Promise.allSettled(promiseArray));
  }

  instance.ROIContourSequence.forEach(ROIContour => {
    try {
      const referencedROINumber = ROIContour.ReferencedROINumber;
      const resolvedPromises = resolvedPromisesMap.get(referencedROINumber);

      if (ROIContour.ContourSequence) {
        ROIContour.ContourSequence.forEach((Contour, index) => {
          const promise = resolvedPromises[index];
          if (promise.status === 'fulfilled') {
            if (Array.isArray(promise.value) && promise.value.every(Number.isFinite)) {
              // If promise.value is already an array of numbers, use it directly
              Contour.ContourData = promise.value;
            } else {
              // If the resolved promise value is a byte array (Blob), it needs to be decoded
              const uint8Array = new Uint8Array(promise.value);
              const textDecoder = new TextDecoder();
              const dataUint8Array = textDecoder.decode(uint8Array);
              if (typeof dataUint8Array === 'string' && dataUint8Array.includes('\\')) {
                Contour.ContourData = dataUint8Array.split('\\').map(parseFloat);
              } else {
                Contour.ContourData = [];
              }
            }
          } else {
            console.error(promise.reason);
          }
        });
      }
    } catch (error) {
      console.error(error);
    }
  });

  return instance;
}

/**
 * Retrieves and parses RT Structure Set instance from DICOM data.
 * Uses the cornerstone utility module to load DICOM data and converts it to a naturalized dataset.
 *
 * @async
 * @function getRTStructInstance
 * @param {Object} params - Parameters object
 * @param {Object} params.extensionManager - OHIF extension manager
 * @param {Object} params.rtStructDisplaySet - RT Structure display set
 * @param {Object} params.headers - HTTP headers for requests
 * @returns {Promise<Object>} Promise that resolves to the parsed RT Structure dataset
 */
const getRTStructInstance = async ({ extensionManager, rtStructDisplaySet, headers }) => {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.common'
  );
  const { dicomLoaderService } = utilityModule.exports;
  const segArrayBuffer = await dicomLoaderService.findDicomDataPromise(
    rtStructDisplaySet,
    null,
    headers
  );
  const dicomData = DicomMessage.readFile(segArrayBuffer);
  const rtStructDataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
  rtStructDataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);
  return rtStructDataset;
};

/**
 * Main function to load and process RT Structure Set data.
 * Creates a structure set object with ROI contours, metadata, and visualization properties.
 * Handles both bulk data URI and inline contour data scenarios.
 *
 * @async
 * @function loadRTStruct
 * @param {Object} extensionManager - OHIF extension manager
 * @param {Object} rtStructDisplaySet - RT Structure display set to process
 * @param {Object} headers - HTTP headers for data requests
 * @returns {Promise<Object>} Promise that resolves to a structure set object containing:
 *   - StructureSetLabel: Label of the structure set
 *   - SeriesInstanceUID: Series instance UID
 *   - ROIContours: Array of ROI contour data with points and metadata
 *   - visible: Visibility state
 *   - ReferencedSOPInstanceUIDsSet: Set of referenced SOP instance UIDs
 */
export default async function loadRTStruct(extensionManager, rtStructDisplaySet, headers) {
  const dataSource = extensionManager.getActiveDataSource()[0];
  const { bulkDataURI } = dataSource.getConfig?.() || {};

  // Set here is loading is asynchronous.
  // If this function throws its set back to false.
  rtStructDisplaySet.isLoaded = true;
  let instance = rtStructDisplaySet.instance;

  if (!bulkDataURI || !bulkDataURI.enabled) {
    instance = await getRTStructInstance({ extensionManager, rtStructDisplaySet, headers });
  } else {
    instance = await checkAndLoadContourData({
      instance,
      dataSource,
      extensionManager,
      rtStructDisplaySet,
      headers,
    });
  }

  const { StructureSetROISequence, ROIContourSequence, RTROIObservationsSequence } = instance;

  // Define our structure set entry and add it to the rtstruct module state.
  const structureSet = {
    StructureSetLabel: instance.StructureSetLabel,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    ROIContours: [],
    visible: true,
    ReferencedSOPInstanceUIDsSet: new Set(),
  };

  for (let i = 0; i < ROIContourSequence.length; i++) {
    const ROIContour = ROIContourSequence[i];
    const { ContourSequence } = ROIContour;
    if (!ContourSequence) {
      continue;
    }

    const ContourSequenceArray = _toArray(ContourSequence);

    const contourPoints = [];
    for (const ContourSequenceItem of ContourSequenceArray) {
      const { ContourData, NumberOfContourPoints, ContourGeometricType, ContourImageSequence } =
        ContourSequenceItem;

      const points = [];
      for (let p = 0; p < NumberOfContourPoints * 3; p += 3) {
        points.push({
          x: ContourData[p],
          y: ContourData[p + 1],
          z: ContourData[p + 2],
        });
      }

      const supportedContourTypesMap = new Map([
        ['CLOSED_PLANAR', false],
        ['OPEN_NONPLANAR', false],
        ['OPEN_PLANAR', false],
        ['POINT', true],
      ]);

      contourPoints.push({
        numberOfPoints: NumberOfContourPoints,
        points,
        type: ContourGeometricType,
        isSupported: supportedContourTypesMap.get(ContourGeometricType) ?? false,
      });

      if (ContourImageSequence?.ReferencedSOPInstanceUID) {
        structureSet.ReferencedSOPInstanceUIDsSet.add(
          ContourImageSequence?.ReferencedSOPInstanceUID
        );
      }
    }

    _setROIContourMetadata(
      structureSet,
      StructureSetROISequence,
      RTROIObservationsSequence,
      ROIContour,
      contourPoints
    );
  }
  return structureSet;
}

/**
 * Sets metadata for ROI contour data and adds it to the structure set.
 * Extracts ROI information from StructureSetROISequence and RTROIObservationsSequence,
 * then creates a complete ROI contour data object with visualization properties.
 *
 * @function _setROIContourMetadata
 * @param {Object} structureSet - The structure set object to add ROI contour to
 * @param {Array} StructureSetROISequence - Array of structure set ROI definitions
 * @param {Array} RTROIObservationsSequence - Array of RT ROI observations
 * @param {Object} ROIContour - ROI contour object containing contour data
 * @param {Array} contourPoints - Array of processed contour points
 */
function _setROIContourMetadata(
  structureSet,
  StructureSetROISequence,
  RTROIObservationsSequence,
  ROIContour,
  contourPoints
) {
  const StructureSetROI = StructureSetROISequence.find(
    structureSetROI => structureSetROI.ROINumber === ROIContour.ReferencedROINumber
  );

  const ROIContourData = {
    ROINumber: StructureSetROI.ROINumber,
    ROIName: StructureSetROI.ROIName,
    ROIGenerationAlgorithm: StructureSetROI.ROIGenerationAlgorithm,
    ROIDescription: StructureSetROI.ROIDescription,
    contourPoints,
    visible: true,
    colorArray: [],
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

/**
 * Sets the display color for ROI contour data.
 * Uses ROIDisplayColor if available, otherwise converts RecommendedDisplayCIELabValue to RGB.
 *
 * @function _setROIContourDataColor
 * @param {Object} ROIContour - ROI contour object containing color information
 * @param {Object} ROIContourData - ROI contour data object to set color on
 */
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

/**
 * Sets RT ROI observations metadata for ROI contour data.
 * Finds matching RTROIObservations by ROINumber and adds observation details to contour data.
 *
 * @function _setROIContourRTROIObservations
 * @param {Object} ROIContourData - ROI contour data object to add observations to
 * @param {Array} RTROIObservationsSequence - Array of RT ROI observations
 * @param {number} ROINumber - ROI number to match observations
 */
function _setROIContourRTROIObservations(ROIContourData, RTROIObservationsSequence, ROINumber) {
  const RTROIObservations = RTROIObservationsSequence.find(
    RTROIObservations => RTROIObservations.ReferencedROINumber === ROINumber
  );

  if (RTROIObservations) {
    // Deep copy so we don't keep the reference to the dcmjs dataset entry.
    const { ObservationNumber, ROIObservationDescription, RTROIInterpretedType, ROIInterpreter } =
      RTROIObservations;

    ROIContourData.RTROIObservations = {
      ObservationNumber,
      ROIObservationDescription,
      RTROIInterpretedType,
      ROIInterpreter,
    };
  }
}

/**
 * Converts a single object or array to an array.
 * Utility function to ensure consistent array handling for DICOM sequences.
 *
 * @function _toArray
 * @param {*} objOrArray - Object or array to convert
 * @returns {Array} Array containing the input (if already array) or wrapped in array
 */
function _toArray(objOrArray) {
  return Array.isArray(objOrArray) ? objOrArray : [objOrArray];
}
