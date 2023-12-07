import { utils, log } from '@ohif/core';
import cornerstoneTools from 'cornerstone-tools';
import refreshViewports from './refreshViewports';

const { studyMetadataManager } = utils;

/**
 *
 *
 * @param {*} viewportSpecificData
 * @param {*} studies
 * @param {*} displaySet
 * @param {*} firstImageId
 * @param {*} activeLabelmapIndex
 * @returns
 */
export default async function setActiveLabelmap(
  referencedDisplaySet,
  studies,
  displaySet,
  callback = () => {},
  onDisplaySetLoadFailure = err => {
    console.error(err.message);
  }
) {
  const studyMetadata = studyMetadataManager.get(
    referencedDisplaySet.StudyInstanceUID
  );
  const firstImageId = studyMetadata.getFirstImageId(
    referencedDisplaySet.displaySetInstanceUID
  );

  let { state } = cornerstoneTools.getModule('segmentation');

  let brushStackState = state.series[firstImageId];
  const activeLabelmapIndex = brushStackState
    ? brushStackState.activeLabelmapIndex
    : undefined;

  let labelmapIndex =
    displaySet.hasOverlapping === true
      ? displaySet.originLabelMapIndex
      : displaySet.labelmapIndex;

  if (labelmapIndex === activeLabelmapIndex) {
    log.warn(`${activeLabelmapIndex} is already the active labelmap`);
    return labelmapIndex;
  }

  if (!displaySet.isLoaded && !displaySet.loadError) {
    try {
      await displaySet.load(referencedDisplaySet, studies);
    } catch (error) {
      displaySet.isLoaded = false;
      displaySet.loadError = true;
      displaySet.segLoadErrorMessagge = error.message;
      onDisplaySetLoadFailure(error);

      /*
       * TODO: Improve the way we notify parts of the app
       * that depends on derived display sets to be loaded.
       * (Implement pubsub for better tracking of derived display sets)
       */
      const event = new CustomEvent('segmentationLoadingError');
      document.dispatchEvent(event);

      return -1;
    }
  }

  labelmapIndex =
    displaySet.hasOverlapping === true
      ? displaySet.originLabelMapIndex
      : displaySet.labelmapIndex;

  // This might have just been created, so need to use the non-cached value.
  state = cornerstoneTools.getModule('segmentation').state;

  brushStackState = state.series[firstImageId];
  if (brushStackState) {
    brushStackState.activeLabelmapIndex = labelmapIndex;
  }

  refreshViewports();
  callback();

  return labelmapIndex;
}
