import React, { createContext, useContext, useRef } from 'react';

type ViewportRefsContextType = {
  registerViewport: (viewportId: string, element: HTMLElement) => void;
  unregisterViewport: (viewportId: string) => void;
  getViewportElement: (viewportId: string) => HTMLElement | null;
  viewportRefs: Map<string, HTMLElement>;
};

// comment
const ViewportRefsContext = createContext<ViewportRefsContextType | undefined>(undefined);

export const ViewportRefsProvider = ({ children }: { children: React.ReactNode }) => {
  const viewportRefsRef = useRef<Map<string, HTMLElement>>(new Map());

  const registerViewport = (viewportId: string, element: HTMLElement) => {
    viewportRefsRef.current.set(viewportId, element);
  };

  const unregisterViewport = (viewportId: string) => {
    viewportRefsRef.current.delete(viewportId);
  };

  const getViewportElement = (viewportId: string): HTMLElement | null => {
    return viewportRefsRef.current.get(viewportId) || null;
  };

  const contextValue: ViewportRefsContextType = {
    registerViewport,
    unregisterViewport,
    getViewportElement,
    viewportRefs: viewportRefsRef.current,
  };

  return React.createElement(ViewportRefsContext.Provider, { value: contextValue }, children);
};

export const useViewportRefs = () => {
  const context = useContext(ViewportRefsContext);

  if (context === undefined) {
    throw new Error('useViewportRefs must be used within a ViewportRefsProvider');
  }

  return context;
};

export const useViewportRef = (viewportId: string) => {
  const { registerViewport, unregisterViewport, getViewportElement } = useViewportRefs();

  const ref = {
    current: getViewportElement(viewportId),
    register: (element: HTMLElement) => registerViewport(viewportId, element),
    unregister: () => unregisterViewport(viewportId),
  };

  return ref;
};
