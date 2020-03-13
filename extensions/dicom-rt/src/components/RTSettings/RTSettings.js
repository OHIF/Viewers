import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Range } from '@ohif/ui';

import './RTSettings.css';

const RTSettings = ({ configuration, onBack, onChange }) => {
  const [state, setState] = useState({
    lineWidth: configuration.lineWidth,
    opacity: configuration.opacity
  });

  const toFloat = value => parseFloat(value / 100).toFixed(2);

  useEffect(() => {
    onChange(state);
  }, [state]);

  const save = (field, value) => {
    setState(state => ({ ...state, [field]: value }));
  };

  return (
    <div className="dcmrt-settings">
      <div className="settings-title">
        <h3>RT Structure Set Settings</h3>
        <button className="return-button" onClick={onBack}>
          Back
        </button>
      </div>
      <div className="range">
        <label htmlFor="range">Opacity</label>
        <Range
          step={1}
          min={0}
          max={100}
          value={state.opacity * 100}
          onChange={event => save('opacity', toFloat(event.target.value))}
        />
      </div>
      <div className="range">
        <label htmlFor="range">Width</label>
        <Range
          step={1}
          min={1}
          max={5}
          value={state.lineWidth}
          onChange={event => save('lineWidth', parseInt(event.target.value))}
        />
      </div>
    </div>
  );
};

RTSettings.propTypes = {
  configuration: PropTypes.shape({
    lineWidth: PropTypes.number.isRequired,
    opacity: PropTypes.number.isRequired,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default RTSettings;
