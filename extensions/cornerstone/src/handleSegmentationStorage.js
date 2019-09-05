import * as dcmjs from 'dcmjs';
import { api } from 'dicomweb-client';

import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import DICOMWeb from '@ohif/core/src/DICOMWeb';

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

function retrieveDicomData(imageInstance) {
  // Set frame value to null so we can create an imageId which will retrieve
  // the entire instance
  const imageId = imageInstance && imageInstance.getImageId(null);

  if (!imageId) {
    throw Error('ImageId for given segmentation storage is not valid');
  }

  const getDicomFileMethod = (imageId, imageInstance) => {
    return cornerstone.loadAndCacheImage(imageId).then(image => {
      return image && image.data && image.data.byteArray.buffer;
    });
  };

  const getWadorsMethod = (imageId, imageInstance) => {
    const config = {
      url: imageInstance.getData().wadoRoot,
      headers: OHIF.DICOMWeb.getAuthorizationHeader(),
    };
    const dicomWeb = new api.DICOMwebClient(config);

    return dicomWeb.retrieveInstance({
      studyInstanceUID: imageInstance.getStudyInstanceUID(),
      seriesInstanceUID: imageInstance.getSeriesInstanceUID(),
      sopInstanceUID: imageInstance.getSOPInstanceUID(),
    });
  };

  const getDefaultMethod = (imageId, imageInstance) => {
    return fetch(imageId, {
      headers: OHIF.DICOMWeb.getAuthorizationHeader(),
    }).then(response => response.arrayBuffer());
  };

  const getLoaderType = imageId => {
    const loaderRegExp = /^\w+\:/;
    const loaderType = loaderRegExp.exec(imageId);

    return (loaderRegExp.lastIndex === 0 && loaderType && loaderType[0]) || '';
  };

  let getDicomData = getDefaultMethod;
  const loaderType = getLoaderType(imageId);

  switch (loaderType) {
    case 'dicomfile:':
      getDicomData = getDicomFileMethod;
      break;
    case 'wadors:':
      getDicomData = getWadorsMethod;
      break;
    case 'wadouri:':
      // Strip out the image loader specifier
      imageId = imageId.substring(imageId.indexOf(':') + 1);
      break;
  }

  return getDicomData(imageId, imageInstance);
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

  const imageInstance =
    displaySet && displaySet.images && displaySet && displaySet.images[0];

  const arrayBuffer = await retrieveDicomData(imageInstance);
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
    stack,
  };
}

export default handleSegmentationStorage;
