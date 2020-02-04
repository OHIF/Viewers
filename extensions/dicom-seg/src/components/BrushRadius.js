import React from 'react';
import { Range } from '@ohif/ui';

const BrushRadius = ({ value, onChange, min = 1, max = 50, step = 1 }) => (
  <div className="brush-radius">
    <label htmlFor="brush-radius">Brush Radius</label>
    <Range
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      id="brush-radius"
    />
  </div>
);

export default BrushRadius;
