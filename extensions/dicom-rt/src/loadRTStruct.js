import OHIF from '@ohif/core';
import dcmjs from 'dcmjs';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import transformPointsToImagePlane from './utils/transformPointsToImagePlane';
import TOOL_NAMES from './utils/toolNames';
import { vec3 } from 'gl-matrix';

const dicomlab2RGB = dcmjs.data.Colors.dicomlab2RGB;
const globalImageIdSpecificToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;
const { DicomLoaderService } = OHIF.utils;

export default async function loadRTStruct(
  rtStructDisplaySet,
  referencedDisplaySet,
  studies
) {
  const rtStructModule = cornerstoneTools.getModule('rtstruct');
  // Set here is loading is asynchronous.
  // If this function throws its set back to false.
  rtStructDisplaySet.isLoaded = true;

  const { StudyInstanceUID, SeriesInstanceUID } = referencedDisplaySet;

  const segArrayBuffer = await DicomLoaderService.findDicomDataPromise(
    rtStructDisplaySet,
    studies
  );

  const dicomData = dcmjs.data.DicomMessage.readFile(segArrayBuffer);
  const rtStructDataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dicomData.dict
  );

  rtStructDataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(
    dicomData.meta
  );

  // global cornerstone tools state to attach measurements to.
  const toolState = globalImageIdSpecificToolStateManager.saveToolState();

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
    referencedSeriesSequence:
      rtStructDisplaySet.metadata.ReferencedSeriesSequence,
    visible: true,
  };

  rtStructModule.setters.structureSet(structureSet);

  const imageIdSopInstanceUidPairs = _getImageIdSopInstanceUidPairsForDisplaySet(
    studies,
    StudyInstanceUID,
    SeriesInstanceUID
  );

  const rtStructDisplayToolName = TOOL_NAMES.RTSTRUCT_DISPLAY_TOOL;

  for (let i = 0; i < ROIContourSequence.length; i++) {
    const ROIContour = ROIContourSequence[i];
    const { ReferencedROINumber, ContourSequence } = ROIContour;

    if (!ContourSequence) {
      continue;
    }

    const isSupported = false;

    const ContourSequenceArray = _toArray(ContourSequence);

    for (let c = 0; c < ContourSequenceArray.length; c++) {
      const {
        ContourImageSequence,
        ContourData,
        NumberOfContourPoints,
        ContourGeometricType,
      } = ContourSequenceArray[c];

      const sopInstanceUID = ContourImageSequence
        ? ContourImageSequence.ReferencedSOPInstanceUID
        : _getClosestSOPInstanceUID(
          ContourData,
          ContourGeometricType,
          NumberOfContourPoints,
          imageIdSopInstanceUidPairs
        );
      const imageId = _getImageId(imageIdSopInstanceUidPairs, sopInstanceUID);

      if (!imageId) {
        continue;
      }

      const imageIdSpecificToolData = _getOrCreateImageIdSpecificToolData(
        toolState,
        imageId,
        rtStructDisplayToolName
      );

      const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageId);
      const points = [];
      let measurementData;

      switch (ContourGeometricType) {
        case 'CLOSED_PLANAR':
        case 'OPEN_PLANAR':
        case 'POINT':
          isSupported = true;

          for (let p = 0; p < NumberOfContourPoints * 3; p += 3) {
            points.push({
              x: ContourData[p],
              y: ContourData[p + 1],
              z: ContourData[p + 2],
            });
          }

          transformPointsToImagePlane(points, imagePlane);

          measurementData = {
            handles: {
              points,
            },
            type: ContourGeometricType,
            structureSetSeriesInstanceUid: rtStructDataset.SeriesInstanceUID,
            ROINumber: ReferencedROINumber,
          };

          imageIdSpecificToolData.push(measurementData);
          break;
        default:
          continue;
      }
    }

    _setROIContourMetadata(
      structureSet,
      StructureSetROISequence,
      RTROIObservationsSequence,
      ROIContour,
      isSupported
    );
  }

  _setToolEnabledIfNotEnabled(rtStructDisplayToolName);

  /*
   * TODO: Improve the way we notify parts of the app that depends on rts to be loaded.
   *
   * Currently we are using a non-ideal implementation through a custom event to notify the rtstruct panel
   * or other components that could rely on loaded rtstructs that
   * the first batch of structs were loaded so that e.g. when the user opens the panel
   * before the structs are fully loaded, the panel can subscribe to this custom event
   * and update itself with the new structs.
   *
   * This limitation is due to the fact that the rtmodule is an object (which will be
   * updated after the structs are loaded) that React its not aware of its changes
   * because the module object its not passed in to the panel component as prop but accessed externally.
   *
   * Improving this event approach to something reactive that can be tracked inside the react lifecycle,
   * allows us to easily watch the module or the rtstruct loading process in any other component
   * without subscribing to external events.
   */
  const event = new CustomEvent('extensiondicomrtrtloaded');
  document.dispatchEvent(event);
}

function _setROIContourMetadata(
  structureSet,
  StructureSetROISequence,
  RTROIObservationsSequence,
  ROIContour,
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
  } else {
    //Choose a color from the cornerstoneTools colorLUT
    // We sample from the default color LUT here (i.e. 0), as we have nothing else to go on.
    const { getters } = cornerstoneTools.getModule('segmentation');
    const color = getters.colorForSegmentIndexColorLUT(
      0,
      ROIContourData.ROINumber
    );

    ROIContourData.colorArray = [...color];
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

function _setToolEnabledIfNotEnabled(toolName) {
  cornerstone.getEnabledElements().forEach(enabledElement => {
    const { element, image } = enabledElement;
    const tool = cornerstoneTools.getToolForElement(element, toolName);

    if (tool.mode !== 'enabled') {
      // If not already active or passive, set passive so contours render.
      cornerstoneTools.setToolEnabled(toolName);
    }

    if (image) {
      cornerstone.updateImage(element);
    }
  });
}

function _getOrCreateImageIdSpecificToolData(toolState, imageId, toolName) {
  if (toolState.hasOwnProperty(imageId) === false) {
    toolState[imageId] = {};
  }

  const imageIdToolState = toolState[imageId];

  // If we don't have tool state for this type of tool, add an empty object
  if (imageIdToolState.hasOwnProperty(toolName) === false) {
    imageIdToolState[toolName] = {
      data: [],
    };
  }

  return imageIdToolState[toolName].data;
}

const _getImageId = (imageIdSopInstanceUidPairs, sopInstanceUID) => {
  const imageIdSopInstanceUidPairsEntry = imageIdSopInstanceUidPairs.find(
    imageIdSopInstanceUidPairsEntry =>
      imageIdSopInstanceUidPairsEntry.sopInstanceUID === sopInstanceUID
  );

  return imageIdSopInstanceUidPairsEntry ? imageIdSopInstanceUidPairsEntry.imageId : null;
};

function _getImageIdSopInstanceUidPairsForDisplaySet(
  studies,
  StudyInstanceUID,
  SeriesInstanceUID
) {
  const study = studies.find(
    study => study.StudyInstanceUID === StudyInstanceUID
  );

  const displaySets = study.displaySets.filter(set => {
    return set.SeriesInstanceUID === SeriesInstanceUID;
  });

  if (displaySets.length > 1) {
    console.warn(
      'More than one display set with the same SeriesInstanceUID. This is not supported yet...'
    );
    // TODO -> We could make check the instance list and see if any match?
    // Do we split the segmentation into two cornerstoneTools segmentations if there are images in both series?
    // ^ Will that even happen?
  }

  const referencedDisplaySet = displaySets[0];

  return referencedDisplaySet.images.map(image => {
    return {
      imageId: image.getImageId(),
      sopInstanceUID: image.getSOPInstanceUID(),
    };
  });
}

function _toArray(objOrArray) {
  return Array.isArray(objOrArray) ? objOrArray : [objOrArray];
}

function _getClosestSOPInstanceUID(
  ContourData,
  ContourGeometricType,
  NumberOfContourPoints,
  imageIdSopInstanceUidPairs
) {
  const closest = {
    distance: Infinity,
    sopInstanceUID: null,
  };

  let point;

  switch (ContourGeometricType) {
    case 'POINT':
      point = ContourData;
      break;
    case 'CLOSED_PLANAR':
    case 'OPEN_PLANAR':
      // These are defined as planar, so get the of the region to get the
      // Best mapping to a plane even if its potentially off center.

      point = [0, 0, 0];
      for (let p = 0; p < NumberOfContourPoints * 3; p += 3) {
        point[0] += ContourData[p];
        point[1] += ContourData[p + 1];
        point[2] += ContourData[p + 2];
      }

      point[0] /= NumberOfContourPoints;
      point[1] /= NumberOfContourPoints;
      point[2] /= NumberOfContourPoints;
  }

  imageIdSopInstanceUidPairs.forEach(pair => {
    const { imageId } = pair;

    const imagePlaneModule = cornerstone.metaData.get(
      'imagePlaneModule',
      imageId
    );

    const distance = distanceFromPointToPlane(point, imagePlaneModule);

    if (distance < closest.distance) {
      closest.distance = distance;
      closest.sopInstanceUID = pair.sopInstanceUID;
    }
  });

  return closest.sopInstanceUID;
}

/**
 *
 * @param {number[3]} P - The point
 * @param {object} imagePlaneModule The cornerstone metadata object for the imagePlane
 */
function distanceFromPointToPlane(P, imagePlaneModule) {
  const {
    rowCosines,
    columnCosines,
    imagePositionPatient: Q,
  } = imagePlaneModule;

  let N = [];
  vec3.cross(N, rowCosines, columnCosines);

  const [A, B, C] = N;

  const D = -A * Q[0] - B * Q[1] - C * Q[2];

  return Math.abs(A * P[0] + B * P[1] + C * P[2] + D); // Denominator is sqrt(A**2 + B**2 + C**2) which is 1 as its a normal vector
}
