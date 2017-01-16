import { $ } from 'meteor/jquery';

export function updateAllViewports() {
    var viewports = $('.imageViewerViewport').not('.empty');
    viewports.each(function(index, element) {
        cornerstone.updateImage(element);
    });
}
