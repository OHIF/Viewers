import { annotation, Enums as csToolsEnums } from '@cornerstonejs/tools';
import { eventTarget as csEventTarget, getEnabledElement } from '@cornerstonejs/core';
import {
  filterAnnotationsForDentalViewport,
  tagAnnotationWithViewport,
} from '../utils/dentalAnnotationFilter';

/**
 * Setup viewport-specific annotation filtering for dental mode
 *
 * This hooks into Cornerstone's annotation creation and rendering events to:
 * 1. Tag new annotations with the viewport ID they were created in
 * 2. Filter annotations during rendering to only show those belonging to each viewport
 *
 * This ensures annotations created in one viewport don't appear in other viewports,
 * even when they display the same image/series data.
 */

let isInitialized = false;

/**
 * Initialize the dental viewport annotation filtering system
 * Call this once during mode initialization
 */
export function initializeDentalAnnotationFiltering(
  servicesManager: AppTypes.ServicesManager
): void {
  if (isInitialized) {
    return;
  }

  const { cornerstoneViewportService } = servicesManager.services;

  // Function to tag annotation with viewport
  const handleAnnotationEvent = (evt: any) => {
    const { annotation: newAnnotation, element } = evt.detail;

    if (newAnnotation && element) {
      try {
        // Get the viewport from the element
        const enabledElement = getEnabledElement(element);
        const viewportId = enabledElement?.viewport?.id;

        if (viewportId) {
          // Tag the annotation with the viewport it was created in
          tagAnnotationWithViewport(newAnnotation.annotationUID, viewportId);

          // Force a re-render to update all viewports
          const renderingEngine = cornerstoneViewportService.getRenderingEngine();
          if (renderingEngine) {
            renderingEngine.render();
          }
        }
      } catch (error) {
        console.warn('Failed to tag annotation with viewport:', error);
      }
    }
  };

  // Listen for annotation completed events and tag them with viewport ID
  csEventTarget.addEventListener(
    csToolsEnums.Events.ANNOTATION_COMPLETED,
    handleAnnotationEvent as EventListener
  );

  // Also listen for annotation added events (catches all annotation types including measurements)
  csEventTarget.addEventListener(
    csToolsEnums.Events.ANNOTATION_ADDED,
    handleAnnotationEvent as EventListener
  );

  // Listen for annotation modified events to maintain viewport tagging
  csEventTarget.addEventListener(csToolsEnums.Events.ANNOTATION_MODIFIED, ((evt: any) => {
    const { annotation: modifiedAnnotation, element } = evt.detail;

    if (modifiedAnnotation && element) {
      try {
        const enabledElement = getEnabledElement(element);
        const viewportId = enabledElement?.viewport?.id;

        if (viewportId && !modifiedAnnotation.metadata?.dentalViewportId) {
          // If annotation doesn't have viewport tag yet, add it
          tagAnnotationWithViewport(modifiedAnnotation.annotationUID, viewportId);
        }
      } catch (error) {
        console.warn('Failed to maintain annotation viewport tag:', error);
      }
    }
  }) as EventListener);

  // Override the annotation rendering to filter by viewport
  // This is a workaround since we can't easily extend all tool classes
  const originalGetAnnotations = annotation.state.getAnnotations;

  annotation.state.getAnnotations = function (toolName: string, element: HTMLDivElement): any[] {
    const annotations = originalGetAnnotations.call(this, toolName, element);

    if (!annotations || !annotations.length) {
      return annotations;
    }

    // Try to get viewport ID from the element
    let viewportId: string | null = null;

    try {
      const enabledElement = getEnabledElement(element);
      viewportId = enabledElement?.viewport?.id;
    } catch (e) {
      // Failed to get viewport ID, return all annotations
      return annotations;
    }

    if (!viewportId) {
      return annotations;
    }

    // Filter annotations to only show those for this viewport
    return filterAnnotationsForDentalViewport(element, annotations, viewportId);
  };

  isInitialized = true;
}

/**
 * Reset the annotation filtering system
 * Useful for testing or mode cleanup
 */
export function resetDentalAnnotationFiltering(): void {
  isInitialized = false;
}
