import csTools from 'cornerstone-tools';
import { getItem } from '../lib/localStorageUtils';

const toolImport = csTools.import;
const scrollToIndex = toolImport('util/scrollToIndex');

const handleScrolltoIndex = (enabledElement, seriesUid) => {
  const lastSavedScroll = getItem(`stackScroll:${seriesUid}`);
  if (lastSavedScroll) {
    const { newImageIdIndex } = lastSavedScroll;
    console.log('handleScrolltoIndex', {
      newImageIdIndex,
      seriesUid,
    });
    scrollToIndex(enabledElement, parseInt(newImageIdIndex));
  }
};

export default handleScrolltoIndex;
