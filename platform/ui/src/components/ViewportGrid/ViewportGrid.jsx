import React from 'react';
import PropTypes from 'prop-types';

function ViewportGrid({ numRows, numCols, children }) {
  const rowSize = 100 / numRows;
  const colSize = 100 / numCols;

  return (
    <div
      data-cy="viewport-grid"
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${numRows}, ${rowSize}%)`,
        gridTemplateColumns: `repeat(${numCols}, ${colSize}%)`,
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
  /** Array of React Components to render within grid */
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
};

export default ViewportGrid;
