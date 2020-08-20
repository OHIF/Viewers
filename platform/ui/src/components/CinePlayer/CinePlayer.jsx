import React, { useState } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import { IconButton, Icon } from '@ohif/ui';

import './CinePlayerCustomInputRange.css';

const CinePlayer = ({
  isPlaying,
  minFrameRate,
  maxFrameRate,
  stepFrameRate,
  frameRate: defaultFrameRate,
  onFrameRateChange,
  onPlayPauseChange,
  onClose
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
    true: { icon: 'old-stop' }
  };

  return (
    <div className="CinePlayer flex flex-row h-10 items-center justify-center border border-primary-light rounded-full">
      <IconButton
        variant="text"
        color="inherit"
        size="initial"
        className="mr-3 ml-4 text-primary-active"
        onClick={onPlayPauseChangeHandler}
      >
        <Icon width="15px" height="15px" name={action[isPlaying].icon} />
      </IconButton>
      <div className="flex flex-col h-full justify-center pt-2 mr-3 pl-1 pr-1">
        <input
          type="range"
          name="frameRate"
          min={minFrameRate}
          max={maxFrameRate}
          step={stepFrameRate}
          value={frameRate}
          onChange={onFrameRateChangeHandler}
        />
        <p className="mt-1 text-sm text-primary-light">{`${frameRate.toFixed(1)} fps`}</p>
      </div>
      <IconButton
        color="inherit"
        size="initial"
        className="mr-3 text-primary-active border border-primary-active rounded-full"
        onClick={onClose}
      >
        <Icon name="close" width="15px" height="15px" />
      </IconButton>
    </div>
  );
};

const noop = () => { };

CinePlayer.defaultProps = {
  isPlaying: false,
  minFrameRate: 1,
  maxFrameRate: 90,
  stepFrameRate: 1,
  frameRate: 24,
  onPlayPauseChange: noop,
  onFrameRateChange: noop,
  onClose: noop
};

CinePlayer.propTypes = {
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

export default CinePlayer;
