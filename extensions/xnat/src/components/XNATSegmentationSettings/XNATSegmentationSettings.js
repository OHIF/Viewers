import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import { Range } from '@ohif/ui';
import refreshViewports from '../../utils/refreshViewports';

import './XNATSegmentationSettings.css';

const segmentationModule = csTools.getModule('segmentation');
const { configuration } = segmentationModule;

const XNATSegmentationSettings = ({
  onBack,
}) => {
  const [state, setState] = useState({ ...configuration });

  useEffect(() => {
    const callback = () => setState({ ...configuration });
    document.addEventListener('brushtoolsizechange', callback);

    return () => {
      document.removeEventListener('brushtoolsizechange', callback);
    };
  }, []);

  useEffect(() => {
    refreshViewports();
  }, [state]);

  const check = field => {
    configuration[field] = !configuration[field];
    setState({ ...configuration });
  };

  const save = (field, value) => {
    if (field === 'radius') {
      segmentationModule.setters.radius(value);
    } else {
      configuration[field] = value;
    }
    setState({ ...configuration });
  };

  const toFloat = value => parseFloat(value) / 100;

  const SegmentFill = (
    <div
      className="settings-group"
      style={{ marginBottom: configuration.renderFill ? 15 : 0 }}
    >
      <CustomCheck
        label="Segment Fill"
        checked={configuration.renderFill}
        onChange={() => check('renderFill')}
      />
      {configuration.renderFill && (
        <CustomRange
          label="Opacity"
          step={1}
          min={0}
          max={100}
          value={Number((configuration.fillAlpha * 100).toFixed(0))}
          onChange={event => save('fillAlpha', toFloat(event.target.value))}
          showPercentage
        />
      )}
    </div>
  );

  const SegmentOutline = (
    <div
      className="settings-group"
      style={{ marginBottom: configuration.renderOutline ? 15 : 0 }}
    >
      <CustomCheck
        label="Segment Outline"
        checked={configuration.renderOutline}
        onChange={() => check('renderOutline')}
      />
      {configuration.renderOutline && (
        <>
          <CustomRange
            value={Number((configuration.outlineAlpha * 100).toFixed(0))}
            label="Opacity"
            showPercentage
            step={1}
            min={0}
            max={100}
            onChange={event =>
              save('outlineAlpha', toFloat(event.target.value))
            }
          />
          <CustomRange
            value={configuration.outlineWidth}
            label="Width"
            showValue
            step={1}
            min={0}
            max={5}
            onChange={event =>
              save('outlineWidth', parseInt(event.target.value))
            }
          />
        </>
      )}
    </div>
  );

  const BrushSize = (
    <div className="settings-group" style={{ marginBottom: 15 }}>
      <div className="custom-check">
        <label>Brush Size</label>
      </div>
      <CustomRange
        label="Radius"
        step={1}
        min={configuration.minRadius}
        max={configuration.maxRadius}
        value={configuration.radius}
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
        <input type="checkbox"  className="mousetrap" checked={checked} onChange={onChange} />
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
  onBack: PropTypes.func.isRequired,
};

export default XNATSegmentationSettings;
