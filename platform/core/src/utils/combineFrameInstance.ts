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
  const { PerFrameFunctionalGroupsSequence, SharedFunctionalGroupsSequence, NumberOfFrames } =
    instance;

  if (PerFrameFunctionalGroupsSequence || NumberOfFrames > 1) {
    const frameNumber = Number.parseInt(frame || 1);
    const shared = (
      SharedFunctionalGroupsSequence ? Object.values(SharedFunctionalGroupsSequence[0]) : []
    )
      .filter(it => !!it)
      .map(it => it[0])
      .filter(it => it !== undefined && typeof it === 'object');
    const perFrame = (
      PerFrameFunctionalGroupsSequence
        ? Object.values(PerFrameFunctionalGroupsSequence[frameNumber - 1])
        : []
    )
      .filter(it => !!it)
      .map(it => it[0])
      .filter(it => it !== undefined && typeof it === 'object');

    // this is to fix NM multiframe datasets with position and orientation
    // information inside DetectorInformationSequence
    if (!instance.ImageOrientationPatient && instance.DetectorInformationSequence) {
      instance.ImageOrientationPatient =
        instance.DetectorInformationSequence[0].ImageOrientationPatient;
    }
    if (!instance.ImagePositionPatient && instance.DetectorInformationSequence) {
      instance.ImagePositionPatient = instance.DetectorInformationSequence[0].ImagePositionPatient;
    }

    const newInstance = Object.assign(instance, { frameNumber: frameNumber });

    // merge the shared first then the per frame to override
    [...shared, ...perFrame].forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        newInstance[key] = value;
      });
    });

    // Todo: we should cache this combined instance somewhere, maybe add it
    // back to the dicomMetaStore so we don't have to do this again.
    return newInstance;
  } else {
    return instance;
  }
};

export default combineFrameInstance;
