import { useState, useEffect } from 'react';
import { useViewportRef } from './useViewportRef';
import { useViewportSize } from './useViewportSize';

interface MousePosition {
  x: number;
  y: number;
  isInViewport: boolean;
  relativeY: number; // Position as percentage from top (0-1)
  isInBottomPercentage: (percentage: number) => boolean;
}

function useViewportMousePosition(viewportId: string): MousePosition {
  const viewportRef = useViewportRef(viewportId);
  const { height, clientRect } = useViewportSize(viewportId);

  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    isInViewport: false,
    relativeY: 0,
    isInBottomPercentage: (percentage: number) => false,
  });

  useEffect(() => {
    if (!viewportRef.current) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!clientRect) {
        return;
      }

      // Get mouse position relative to viewport
      const x = event.clientX - clientRect.left;
      const y = event.clientY - clientRect.top;

      const isInViewport = x >= 0 && x <= clientRect.width && y >= 0 && y <= clientRect.height;

      const relativeY = Math.max(0, Math.min(1, y / height));

      const isInBottomPercentage = (percentage: number) => {
        return relativeY >= 1 - percentage / 100;
      };

      setMousePosition({
        x,
        y,
        isInViewport,
        relativeY,
        isInBottomPercentage,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [viewportRef, height, clientRect]);

  return mousePosition;
}

export default useViewportMousePosition;
export { useViewportMousePosition };
