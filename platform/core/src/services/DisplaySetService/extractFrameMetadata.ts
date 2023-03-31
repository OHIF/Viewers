/**
 * Extract frame metadata from a multiframe metadata. All information related to
 * multiframe is removed from the instance metadata
 */
const extractFrameMetadata = (frame, instance) => {
  const {
    PerFrameFunctionalGroupsSequence,
    SharedFunctionalGroupsSequence,
    NumberOfFrames,
    ...rest
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
      NumberOfFrames,
      rest,
      ...Object.values(shared),
      ...Object.values(perFrame)
    );
  } else {
    return instance;
  }
};

/**
 * This function receives a list of multiframe metadata instances, and extracts
 * the frame metadata from them and creates a new list
 * @param instances list of instances with multiframe information
 */
function convertMultiframeInstances(instances) {
  const newInstances = [];
  instances.forEach(instance => {
    if (instance.NumberOfFrames) {
      for (let i = 0; i < instance.NumberOfFrames; i++) {
        const newInstance = extractFrameMetadata(i + 1, instance);
        newInstances.push(newInstance);
      }
    } else {
      newInstances.push(instance);
    }
  });
  return newInstances;
}

export { extractFrameMetadata, convertMultiframeInstances };
