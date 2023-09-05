import { useEffect } from 'react';

/**
 * A resizeObserver React hook that with useEffect attaches a ResizeObserver to the
 * given element such that the given callback is invoked whenever the element is resized.
 * <p>
 * Care is taken to disconnect the ResizeObserver whenever either the element or the callback change.
 *
 * @param elem the element to listen for resizing
 * @param callback the callback to invoke when the element is resized
 */
const useResizeObserver = (elem: HTMLElement, callback: ResizeObserverCallback): void => {
  useEffect(() => {
    if (!elem || !callback) {
      return;
    }

    const resizeObserver = new ResizeObserver(callback);
    resizeObserver.observe(elem);

    return () => resizeObserver.disconnect();
  }, [elem, callback]);
};

export default useResizeObserver;
