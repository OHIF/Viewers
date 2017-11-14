import { $ } from 'meteor/jquery';

/**
 * Updates the orientation labels on a Cornerstone-enabled Viewport element
 * when the viewport settings change (e.g. when a horizontal flip or a rotation occurs)
 *
 * @param element The DOM element of the Cornerstone viewport
 * optional
 * @param viewport The current viewport
 */
export function updateOrientationMarkers(element, viewport) {
    // Get the current viewport settings
    if(!viewport) {
        viewport = cornerstone.getViewport(element);
    }

    // Updates the orientation labels on the viewport
    const enabledElement = cornerstone.getEnabledElement(element);
    const imagePlane = cornerstone.metaData.get('imagePlane', enabledElement.image.imageId);
    
    if (!imagePlane || !imagePlane.rowCosines || !imagePlane.columnCosines) {
        return;
    }

    const rowString = cornerstoneTools.orientation.getOrientationString(imagePlane.rowCosines);
    const columnString = cornerstoneTools.orientation.getOrientationString(imagePlane.columnCosines);
    const oppositeRowString = cornerstoneTools.orientation.invertOrientationString(rowString);
    const oppositeColumnString = cornerstoneTools.orientation.invertOrientationString(columnString);

    const markers = {
        top: oppositeColumnString,
        left: oppositeRowString
    };

    // If any vertical or horizontal flips are applied, change the orientation strings ahead of
    // the rotation applications
    if (viewport.vflip) {
        markers.top = cornerstoneTools.orientation.invertOrientationString(markers.top);
    }

    if (viewport.hflip) {
        markers.left = cornerstoneTools.orientation.invertOrientationString(markers.left);
    }

    // Get the viewport orientation marker DOM elements
    const viewportOrientationMarkers = $(element).siblings('.viewportOrientationMarkers');
    const topMarker = viewportOrientationMarkers.find('.topMid');
    const leftMarker = viewportOrientationMarkers.find('.leftMid');

    // Swap the labels accordingly if the viewport has been rotated
    // This could be done in a more complex way for intermediate rotation values (e.g. 45 degrees)
    if (viewport.rotation === 90 || viewport.rotation === -270) {
        topMarker.text(markers.left);
        leftMarker.text(cornerstoneTools.orientation.invertOrientationString(markers.top));
    } else if (viewport.rotation === -90 || viewport.rotation === 270) {
        topMarker.text(cornerstoneTools.orientation.invertOrientationString(markers.left));
        leftMarker.text(markers.top);
    } else if (viewport.rotation === 180 || viewport.rotation === -180) {
        topMarker.text(cornerstoneTools.orientation.invertOrientationString(markers.top));
        leftMarker.text(cornerstoneTools.orientation.invertOrientationString(markers.left));
    } else {
        topMarker.text(markers.top);
        leftMarker.text(markers.left);
    }
}
