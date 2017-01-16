import { $ } from 'meteor/jquery';

export function getElementIfNotEmpty(viewportIndex) {
    // Meteor template helpers run more often than expected
    // They often seem to run just before the whole template is rendered
    // This meant that the onRendered event hadn't fired yet, so the
    // element wasn't enabled / set empty yet. The check here
    // for canvases under the 'enabled' element div is to prevent
    // 'undefined' errors from the helper functions

    var imageViewerViewports = $('.imageViewerViewport'),
        element = imageViewerViewports.get(viewportIndex),
        canvases = imageViewerViewports.eq(viewportIndex).find('canvas');

    if (!element || $(element).hasClass('empty') || canvases.length === 0) {
        return;
    }

    // Check to make sure the element is enabled.
    try {
        var enabledElement = cornerstone.getEnabledElement(element);
    } catch(error) {
        return;
    }

    return element;
}
