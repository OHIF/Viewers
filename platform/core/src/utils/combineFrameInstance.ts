import Combine from './Combine';

/**
 * Combine the Per instance frame data, the shared frame data
 * and the root data objects.
 */
const combineFrameInstance = (frame, instance) => {
  const {
    PerFrameFunctionalGroupsSequence,
    SharedFunctionalGroupsSequence,
  } = instance;
  if (!PerFrameFunctionalGroupsSequence || frame === undefined) return instance;
  const shared = Object.values(SharedFunctionalGroupsSequence[0])
    .map(it => it[0])
    .filter(it => it !== undefined && typeof it === 'object');
  const perFrame = Object.values(PerFrameFunctionalGroupsSequence[frame - 1])
    .map(it => it[0])
    .filter(it => it !== undefined && typeof it === 'object');
  return Combine(
    {},
    instance,
    ...Object.values(shared),
    ...Object.values(perFrame)
  );
};

export default combineFrameInstance;
