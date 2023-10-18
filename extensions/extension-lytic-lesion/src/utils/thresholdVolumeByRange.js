// // import { pointInShapeCallback } from '../../utilities';
// import { triggerSegmentationDataModified } from '../../stateManagement/segmentation/triggerSegmentationEvents';
// import { getVoxelOverlap, processVolumes, } from 'node_modules/@cornerstonejs/tools/dist/esm/utilities/segmentation/utilities.js';
import { pointInShapeCallback } from '@cornerstonejs/tools/dist/esm/utilities/';
import { triggerSegmentationDataModified } from '@cornerstonejs/tools/dist/esm/stateManagement/segmentation/triggerSegmentationEvents';
import {
  getVoxelOverlap,
  processVolumes,
} from '@cornerstonejs/tools/dist/esm/utilities/segmentation/utilities';

function thresholdVolumeByRange(
  segmentationVolume,
  thresholdVolumeInformation,
  segmentIndex,
  options
) {
  const { imageData: segmentationImageData } = segmentationVolume;
  const scalarData = segmentationVolume.getScalarData();
  const { overwrite, boundsIJK } = options;
  const overlapType = options?.overlapType || 0;
  if (overwrite) {
    for (let i = 0; i < scalarData.length; i++) {
      scalarData[i] = 0;
    }
  }
  const { baseVolumeIdx, volumeInfoList } = processVolumes(
    segmentationVolume,
    thresholdVolumeInformation
  );
  let overlaps, total, range;
  const testOverlapRange = (volumeInfo, voxelSpacing, voxelCenter) => {
    const callbackOverlap = ({ value }) => {
      total = total + 1;
      if (value >= range.lower && value <= range.upper) {
        overlaps = overlaps + 1;
      }
    };
    const { imageData, dimensions, lower, upper } = volumeInfo;
    const overlapBounds = getVoxelOverlap(
      imageData,
      dimensions,
      voxelSpacing,
      voxelCenter
    );
    total = 0;
    overlaps = 0;
    range = { lower, upper };
    let overlapTest = false;
    pointInShapeCallback(imageData, () => true, callbackOverlap, overlapBounds);
    if (overlapType === 0) {
      overlapTest = overlaps > 0;
    } else if (overlapType == 1) {
      overlapTest = overlaps === total;
    }
    return overlapTest;
  };
  const testRange = (volumeInfo, pointIJK) => {
    const { imageData, referenceValues, lower, upper } = volumeInfo;
    const offset = imageData.computeOffsetIndex(pointIJK);
    const value = referenceValues[offset];
    if (value <= lower || value >= upper) {
      return false;
    } else {
      return true;
    }
  };
  const callback = ({ index, pointIJK, pointLPS }) => {
    let insert = volumeInfoList.length > 0;
    for (let i = 0; i < volumeInfoList.length; i++) {
      if (volumeInfoList[i].volumeSize === scalarData.length) {
        insert = testRange(volumeInfoList[i], pointIJK);
      } else {
        insert = testOverlapRange(
          volumeInfoList[i],
          volumeInfoList[baseVolumeIdx].spacing,
          pointLPS
        );
      }
      if (!insert) {
        break;
      }
    }
    if (insert) {
      scalarData[index] = segmentIndex;
    }
  };
  pointInShapeCallback(segmentationImageData, () => true, callback, boundsIJK);
  triggerSegmentationDataModified(segmentationVolume.volumeId);
  return segmentationVolume;
}
export default thresholdVolumeByRange;
//# sourceMappingURL=thresholdVolumeByRange.js.map
