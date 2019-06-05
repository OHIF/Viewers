import OHIF from 'ohif-core';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import * as dcmjs from 'dcmjs';
import { api } from 'dicomweb-client';
import DICOMWeb from '../../../ohif-core/src/DICOMWeb';

const { StackManager } = OHIF.utils;

function getDisplaySet(studies, studyInstanceUid, displaySetInstanceUid) {
  const study = studies.find(
    study => study.studyInstanceUid === studyInstanceUid
  );

  const displaySet = study.displaySets.find(set => {
    return set.displaySetInstanceUid === displaySetInstanceUid;
  });

  return displaySet;
}

function getDisplaySetsBySeries(studies, studyInstanceUid, seriesInstanceUid) {
  const study = studies.find(
    study => study.studyInstanceUid === studyInstanceUid
  );

  return study.displaySets.filter(set => {
    return set.seriesInstanceUid === seriesInstanceUid;
  });
}

function getCornerstoneStack(studies, studyInstanceUid, displaySetInstanceUid) {
  const study = studies.find(
    study => study.studyInstanceUid === studyInstanceUid
  );

  // Create shortcut to displaySet
  const displaySet = getDisplaySet(
    studies,
    studyInstanceUid,
    displaySetInstanceUid
  );

  // Get stack from Stack Manager
  const stack = StackManager.findOrCreateStack(study, displaySet);

  // Clone the stack here so we don't mutate it later
  const stackClone = Object.assign({}, stack);
  stackClone.currentImageIdIndex = 0;

  return stackClone;
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

function retrieveDicomData(studyInstanceUID,
                           seriesInstanceUID,
                           sopInstanceUID, wadoRoot) {
  // TODO: Authorization header depends on the server. If we ever have multiple servers
  // we will need to figure out how / when to pass this information in.

  const config = {
    url: wadoRoot,
    headers: DICOMWeb.getAuthorizationHeader()
  };

  const dicomWeb = new api.DICOMwebClient(config);
  const options = {
    studyInstanceUID,
    seriesInstanceUID,
    sopInstanceUID
  };

  return dicomWeb.retrieveInstance(options);
}

async function handleSegmentationStorage(
  studies,
  studyInstanceUid,
  displaySetInstanceUid
) {
  const study = studies.find(
    study => study.studyInstanceUid === studyInstanceUid
  );
  const displaySet = getDisplaySet(
    studies,
    studyInstanceUid,
    displaySetInstanceUid
  );

  // TODO: This is terrible
  const wadoRoot = displaySet.images[0].getData().wadoRoot;

  const StudyInstanceUID = displaySet.images[0].getStudyInstanceUID();
  const SeriesInstanceUID = displaySet.images[0].getSeriesInstanceUID();
  const SOPInstanceUID = displaySet.images[0].getSOPInstanceUID();

  const arrayBuffer = await retrieveDicomData(StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID, wadoRoot);
  const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dicomData.dict
  );

  dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);

  const seriesInstanceUid = dataset.ReferencedSeriesSequence.SeriesInstanceUID;
  const displaySets = getDisplaySetsBySeries(
    studies,
    studyInstanceUid,
    seriesInstanceUid
  );

  if (displaySets.length > 1) {
    console.warn(
      'More than one display set with the same seriesInstanceUid. This is not supported yet...'
    );
  }

  const referenceDisplaySet = displaySets[0];
  const imageIds = referenceDisplaySet.images.map(image => image.getImageId());
  const results = parseSeg(arrayBuffer, imageIds);

  if (!results) {
    throw new Error('Fractional segmentations are not supported');
  }

  const { segMetadata, toolState } = results;

  segMetadata.seriesInstanceUid = seriesInstanceUid;

  addSegMetadataToCornerstoneToolState(
    segMetadata,
    toolState,
    displaySetInstanceUid
  );

  const cachedStack = StackManager.findOrCreateStack(
    study,
    referenceDisplaySet
  );
  const stack = Object.assign({}, cachedStack);
  stack.currentImageIdIndex = 0;

  return {
    studyInstanceUid,
    displaySetInstanceUid,
    stack
  };
}

export default handleSegmentationStorage;
