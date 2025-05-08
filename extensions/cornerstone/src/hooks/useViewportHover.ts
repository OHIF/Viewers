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

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [viewportId]);

  useEffect(() => {
    const cleanup = setupListeners();

    return cleanup;
  }, [setupListeners]);

  return { isHovered, isActive };
}
