import { locking } from '@cornerstonejs/tools/annotation';

export const getIsLocked = annotationUID => {
  return locking.isAnnotationLocked(annotationUID);
};
