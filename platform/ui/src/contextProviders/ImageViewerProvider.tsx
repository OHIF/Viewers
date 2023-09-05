import React, { createContext, useContext, useReducer, useMemo } from 'react';

// export const IMAGE_VIEWER_DEFAULT_VALUE = {
//   StudyInstanceUIDs: [],
//   setImageViewer: () => {},
// };

export const ImageViewerContext = createContext();

export function ImageViewerProvider({ StudyInstanceUIDs, reducer, initialState, children }) {
  const value = useMemo(() => {
    return { StudyInstanceUIDs };
  }, [StudyInstanceUIDs]);

  return <ImageViewerContext.Provider value={value}>{children}</ImageViewerContext.Provider>;
}

export const useImageViewer = () => useContext(ImageViewerContext);
