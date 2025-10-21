import { useRef, useState, useEffect, RefObject } from 'react';

const _getMovementIntersectionObserver = ({
  callback,
  rootMargin,
  threshold,
}: {
  callback: () => void;
  rootMargin: string;
  threshold: number[];
}): IntersectionObserver => {
  return new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback();
        }
      });
    },
    {
      threshold,
      rootMargin,
    }
  );
};

/**
 * Calculates the maximum height for an element based on its position
 * relative to the bottom of the viewport.
 *
 * @param data The data that, when changed, should trigger a recalculation.
 * @param buffer Optional buffer space (in pixels) to leave below the element. Defaults to 20.
 * @param minHeight Optional minimum height (in pixels) for the element. Defaults to 100.
 * @returns An object containing:
 *  - `ref`: A RefObject to attach to the target DOM element.
 *  - `maxHeight`: The calculated maximum height string (e.g., "500px").
 */
export function useDynamicMaxHeight(
  data: any,
  buffer = 20,
  minHeight = 100
): {
  ref: RefObject<HTMLDivElement>;
  maxHeight: string;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>('100vh'); // Start with full viewport height initially

  useEffect(() => {
    const calculateMaxHeight = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - buffer;
        setMaxHeight(`${Math.max(minHeight, availableHeight)}px`);
      }
    };

    // Two intersection observers to trigger a recalculation when the target element
    // moves up or down. One for moving up and one for moving down.
    // Note that with this approach we don't need to use a resize observer nor
    // a window resize listener.

    // The trick is to use a margin for the IntersectionObserver to detect movement.
    // See more below.
    const rootMarginHeight = maxHeight === '100vh' ? `${window.innerHeight}px` : `${maxHeight}`;

    // Note that we use a fine grained threshold because we don't know how
    // much it will move and we want any movement to trigger the intersection observer.
    const threshold = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

    // The trick here is to use the calculated maxHeight as the root margin height
    // so that any movement of the target element down (i.e. "out of the" viewport)
    // will trigger the intersection observer.
    const moveDownIntersectionObserver = _getMovementIntersectionObserver({
      callback: calculateMaxHeight,
      rootMargin: `0px 0px ${rootMarginHeight} 0px`,
      threshold,
    });

    // The trick here is to use the calculated maxHeight as the negative
    // root margin height so that any movement of the target element up
    // (i.e. "into the" viewport) will trigger the intersection observer.
    const moveUpIntersectionObserver = _getMovementIntersectionObserver({
      callback: calculateMaxHeight,
      rootMargin: `0px 0px -${rootMarginHeight} 0px`,
      threshold,
    });

    if (ref.current) {
      moveUpIntersectionObserver.observe(ref.current);
      moveDownIntersectionObserver.observe(ref.current);
    }

    // Cleanup listener and requestAnimationFrame on component unmount
    return () => {
      moveUpIntersectionObserver.disconnect();
      moveDownIntersectionObserver.disconnect();
    };
    // Dependencies: buffer, minHeight, and data.
  }, [data, buffer, minHeight, maxHeight]);

  return { ref, maxHeight };
}

export default useDynamicMaxHeight;
