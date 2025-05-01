import React from 'react';
import PropTypes from 'prop-types';

/**
 * A minimal top-level container that organizes multiple <ViewportPane>
 * children in a grid. Typically driven by a layout config.
 */
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
  numRows: PropTypes.number.isRequired,
  numCols: PropTypes.number.isRequired,
  layoutType: PropTypes.string,
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
};

export { ViewportGrid };
