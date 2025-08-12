import React, { useEffect, useState, useMemo } from 'react';
import classNames from 'classnames';
import { metaData, Enums, getEnabledElement } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';
import { vec3 } from 'gl-matrix';

import './ViewportOrientationMarkers.css';
import { useViewportRendering } from '../../hooks';
const { getOrientationStringLPS, invertOrientationStringLPS } = utilities.orientation;

function ViewportOrientationMarkers({
  element,
  viewportData,
  imageSliceData,
  viewportId,
  servicesManager,
  orientationMarkers = ['top', 'left'],
}: withAppTypes) {
  const [cameraModifiedTime, setCameraModifiedTime] = useState(0);
  const { isViewportBackgroundLight: isLight } = useViewportRendering(viewportId);
  const { cornerstoneViewportService } = servicesManager.services;

  useEffect(() => {
    const cameraModifiedListener = () => setCameraModifiedTime(Date.now());
    element.addEventListener(Enums.Events.CAMERA_MODIFIED, cameraModifiedListener);

    return () => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, cameraModifiedListener);
    };
  }, [element]);

  const markers = useMemo(() => {
    if (!viewportData || cameraModifiedTime === 0) {
      return '';
    }

    if (!element || !getEnabledElement(element)) {
      console.log(`ViewportOrientationMarkers :: Viewport element not enabled (${viewportId})`);
      return '';
    }

    const ohifViewport = cornerstoneViewportService.getViewportInfo(viewportId);

    if (!ohifViewport) {
      console.log(`ViewportOrientationMarkers :: No viewport (${viewportId})`);
      return '';
    }

    if (viewportData.viewportType === 'stack') {
      const imageIndex = imageSliceData.imageIndex;
      const imageId = viewportData.data[0].imageIds?.[imageIndex];

      // Workaround for below TODO stub
      if (!imageId) {
        return false;
      }

      const { isDefaultValueSetForRowCosine, isDefaultValueSetForColumnCosine } =
        metaData.get('imagePlaneModule', imageId) || {};

      if (isDefaultValueSetForColumnCosine || isDefaultValueSetForRowCosine) {
        return '';
      }
    }

    const { viewport } = getEnabledElement(element);
    const p00 = viewport.canvasToWorld([0, 0]);
    const p10 = viewport.canvasToWorld([1, 0]);
    const p01 = viewport.canvasToWorld([0, 1]);
    const rowCosines = vec3.sub(vec3.create(), p10, p00);
    const columnCosines = vec3.sub(vec3.create(), p01, p00);

    vec3.normalize(rowCosines, rowCosines);
    vec3.normalize(columnCosines, columnCosines);

    const markers = _getOrientationMarkers(rowCosines, columnCosines);

    return orientationMarkers.map((m, index) => (
      <div
        className={classNames(
          'overlay-text',
          `${m}-mid orientation-marker`,
          isLight ? 'text-neutral-dark/70' : 'text-neutral-light/70',
          isLight ? 'shadow-light' : 'shadow-dark',
          'text-base',
          'leading-5'
        )}
        key={`${m}-mid orientation-marker`}
      >
        <div className="orientation-marker-value">{markers[m]}</div>
      </div>
    ));
  }, [viewportData, imageSliceData, cameraModifiedTime, orientationMarkers, element, isLight]);

  return <div className="ViewportOrientationMarkers select-none">{markers}</div>;
}

/**
 *
 * Computes the orientation labels on a Cornerstone-enabled Viewport element
 * when the viewport settings change (e.g. when a horizontal flip or a rotation occurs)
 *
 * @param {*} rowCosines
 * @param {*} columnCosines
 */
function _getOrientationMarkers(rowCosines, columnCosines) {
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

  return markers;
}

export default ViewportOrientationMarkers;
