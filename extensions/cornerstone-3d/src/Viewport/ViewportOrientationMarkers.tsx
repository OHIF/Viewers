import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { metaData } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';

import './ViewportOrientationMarkers.css';

/**
 *
 * Computes the orientation labels on a Cornerstone-enabled Viewport element
 * when the viewport settings change (e.g. when a horizontal flip or a rotation occurs)
 *
 * @param {*} rowCosines
 * @param {*} columnCosines
 * @param {*} rotationDegrees
 * @param {*} isFlippedVertically
 * @param {*} isFlippedHorizontally
 * @returns
 */
function getOrientationMarkers(
  rowCosines,
  columnCosines,
  rotationDegrees,
  isFlippedVertically,
  isFlippedHorizontally
) {
  const {
    getOrientationStringLPS,
    invertOrientationStringLPS,
  } = utilities.orientation;
  const rowString = getOrientationStringLPS(rowCosines);
  const columnString = getOrientationStringLPS(columnCosines);
  const oppositeRowString = invertOrientationStringLPS(rowString);
  const oppositeColumnString = invertOrientationStringLPS(columnString);

  const markers = {
    top: oppositeColumnString,
    left: oppositeRowString,
    right: rowString,
    bottom: columnString,
  };

  // If any vertical or horizontal flips are applied, change the orientation strings ahead of
  // the rotation applications
  if (isFlippedVertically) {
    markers.top = invertOrientationStringLPS(markers.top);
    markers.bottom = invertOrientationStringLPS(markers.bottom);
  }

  if (isFlippedHorizontally) {
    markers.left = invertOrientationStringLPS(markers.left);
    markers.right = invertOrientationStringLPS(markers.right);
  }

  // Swap the labels accordingly if the viewport has been rotated
  // This could be done in a more complex way for intermediate rotation values (e.g. 45 degrees)
  if (rotationDegrees === 90 || rotationDegrees === -270) {
    return {
      top: markers.left,
      left: invertOrientationStringLPS(markers.top),
      right: invertOrientationStringLPS(markers.bottom),
      bottom: markers.right, // left
    };
  } else if (rotationDegrees === -90 || rotationDegrees === 270) {
    return {
      top: invertOrientationStringLPS(markers.left),
      left: markers.top,
      bottom: markers.left,
      right: markers.bottom,
    };
  } else if (rotationDegrees === 180 || rotationDegrees === -180) {
    return {
      top: invertOrientationStringLPS(markers.top),
      left: invertOrientationStringLPS(markers.left),
      bottom: invertOrientationStringLPS(markers.bottom),
      right: invertOrientationStringLPS(markers.right),
    };
  }

  return markers;
}

function ViewportOrientationMarkers({
  viewportData,
  imageIndex,
  orientationMarkers = ['top', 'left'],
}) {
  const imageId = viewportData?.stack?.imageIds[imageIndex];

  // Todo: We should be reactive to these changes
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [isFlippedVertically, setIsFlippedVertically] = useState(false);
  const [isFlippedHorizontally, setIsFlippedHorizontally] = useState(false);

  // Workaround for below TODO stub
  if (!imageId) {
    return false;
  }

  const { rowCosines, columnCosines } =
    metaData.get('imagePlaneModule', imageId) || {};

  if (!rowCosines || !columnCosines || rotationDegrees === undefined) {
    return false;
  }

  if (!rowCosines || !columnCosines) {
    return '';
  }

  const markers = getOrientationMarkers(
    rowCosines,
    columnCosines,
    rotationDegrees,
    isFlippedVertically,
    isFlippedHorizontally
  );

  const getMarkers = orientationMarkers =>
    orientationMarkers.map((m, index) => (
      <div
        className={`${m}-mid orientation-marker`}
        key={`${m}-mid orientation-marker`}
      >
        <div className="orientation-marker-value">{markers[m]}</div>
      </div>
    ));

  return (
    <div className="ViewportOrientationMarkers noselect">
      {getMarkers(orientationMarkers)}
    </div>
  );
}

ViewportOrientationMarkers.propTypes = {
  percentComplete: PropTypes.number,
  error: PropTypes.object,
};

ViewportOrientationMarkers.defaultProps = {
  percentComplete: 0,
  error: null,
};

export default ViewportOrientationMarkers;
