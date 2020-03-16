import React from 'react';
import PropTypes from 'prop-types';
import { Range } from '@ohif/ui';

import './BrushRadius.css';

const BrushRadius = ({ value, onChange, min, max, step }) => (
  <div className="dcmseg-brush-radius">
    <label htmlFor="dcmseg-brush-radius">Brush Radius</label>
    <Range
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      id="dcmseg-brush-radius"
    />
  </div>
);

BrushRadius.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
};

BrushRadius.defaultProps = {
  onChange: () => { },
  min: 1,
  max: 50,
  step: 1,
};

export default BrushRadius;
