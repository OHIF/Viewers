import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import * as dcmjs from 'dcmjs';
import hull from './hull';
import TOOL_NAMES from '../tools/toolNames';
import { measurementConfig } from '../tools/KinderspitalFreehandRoiTool';
import { labelToSegmentNumberMap } from '../constants/labels';

const { KINDERSPITAL_FREEHAND_ROI_TOOL } = TOOL_NAMES;

const { globalImageIdSpecificToolStateManager } = cornerstoneTools;

const { DicomMessage, DicomMetaDictionary, BitArray } = dcmjs.data;
const { Normalizer } = dcmjs.normalizers;

export default function loadSegmentation(arrayBuffer, metadata, displaySet) {
  _removeOldAnnotations();

  const dicomData = DicomMessage.readFile(arrayBuffer);
  const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
  dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);
  const multiframe = Normalizer.normalizeToDataset([dataset]);

  const pixelData = BitArray.unpack(multiframe.PixelData);

  const sopInstanceUIDtoImageId = {};

  displaySet.images.forEach(stack => {
    stack.forEach(image => {
      sopInstanceUIDtoImageId[image.getSOPInstanceUID()] = image.getImageId();
    });
  });

  const {
    PerFrameFunctionalGroupsSequence,
    SegmentSequence,
    Rows,
    Columns,
  } = multiframe;

  const frameLength = Rows * Columns;

  const PerFrameFunctionalGroupsAsArray = toArray(
    PerFrameFunctionalGroupsSequence
  );

  const SegmentSequenceAsArray = toArray(SegmentSequence);

  for (
    let i = 0, groupsLen = PerFrameFunctionalGroupsAsArray.length;
    i < groupsLen;
    ++i
  ) {
    const PerFrameFunctionalGroups = PerFrameFunctionalGroupsAsArray[i];

    const pixelDataForFrame = new Uint8Array(
      pixelData.buffer,
      i * frameLength,
      frameLength
    );

    const label = _getLabel(PerFrameFunctionalGroups, SegmentSequenceAsArray);
    const points = _getPoints(pixelDataForFrame, Rows, Columns);
    const ReferencedSOPInstanceUID =
      PerFrameFunctionalGroups.DerivationImageSequence.SourceImageSequence
        .ReferencedSOPInstanceUID;
    const imageId = sopInstanceUIDtoImageId[ReferencedSOPInstanceUID];

    _addToolData(imageId, points, label, metadata);
  }
}

function _addToolData(imageId, points, label, metadata) {
  const labelNumber = labelToSegmentNumberMap[label];

  const labelSpecificMetadata = metadata.find(
    md => md.labelNumber === labelNumber
  );

  const globalToolState = globalImageIdSpecificToolStateManager.saveToolState();

  if (!globalToolState[imageId]) {
    globalToolState[imageId] = {};
  }

  const imageIdSpecificToolState = globalToolState[imageId];

  if (!imageIdSpecificToolState[KINDERSPITAL_FREEHAND_ROI_TOOL]) {
    imageIdSpecificToolState[KINDERSPITAL_FREEHAND_ROI_TOOL] = { data: [] };
  } else if (!imageIdSpecificToolState[KINDERSPITAL_FREEHAND_ROI_TOOL].data) {
    imageIdSpecificToolState[KINDERSPITAL_FREEHAND_ROI_TOOL].data = [];
  }

  const freehandToolData =
    imageIdSpecificToolState[KINDERSPITAL_FREEHAND_ROI_TOOL].data;

  const instanceMetadata = cornerstone.metaData.get('instance', imageId);

  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    TemporalPositionIdentifier,
  } = instanceMetadata;

  // TODO: Generate mock timecouse and add here

  _joinPointsWithLines(points);

  const measurementData = {
    label,
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    TemporalPositionIdentifier,
    FrameIndex: 1, //Would need to update this in the case of a multiframe.
    visible: true,
    active: true,
    invalidated: true,
    color: undefined,
    handles: {
      points,
    },
    measurementNumber: measurementConfig.measurementNumber,
    areaUnderCurve: 0,
    volume: labelSpecificMetadata.volume, // TODO -> Load volume from received data.
    timecourse: labelSpecificMetadata.timecourse, // TODO -> Load points from received data.
    pIndex: undefined,
    gIndex: undefined,
  };

  measurementConfig.measurementNumber++;

  measurementData.handles.textBox = {
    active: false,
    hasMoved: false,
    movesIndependently: false,
    drawnIndependently: true,
    allowedOutsideImage: true,
    hasBoundingBox: true,
  };

  freehandToolData.push(measurementData);
}

function _getLabel(PerFrameFunctionalGroups, SegmentSequenceAsArray) {
  const SegmentNumber =
    PerFrameFunctionalGroups.SegmentIdentificationSequence
      .ReferencedSegmentNumber;

  const segmentMetadata = SegmentSequenceAsArray.find(
    item => item.SegmentNumber === SegmentNumber
  );

  return segmentMetadata.SegmentLabel;
}

function _joinPointsWithLines(points) {
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  lastPoint.lines = [{ x: firstPoint.x, y: firstPoint.y }];

  for (let i = 0; i < points.length - 1; i++) {
    const nextPoint = points[i + 1];
    points[i].lines = [{ x: nextPoint.x, y: nextPoint.y }];
  }
}

function _getPoints(pixelData, Rows, Columns) {
  let pixelIndex = 0;

  const verticies = [];

  // Get all points

  for (let x = 0; x < Rows; x++) {
    for (let y = 0; y < Columns; y++) {
      if (pixelData[pixelIndex]) {
        // Put 4 corners of the voxel in the list so we gift wrap the voxels and not the top left of voxels.
        verticies.push([x, y]);
        verticies.push([x + 1, y]);
        verticies.push([x, y + 1]);
        verticies.push([x + 1, y + 1]);
      }
      pixelIndex++;
    }
  }

  console.log(verticies);

  const edgeVerticies = hull(verticies, 4);

  // Map from array to cornerstoneTools point format.
  const points = edgeVerticies.map(v => {
    return { x: v[0], y: v[1] };
  });

  console.log(points);

  return points;
}

function toArray(objOrArray) {
  return Array.isArray(objOrArray) ? objOrArray : [objOrArray];
}

function _removeOldAnnotations() {
  const globalToolState = globalImageIdSpecificToolStateManager.saveToolState();

  const imageIds = Object.keys(globalToolState);

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const imageIdSpecificToolState = globalToolState[imageId];

    const freehandToolData =
      imageIdSpecificToolState[KINDERSPITAL_FREEHAND_ROI_TOOL];

    if (freehandToolData) {
      delete imageIdSpecificToolState[KINDERSPITAL_FREEHAND_ROI_TOOL];
    }
  }

  measurementConfig.measurementNumber = 1;
}
