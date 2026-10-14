import React, { createContext, useContext, useState, useSyncExternalStore } from 'react';

type ViewportElementRegistry = {
  registerViewport: (viewportId: string, element: HTMLElement) => void;
  unregisterViewport: (viewportId: string) => void;
  getViewportElement: (viewportId: string) => HTMLElement | null;
  subscribe: (listener: () => void) => () => void;
};

const ViewportElementsContext = createContext<ViewportElementRegistry | undefined>(undefined);

/**
 * Per-viewport DOM elements, so that a component which is not a viewport's child
 * can still reach its element - the colorbar and the size and mouse-position
 * hooks all need one. The viewport that owns the element registers it as React
 * attaches it; everyone else looks it up by viewport ID.
 *
 * The registry lives outside React, so registering is not a render. Readers are
 * notified explicitly rather than relying on a re-render happening to occur -
 * see useViewportElement.
 */
function createViewportElementRegistry(): ViewportElementRegistry {
  const viewportElements = new Map<string, HTMLElement>();
  const listeners = new Set<() => void>();

  const notify = () => {
    listeners.forEach(listener => listener());
  };

  return {
    registerViewport: (viewportId: string, element: HTMLElement) => {
      if (viewportElements.get(viewportId) === element) {
        return;
      }
      viewportElements.set(viewportId, element);
      notify();
    },
    unregisterViewport: (viewportId: string) => {
      if (viewportElements.delete(viewportId)) {
        notify();
      }
    },
    getViewportElement: (viewportId: string): HTMLElement | null =>
      viewportElements.get(viewportId) || null,
    subscribe: (listener: () => void) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const ViewportElementsProvider = ({ children }: { children: React.ReactNode }) => {
  // useState rather than useMemo: useMemo is a hint React may discard, and
  // discarding this would throw away every registration in the viewer.
  const [registry] = useState(createViewportElementRegistry);

  return React.createElement(ViewportElementsContext.Provider, { value: registry }, children);
};

function useViewportElementRegistry(): ViewportElementRegistry {
  const registry = useContext(ViewportElementsContext);

  if (registry === undefined) {
    throw new Error('Viewport element hooks must be used within a ViewportElementsProvider');
  }

  return registry;
}

/**
 * The DOM element for a viewport, or null while none is attached. Re-renders the
 * caller when that viewport's element is registered or removed.
 *
 * Notification is registry-wide, but useSyncExternalStore compares the value it
 * reads back, so a caller watching one viewport does not re-render when another
 * viewport registers.
 *
 * The element type is the caller's assertion, as with useRef<T> - the registry
 * itself only knows it holds an HTMLElement.
 */
export function useViewportElement<T extends HTMLElement = HTMLElement>(
  viewportId: string
): T | null {
  const { getViewportElement, subscribe } = useViewportElementRegistry();

  return useSyncExternalStore(subscribe, () => getViewportElement(viewportId)) as T | null;
}

/**
 * For the component that owns a viewport's element. Subscribes to nothing, so
 * registering does not re-render the owner - which matters, because the owner is
 * the viewport itself.
 *
 * `unregister` is returned as a plain function rather than handled by a ref
 * cleanup so that callers keep control of when it runs relative to the rest of
 * their teardown.
 */
export const useViewportElementRegistration = (viewportId: string) => {
  const { registerViewport, unregisterViewport } = useViewportElementRegistry();

  return {
    register: (element: HTMLElement) => registerViewport(viewportId, element),
    unregister: () => unregisterViewport(viewportId),
  };
};
