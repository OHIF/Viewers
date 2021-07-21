import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export const BackgroundColor = ({ color }) => {
  return (
    <div
      className={classnames(
        `mb-4 w-56 h-10 flex items-center justify-center flex-col text-white text-lg bg-${color} py-8`
      )}
    >
      <p>bg-{color}</p>
    </div>
  );
};

BackgroundColor.propTypes = {
  color: PropTypes.string,
};

export default BackgroundColor;
