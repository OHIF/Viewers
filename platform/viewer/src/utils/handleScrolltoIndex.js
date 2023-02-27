import csTools from 'cornerstone-tools';

const toolImport = csTools.import;
const scrollToIndex = toolImport('util/scrollToIndex');

const handleScrolltoIndex = enabledElement => {
  let currentImageIdIndex = localStorage.getItem('currentImageIdIndex');
  scrollToIndex(enabledElement, parseInt(currentImageIdIndex));
};

export default handleScrolltoIndex;
