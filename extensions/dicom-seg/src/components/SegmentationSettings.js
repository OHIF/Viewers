import React, { useState } from 'react';
import { Range } from '@ohif/ui';

import './SegmentationSettings.css';

const SegmentationSettings = ({ segmentation, onBack }) => {
  const [state, setState] = useState({
    segmentFill: true,
    segmentOutline: true,
    renderInactiveSegs: true,
  });

  const check = field => {
    setState(state => ({ ...state, [field]: !state[field] }))
  };

  return (
    <div className="segmentation-settings">
      <div className="settings-title">
        <h3>Segmentations Settings</h3>
        <button className="db-button" onClick={onBack}>
          Back
        </button>
      </div>
      <div
        className="settings-group"
        style={{ marginBottom: state.segmentFill ? 30 : 0 }}
      >
        <CustomCheck
          label="Segment Fill"
          checked={state.segmentFill}
          onChange={() => check('segmentFill')}
        />
        {state.segmentFill && <CustomRange label="Opacity" showPercentage />}
      </div>
      <div
        className="settings-group"
        style={{ marginBottom: state.segmentOutline ? 30 : 0 }}
      >
        <CustomCheck
          label="Segment Outline"
          checked={state.segmentOutline}
          onChange={() => check('segmentOutline')}
        />
        {state.segmentOutline && <CustomRange label="Opacity" showPercentage />}
        {state.segmentOutline && <CustomRange label="Width" showValue />}
      </div>
      <div
        className="settings-group"
        style={{ marginBottom: state.renderInactiveSegs ? 30 : 0 }}
      >
        <CustomCheck
          label="Render inactive segmentations"
          checked={state.renderInactiveSegs}
          onChange={() => check('renderInactiveSegs')}
        />
        {state.renderInactiveSegs && <CustomRange label="Opacity" showPercentage />}
      </div>
    </div>
  );
};

const CustomCheck = ({ label, checked, onChange }) => {
  return (
    <div className="custom-check">
      <label>
        <span>{label}</span>
        <input type="checkbox" checked={checked} onChange={onChange} />
      </label>
    </div>
  );
};

const CustomRange = ({ label, value, onChange, showPercentage, showValue }) => (
  <div className="range">
    <label htmlFor="range">{label}</label>
    <Range
      value={value}
      min={1}
      max={50}
      step={1}
      onChange={onChange}
      id="range"
      showPercentage={showPercentage}
      showValue={showValue}
    />
  </div>
);

export default SegmentationSettings;
