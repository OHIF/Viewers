import React, { useState } from 'react';
import PropTypes from 'prop-types';

function LayoutSelector({ onSelection }) {
  const [hoveredIndex, setHoveredIndex] = useState();
  const hoverX = hoveredIndex % 3;
  const hoverY = Math.floor(hoveredIndex / 3);
  const isHovered = index => {
    const x = index % 3;
    const y = Math.floor(index / 3);

    return x <= hoverX && y <= hoverY;
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 20px 20px',
        gridTemplateRows: '20px 20px 20px',
        backgroundColor: '#090c29', // primary-dark
      }}
      className="p-2"
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(index => (
        <div
          key={index}
          style={{
            border: '1px solid white',
            backgroundColor: isHovered(index) ? '#5acce6' : '#0b1a42',
          }}
          className="cursor-pointer"
          onClick={() => {
            const x = index % 3;
            const y = Math.floor(index / 3);

            onSelection({
              numRows: y + 1,
              numCols: x + 1,
            });
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(-1)}
        ></div>
      ))}
    </div>
  );
}

LayoutSelector.defaultProps = {
  onSelection: () => {},
};

LayoutSelector.propTypes = {
  onSelection: PropTypes.func.isRequired,
};

export default LayoutSelector;
