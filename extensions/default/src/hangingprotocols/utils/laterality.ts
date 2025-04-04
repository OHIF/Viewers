export default displaySet => {
  const frameAnatomy =
    displaySet?.images?.[0]?.SharedFunctionalGroupsSequence?.[0]?.FrameAnatomySequence?.[0];
  if (!frameAnatomy) {
    return undefined;
  }
  const laterality = frameAnatomy?.FrameLaterality;
  return laterality;
};
