import { visibility } from '@cornerstonejs/tools/annotation';

export const getIsVisible = annotationUID => {
  const isVisible = visibility.isAnnotationVisible(annotationUID);
  return isVisible;
};
