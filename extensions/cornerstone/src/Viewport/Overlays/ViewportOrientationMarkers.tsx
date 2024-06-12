import React, { useEffect, useState, useMemo } from 'react';
import classNames from 'classnames';
import {
  metaData,
  Enums,
  Types,
  getEnabledElement,
  utilities as csUtils,
} from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';
import PropTypes from 'prop-types';
import { vec3 } from 'gl-matrix';

import './ViewportOrientationMarkers.css';

const { getOrientationStringLPS, invertOrientationStringLPS } = utilities.orientation;

function ViewportOrientationMarkers({
  element,
  viewportData,
  imageSliceData,
  viewportId,
  servicesManager,
  orientationMarkers = ['top', 'left'],
}: withAppTypes) {
  // Rotation is in degrees
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const { cornerstoneViewportService } = servicesManager.services;

  useEffect(() => {
    const cameraModifiedListener = (evt: Types.EventTypes.CameraModifiedEvent) => {
      const { rotation, previousCamera, camera } = evt.detail;

      if (rotation !== undefined) {
        setRotation(rotation);
      }

      if (
        camera.flipHorizontal !== undefined &&
        previousCamera.flipHorizontal !== camera.flipHorizontal
      ) {
        setFlipHorizontal(camera.flipHorizontal);
      }

      if (
        camera.flipVertical !== undefined &&
        previousCamera.flipVertical !== camera.flipVertical
      ) {
        setFlipVertical(camera.flipVertical);
      }
    };

    element.addEventListener(Enums.Events.CAMERA_MODIFIED, cameraModifiedListener);

    return () => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, cameraModifiedListener);
    };
  }, []);

  const markers = useMemo(() => {
    if (!viewportData) {
      return '';
    }

    let rowCosines, columnCosines;
    if (viewportData.viewportType === 'stack') {
      const imageIndex = imageSliceData.imageIndex;
      const imageId = viewportData.data[0].imageIds?.[imageIndex];

      // Workaround for below TODO stub
      if (!imageId) {
        return false;
      }

      ({ rowCosines, columnCosines } = metaData.get('imagePlaneModule', imageId) || {});
    } else {
      if (!element || !getEnabledElement(element)) {
        return '';
      }

      const { viewport } = getEnabledElement(element);
      const { viewUp, viewPlaneNormal } = viewport.getCamera();

      const viewRight = vec3.create();
      vec3.cross(viewRight, viewUp, viewPlaneNormal);

      columnCosines = [-viewUp[0], -viewUp[1], -viewUp[2]];
      rowCosines = viewRight;
    }

    if (!rowCosines || !columnCosines || rotation === undefined) {
      return '';
    }

    const markers = _getOrientationMarkers(
      rowCosines,
      columnCosines,
      rotation,
      flipVertical,
      flipHorizontal
    );

    const ohifViewport = cornerstoneViewportService.getViewportInfo(viewportId);

    if (!ohifViewport) {
      console.log('ViewportOrientationMarkers::No viewport');
      return null;
    }

    return orientationMarkers.map((m, index) => (
      <div
        className={classNames(
          'overlay-text',
          `${m}-mid orientation-marker`,
          'text-aqua-pale',
          'text-[13px]',
          'leading-5'
        )}
        key={`${m}-mid orientation-marker`}
      >
        <div className="orientation-marker-value">{markers[m]}</div>
      </div>
    ));
  }, [
    viewportData,
    imageSliceData,
    rotation,
    flipVertical,
    flipHorizontal,
    orientationMarkers,
    element,
  ]);

  return <div className="ViewportOrientationMarkers select-none">{markers}</div>;
}

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
function _getOrientationMarkers(rowCosines, columnCosines, rotation, flipVertical, flipHorizontal) {
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

export default ViewportOrientationMarkers;
