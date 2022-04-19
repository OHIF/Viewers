import React from 'react';
import PropTypes from 'prop-types';

function ViewportGrid({ numRows, numCols, layoutType, children }) {
  return (
    <div
      data-cy="viewport-grid"
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

ViewportGrid.propTypes = {
  /** Number of columns */
  numRows: PropTypes.number.isRequired,
  /** Number of rows */
  numCols: PropTypes.number.isRequired,
  layoutType: PropTypes.string,
  /** Array of React Components to render within grid */
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
};

export default ViewportGrid;
