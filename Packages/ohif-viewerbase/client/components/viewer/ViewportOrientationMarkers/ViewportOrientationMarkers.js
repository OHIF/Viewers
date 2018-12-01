import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import './ViewportOrientationMarkers.styl';

/**
 * Computes the orientation labels on a Cornerstone-enabled Viewport element
 * when the viewport settings change (e.g. when a horizontal flip or a rotation occurs)
 *
 * @param imageId The Cornerstone ImageId
 * @param viewport The current viewport
 */
export function getOrientationMarkers(imageId, viewport) {
    const imagePlane = cornerstone.metaData.get('imagePlane', imageId);
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

    // Swap the labels accordingly if the viewport has been rotated
    // This could be done in a more complex way for intermediate rotation values (e.g. 45 degrees)
    if (viewport.rotation === 90 || viewport.rotation === -270) {
        return {
            top: markers.left,
            left: cornerstoneTools.orientation.invertOrientationString(markers.top)
        };
    } else if (viewport.rotation === -90 || viewport.rotation === 270) {
        return {
            top: cornerstoneTools.orientation.invertOrientationString(markers.left),
            left: markers.top
        };
    } else if (viewport.rotation === 180 || viewport.rotation === -180) {
        return {
            top: cornerstoneTools.orientation.invertOrientationString(markers.top),
            left: cornerstoneTools.orientation.invertOrientationString(markers.left)
        };
    }

    return markers;
}

class ViewportOrientationMarkers extends Component {
    render() {
        const { imageId, viewport } = this.props;
        const markers = getOrientationMarkers(imageId, viewport);
        return (
            <div className="ViewportOrientationMarkers noselect">
                <div className="top-mid orientation-marker">
                    {markers.top}
                </div>
                <div className="left-mid orientation-marker">
                    {markers.left}
                </div>
            </div>
        );
    }
};

ViewportOrientationMarkers.propTypes = {
    imageId: PropTypes.string.isRequired,
    viewport: PropTypes.object.isRequired
};

export default ViewportOrientationMarkers;
