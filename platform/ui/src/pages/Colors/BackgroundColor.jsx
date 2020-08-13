import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import tailwindConfig from './tailwind.config';

const BackgroundColor = ({ color }) => {
  const getColorValue = () => {
    const currentColor = color.split('-');
    const { colors } = tailwindConfig.theme;
    return colors[currentColor[0]][currentColor[1]];
  };
  return (
    <div
      className={classnames(
        `mb-4 w-56 h-10 flex items-center justify-center flex-col text-white text-lg bg-${color} py-8`
      )}
    >
      <p>{getColorValue()}</p>
      <p>bg-{color}</p>
    </div>
  );
};

BackgroundColor.propTypes = {
  color: PropTypes.string,
};

export default BackgroundColor;
