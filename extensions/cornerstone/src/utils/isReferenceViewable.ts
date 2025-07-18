import { vec3 } from 'gl-matrix';
import { Enums } from '@cornerstonejs/core';

import OrientationAxis = Enums.OrientationAxis;

export const isReferenceViewable = (servicesManager, viewportId, reference, viewportOptions?) => {
  const { cornerstoneViewportService, displaySetService } = servicesManager.services;

  if (!viewportOptions) {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

    // we can make a customization for this to allow specific settings
    // The annotation can be seen either via navigation or by changing to a volume
    const isViewable = viewport.isReferenceViewable(reference, {
      withNavigation: true,
      asVolume: true,
    });

    return isViewable;
  }

  if (viewportOptions.viewportType === 'stack') {
    // we only need the viewport to include the referenced imageId
    const displaySet = displaySetService.getDisplaySetByUID(reference.displaySetInstanceUID);
    const imageIds = displaySet.instances.map(instance => instance.imageId);
    return imageIds.includes(reference.referencedImageId);
  }

  // for the volume viewports, we need to check orientation
  const { orientation } = viewportOptions;

  // Todo: handle hanging protocols that have acquisition orientation
  const closestOrientation = getClosestOrientationFromIOP(
    displaySetService,
    reference.displaySetInstanceUID
  );

  return closestOrientation === orientation;
};

/**
 * Get the plane (orientation) to which the ImageOrientationPatient is most closely aligned
 *
 * @param displaySetService
 * @param displaySetInstanceUID
 * @returns orientation
 */
export default function getClosestOrientationFromIOP(
  displaySetService,
  displaySetInstanceUID
): OrientationAxis {
  const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
  const imageOrientationPatient = displaySet.instances[0].ImageOrientationPatient as Array<number>;
  // ImageOrientationPatient must be an array of length 6.
  if (imageOrientationPatient?.length !== 6) {
    return;
  }

  // Take cross product to get vector coming "out" of image plane
  const rowCosineVec = vec3.fromValues(
    imageOrientationPatient[0],
    imageOrientationPatient[1],
    imageOrientationPatient[2]
  );
  const colCosineVec = vec3.fromValues(
    imageOrientationPatient[3],
    imageOrientationPatient[4],
    imageOrientationPatient[5]
  );
  const scanAxisNormal = vec3.cross(vec3.create(), rowCosineVec, colCosineVec);

  // Define the reference vectors for axial, coronal, and sagittal planes
  const unitVectors = {
    [OrientationAxis.AXIAL]: vec3.fromValues(0, 0, 1),
    [OrientationAxis.CORONAL]: vec3.fromValues(0, 1, 0),
    [OrientationAxis.SAGITTAL]: vec3.fromValues(1, 0, 0),
  };

  // Compute dot products for each reference plane
  // Because all vectors are normalized, dot product is bounded between -1 and 1
  let maxDot = 0;
  let maxOrientation: string = '';
  for (const [k, v] of Object.entries(unitVectors)) {
    // Absolute value of dot product because we only care about alignment with the axis
    // For example, dot product of -1 for a given axis means perfect alignment
    // but the image is pointing in the "opposite" direction
    const res = Math.abs(vec3.dot(scanAxisNormal, v));
    if (res > maxDot) {
      maxDot = res;
      maxOrientation = k;
    }
  }

  return maxOrientation as OrientationAxis;
}
