import { vec3 } from 'gl-matrix';
import { dicomSplit } from './dicomSplit';

/**
 * Combine the Per instance frame data, the shared frame data
 * and the root data objects.
 * The data is combined by taking nested sequence objects within
 * the functional group sequences.  Data that is directly contained
 * within the functional group sequences, such as private creators
 * will be ignored.
 * This can be safely called with an undefined frame in order to handle
 * single frame data. (eg frame is undefined is the same as frame===1).
 */
const combineFrameInstance = (frame, instance) => {
  const {
    PerFrameFunctionalGroupsSequence,
    SharedFunctionalGroupsSequence,
    NumberOfFrames,
    ImageType,
  } = instance;

  instance.ImageType = dicomSplit(ImageType);

  if (PerFrameFunctionalGroupsSequence || NumberOfFrames > 1) {
    const frameNumber = Number.parseInt(frame || 1);

    // this is to fix NM multiframe datasets with position and orientation
    // information inside DetectorInformationSequence
    if (!instance.ImageOrientationPatient && instance.DetectorInformationSequence) {
      instance.ImageOrientationPatient =
        instance.DetectorInformationSequence[0].ImageOrientationPatient;
    }

    let ImagePositionPatientToUse = instance.ImagePositionPatient;

    if (!instance.ImagePositionPatient && instance.DetectorInformationSequence) {
      let imagePositionPatient = instance.DetectorInformationSequence[0].ImagePositionPatient;
      let imageOrientationPatient = instance.ImageOrientationPatient;

      imagePositionPatient = imagePositionPatient.map(it => Number(it));
      imageOrientationPatient = imageOrientationPatient.map(it => Number(it));
      const SpacingBetweenSlices = Number(instance.SpacingBetweenSlices);

      // Calculate the position for the current frame
      if (imageOrientationPatient && SpacingBetweenSlices) {
        const rowOrientation = vec3.fromValues(
          imageOrientationPatient[0],
          imageOrientationPatient[1],
          imageOrientationPatient[2]
        );

        const colOrientation = vec3.fromValues(
          imageOrientationPatient[3],
          imageOrientationPatient[4],
          imageOrientationPatient[5]
        );

        const normalVector = vec3.cross(vec3.create(), rowOrientation, colOrientation);

        const position = vec3.scaleAndAdd(
          vec3.create(),
          imagePositionPatient,
          normalVector,
          SpacingBetweenSlices * (frameNumber - 1)
        );

        ImagePositionPatientToUse = [position[0], position[1], position[2]];
      }
    }
    const sharedInstance = createCombinedValue(instance, SharedFunctionalGroupsSequence?.[0]);
    const newInstance = createCombinedValue(
      sharedInstance,
      PerFrameFunctionalGroupsSequence?.[frameNumber]
    );

    // Note: do not assign directly to newInstance.ImagePositionPatient
    // because it will also overwrite the instance.ImagePositionPatient since it
    // is create via Object.create(parent)
    Object.defineProperty(newInstance, 'ImagePositionPatient', {
      value: ImagePositionPatientToUse ?? newInstance.ImagePositionPatient ?? [0, 0, frameNumber],
      writable: true,
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(newInstance, 'frameNumber', {
      value: frameNumber,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    return newInstance;
  } else {
    return instance;
  }
};

function createCombinedValue(parent, functionalGroups) {
  const newInstance = Object.create(parent);
  if (!functionalGroups) {
    return newInstance;
  }
  if (functionalGroups._sharedValue) {
    return functionalGroups._sharedValue;
  }
  const shared = functionalGroups
    ? Object.values(functionalGroups)
        .filter(Boolean)
        .map(it => it[0])
        .filter(it => typeof it === 'object')
    : [];

  // merge the shared first then the per frame to override
  [...shared].forEach(item => {
    if (item.SOPInstanceUID) {
      // This sub-item is a previous value information item, so don't merge it
      return;
    }
    Object.entries(item).forEach(([key, value]) => {
      newInstance[key] = value;
    });
  });
  Object.defineProperty(functionalGroups, '_sharedValue', {
    value: newInstance,
    writable: false,
    enumerable: false,
  });
  return newInstance;
}

export default combineFrameInstance;
