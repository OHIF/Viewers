import { useState, useEffect, useCallback, useMemo } from 'react';
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
    const viewportElement = document.querySelector(`[data-viewportid="${viewportId}"]`);
    const element = viewportElement?.closest('.viewport-wrapper') || viewportElement;

    if (!element) {
      return null;
    }

    let elementRect = (element as HTMLElement).getBoundingClientRect();
    let lastIsInside = false;

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

      if (isInside !== lastIsInside) {
        lastIsInside = isInside;
        setIsHovered(isInside);
      }
    };

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateRect, 10);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousemove', handleMouseMove);

    updateRect();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(resizeTimeout);
    };
  }, [viewportId]);

  useEffect(() => {
    const cleanup = setupListeners();
    return cleanup;
  }, [setupListeners]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({ isHovered, isActive }), [isHovered, isActive]);
}
