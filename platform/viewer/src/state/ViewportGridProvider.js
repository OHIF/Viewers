import React, { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const ViewportGridContext = createContext(null);

export const useViewportGrid = () => useContext(ViewportGridContext);

export default function ViewportGridProvider({ children }) {
  const [viewportGrid, setViewportGrid] = useState({
    rows: 1,
    columns: 1,
    viewports: [],
  });

  const get = () => {
    return viewportGrid;
  };

  const set = ({ rows, columns, viewports }) => {
    setViewportGrid({ rows, columns, viewports });
  };

  return (
    <ViewportGridProvider.Provider value={{ get, set }}>
      {/* {children} */}
    </ViewportGridProvider.Provider>
  );
}

ViewportGridProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default ViewportGridProvider;
