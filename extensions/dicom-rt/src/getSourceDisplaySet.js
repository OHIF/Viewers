import { getReferencedDisplaySet } from '../../../platform/core/src/classes/metadata/StudyMetadata.js';


export default function getSourceDisplaySet(studies, rtStructDisplaySet, activateLabelMap = true) {
  const referencedDisplaySet = getReferencedDisplaySet(
    rtStructDisplaySet,
    studies
  );

  if (activateLabelMap) {
    rtStructDisplaySet.load(referencedDisplaySet, studies);
  }

  return referencedDisplaySet;
}
