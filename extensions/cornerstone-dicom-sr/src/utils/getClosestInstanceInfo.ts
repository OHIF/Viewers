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
  const scanAxisNormal = vec3.cross(vec3.create(), rowCosineVec, colCosineVec);
  const distance = Math.abs(vec3.dot(subtractedPoint, scanAxisNormal));
  const pointProjected = vec3.create();
  vec3.scaleAndAdd(pointProjected, point, scanAxisNormal, -distance);
  return [pointProjected[0], pointProjected[1], pointProjected[2]];
}
/**
 * Calculates the minimum distance between a world point and an image plane
 * @param point
 * @param instance
 * @returns
 */
function planeDistance(point, instance) {
  const imageOrientation = instance.ImageOrientationPatient;
  const imagePositionPatient = instance.ImagePositionPatient;
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
  const [A, B, C] = scanAxisNormal;

  const D =
    -A * imagePositionPatient[0] - B * imagePositionPatient[1] - C * imagePositionPatient[2];

  return Math.abs(A * point[0] + B * point[1] + C * point[2] + D); // Denominator is sqrt(A**2 + B**2 + C**2) which is 1 as its a normal vector
}

/**
 * Gets the closest instance of a displaySet related to a given world point
 * @param targetPoint            target world point
 * @param displaySet             displaySet to check
 * @param closestInstanceInfo    last closest instance
 * @returns
 */
function getClosestInstance(targetPoint, displaySet, closestInstanceInfos) {
  // todo: this does not assume orientation yet, but that can be added later
  const displaySetInstanceUID = displaySet.displaySetInstanceUID;
  return displaySet.instances.reduce((closestInstanceInfos, instance) => {
    const distance = planeDistance(targetPoint, instance);

    // the threshold is half of the slicethickness or 5 mm
    const threshold = 0.1; //(instance?.SliceThickness || 5) / 2;

    if (distance < threshold) {
      const closestInstanceInfo = {
        distance,
        instance,
        displaySetInstanceUID,
      };
      closestInstanceInfos.push(closestInstanceInfo);
    }
    return closestInstanceInfos;
  }, closestInstanceInfos);
}

/**
 * Return the information of the closest instance respective to a target world point
 * of all displaySets that shares a given FrameOfReferenceUID
 * @param targetPoint
 * @param displaySets
 * @returns
 */
export default function getClosestInstanceInfo(targetPoint, frameOfReferenceUID, displaySets) {
  return displaySets.reduce((closestInstanceInfos, displaySet) => {
    if (displaySet.instance.FrameOfReferenceUID === frameOfReferenceUID) {
      return getClosestInstance(targetPoint, displaySet, closestInstanceInfos);
    } else {
      return closestInstanceInfos;
    }
  }, []);
}
