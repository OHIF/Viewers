import { useEffect, useState, useCallback, useMemo } from 'react';
import { useViewportElement } from './';

interface ViewportSize {
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
  clientRect: DOMRect | null;
  isVisible: boolean;
}

/**
 * Hook that provides viewport size dimensions and monitors for changes
 * @param viewportId - The ID of the viewport to monitor
 * @returns ViewportSize object containing width, height, and visibility info
 */
function useViewportSize(viewportId: string): ViewportSize {
  const element = useViewportElement(viewportId);

  const [size, setSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
    offsetLeft: 0,
    offsetTop: 0,
    clientRect: null,
    isVisible: false,
  });

  // Update viewport dimensions
  const updateViewportSize = useCallback(() => {
    if (!element) {
      return;
    }

    const clientRect = element.getBoundingClientRect();
    const newWidth = clientRect.width;
    const newHeight = clientRect.height;
    const newOffsetLeft = element.offsetLeft;
    const newOffsetTop = element.offsetTop;
    const newIsVisible = newWidth > 0 && newHeight > 0;

    setSize(prevSize => {
      if (
        prevSize.width === newWidth &&
        prevSize.height === newHeight &&
        prevSize.offsetLeft === newOffsetLeft &&
        prevSize.offsetTop === newOffsetTop &&
        prevSize.isVisible === newIsVisible
      ) {
        return prevSize;
      }

      return {
        width: newWidth,
        height: newHeight,
        offsetLeft: newOffsetLeft,
        offsetTop: newOffsetTop,
        clientRect,
        isVisible: newIsVisible,
      };
    });
  }, [element]);

  useEffect(() => {
    if (!viewportId || !element) {
      return;
    }

    // observe() fires the callback with the current size, so the initial
    // measurement happens here too - and measuring in the effect body would set
    // state synchronously during the effect.
    const resizeObserver = new ResizeObserver(() => {
      updateViewportSize();
    });

    resizeObserver.observe(element);

    window.addEventListener('resize', updateViewportSize);

    return () => {
      window.removeEventListener('resize', updateViewportSize);

      resizeObserver.unobserve(element);
      resizeObserver.disconnect();
    };
  }, [viewportId, element, updateViewportSize]);

  const memoizedSize = useMemo(() => size, [size]);

  return memoizedSize;
}

export default useViewportSize;
export { useViewportSize };
