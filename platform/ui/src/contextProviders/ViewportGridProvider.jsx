import React, { createContext, useContext, useReducer } from 'react';

// export const VIEWPORT_GRID_DEFAULT_VALUE = {
//   numCols: 1,
//   numRows: 1,
//   activeViewportIndex: 0,
//   viewports: [],
// };

export const ViewportGridContext = createContext();

export function ViewportGridProvider({ reducer, initialState, children }) {
  return (
    <ViewportGridContext.Provider value={useReducer(reducer, initialState)}>
      {children}
    </ViewportGridContext.Provider>
  );
}

export const useViewportGrid = () => useContext(ViewportGridContext);
