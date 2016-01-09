/**
 * Restores the browser focus to the currently specified active viewport
 * as determined from Meteor's Session variable.
 *
 * This is allows keydown events to be captured on the focused element
 */
setFocusToActiveViewport = function() {
    // Get the list of viewports
    var viewports = $('.imageViewerViewport');

    // Get the current active viewport index from Session
    var activeViewportIndex = Session.get('activeViewport');

    // Find the div from the list of viewports
    var activeViewport = viewports.eq(activeViewportIndex);

    // Set the browser focus to this div
    activeViewport.focus();
};