import { useState, useEffect } from 'react';
import { useViewportRef } from './useViewportRef';
import { useViewportSize } from './useViewportSize';

interface NormalizedBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface MousePosition {
  x: number;
  y: number;
  isInViewport: boolean;
  relativeX: number;
  relativeY: number; // Position as percentage from top (0-1)
  isInBottomPercentage: (percentage: number) => boolean;
  isWithinNormalizedBox?: (normalizedBox: NormalizedBox) => boolean;
}

function useViewportMousePosition(viewportId: string): MousePosition {
  const viewportRef = useViewportRef(viewportId);
  const { width, height, clientRect } = useViewportSize(viewportId);

  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    isInViewport: false,
    relativeY: 0,
    relativeX: 0,
    isInBottomPercentage: (percentage: number) => false,
    isWithinNormalizedBox: (normalizedBox: NormalizedBox) => false,
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

      const relativeX = Math.max(0, Math.min(1, x / width));
      const relativeY = Math.max(0, Math.min(1, y / height));

      const isInBottomPercentage = (percentage: number) => {
        return isWithinNormalizedBox({
          minX: 0,
          minY: 1 - percentage / 100,
          maxX: 1,
          maxY: 1,
        });
      };

      const isWithinNormalizedBox = (normalizedBox: NormalizedBox) => {
        return (
          relativeX >= normalizedBox.minX &&
          relativeX <= normalizedBox.maxX &&
          relativeY >= normalizedBox.minY &&
          relativeY <= normalizedBox.maxY
        );
      };

      setMousePosition({
        x,
        y,
        isInViewport,
        relativeX,
        relativeY,
        isInBottomPercentage,
        isWithinNormalizedBox,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [viewportRef, height, clientRect, width]);

  return mousePosition;
}

export default useViewportMousePosition;
export { useViewportMousePosition };
