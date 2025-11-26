import { annotation } from '@cornerstonejs/tools';
import { Types } from '@cornerstonejs/core';

/**
 * Dental annotation filtering utilities
 *
 * Since Cornerstone3D stores annotations globally by FrameOfReferenceUID and imageId,
 * we need a custom filtering mechanism to isolate annotations per viewport in dental mode.
 * This is especially important when multiple viewports display images from the same series/study.
 */

const DENTAL_VIEWPORT_METADATA_KEY = 'dentalViewportId';

/**
 * Add viewport-specific metadata to an annotation
 * @param annotationUID - The UID of the annotation
 * @param viewportId - The viewport ID to associate with this annotation
 */
export function tagAnnotationWithViewport(annotationUID: string, viewportId: string): void {
  const annotationObj = annotation.state.getAnnotation(annotationUID);

  if (annotationObj && annotationObj.metadata) {
    // Add viewport metadata to track which viewport this annotation belongs to
    annotationObj.metadata[DENTAL_VIEWPORT_METADATA_KEY] = viewportId;
  }
}

/**
 * Filter annotations to only show those belonging to the specified viewport
 * @param element - The HTML element of the viewport
 * @param annotations - Array of annotations to filter
 * @param viewportId - The viewport ID to filter for
 * @returns Filtered array of annotations
 */
export function filterAnnotationsForDentalViewport(
  element: HTMLElement,
  annotations: any[],
  viewportId: string
): any[] {
  if (!annotations || !annotations.length) {
    return [];
  }

  // Filter annotations to only include those tagged with this viewport
  return annotations.filter(ann => {
    const annViewportId = ann.metadata?.[DENTAL_VIEWPORT_METADATA_KEY];

    // Only show annotations that belong to this specific viewport
    // Don't show annotations without viewport metadata (strict filtering for dental mode)
    return annViewportId === viewportId;
  });
}

/**
 * Get all annotations for a specific viewport
 * @param viewportId - The viewport ID
 * @returns Array of annotations belonging to this viewport
 */
export function getAnnotationsForViewport(viewportId: string): any[] {
  const allAnnotations = annotation.state.getAllAnnotations();

  return allAnnotations.filter(ann => {
    const annViewportId = ann.metadata?.[DENTAL_VIEWPORT_METADATA_KEY];
    return annViewportId === viewportId;
  });
}

/**
 * Remove all annotations for a specific viewport
 * @param viewportId - The viewport ID
 */
export function removeAllAnnotationsForViewport(viewportId: string): void {
  const annotationsToRemove = getAnnotationsForViewport(viewportId);

  annotationsToRemove.forEach(ann => {
    annotation.state.removeAnnotation(ann.annotationUID);
  });
}
