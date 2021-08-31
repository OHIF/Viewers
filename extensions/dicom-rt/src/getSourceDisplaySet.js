import { metadata } from '@ohif/core';

export default function getSourceDisplaySet(studies, rtStructDisplaySet, activateLabelMap = true) {
  const referencedDisplaySet = metadata.StudyMetadata.getReferencedDisplaySet(
    rtStructDisplaySet,
    studies
  );

  if (activateLabelMap) {
    rtStructDisplaySet.load(referencedDisplaySet, studies);
  }

  return referencedDisplaySet;
}
