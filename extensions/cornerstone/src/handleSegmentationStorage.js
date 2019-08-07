import * as dcmjs from "dcmjs";

import OHIF from "@ohif/core";
import cornerstone from "cornerstone-core";
import cornerstoneTools from "cornerstone-tools";

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

function retrieveDicomData(wadoUri) {
  // TODO: Authorization header depends on the server. If we ever have multiple servers
  // we will need to figure out how / when to pass this information in.
  return fetch(wadoUri, {
    headers: OHIF.DICOMWeb.getAuthorizationHeader()
  }).then(response => response.arrayBuffer());
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
  const segWadoUri = displaySet.images[0].getData().wadouri;
  const arrayBuffer = await retrieveDicomData(segWadoUri);
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
      "More than one display set with the same seriesInstanceUid. This is not supported yet..."
    );
  }

  const referenceDisplaySet = displaySets[0];
  const imageIds = referenceDisplaySet.images.map(image => image.getImageId());
  const results = parseSeg(arrayBuffer, imageIds);

  if (!results) {
    throw new Error("Fractional segmentations are not supported");
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
