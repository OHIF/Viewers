import React from 'react';

const BrushColorSelector = ({ defaultColor, index, onNext, onPrev }) => (
  <div>
    <div
      className="selector-active-segment"
      style={{ backgroundColor: defaultColor }}
    >
      {index}
    </div>
    <div className="selector-buttons">
      <button className="db-button" onClick={onPrev}>
        Previous
      </button>
      <button className="db-button" onClick={onNext}>
        Next
      </button>
    </div>
  </div>
);

export default BrushColorSelector;
