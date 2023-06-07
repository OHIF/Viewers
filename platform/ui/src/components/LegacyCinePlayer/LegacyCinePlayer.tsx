import React, { useState } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import IconButton from '../IconButton';
import Icon from '../Icon';

import './LegacyCinePlayerCustomInputRange.css';

const LegacyCinePlayer = ({
  isPlaying,
  minFrameRate,
  maxFrameRate,
  stepFrameRate,
  frameRate: defaultFrameRate,
  onFrameRateChange,
  onPlayPauseChange,
  onClose,
}) => {
  const [frameRate, setFrameRate] = useState(defaultFrameRate);
  const debouncedSetFrameRate = debounce(onFrameRateChange, 300);

  const onFrameRateChangeHandler = ({ target }) => {
    const frameRate = parseFloat(target.value);
    debouncedSetFrameRate(frameRate);
    setFrameRate(frameRate);
  };

  const onPlayPauseChangeHandler = () => onPlayPauseChange(!isPlaying);

  const action = {
    false: { icon: 'old-play' },
    true: { icon: 'old-stop' },
  };

  return (
    <div className="flex flex-row items-center justify-center h-10 border rounded-full LegacyCinePlayer border-primary-light">
      <IconButton
        variant="text"
        color="inherit"
        size="initial"
        className="ml-4 mr-3 text-primary-active"
        onClick={onPlayPauseChangeHandler}
      >
        <Icon width="15px" height="15px" name={action[isPlaying].icon} />
      </IconButton>
      <div className="flex flex-col justify-center h-full pt-2 pl-1 pr-1 mr-3">
        <input
          type="range"
          name="frameRate"
          min={minFrameRate}
          max={maxFrameRate}
          step={stepFrameRate}
          value={frameRate}
          onChange={onFrameRateChangeHandler}
        />
        <p className="-mt-2 text-sm text-primary-light">{`${frameRate.toFixed(
          1
        )} fps`}</p>
      </div>
      <IconButton
        color="inherit"
        size="initial"
        className="mr-3 border rounded-full text-primary-active border-primary-active"
        onClick={onClose}
      >
        <Icon name="close" />
      </IconButton>
    </div>
  );
};

const noop = () => {};

LegacyCinePlayer.defaultProps = {
  isPlaying: false,
  minFrameRate: 1,
  maxFrameRate: 90,
  stepFrameRate: 1,
  frameRate: 24,
  onPlayPauseChange: noop,
  onFrameRateChange: noop,
  onClose: noop,
};

LegacyCinePlayer.propTypes = {
  /** Minimum value for range slider */
  minFrameRate: PropTypes.number.isRequired,
  /** Maximum value for range slider */
  maxFrameRate: PropTypes.number.isRequired,
  /** Increment range slider can "step" in either direction */
  stepFrameRate: PropTypes.number.isRequired,
  frameRate: PropTypes.number.isRequired,
  /** 'true' if playing, 'false' if paused */
  isPlaying: PropTypes.bool.isRequired,
  onPlayPauseChange: PropTypes.func,
  onFrameRateChange: PropTypes.func,
  onClose: PropTypes.func,
};

export default LegacyCinePlayer;
