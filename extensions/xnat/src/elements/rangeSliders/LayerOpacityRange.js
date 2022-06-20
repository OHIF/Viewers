import React, { useState, useEffect } from 'react';
import ReactSlider from './ReactSlider';

import './RangeSlider.styl';

const LayerOpacityRange = ({ opacity, onOpacityChanged }) => {
  const [value, setValue] = useState(50);

  useEffect(() => {
    setValue(parseInt((opacity * 100).toFixed(0)));
  }, [opacity]);

  return (
    <div className="rangeContainer">
      <div className="labelGroup" title="Background Image">
        <label>BG</label>
        <span>{100 - value}%</span>
      </div>
      <ReactSlider
        min={0}
        max={100}
        value={value}
        marks={[50]}
        className="rs-slider"
        thumbClassName="rs-thumb"
        trackClassName="rs-track"
        markClassName="rs-mark"
        onChange={(value, index) => setValue(value)}
        onAfterChange={(value, index) => onOpacityChanged(value)}
      />
      <div className="labelGroup" title="Layer Image">
        <label>FG</label>
        <span>{value}%</span>
      </div>
    </div>
  );
};

export default LayerOpacityRange;
