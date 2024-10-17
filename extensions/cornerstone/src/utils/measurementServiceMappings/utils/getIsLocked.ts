import { locking } from '@cornerstonejs/tools/annotation';
import { Annotation } from '@cornerstonejs/tools/types';

export const getIsLocked = (annotation: Annotation) => {
  return locking.isAnnotationLocked(annotation);
};
