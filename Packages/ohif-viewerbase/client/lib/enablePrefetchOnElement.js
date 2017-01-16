import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { StackManager } from './StackManager.js';
import { OHIFError } from './classes/OHIFError';
/**
 * This function enables stack prefetching for a specified element (viewport)
 * It first disables any prefetching currently occurring on any other viewports.
 *
 * @param element
 */
export function enablePrefetchOnElement(element) {
    OHIF.log.info('enablePrefetchOnElement');

    // Loop through all of the viewports and disable stackPrefetch
    $('.viewportContainer .imageViewerViewport').each((index, viewportElement) => {
        if ($(viewportElement).find('canvas').length) {
            cornerstoneTools.stackPrefetch.disable(viewportElement);
        }
    });

    if ($(element).find('canvas').length) {
        // If the stack in the active viewport has more than one image,
        // enable prefetching for the element
        const cornerstoneStack = cornerstoneTools.getToolState(element, 'stack');
        if (cornerstoneStack && cornerstoneStack.data.length && cornerstoneStack.data[0].imageIds.length > 1) {

            // Check if this is a clip or not
            const activeViewportIndex = Session.get('activeViewport');
            const contentId = Session.get('activeContentId');
            const displaySetInstanceUid = ViewerData[contentId].loadedSeriesData[activeViewportIndex].displaySetInstanceUid;

            const stack = StackManager.findStack(displaySetInstanceUid);

            if (!stack) {
                throw new OHIFError(`Requested stack ${displaySetInstanceUid} was not created`);
            }

            cornerstoneTools.stackPrefetch.enable(element);
        }
    }
}
