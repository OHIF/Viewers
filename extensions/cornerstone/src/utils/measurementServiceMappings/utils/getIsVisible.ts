import { visibility } from '@cornerstonejs/tools/annotation';

export const getIsVisible = annotationUID => {
  const isVisible = visibility.isAnnotationVisible(annotationUID);
  console.debug('isVisible', isVisible);
  return isVisible;
};
