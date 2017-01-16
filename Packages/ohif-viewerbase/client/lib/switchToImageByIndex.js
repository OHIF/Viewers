import { viewportUtils } from './viewportUtils';

/**
 * This function switches to an image given an element and the index of the image in the current stack
 * Note: Negative indexing is supported:
 * 
 *      e.g. switchToImageByIndex(element, -1) to switch to the last image of the stack
 * 
 * @param element
 * @param {number} [newImageIdIndex] The image index in the stack to switch to.
 */
export function switchToImageByIndex(newImageIdIndex) {
    var element = viewportUtils.getActiveViewportElement();
    cornerstoneTools.scrollToIndex(element, newImageIdIndex);
}
