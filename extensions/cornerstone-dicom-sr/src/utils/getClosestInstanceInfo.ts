import { vec3 } from 'gl-matrix';

/**
 * Calculates the projection of a world point in an image plane
 * @param point
 * @param instance
 */
export function getPointProjection(point, instance) {
  const reference = instance.ImagePositionPatient;
  const imageOrientation = instance.ImageOrientationPatient;
  const rowCosineVec = vec3.fromValues(
    imageOrientation[0],
    imageOrientation[1],
    imageOrientation[2]
  );
  const colCosineVec = vec3.fromValues(
    imageOrientation[3],
    imageOrientation[4],
    imageOrientation[5]
  );
  const subtractedPoint = vec3.create();
  vec3.subtract(subtractedPoint, point, reference);
  const x = vec3.dot(subtractedPoint, rowCosineVec);
  const y = vec3.dot(subtractedPoint, colCosineVec);
  vec3.scale(subtractedPoint, rowCosineVec, x);
  return vec3.scaleAndAdd(subtractedPoint, subtractedPoint, colCosineVec, y);
}
/**
 * Calculates the minimum distance between a world point and an image plane
 * @param point
 * @param instance
 * @returns
 */
function planeDistance(point, instance) {
  const imageOrientation = instance.ImageOrientationPatient;
  const rowCosineVec = vec3.fromValues(
    imageOrientation[0],
    imageOrientation[1],
    imageOrientation[2]
  );
  const colCosineVec = vec3.fromValues(
    imageOrientation[3],
    imageOrientation[4],
    imageOrientation[5]
  );
  const scanAxisNormal = vec3.cross(vec3.create(), rowCosineVec, colCosineVec);
  vec3.normalize(scanAxisNormal, scanAxisNormal);
  return Math.abs(vec3.dot(scanAxisNormal, point));
}
/**
 * Gets the closest instance of a displaySet related to a given world point
 * @param targetPoint            target world point
 * @param displaySet             displaySet to check
 * @param closestInstanceInfo    last closest instance
 * @returns
 */
function getClosestInstance(targetPoint, displaySet, closestInstanceInfo) {
  // todo: this does not assume orientation yet, but that can be added later
  const displaySetInstanceUID = displaySet.displaySetInstanceUID;
  const distance = closestInstanceInfo
    ? planeDistance(targetPoint, closestInstanceInfo.instance)
    : Infinity;
  return displaySet.instances.reduce(
    (closestInstanceInfo, instance) => {
      const distance = planeDistance(targetPoint, instance);

      if (distance < closestInstanceInfo.distance) {
        return {
          distance,
          instance,
          displaySetInstanceUID,
        };
      }
      return closestInstanceInfo;
    },
    {
      distance: distance,
      instance: closestInstanceInfo?.instance,
      displaySetInstanceUID: closestInstanceInfo?.displaySetInstanceUID,
    }
  );
}

/**
 * Return the information of the closest instance respective to a target world point
 * of all displaySets that shares a given FrameOfReferenceUID
 * @param targetPoint
 * @param displaySets
 * @returns
 */
export default function getClosestInstanceInfo(targetPoint, frameOfReferenceUID, displaySets) {
  return displaySets.reduce((closestInstanceInfo, displaySet) => {
    if (displaySet.instance.FrameOfReferenceUID === frameOfReferenceUID) {
      return getClosestInstance(targetPoint, displaySet, closestInstanceInfo);
    } else {
      return closestInstanceInfo;
    }
  }, undefined);
}
