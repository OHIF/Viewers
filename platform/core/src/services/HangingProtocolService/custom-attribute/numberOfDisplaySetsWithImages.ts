export default (study, extraData) => {
  const ret = extraData?.displaySets?.filter(ds => ds.numImageFrames > 0)?.length;
  console.log('number of display sets with images', ret);
  return ret;
};
