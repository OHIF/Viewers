import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { metaData, Enums, Types } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';

import './ViewportOrientationMarkers.css';
import { getEnabledElement } from '../../state';

/**
 *
 * Computes the orientation labels on a Cornerstone-enabled Viewport element
 * when the viewport settings change (e.g. when a horizontal flip or a rotation occurs)
 *
 * @param {*} rowCosines
 * @param {*} columnCosines
 * @param {*} rotation in degrees
 * @returns
 */
function getOrientationMarkers(
  rowCosines,
  columnCosines,
  rotation,
  flipVertical,
  flipHorizontal
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
  if (flipVertical) {
    markers.top = invertOrientationStringLPS(markers.top);
    markers.bottom = invertOrientationStringLPS(markers.bottom);
  }

  if (flipHorizontal) {
    markers.left = invertOrientationStringLPS(markers.left);
    markers.right = invertOrientationStringLPS(markers.right);
  }

  // Swap the labels accordingly if the viewport has been rotated
  // This could be done in a more complex way for intermediate rotation values (e.g. 45 degrees)
  if (rotation === 90 || rotation === -270) {
    return {
      top: markers.left,
      left: invertOrientationStringLPS(markers.top),
      right: invertOrientationStringLPS(markers.bottom),
      bottom: markers.right, // left
    };
  } else if (rotation === -90 || rotation === 270) {
    return {
      top: invertOrientationStringLPS(markers.left),
      left: markers.top,
      bottom: markers.left,
      right: markers.bottom,
    };
  } else if (rotation === 180 || rotation === -180) {
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
  element,
  viewportData,
  imageSliceData,
  viewportIndex,
  orientationMarkers = ['top', 'left'],
}) {
  // Rotation is in degrees
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);

  useEffect(() => {
    const cameraModifiedListener = (
      evt: Types.EventTypes.CameraModifiedEvent
    ) => {

      const { rotation, previousCamera, camera } = evt.detail;

      if (rotation !== undefined) {
        setRotation(rotation);
      }

      if (camera.flipHorizontal !== undefined &&
          previousCamera.flipHorizontal !== camera.flipHorizontal) {
        setFlipHorizontal(camera.flipHorizontal);
      }

      if (camera.flipVertical !== undefined &&
          previousCamera.flipVertical !== camera.flipVertical) {
        setFlipVertical(camera.flipVertical);
      }
    };

    element.addEventListener(
      Enums.Events.CAMERA_MODIFIED,
      cameraModifiedListener
    );

    return () => {
      element.removeEventListener(
        Enums.Events.CAMERA_MODIFIED,
        cameraModifiedListener
      );
    };
  }, []);

  const getMarkers = useCallback(
    orientationMarkers => {
      // Todo: support orientation markers for the volume viewports
      if (
        !viewportData ||
        viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC
      ) {
        return '';
      }

      const imageIndex = imageSliceData.imageIndex;
      const imageId = viewportData.imageIds?.[imageIndex];

      // Workaround for below TODO stub
      if (!imageId) {
        return false;
      }

      const { rowCosines, columnCosines } =
        metaData.get('imagePlaneModule', imageId) || {};

      if (!rowCosines || !columnCosines || rotation === undefined) {
        return false;
      }

      if (!rowCosines || !columnCosines) {
        return '';
      }

      const markers = getOrientationMarkers(
        rowCosines,
        columnCosines,
        rotation,
        flipVertical,
        flipHorizontal
      );

      return orientationMarkers.map((m, index) => (
        <div
          className={`${m}-mid orientation-marker`}
          key={`${m}-mid orientation-marker`}
        >
          <div className="orientation-marker-value">{markers[m]}</div>
        </div>
      ));
    },
    [flipHorizontal, flipVertical, rotation, viewportData, imageSliceData]
  );

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
