import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { Random } from 'meteor/random';

import { OHIF } from 'meteor/ohif:core';
import { StudyPrefetcher } from './classes/StudyPrefetcher';
import { displayReferenceLines } from './displayReferenceLines';

const PLUGIN_CORNERSTONE = 'cornerstone';

/**
 * Sets a viewport element active
 * @param  {node} element DOM element to be activated or viewportIndex
 */
export function setActiveViewport(element) {
    const $viewports = $('.viewportContainer');
    const viewportIndex = $viewports.index(element);

    const $element = $viewports.eq(viewportIndex);
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

    // Finally, enable stack prefetching and hide the reference lines from
    // the newly activated viewport that has a canvas
    const { layoutManager } = OHIF.viewerbase;
    const viewportData = layoutManager.viewportData[viewportIndex];

    if (viewportData.plugin === PLUGIN_CORNERSTONE &&
        $element.find('canvas').length) {
        // Cornerstone Tools compare DOM elements (check getEnabledElement cornerstone function)
        // so we can't pass a jQuery object as an argument, otherwise it throws an excepetion
        const domElement = $element.find('.imageViewerViewport').get(0);
        displayReferenceLines(domElement);
        StudyPrefetcher.getInstance().prefetch();

        // @TODO Add this to OHIFAfterActivateViewport handler...
        const synchronizer = OHIF.viewer.stackImagePositionOffsetSynchronizer;
        if (!synchronizer) { return; }

        synchronizer.update();
    }

    // Set the div to focused, so keypress events are handled
    //$(element).focus();
    //.focus() event breaks in FF&IE
    $element.triggerHandler('focus');

    // Trigger OHIFAfterActivateViewport event on activated instance
    // for compatibility with other systems
    $element.trigger('OHIFAfterActivateViewport');

}
