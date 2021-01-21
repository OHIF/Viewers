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
    throw new Error(err.message);
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

  if (!displaySet.isLoaded) {
    const loadPromise = displaySet.load(referencedDisplaySet, studies);

    loadPromise.catch(error => {
      onDisplaySetLoadFailure(error);

      // Return old index.
      return activeLabelmapIndex;
    });

    await loadPromise;
  }

  labelmapIndex =
    displaySet.hasOverlapping === true
      ? displaySet.originLabelMapIndex
      : displaySet.labelmapIndex;

  // This might have just been created, so need to use the non-cached value.
  state = cornerstoneTools.getModule('segmentation').state;
  brushStackState = state.series[firstImageId];
  brushStackState.activeLabelmapIndex = labelmapIndex;

  refreshViewports();
  callback();

  return labelmapIndex;
}
