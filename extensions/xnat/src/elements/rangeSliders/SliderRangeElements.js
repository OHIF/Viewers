import React, { useState, useEffect } from 'react';
import ReactSlider from 'react-slider';

import './ImageFusionDialog.styl';

const CSOpacityRange = ({ opacity, onOpacityChanged }) => {
  const [value, setValue] = useState(parseInt((opacity * 100).toFixed(0)));
  const bgOpacityValue = 100 - value;
  const fgOpacityValue = 100 - bgOpacityValue;
  return (
    <div className="rangeContainer">
      <div className="labelGroup" title="Background Image">
        <label>BG</label>
        <span>{bgOpacityValue}%</span>
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
        <span>{fgOpacityValue}%</span>
      </div>
    </div>
  );
};

const VTKIntensityRange = ({ rangeInfo, onIntensityRangeChanged, modality }) => {
  const { data, user } = rangeInfo;
  const { lower: dataLower, upper: dataUpper, middle: dataMiddle } = data;
  const { lower, upper, middle } = user;

  let SF = 1;
  let digits = 0;
  if (modality === 'PT') {
    SF = 10000 / (dataUpper - dataLower);
    digits = 2;
  }

  const [value, setValue] = useState([]);

  useEffect(() => {
    setValue([
      intensityToRange(lower, SF),
      intensityToRange(middle, SF),
      intensityToRange(upper, SF),
    ]);
  }, [SF, lower, middle, upper]);

  const getStyle = index => {
    let style;
    switch (index) {
      case 0:
        style = { left: -12 };
        break;
      case 1:
        style = { top: 18, left: -6 };
        break;
      case 2:
        style = { left: +12 };
        break;
      default:
        style = {};
    }
    return style;
  };

  return (
    <div className="rangeContainer">
      <div className="labelGroup" title="Background Image">
        <label>{nFormatter(dataLower, digits)}</label>
      </div>
      <ReactSlider
        min={intensityToRange(dataLower, SF)}
        max={intensityToRange(dataUpper, SF)}
        value={value}
        className="rs-slider widthx2"
        thumbClassName="rs-thumb"
        trackClassName="rs-track"
        markClassName="rs-mark"
        pearling
        minDistance={100}
        renderThumb={(props, state) => (
          <div {...props}>
            <div className="thumbValue" style={getStyle(state.index)}>
              {rangeToIntensity(state.valueNow, SF).toFixed(digits)}
            </div>
          </div>
        )}
        onChange={(value, index) => setValue(value)}
        onAfterChange={(value, index) => {
          const valueArray = rangeToIntensity(value, SF);
          onIntensityRangeChanged(valueArray);
        }}
      />
      <div className="labelGroup" title="Layer Image">
        <label>{nFormatter(dataUpper, digits)}</label>
      </div>
    </div>
  );
};

const VTKOpacityRange = ({ rangeInfo, onOpacityRangeChanged }) => {
  const { opacity, user } = rangeInfo;
  const { lower, upper, middle } = user;

  const [value, setValue] = useState([]);

  useEffect(() => {
    const valueArray = opacityToRange(opacity);
    setValue([...valueArray]);
  }, [opacity, lower, middle, upper]);

  const getStyle = index => {
    let style;
    switch (index) {
      case 0:
        style = { left: -12 };
        break;
      case 1:
        style = { top: 18, left: -6 };
        break;
      case 2:
        style = { left: +12 };
        break;
      default:
        style = {};
    }
    return style;
  };

  return (
    <div className="rangeContainer">
      <div className="labelGroup" title="Background Image">
        <label>0%</label>
      </div>
      <ReactSlider
        min={0}
        max={100}
        value={value}
        marks={[25, 50, 75]}
        className="rs-slider widthx2"
        thumbClassName="rs-thumb"
        trackClassName="rs-track"
        markClassName="rs-mark"
        pearling
        minDistance={1}
        renderThumb={(props, state) => (
          <div {...props}>
            <div className="thumbValue" style={getStyle(state.index)}>
              {state.valueNow}%
            </div>
          </div>
        )}
        onChange={(value, index) => setValue(value)}
        onAfterChange={(value, index) => {
          const valueArray = rangeToOpacity(value);
          onOpacityRangeChanged(valueArray);
        }}
        // onAfterChange={(value, index) => {
        //   const val = rangeToOpacity(value);
        //   console.log(`onAfterChange: ${JSON.stringify({ val, index })}`);
        // }}
      />
      <div className="labelGroup" title="Layer Image">
        <label>100%</label>
      </div>
    </div>
  );
};

//// Utils

function intensityToRange(value, SF) {
  return parseInt((value * SF).toFixed(0));
}

function rangeToIntensity(value, SF) {
  if (Array.isArray(value)) {
    const valueArray = [];
    for (let i = 0; i < value.length; i++) {
      valueArray.push(value[i] / SF);
    }
    return valueArray;
  }

  return value / SF;
}

function opacityToRange(value) {
  if (Array.isArray(value)) {
    const valueArray = [];
    for (let i = 0; i < value.length; i++) {
      valueArray.push(parseInt((value[i] * 100).toFixed(0)));
    }
    return valueArray;
  }

  return parseInt((value * 100).toFixed(0));
}

function rangeToOpacity(value) {
  if (Array.isArray(value)) {
    const valueArray = [];
    for (let i = 0; i < value.length; i++) {
      valueArray.push(parseFloat(value[i]) / 100);
    }
    return valueArray;
  }

  return parseFloat(value) / 100;
}

function nFormatter(num, digits) {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function(item) {
      return Math.abs(num) >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol
    : '0';
}

export { CSOpacityRange, VTKIntensityRange, VTKOpacityRange };
