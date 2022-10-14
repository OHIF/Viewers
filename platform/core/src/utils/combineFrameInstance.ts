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
  } = instance;

  if (PerFrameFunctionalGroupsSequence || NumberOfFrames > 1) {
    const frameNumber = Number.parseInt(frame || 1);
    const shared = (SharedFunctionalGroupsSequence
      ? Object.values(SharedFunctionalGroupsSequence[0])
      : []
    )
      .map(it => it[0])
      .filter(it => it !== undefined && typeof it === 'object');
    const perFrame = (PerFrameFunctionalGroupsSequence
      ? Object.values(PerFrameFunctionalGroupsSequence[frameNumber - 1])
      : []
    )
      .map(it => it[0])
      .filter(it => it !== undefined && typeof it === 'object');

    return Object.assign(
      { frameNumber: frameNumber },
      instance,
      ...Object.values(shared),
      ...Object.values(perFrame)
    );
  } else {
    return instance;
  }
};

export default combineFrameInstance;
