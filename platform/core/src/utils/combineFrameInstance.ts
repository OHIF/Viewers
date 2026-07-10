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
 *
 * Note: instances carry non-enumerable runtime props (frameNumber, imageId,
 * url, wadoRoot, ...). This is intentional: dcmjs serialization skips them and
 * spreads/copies (including of anything from `metaData.get('instance', ...)`)
 * deliberately do not carry them — frameNumber in particular must not be
 * copied onto other objects. Read runtime props off the original instance.
 */
const combineFrameInstance = (frame, instance) => {
  const {
    PerFrameFunctionalGroupsSequence,
    SharedFunctionalGroupsSequence,
    NumberOfFrames,
    ImageType,
  } = instance;

  if (NumberOfFrames < 2) {
    // Return a fresh proxy so callers can set properties (eg. imageId)
    // without mutating the shared `instance` stored in DicomMetadataStore.
    return Object.create(instance);
  }

  instance.ImageType = dicomSplit(ImageType);
  const frameNumber = Number.parseInt(frame || 1);

  const hasDetectorButMissingSpatialInfo =
    instance.DetectorInformationSequence &&
    (!instance.ImagePositionPatient || !instance.ImageOrientationPatient);

  if (
    (PerFrameFunctionalGroupsSequence && SharedFunctionalGroupsSequence) ||
    hasDetectorButMissingSpatialInfo ||
    NumberOfFrames > 1
  ) {
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

      imagePositionPatient = imagePositionPatient?.map(it => Number(it));
      imageOrientationPatient = imageOrientationPatient?.map(it => Number(it));
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

    // Cache the _parentInstance at the top level as a full copy to prevent
    // setting values hard.
    if (!instance._parentInstance) {
      Object.defineProperty(instance, '_parentInstance', {
        value: { ...instance },
        enumerable: false,
        writable: false,
        configurable: false,
      });
    }
    const sharedInstance = createCombinedValue(
      instance._parentInstance,
      SharedFunctionalGroupsSequence?.[0],
      '_shared'
    );
    const newInstance = createCombinedValue(
      sharedInstance,
      PerFrameFunctionalGroupsSequence?.[frameNumber - 1],
      frameNumber
    );

    newInstance.ImagePositionPatient = ImagePositionPatientToUse ??
      newInstance.ImagePositionPatient ?? [0, 0, frameNumber];

    Object.defineProperty(newInstance, 'frameNumber', {
      value: frameNumber,
      writable: true,
      enumerable: false,
      configurable: true,
    });
    return newInstance;
  }

  // For RTDOSE datasets
  if (instance.GridFrameOffsetVector) {
    if (!instance._parentInstance) {
      Object.defineProperty(instance, '_parentInstance', {
        value: { ...instance },
        enumerable: false,
        writable: false,
        configurable: false,
      });
    }

    const sharedInstance = createCombinedValue(
      instance._parentInstance,
      SharedFunctionalGroupsSequence?.[0],
      '_shared'
    );

    const newInstance = createCombinedValue(
      sharedInstance,
      PerFrameFunctionalGroupsSequence?.[frameNumber - 1],
      frameNumber
    );

    const origin = newInstance.ImagePositionPatient?.map(Number);
    const orientation = newInstance.ImageOrientationPatient?.map(Number);
    const offset = Number(instance.GridFrameOffsetVector[frameNumber - 1]);

    if (origin && orientation && !Number.isNaN(offset)) {
      const row = vec3.fromValues(orientation[0], orientation[1], orientation[2]);
      const col = vec3.fromValues(orientation[3], orientation[4], orientation[5]);
      const normal = vec3.cross(vec3.create(), row, col);

      const position = vec3.scaleAndAdd(vec3.create(), vec3.fromValues(...origin), normal, offset);
      newInstance.ImagePositionPatient = [position[0], position[1], position[2]];
    }

    Object.defineProperty(newInstance, 'frameNumber', {
      value: frameNumber,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    return newInstance;
  }

  return instance;
};

/**
 * Creates a combined instance stored in the parent object which
 * inherits from the parent instance the attributes in the functional groups.
 * The storage key in the parent is in key
 */
function createCombinedValue(parent, functionalGroups, key) {
  // Ensure there's a cached template on the parent (a non-writable, non-enumerable object)
  if (!parent[key]) {
    const templateInstance = Object.create(parent);
    Object.defineProperty(parent, key, {
      value: templateInstance,
      writable: false,
      enumerable: false,
    });

    if (functionalGroups) {
      const shared = Object.values(functionalGroups)
        .filter(Boolean)
        .map(it => it[0])
        .filter(it => typeof it === 'object');

      // merge the shared/per-frame attributes onto the template
      [...shared].forEach(item => {
        if (item.SOPInstanceUID) {
          // This sub-item is a previous value information item, so don't merge it
          return;
        }
        Object.entries(item).forEach(([k, value]) => {
          templateInstance[k] = value;
        });
      });
    }
  }

  // Return a fresh object that inherits from the cached template so
  // mutations by the caller do not affect the cached template.
  return Object.create(parent[key]);
}

export default combineFrameInstance;
