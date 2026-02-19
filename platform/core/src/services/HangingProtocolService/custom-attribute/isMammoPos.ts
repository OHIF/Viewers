export default function isMammoPos(displaySet: any, pos: 'R' | 'L', type: 'CC' | 'MLO') {
  const instanceTags = displaySet.instances[0];
  const viewCode = instanceTags.ViewCodeSequence?.[0]?.CodeValue;
  const laterality =
    instanceTags.ImageLaterality ||
    instanceTags.Laterality ||
    instanceTags.SharedFunctionalGroupsSequence?.[0]?.FrameAnatomySequence?.[0]?.FrameLaterality;

  const typeToCodeMap = {
    CC: 'R-10242',
    MLO: 'R-10226',
  };

  return laterality === pos && viewCode === typeToCodeMap[type];
}
