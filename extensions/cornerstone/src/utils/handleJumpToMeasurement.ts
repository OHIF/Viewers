import { getEnabledElement } from '@cornerstonejs/core';
import * as cs3DTools from '@cornerstonejs/tools';
import { vec3 } from 'gl-matrix';
import type { Types as csTypes } from '@cornerstonejs/core';
import { Point3 } from '@cornerstonejs/core/types';

import { WITH_NAVIGATION } from '../services/ViewportService/CornerstoneViewportService';
import { isMeasurementWithinViewport } from './isMeasurementWithinViewport';

/**
 * Helper function to handle jumping to measurements
 * @param event - The measurement event containing measurement data
 * @param elementRef - Reference to the DOM element
 * @param viewportId - The ID of the viewport
 * @param cornerstoneViewportService - The cornerstone viewport service
 */
export function handleJumpToMeasurement(
  event: any,
  elementRef: React.MutableRefObject<HTMLDivElement>,
  viewportId: string,
  cornerstoneViewportService: any
): void {
  const { measurement, isConsumed } = event;
  if (!measurement || isConsumed) {
    return;
  }

  const enabledElement = getEnabledElement(elementRef.current);

  if (!enabledElement) {
    return;
  }

  const viewport = enabledElement.viewport as csTypes.IStackViewport | csTypes.IVolumeViewport;

  const { metadata, displaySetInstanceUID } = measurement;

  const viewportDisplaySets = cornerstoneViewportService.getViewportDisplaySets(viewportId);

  const showingDisplaySet = viewportDisplaySets.find(
    ds => ds.displaySetInstanceUID === displaySetInstanceUID
  );

  let metadataToUse = metadata;
  // if it is not showing the displaySet we need to remove the FOR from the metadata
  if (!showingDisplaySet) {
    metadataToUse = {
      ...metadata,
      FrameOfReferenceUID: undefined,
    };
  }

  // Todo: make it work with cases where we want to define FOR based measurements too
  if (!viewport.isReferenceViewable(metadataToUse, WITH_NAVIGATION)) {
    return;
  }

  try {
    viewport.setViewReference(metadata);
    viewport.render();
  } catch (e) {
    console.warn('Unable to apply', metadata, e);
  }

  // If the measurement is not visible inside the current viewport, we need to move the camera to the measurement
  // otherwise do not move the camera to the measurement.
  if (!isMeasurementWithinViewport(viewport, measurement)) {
    try {
      const camera = viewport.getCamera();
      const { focalPoint: cameraFocalPoint, position: cameraPosition } = camera;
      const focalPoint: Point3 = [
        (measurement.points[0][0] + measurement.points[1][0]) / 2,
        (measurement.points[0][1] + measurement.points[1][1]) / 2,
        0,
      ];
      const position = vec3.sub(vec3.create(), cameraPosition, cameraFocalPoint);
      vec3.add(position, position, focalPoint);
      viewport.setCamera({ focalPoint, position });
      // Zoom out if the measurement is too large
      const measurementSize = Math.sqrt(
        Math.pow(measurement.points[0][0] - measurement.points[1][0], 2) +
          Math.pow(measurement.points[0][1] - measurement.points[1][1], 2)
      );

      if (measurementSize > camera.parallelScale) {
        const scaleFactor = measurementSize / camera.parallelScale;
        viewport.setZoom(viewport.getZoom() / scaleFactor);
      }
      viewport.render();
    } catch (e) {
      console.warn('Unable to adjust pan/zoom for the measurement', measurement.points, e);
    }
  }

  cs3DTools.annotation.selection.setAnnotationSelected(measurement.uid);
}
