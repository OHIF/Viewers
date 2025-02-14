import * as cornerstone from '@cornerstonejs/core'
import * as csTools from '@cornerstonejs/tools';
import { Vector3 } from 'cornerstone-math';

const { getToolState, loadHandlerManager } = csTools;

/**
 * Synchronize the target stack to the image closest to the source image's position
 * @export
 * @public
 * @method
 * @name stackImagePositionSynchronizer
 *
 * @param {Object} synchronizer - The Synchronizer instance that attaches this
 * handler to an event
 * @param {HTMLElement} sourceElement - The source element for the image position
 * @param {HTMLElement} targetElement - The target element
 * @returns {void}
 */
export default function(synchronizer, sourceElement, targetElement) {
  // Ignore the case where the source and target are the same enabled element
  if (targetElement === sourceElement) {
    return;
  }

  const sourceStackData = getToolState(sourceElement, 'stack').data[0];
  const sourceImageId =
    sourceStackData.imageIds[sourceStackData.currentImageIdIndex];
  const sourceImagePlane = cornerstone.metaData.get(
    'imagePlaneModule',
    sourceImageId
  );

  if (
    sourceImagePlane === undefined ||
    sourceImagePlane.imagePositionPatient === undefined
  ) {
    // Console.log('No position found for image ' + sourceImage.imageId);
    return;
  }

  const srcIpp = new Vector3(
    sourceImagePlane.imagePositionPatient[0],
    sourceImagePlane.imagePositionPatient[1],
    sourceImagePlane.imagePositionPatient[2]
  );

  const srcIop = sourceImagePlane.imageOrientationPatient;
  let srcLoc;
  if (srcIop) {
    const srcAxisNormal = new Vector3(srcIop[0], srcIop[1], srcIop[2]).cross(
      new Vector3(srcIop[3], srcIop[4], srcIop[5]),
    );
    srcLoc = srcIpp.dot(srcAxisNormal);
  }

  const stackToolDataSource = getToolState(targetElement, 'stack');
  const stackData = stackToolDataSource.data[0];

  let targetIop;
  if (stackData.imageIds.length > 0) {
    const firstTargetImageId = stackData.imageIds[0];
    const { imageOrientationPatient } = cornerstone.metaData.get(
      'imagePlaneModule',
      firstTargetImageId
    );
    targetIop = imageOrientationPatient;
  }

  let newImageIdIndex = -1;
  if (srcLoc !== undefined && targetIop !== undefined) {
    newImageIdIndex = getImageIdIndexUsingLocation(srcLoc, stackData.imageIds);
  } else {
    newImageIdIndex = getImageIdIndexUsingIpp(srcIpp, stackData.imageIds);
  }

  if (newImageIdIndex === stackData.currentImageIdIndex) {
    return;
  }

  const startLoadingHandler = loadHandlerManager.getStartLoadHandler(
    targetElement
  );
  const endLoadingHandler = loadHandlerManager.getEndLoadHandler(targetElement);
  const errorLoadingHandler = loadHandlerManager.getErrorLoadingHandler(
    targetElement
  );

  stackData.currentImageIdIndex = newImageIdIndex;
  const newImageId = stackData.imageIds[newImageIdIndex];

  if (startLoadingHandler) {
    startLoadingHandler(targetElement);
  }

  if (newImageIdIndex !== -1) {
    let loader;

    if (stackData.preventCache === true) {
      loader = cornerstone.loadImage(newImageId);
    } else {
      loader = cornerstone.loadAndCacheImage(newImageId);
    }

    loader.then(
      function(image) {
        const viewport = cornerstone.getViewport(targetElement);

        if (stackData.currentImageIdIndex !== newImageIdIndex) {
          return;
        }

        synchronizer.displayImage(targetElement, image, viewport);
        if (endLoadingHandler) {
          endLoadingHandler(targetElement, image);
        }
      },
      function(error) {
        const imageId = stackData.imageIds[newImageIdIndex];

        if (errorLoadingHandler) {
          errorLoadingHandler(targetElement, imageId, error);
        }
      }
    );
  }
}

const getImageIdIndexUsingIpp = (srcIpp, targetImageIds) => {
  let minDistance = Number.MAX_VALUE;
  let newImageIdIndex = -1;

  const numImages = targetImageIds.length;
  for (let i = 0; i < numImages; i++) {
    const imageId = targetImageIds[i];
    const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageId);

    if (
      imagePlane === undefined ||
      imagePlane.imagePositionPatient === undefined
    ) {
      // Console.log('No position found for image ' + imageId);
      continue;
    }

    const ipp = new Vector3(
      imagePlane.imagePositionPatient[0],
      imagePlane.imagePositionPatient[1],
      imagePlane.imagePositionPatient[2]
    );

    const distance = ipp.distanceToSquared(srcIpp);
    console.log(i + '=' + distance);

    if (distance < minDistance) {
      minDistance = distance;
      newImageIdIndex = i;
    } else {
      break;
    }
  }

  return newImageIdIndex;
};

const getImageIdIndexUsingLocation = (srcLoc, targetImageIds) => {
  let minLocDiff = Number.MAX_VALUE;
  let newImageIdIndex = -1;

  const numImages = targetImageIds.length;
  for (let i = 0; i < numImages; i++) {
    const imageId = targetImageIds[i];
    const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageId);

    if (
      imagePlane === undefined ||
      imagePlane.imagePositionPatient === undefined ||
      imagePlane.imageOrientationPatient === undefined
    ) {
      // Console.log('No position found for image ' + imageId);
      continue;
    }

    const iop = imagePlane.imageOrientationPatient;
    const axisNormal = new Vector3(iop[0], iop[1], iop[2]).cross(
      new Vector3(iop[3], iop[4], iop[5])
    );
    const ipp = new Vector3(
      imagePlane.imagePositionPatient[0],
      imagePlane.imagePositionPatient[1],
      imagePlane.imagePositionPatient[2]
    );
    const loc = ipp.dot(axisNormal);
    const locDiff = Math.abs(srcLoc - loc);
    // console.log(`${i} ${srcLoc} <=> ${loc} | ${locDiff}`);

    if (locDiff < minLocDiff) {
      minLocDiff = locDiff;
      newImageIdIndex = i;
    } else {
      break;
    }
  }

  return newImageIdIndex;
};
