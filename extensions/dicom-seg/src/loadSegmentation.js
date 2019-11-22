import OHIF from '@ohif/core';
import * as dcmjs from 'dcmjs';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

const { DicomLoaderService } = OHIF.utils;

export default async function loadSegmentation(
  segDisplaySet,
  referencedDisplaySet,
  studies
) {
  const { studyInstanceUid } = referencedDisplaySet;

  // Set here is loading is asynchronous.
  // If this function throws its set back to false.
  segDisplaySet.isLoaded = true;

  const segArrayBuffer = await DicomLoaderService.findDicomDataPromise(
    segDisplaySet,
    studies
  );

  const dicomData = dcmjs.data.DicomMessage.readFile(segArrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dicomData.dict
  );

  dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);

  const imageIds = _getImageIdsForDisplaySet(
    studies,
    studyInstanceUid,
    referencedDisplaySet.seriesInstanceUid
  );

  const results = _parseSeg(segArrayBuffer, imageIds);

  if (!results) {
    throw new Error('Fractional segmentations are not yet supported');
  }

  const { labelmapBuffer, segMetadata, segmentsOnFrame } = results;
  const { setters } = cornerstoneTools.getModule('segmentation');

  // TODO: Could define a color LUT based on colors in the SEG.
  // TODO -> Check the index and allocate a different labelmap if one exists?
  const labelmapIndex = _getNextLabelmapIndex(imageIds[0]);

  setters.labelmap3DByFirstImageId(
    imageIds[0],
    labelmapBuffer,
    labelmapIndex,
    segMetadata,
    imageIds.length,
    segmentsOnFrame
  );

  segDisplaySet.labelmapIndex = labelmapIndex;
}

function _getNextLabelmapIndex(firstImageId) {
  const { state } = cornerstoneTools.getModule('segmentation');
  const brushStackState = state.series[firstImageId];

  let labelmapIndex;

  if (brushStackState) {
    const { labelmaps3D } = brushStackState;

    for (let i = 0; i < labelmaps3D.length; i++) {
      if (!labelmaps3D[i]) {
        labelmapIndex = i;
        break;
      }
    }
    if (labelmapIndex === undefined) {
      labelmapIndex = 0;
    }
  } else {
    labelmapIndex = 0;
  }

  return labelmapIndex;
}

function _parseSeg(arrayBuffer, imageIds) {
  return dcmjs.adapters.Cornerstone.Segmentation.generateToolState(
    imageIds,
    arrayBuffer,
    cornerstone.metaData
  );
}

function _getImageIdsForDisplaySet(
  studies,
  studyInstanceUid,
  seriesInstanceUid
) {
  const study = studies.find(
    study => study.studyInstanceUid === studyInstanceUid
  );

  const displaySets = study.displaySets.filter(set => {
    return set.seriesInstanceUid === seriesInstanceUid;
  });

  if (displaySets.length > 1) {
    console.warn(
      'More than one display set with the same seriesInstanceUid. This is not supported yet...'
    );
    // TODO -> We could make check the instance list and see if any match?
    // Do we split the segmentation into two cornerstoneTools segmentations if there are images in both series?
    // ^ Will that even happen?
  }

  const referencedDisplaySet = displaySets[0];

  return referencedDisplaySet.images.map(image => image.getImageId());
}
