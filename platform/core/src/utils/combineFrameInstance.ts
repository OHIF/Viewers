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
  } = instance;
  if (!PerFrameFunctionalGroupsSequence) return instance;
  const shared = Object.values(SharedFunctionalGroupsSequence[0])
    .map(it => it[0])
    .filter(it => it !== undefined && typeof it === 'object');
  const perFrame = Object.values(
    PerFrameFunctionalGroupsSequence[(frame || 1) - 1]
  )
    .map(it => it[0])
    .filter(it => it !== undefined && typeof it === 'object');
  return Object.assign(
    {},
    instance,
    ...Object.values(shared),
    ...Object.values(perFrame)
  );
};

export default combineFrameInstance;
