import React from 'react';
import PropTypes from 'prop-types';

import './BrushColorSelector.css';

const BrushColorSelector = ({ defaultColor, index, onNext, onPrev }) => (
  <div className="dcmseg-brush-color-selector">
    <div
      className="selector-active-segment"
      style={{ backgroundColor: defaultColor }}
    >
      {index}
    </div>
    <div className="selector-buttons">
      <button onClick={onPrev}>
        Previous
      </button>
      <button onClick={onNext}>
        Next
      </button>
    </div>
  </div>
);

BrushColorSelector.propTypes = {
  defaultColor: PropTypes.string.isRequired,
  index: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
};

export default BrushColorSelector;
