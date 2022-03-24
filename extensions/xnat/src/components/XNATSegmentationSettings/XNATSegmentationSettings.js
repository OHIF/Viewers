import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Range } from '@ohif/ui';

import './XNATSegmentationSettings.css';

const XNATSegmentationSettings = ({
  configuration,
  onBack,
  onChange,
  disabledFields = [],
}) => {
  const [state, setState] = useState({
    renderFill: configuration.renderFill,
    renderOutline: configuration.renderOutline,
    shouldRenderInactiveLabelmaps: configuration.shouldRenderInactiveLabelmaps,
    fillAlpha: configuration.fillAlpha,
    outlineAlpha: configuration.outlineAlpha,
    outlineWidth: configuration.outlineWidth,
    fillAlphaInactive: configuration.fillAlphaInactive,
    outlineAlphaInactive: configuration.outlineAlphaInactive,
    radius: configuration.radius,
  });

  useEffect(() => {
    onChange(state);
  }, [state]);

  const check = field => {
    setState(state => ({ ...state, [field]: !state[field] }));
  };

  const save = (field, value) => {
    setState(state => ({ ...state, [field]: value }));
  };

  const toFloat = value => (parseFloat(value) / 100).toFixed(2);

  const SegmentFill = (
    <div
      className="settings-group"
      style={{ marginBottom: state.renderFill ? 15 : 0 }}
    >
      <CustomCheck
        label="Segment Fill"
        checked={state.renderFill}
        onChange={() => check('renderFill')}
      />
      {state.renderFill && (
        <CustomRange
          label="Opacity"
          step={1}
          min={0}
          max={100}
          value={state.fillAlpha * 100}
          onChange={event => save('fillAlpha', toFloat(event.target.value))}
          showPercentage
        />
      )}
    </div>
  );

  const SegmentOutline = (
    <div
      className="settings-group"
      style={{ marginBottom: state.renderOutline ? 15 : 0 }}
    >
      <CustomCheck
        label="Segment Outline"
        checked={state.renderOutline}
        onChange={() => check('renderOutline')}
      />
      {state.renderOutline && (
        <>
          {!disabledFields.includes('outlineAlpha') && (
            <CustomRange
              value={state.outlineAlpha * 100}
              label="Opacity"
              showPercentage
              step={1}
              min={0}
              max={100}
              onChange={event =>
                save('outlineAlpha', toFloat(event.target.value))
              }
            />
          )}
          {!disabledFields.includes('outlineWidth') && (
            <CustomRange
              value={state.outlineWidth}
              label="Width"
              showValue
              step={1}
              min={0}
              max={5}
              onChange={event =>
                save('outlineWidth', parseInt(event.target.value))
              }
            />
          )}
        </>
      )}
    </div>
  );

  const BrushSize = (
    <div
      className="settings-group"
      style={{ marginBottom: 15 }}
    >
      <div className="custom-check">
        <label>Brush Size</label>
      </div>
      <CustomRange
        label="Radius"
        step={1}
        min={configuration.minRadius}
        max={configuration.maxRadius}
        value={state.radius}
        onChange={event => save('radius', parseInt(event.target.value))}
        showValue
      />
    </div>
  );

  return (
    <div className="dcmseg-segmentation-settings">
      <div className="settings-title">
        <h3>Mask ROI Settings</h3>
        <button className="return-button" onClick={onBack}>
          Back
        </button>
      </div>
      {BrushSize}
      {SegmentFill}
      {SegmentOutline}
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

const CustomRange = props => {
  const { label, onChange } = props;
  return (
    <div className="range">
      <label htmlFor="range">{label}</label>
      <Range
        {...props}
        onChange={event => {
          event.persist();
          onChange(event);
        }}
      />
    </div>
  );
};

XNATSegmentationSettings.propTypes = {
  configuration: PropTypes.shape({
    renderFill: PropTypes.bool.isRequired,
    renderOutline: PropTypes.bool.isRequired,
    shouldRenderInactiveLabelmaps: PropTypes.bool.isRequired,
    fillAlpha: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired /* TODO: why fillAlpha is string? */,
    outlineAlpha: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired /* TODO: why fillAlpha is string? */,
    outlineWidth: PropTypes.number.isRequired,
    fillAlphaInactive: PropTypes.number.isRequired,
    outlineAlphaInactive: PropTypes.number.isRequired,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default XNATSegmentationSettings;
