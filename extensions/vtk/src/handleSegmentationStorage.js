import * as dcmjs from 'dcmjs';

import OHIF from '@ohif/core';
import { api } from 'dicomweb-client';

const { StackManager } = OHIF.utils;

function getDisplaySet(studies, StudyInstanceUID, displaySetInstanceUID) {
  const study = studies.find(
    study => study.StudyInstanceUID === StudyInstanceUID
  );

  const displaySet = study.displaySets.find(set => {
    return set.displaySetInstanceUID === displaySetInstanceUID;
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

function getCornerstoneStack(studies, StudyInstanceUID, displaySetInstanceUID) {
  const study = studies.find(
    study => study.StudyInstanceUID === StudyInstanceUID
  );

  // Create shortcut to displaySet
  const displaySet = getDisplaySet(
    studies,
    StudyInstanceUID,
    displaySetInstanceUID
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
  sopInstanceUid,
  wadoRoot
) {
  const config = {
    url: wadoRoot,
    headers: DICOMWeb.getAuthorizationHeader(),
  };

  const dicomWeb = new api.DICOMwebClient(config);
  const options = {
    studyInstanceUID,
    seriesInstanceUID,
    sopInstanceUid,
  };

  return dicomWeb.retrieveInstance(options);
}

async function handleSegmentationStorage(
  studies,
  StudyInstanceUID,
  displaySetInstanceUID
) {
  const study = studies.find(
    study => study.StudyInstanceUID === StudyInstanceUID
  );
  const displaySet = getDisplaySet(
    studies,
    StudyInstanceUID,
    displaySetInstanceUID
  );

  // TODO: This is terrible but we need to use WADO-RS or we can't retrieve the SEG
  // from google cloud
  const wadoRoot = displaySet.images[0].getData().wadoRoot;

  const arrayBuffer = await retrieveDicomData(
    displaySet.images[0].getStudyInstanceUID(),
    displaySet.images[0].getSeriesInstanceUID(),
    displaySet.images[0].getSOPInstanceUID(),
    wadoRoot
  );

  const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dicomData.dict
  );

  const segments = dcmjs.adapters.VTKjs.Segmentation.generateSegments(dataset);

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

  if (!results) {
    throw new Error('Fractional segmentations are not supported');
  }

  const cachedStack = StackManager.findOrCreateStack(
    study,
    referenceDisplaySet
  );
  const stack = Object.assign({}, cachedStack);
  stack.currentImageIdIndex = 0;

  return {
    referenceDataObject,
    labelmapDataObject,
  };

  return {
    StudyInstanceUID,
    displaySetInstanceUID,
    stack,
  };
}

export default handleSegmentationStorage;
