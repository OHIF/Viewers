import { viewportUtils } from './viewportUtils';

/**
 * This function switches to an image given an element and 
 * the relative distance from the current image in the stack
 * 
 *      e.g. switchToImageRelative(element, -1) to switch to currentImageIdIndex - 1
 * 
 * @param element
 * @param {number} [distanceFromCurrentIndex] The image index in the stack to switch to.
 */
export function switchToImageRelative(distanceFromCurrentIndex) {
    var element = viewportUtils.getActiveViewportElement();
    cornerstoneTools.scroll(element, distanceFromCurrentIndex);
}
