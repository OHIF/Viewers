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
          'rounded-lg hover:border-primary-light transition duration-300',
          {
            'border-2 border-primary-light -m-px': isActive,
            'border border-secondary-light': !isActive,
          }
        )}
        onClick={() => {
          setActiveViewportIndex(index);
        }}
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
