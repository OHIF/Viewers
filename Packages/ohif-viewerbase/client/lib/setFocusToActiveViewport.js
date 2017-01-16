import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

/**
 * Restores the browser focus to the currently specified active viewport
 * as determined from Meteor's Session variable.
 *
 * This is allows keydown events to be captured on the focused element.
 */
const setFocusToActiveViewport = () => {
    // Get the list of viewports
    const viewports = $('.imageViewerViewport');

    // Get the current active viewport index from Session
    const activeViewportIndex = Session.get('activeViewport');

    // Find the div from the list of viewports
    const activeViewport = viewports.eq(activeViewportIndex);

    // Set the browser focus to this div
    activeViewport.focus();
};

export { setFocusToActiveViewport };