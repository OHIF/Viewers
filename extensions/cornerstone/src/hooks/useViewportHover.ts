import { useState, useEffect, useCallback } from 'react';
import { useViewportGrid } from '@ohif/ui-next';

/**
 * Hook to track whether the mouse is hovering over a specific viewport
 * and whether the viewport is active
 *
 * @param viewportId - The ID of the viewport to track
 * @returns { isHovered, isActive } - Whether the viewport is hovered and active
 */
export function useViewportHover(viewportId: string): { isHovered: boolean; isActive: boolean } {
  const [isHovered, setIsHovered] = useState(false);
  const [viewportGrid] = useViewportGrid();
  const { activeViewportId } = viewportGrid;

  const isActive = activeViewportId === viewportId;

  const setupListeners = useCallback(() => {
    const viewportElement = document.querySelector(`[data-viewportId="${viewportId}"]`);
    const element = viewportElement?.closest('.viewport-wrapper') || viewportElement;

    if (!element) {
      return null;
    }

    let elementRect = (element as HTMLElement).getBoundingClientRect();

    // Update rectangle when window is resized
    const updateRect = () => {
      elementRect = (element as HTMLElement).getBoundingClientRect();
    };

    const isPointInViewport = (x, y) => {
      return (
        x >= elementRect.left &&
        x <= elementRect.right &&
        y >= elementRect.top &&
        y <= elementRect.bottom
      );
    };

    const handleMouseMove = event => {
      const isInside = isPointInViewport(event.clientX, event.clientY);
      setIsHovered(isInside);
    };

    window.addEventListener('resize', updateRect);
    document.addEventListener('mousemove', handleMouseMove);

    updateRect();

    return () => {
      window.removeEventListener('resize', updateRect);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [viewportId]);

  useEffect(() => {
    const cleanup = setupListeners();

    return cleanup;
  }, [setupListeners]);

  return { isHovered, isActive };
}
