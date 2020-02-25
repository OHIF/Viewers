import * as dcmjs from 'dcmjs';

import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

const { StackManager, DicomLoaderService } = OHIF.utils;

function getDisplaySet(studies, StudyInstanceUID, displaySetInstanceUid) {
  const study = studies.find(
    study => study.StudyInstanceUID === StudyInstanceUID
  );

  const displaySet = study.displaySets.find(set => {
    return set.displaySetInstanceUid === displaySetInstanceUid;
  });

  return displaySet;
}

function getDisplaySetsBySeries(studies, StudyInstanceUID, SeriesInstanceUID) {
  const study = studies.find(
    study => study.StudyInstanceUID === StudyInstanceUID
  );

  return study.displaySets.filter(set => {
    return set.SeriesInstanceUID === SeriesInstanceUID;
  });
}

function parseSeg(arrayBuffer, imageIds) {
  return dcmjs.adapters.Cornerstone.Segmentation.generateToolState(
    imageIds,
    arrayBuffer,
    cornerstone.metaData
  );
}

function addSegMetadataToCornerstoneToolState(
  segMetadata,
  toolState,
  displaySetInstanceUid
) {
  cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(
    toolState
  );

  const brushModule = cornerstoneTools.store.modules.brush;

  for (let i = 0; i < segMetadata.length; i++) {
    brushModule.setters.metadata(displaySetInstanceUid, i, segMetadata[i]);
  }
}

async function handleSegmentationStorage(
  studies,
  StudyInstanceUID,
  displaySetInstanceUid
) {
  const study = studies.find(
    study => study.StudyInstanceUID === StudyInstanceUID
  );
  const displaySet = getDisplaySet(
    studies,
    StudyInstanceUID,
    displaySetInstanceUid
  );

  const arrayBuffer = await DicomLoaderService.findDicomDataPromise(
    displaySet,
    studies
  );
  const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dicomData.dict
  );

  dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);

  const SeriesInstanceUID = dataset.ReferencedSeriesSequence.SeriesInstanceUID;
  const displaySets = getDisplaySetsBySeries(
    studies,
    StudyInstanceUID,
    SeriesInstanceUID
  );

  if (displaySets.length > 1) {
    console.warn(
      'More than one display set with the same SeriesInstanceUID. This is not supported yet...'
    );
  }

  const referenceDisplaySet = displaySets[0];
  const imageIds = referenceDisplaySet.images.map(image => image.getImageId());
  const results = parseSeg(arrayBuffer, imageIds);

  if (!results) {
    throw new Error('Fractional segmentations are not supported');
  }

  const { labelmapBuffer, segMetadata, segmentsOnFrame } = results;
  const { setters } = cornerstoneTools.getModule('segmentation');

  setters.labelmap3DByFirstImageId(
    imageIds[0],
    labelmapBuffer,
    0, // TODO -> Can define a color LUT based on colors in the SEG later.
    segMetadata,
    imageIds.length,
    segmentsOnFrame
  );

  const cachedStack = StackManager.findOrCreateStack(
    study,
    referenceDisplaySet
  );
  const stack = Object.assign({}, cachedStack);

  stack.currentImageIdIndex = 0;

  return {
    StudyInstanceUID,
    displaySetInstanceUid,
    stack,
  };
}

export default handleSegmentationStorage;
