import { vec3 } from 'gl-matrix';

/**
 * Given an array of imageIds, sort them based on their imagePositionPatient, and
 * also returns the spacing between images and the origin of the reference image
 *
 * @param imageIds - array of imageIds
 * @param scanAxisNormal - [x, y, z] array or gl-matrix vec3
 *
 * @returns The sortedImageIds, zSpacing, and origin of the first image in the series.
 */
export default function sortInstances(instances: Array<any>) {
  // Return if only one instance e.g., multiframe
  if (instances.length <= 1) {
    return instances;
  }

  const { ImagePositionPatient: referenceImagePositionPatient, ImageOrientationPatient } =
    instances[Math.floor(instances.length / 2)]; // this prevents getting scout image as test image

  if (!referenceImagePositionPatient || !ImageOrientationPatient) {
    return instances;
  }

  const rowCosineVec = vec3.fromValues(
    ImageOrientationPatient[0],
    ImageOrientationPatient[1],
    ImageOrientationPatient[2]
  );
  const colCosineVec = vec3.fromValues(
    ImageOrientationPatient[3],
    ImageOrientationPatient[4],
    ImageOrientationPatient[5]
  );

  const scanAxisNormal = vec3.cross(vec3.create(), rowCosineVec, colCosineVec);

  const refIppVec = vec3.set(
    vec3.create(),
    referenceImagePositionPatient[0],
    referenceImagePositionPatient[1],
    referenceImagePositionPatient[2]
  );

  const distanceInstancePairs = instances.map(instance => {
    const imagePositionPatient = instance.ImagePositionPatient;

    const positionVector = vec3.create();

    vec3.sub(positionVector, referenceImagePositionPatient, imagePositionPatient);

    const distance = vec3.dot(positionVector, scanAxisNormal);

    return {
      distance,
      instance,
    };
  });

  distanceInstancePairs.sort((a, b) => b.distance - a.distance);

  const sortedInstances = distanceInstancePairs.map(a => a.instance);

  return sortedInstances;
}
