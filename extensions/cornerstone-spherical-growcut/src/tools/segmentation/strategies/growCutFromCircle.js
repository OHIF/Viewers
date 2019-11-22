import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import {
  performGrowCut,
  getCircumferencePoints,
  subVolume,
  updateSegmentsOnActiveLabelmap,
  deleteLabelmap,
} from '../../../utils';
import getDatasetPair from '../../../utils/getDatasetPair';
import calculateIterationCountFromExtent from '../../../utils/calculateIterationCountFromExtent';

const {
  setPixelDataOfSubVolume,
  getPointsInSubVolume,
  getExtentOfSphere,
} = subVolume;
const { getToolState } = cornerstoneTools;
const { floodFill } = cornerstoneTools.importInternal('util/segmentationUtils');
const segmentationModule = cornerstoneTools.getModule('segmentation');
const getLogger = cornerstoneTools.importInternal('util/getLogger');

const logger = getLogger(
  'GrowCutSegmentationTool:tools:segmentation:strategies:growCutFromCircle'
);

// We need "WIP" label values to work with within the Uint16 bounds of the labelmap.
// This is on the temp labelmap, and we replace the values at the end with the actual segment.
// This is not compatible with drawing either of these values, but isn't important for now.
// TODO: We could swap these to different labels on command if they are actually used.
const seedValue = 65532;
const outsideValue = 65533;
const previewLabelmapIndex = -1;

export default function growCutFromCircle(evt, operationData) {
  const { segmentationMixinType } = operationData;
  const { shouldCleanSegment } = this.configuration;

  if (segmentationMixinType !== 'circleSegmentationMixin') {
    logger.error(
      'fillInsideCircle operation requires circleSegmentationMixin operationData, recieved ${segmentationMixinType}'
    );

    return;
  }

  const { points } = operationData;

  cornerstoneTools.store.state.isMultiPartToolActive = true;

  asyncGrowCutFromCircle(evt, points, shouldCleanSegment);
}

async function asyncGrowCutFromCircle(evt, points, shouldCleanSegment = false) {
  const { getters, setters } = segmentationModule;
  const eventData = evt.detail;
  const { image, element } = eventData;

  const targetLabelmapIndex = getters.activeLabelmapIndex(element);
  const activeSegmentIndex = getters.activeSegmentIndex(element);

  setters.activeLabelmapIndex(element, previewLabelmapIndex);
  setters.activeSegmentIndex(element, activeSegmentIndex);

  const stack = getToolState(element, 'stack');
  const imageIds = stack.data[0].imageIds;
  const currentImageIdIndex = stack.data[0].currentImageIdIndex;

  await Promise.all(imageIds.map(cornerstone.loadAndCacheImage));

  const extent = getExtentOfSphere(
    currentImageIdIndex,
    points,
    image,
    imageIds
  );

  const backgroundVolume = new Int16Array(extent.arrayLength);
  const labelmapVolume = new Uint16Array(extent.arrayLength);

  const { start, end } = getPointsInSubVolume(points, extent);

  _initializeSeeds(labelmapVolume, extent, start, end);

  const { backgroundDataset, labelmapDataset } = getDatasetPair(
    backgroundVolume,
    labelmapVolume,
    extent
  );

  await setPixelDataOfSubVolume(backgroundVolume, imageIds, extent);

  let numIterations = calculateIterationCountFromExtent(extent);

  const result = performGrowCut(
    backgroundDataset,
    labelmapDataset,
    numIterations
  );

  shouldCleanSegment
    ? _cleanSegmentAndFinalize(
        result,
        activeSegmentIndex,
        [start.x, start.y, extent.currentSubVolumeIndex],
        {
          width: extent.width,
          height: extent.height,
          numFrames: extent.numFrames,
        }
      )
    : _finalizeSegment(result, activeSegmentIndex);

  _populateActiveLabelmapWithSubLabelmap(
    eventData,
    result,
    extent,
    activeSegmentIndex
  );
  updateSegmentsOnActiveLabelmap(eventData, extent);

  // TODO -> Confirmation before application.

  setters.activeLabelmapIndex(element, targetLabelmapIndex);

  _populateActiveLabelmapWithSubLabelmap(
    eventData,
    result,
    extent,
    activeSegmentIndex
  );
  updateSegmentsOnActiveLabelmap(eventData, extent);

  deleteLabelmap(element, previewLabelmapIndex);

  cornerstoneTools.store.state.isMultiPartToolActive = false;
}

function _populateActiveLabelmapWithSubLabelmap(
  eventData,
  subVolumeData,
  extent,
  segmentIndex
) {
  const { image, element } = eventData;
  const { getters } = segmentationModule;
  const activeLabelmapIndex = getters.activeLabelmapIndex(element);
  const previewToolData = getters.labelmapBuffers(element, activeLabelmapIndex);
  const labelmapData = new Uint16Array(previewToolData.buffer);
  const labelMapOffsetX = extent.topLeft.x;
  const labelMapOffsetY = extent.topLeft.y;
  const imageWidth = image.width;
  const imageHeight = image.height;

  let imageIdIndex = extent.bottomImageIdIndex;

  // Put the subvolume back in the full volume.
  for (let k = 0; k < extent.numFrames; k++) {
    const labelmapOffsetK = imageIdIndex * imageWidth * imageHeight;
    const subVolumeOffset = k * extent.width * extent.height;

    for (let j = 0; j < extent.height; j++) {
      for (let i = 0; i < extent.width; i++) {
        if (
          subVolumeData[subVolumeOffset + j * extent.width + i] === segmentIndex
        ) {
          labelmapData[
            labelmapOffsetK +
              (labelMapOffsetY + j) * imageWidth +
              labelMapOffsetX +
              i
          ] = segmentIndex;
        }
      }
    }

    imageIdIndex++;
  }
}

function _initializeSeeds(labelmapData, extent, start, end) {
  const { width, height, currentSubVolumeIndex } = extent;

  // Set the center point of the circle to the 'inside'
  labelmapData[
    width * height * currentSubVolumeIndex + start.y * width + start.x
  ] = seedValue;

  for (let x = start.x - 1; x <= start.x + 1; x++) {
    for (let y = start.y - 1; y <= start.y + 1; y++) {
      labelmapData[
        width * height * currentSubVolumeIndex + y * width + x
      ] = seedValue;
    }
  }

  // Set the circumference points to the 'outside'
  const circumferencePoints = getCircumferencePoints(start, end, width, height);

  circumferencePoints.forEach(point => {
    const { x, y } = point;
    const xRound = Math.floor(x);
    const yRound = Math.floor(y);

    labelmapData[
      width * height * currentSubVolumeIndex + yRound * width + xRound
    ] = outsideValue;
  });
}

function _finalizeSegment(labelmapData, activeSegmentIndex) {
  for (let i = 0; i < labelmapData.length; i++) {
    if (labelmapData[i] === seedValue) {
      labelmapData[i] = activeSegmentIndex;
    } else if (labelmapData[i] === outsideValue) {
      labelmapData[i] = 0;
    }
  }
}

function _cleanSegmentAndFinalize(
  labelmapData,
  activeSegmentIndex,
  seedVoxel,
  { width, height, numFrames }
) {
  const frameLength = width * height;

  // Define a getter for the floodfill.
  function getter(x, y, z) {
    // Check if out of bounds, as the flood filler doesn't know about the dimensions of
    // The data structure. E.g. if cols is 10, (0,1) and (10, 0) would point to the same
    // position in this getter.

    if (
      x >= width ||
      x < 0 ||
      y >= height ||
      y < 0 ||
      z >= numFrames ||
      z < 0
    ) {
      return;
    }

    return labelmapData[z * frameLength + y * width + x];
  }

  // Fill outside.
  const fillZero = floodFill(getter, [0, 0, 0]).flooded;

  for (let i = 0; i < fillZero.length; i++) {
    const voxel = fillZero[i];

    labelmapData[voxel[2] * frameLength + voxel[1] * width + voxel[0]] = 0;
  }

  // Fill segment from source to get a contiguous region.
  const fillInternal = floodFill(getter, seedVoxel).flooded;

  for (let i = 0; i < fillInternal.length; i++) {
    const voxel = fillInternal[i];

    labelmapData[
      voxel[2] * frameLength + voxel[1] * width + voxel[0]
    ] = activeSegmentIndex;
  }

  // Fill holes with segment color and remove islands.
  for (let i = 0; i < labelmapData.length; i++) {
    if (labelmapData[i] === seedValue) {
      labelmapData[i] = 0;
    } else if (labelmapData[i] === outsideValue) {
      labelmapData[i] = activeSegmentIndex;
    }
  }

  // TODO -> there must be a neater way to do this:
  // Perform another floodfill, as some of those "holes" might have been holes in other volumes.

  // Fill segment from source to get a contiguous region.
  const fillInternal2 = floodFill(getter, seedVoxel).flooded;

  for (let i = 0; i < fillInternal2.length; i++) {
    const voxel = fillInternal2[i];

    labelmapData[
      voxel[2] * frameLength + voxel[1] * width + voxel[0]
    ] = seedValue;
  }

  // set seed back to segment and remaining segments (islands to zero.) with segment color and remove islands.
  for (let i = 0; i < labelmapData.length; i++) {
    if (labelmapData[i] === activeSegmentIndex) {
      labelmapData[i] = 0;
    } else if (labelmapData[i] === seedValue) {
      labelmapData[i] = activeSegmentIndex;
    }
  }
}
