import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Range } from '@ohif/ui';

import './RTSettings.css';

const RTSettings = ({ configuration, onBack, onChange }) => {
  const toFloat = value => parseFloat(value / 100).toFixed(2);

  const save = (field, value) => {
    onChange({ ...configuration, [field]: value });
  };

  const SettingsSection = ({ title, children }) => {
    return (
      <div className="settings-section">
        <div className="header">{title}</div>
        <div className="content">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="dcmrt-settings">
      <div className="settings-title">
        <h3>RT Structure Set Settings</h3>
        <button className="return-button" onClick={onBack}>
          Back
        </button>
      </div>

      <SettingsSection title="Segment Outline">
        <div className="range">
          <label htmlFor="range">Opacity</label>
          <Range
            showPercentage
            step={1}
            min={0}
            max={100}
            value={configuration.opacity * 100}
            onChange={event => save('opacity', toFloat(event.target.value))}
          />
        </div>
        <div className="range">
          <label htmlFor="range">Width</label>
          <Range
            showValue
            step={1}
            min={1}
            max={5}
            value={configuration.lineWidth}
            onChange={event => save('lineWidth', parseInt(event.target.value))}
          />
        </div>
      </SettingsSection>
    </div>
  );
};

RTSettings.propTypes = {
  configuration: PropTypes.shape({
    lineWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    opacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default RTSettings;
