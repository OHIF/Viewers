import setActiveLabelmap from './utils/setActiveLabelMap';
import { getReferencedDisplaySet } from '../../../platform/core/src/classes/metadata/StudyMetadata.js';

export default function getSourceDisplaySet(studies, segDisplaySet, activateLabelMap = true, onDisplaySetLoadFailureHandler) {
  const referencedDisplaySet = getReferencedDisplaySet(segDisplaySet, studies);

  let activatedLabelmapPromise;
  if (activateLabelMap) {
    activatedLabelmapPromise = setActiveLabelmap(referencedDisplaySet, studies, segDisplaySet, undefined, onDisplaySetLoadFailureHandler);
  }

  return {
    referencedDisplaySet : referencedDisplaySet,
    activatedLabelmapPromise : activatedLabelmapPromise
  }
}
