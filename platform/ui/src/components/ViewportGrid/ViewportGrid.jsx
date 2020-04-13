import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const ViewportGrid = ({ rows, cols, viewportContents }) => {
  const ViewportPanes = viewportContents.map((viewportContent, index) => {
    const isActive = index === activeViewportIndex;
    return (
      <div
        key={index}
        className={classnames(
          'border rounded-lg border-secondary-light hover:border-primary-light transition duration-300'
        )}
      >
        {viewportContent}
      </div>
    );
  });

  return (
    <div
      className={classnames(
        'h-full w-full grid gap-2',
        `grid-cols-${cols}`,
        `grid-rows-${rows}`
      )}
    >
      {ViewportPanes}
    </div>
  );
};

ViewportGrid.propTypes = {
  rows: PropTypes.number.isRequired,
  cols: PropTypes.number.isRequired,
  viewportContents: PropTypes.arrayOf(PropTypes.node),
};

export default ViewportGrid;
