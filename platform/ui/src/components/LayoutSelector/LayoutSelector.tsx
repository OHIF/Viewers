import React, { useState } from 'react';
import PropTypes from 'prop-types';

function LayoutSelector({ onSelection = () => {}, rows = 3, columns = 4 }) {
  const [hoveredIndex, setHoveredIndex] = useState();
  const hoverX = hoveredIndex % columns;
  const hoverY = Math.floor(hoveredIndex / columns);
  const isHovered = index => {
    const x = index % columns;
    const y = Math.floor(index / columns);

    return x <= hoverX && y <= hoverY;
  };

  const gridSize = '20px ';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: gridSize.repeat(columns),
        gridTemplateRows: gridSize.repeat(rows),
        backgroundColor: '#090c29', // primary-dark
      }}
    >
      {Array.apply(null, Array(rows * columns))
        .map(function (_, i) {
          return i;
        })
        .map(index => (
          <div
            key={index}
            className={`border-primary-dark border ${isHovered(index) ? 'bg-primary-active' : 'bg-[#04225b]'} cursor-pointer`}
            data-cy={`Layout-${index % columns}-${Math.floor(index / columns)}`}
            onClick={() => {
              const x = index % columns;
              const y = Math.floor(index / columns);

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

LayoutSelector.propTypes = {
  onSelection: PropTypes.func.isRequired,
  columns: PropTypes.number.isRequired,
  rows: PropTypes.number.isRequired,
};

export default LayoutSelector;
