export default (study, extraData) =>
  Math.max(...(extraData?.displaySets?.map?.(ds => ds.numImageFrames ?? 0) || [0]));
