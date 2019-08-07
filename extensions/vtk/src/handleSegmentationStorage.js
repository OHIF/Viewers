import * as dcmjs from "dcmjs";

import OHIF from "@ohif/core";
import { api } from "dicomweb-client";

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

function retrieveDicomData(
  studyInstanceUID,
  seriesInstanceUID,
  sopInstanceUID,
  wadoRoot
) {
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

  // TODO: This is terrible but we need to use WADO-RS or we can't retrieve the SEG
  // from google cloud
  const wadoRoot = displaySet.images[0].getData().wadoRoot;

  const StudyInstanceUID = displaySet.images[0].getStudyInstanceUID();
  const SeriesInstanceUID = displaySet.images[0].getSeriesInstanceUID();
  const SOPInstanceUID = displaySet.images[0].getSOPInstanceUID();

  const arrayBuffer = await retrieveDicomData(
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    wadoRoot
  );

  const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dicomData.dict
  );

  const segments = dcmjs.adapters.VTKjs.Segmentation.generateSegments(dataset);

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

  if (!results) {
    throw new Error("Fractional segmentations are not supported");
  }

  const cachedStack = StackManager.findOrCreateStack(
    study,
    referenceDisplaySet
  );
  const stack = Object.assign({}, cachedStack);
  stack.currentImageIdIndex = 0;

  return {
    referenceDataObject,
    labelmapDataObject
  };

  return {
    studyInstanceUid,
    displaySetInstanceUid,
    stack
  };
}

export default handleSegmentationStorage;
