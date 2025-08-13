import React, { ReactNode, createContext, useContext, useMemo } from 'react';

interface ImageViewerProviderProps {
  StudyInstanceUIDs: string[];
  children: ReactNode;
}

export const ImageViewerContext = createContext(null);
export const useImageViewer = () => useContext(ImageViewerContext);

export function ImageViewerProvider({ StudyInstanceUIDs, children }: ImageViewerProviderProps) {
  const value = useMemo(() => {
    return { StudyInstanceUIDs };
  }, [StudyInstanceUIDs]);

  return <ImageViewerContext.Provider value={value}>{children}</ImageViewerContext.Provider>;
}
