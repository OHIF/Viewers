/**
 * Updates the orientation labels on a Cornerstone-enabled Viewport element
 * when the viewport settings change (e.g. when a horizontal flip or a rotation occurs)
 *
 * @param element The DOM element of the Cornerstone viewport
 */
updateOrientationMarkers = function(element) {
    // Get the current viewport settings
    var viewport = cornerstone.getViewport(element);

    var enabledElement = cornerstone.getEnabledElement(element);
    var imagePlane = cornerstoneTools.metaData.get('imagePlane', enabledElement.image.imageId);
    
    if (!imagePlane || !imagePlane.rowCosines || !imagePlane.columnCosines) {
        return;
    }

    var rowString = cornerstoneTools.orientation.getOrientationString(imagePlane.rowCosines);
    var columnString = cornerstoneTools.orientation.getOrientationString(imagePlane.columnCosines);
    var oppositeRowString = cornerstoneTools.orientation.invertOrientationString(rowString);
    var oppositeColumnString = cornerstoneTools.orientation.invertOrientationString(columnString);

    var markers = {
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
    var viewportOrientationMarkers = $(element).siblings('.viewportOrientationMarkers');
    var topMarker = viewportOrientationMarkers.find('.topMid');
    var leftMarker = viewportOrientationMarkers.find('.leftMid');

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
};
