import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { Random } from 'meteor/random';

import { OHIF } from 'meteor/ohif:core';
import { StudyPrefetcher } from './classes/StudyPrefetcher';
import { displayReferenceLines } from './displayReferenceLines';

/**
 * Sets a viewport element active
 * @param  {node} element DOM element to be activated or viewportIndex
 */
export function setActiveViewport(element) {
    const $viewerports = $('.imageViewerViewport');

    let viewportIndex;
    if (typeof element === 'number') {
        viewportIndex = element;
    } else {
        viewportIndex = $viewerports.index(element);
    }

    const $element = $viewerports.eq(viewportIndex);
    if (!$element.length) {
        OHIF.log.info('setActiveViewport element does not exist');
        return;
    }

    OHIF.log.info(`setActiveViewport setting viewport index: ${viewportIndex}`);

    // If viewport is not active
    if (!$element.parents('.viewportContainer').hasClass('active')) {
        // Trigger an event for compatibility with other systems
        $element.trigger('OHIFBeforeActivateViewport');
    }

    // When an OHIFActivateViewport event is fired, update the Meteor Session
    // with the viewport index that it was fired from.
    Session.set('activeViewport', viewportIndex);

    const randomId = Random.id();

    // Update the Session variable to inform that a viewport is active
    Session.set('viewportActivated', randomId);

    // Update the Session variable to the UI re-renders
    Session.set('LayoutManagerUpdated', randomId);

    // Add the 'active' class to the parent container to highlight the active viewport
    $('#imageViewerViewports .viewportContainer').removeClass('active');
    $element.parents('.viewportContainer').addClass('active');

    // Finally, enable stack prefetching and hide the reference lines from
    // the newly activated viewport that has a canvas

    if ($element.find('canvas').length) {
        // Cornerstone Tools compare DOM elements (check getEnabledElement cornerstone function)
        // so we can't pass a jQuery object as an argument, otherwise it throws an excepetion
        const domElement = $element.get(0);
        displayReferenceLines(domElement);
        StudyPrefetcher.getInstance().prefetch();

        // @TODO Add this to OHIFAfterActivateViewport handler...
        if (OHIF.viewer.stackImagePositionOffsetSynchronizer) {
            OHIF.viewer.stackImagePositionOffsetSynchronizer.update();
        }
    }

    // Set the div to focused, so keypress events are handled
    //$(element).focus();
    //.focus() event breaks in FF&IE
    $element.triggerHandler('focus');

    // Trigger OHIFAfterActivateViewport event on activated instance
    // for compatibility with other systems
    $element.trigger('OHIFAfterActivateViewport');

}
