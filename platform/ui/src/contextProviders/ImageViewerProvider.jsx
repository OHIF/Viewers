import React, { createContext, useContext, useReducer } from 'react';

// export const IMAGE_VIEWER_DEFAULT_VALUE = {
//   StudyInstanceUIDs: [],
//   setImageViewer: () => {},
// };

export const ImageViewerContext = createContext();

export function ImageViewerProvider({ reducer, initialState, children }) {
  return (
    <ImageViewerContext.Provider value={useReducer(reducer, initialState)}>
      {children}
    </ImageViewerContext.Provider>
  );
}

export const useImageViewer = () => useContext(ImageViewerContext);
