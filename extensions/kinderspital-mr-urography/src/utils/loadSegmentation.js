import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import * as dcmjs from 'dcmjs';
import hull from './hull';

const { globalImageIdSpecificToolStateManager } = cornerstoneTools;

const { DicomMessage, DicomMetaDictionary, BitArray } = dcmjs.data;
const { Normalizer } = dcmjs.normalizers;

export default function loadSegmentation(arrayBuffer, displaySet) {
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

    _addToolData(imageId, points, label);
  }
}

function _addToolData(imageId, points, label) {
  debugger;

  const globalToolState = globalImageIdSpecificToolStateManager.saveToolState();
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
