import { annotation as cs3dToolAnnotationUtils } from '@cornerstonejs/tools';

/**
 * Check whether an annotation from imaging library is selected or not.
 * @param {string} annotationUID uid of imaging library annotation
 * @returns boolean
 */
function isAnnotationSelected(annotationUID: string): boolean {
  return cs3dToolAnnotationUtils.selection.isAnnotationSelected(annotationUID);
}

/**
 * Change an annotation from imaging library's selected property.
 * @param annotationUID - uid of imaging library annotation
 * @param selected - new value for selected
 */
function setAnnotationSelected(annotationUID: string, selected: boolean): void {
  const isCurrentSelected = isAnnotationSelected(annotationUID);
  // branch cut, avoid invoking imaging library unnecessarily.
  if (isCurrentSelected !== selected) {
    cs3dToolAnnotationUtils.selection.setAnnotationSelected(annotationUID, selected);
  }
}

function getFirstAnnotationSelected(element) {
  const [selectedAnnotationUID] = cs3dToolAnnotationUtils.selection.getAnnotationsSelected() || [];

  if (selectedAnnotationUID) {
    return cs3dToolAnnotationUtils.state.getAnnotation(selectedAnnotationUID);
  }
}

export { isAnnotationSelected, setAnnotationSelected, getFirstAnnotationSelected };
