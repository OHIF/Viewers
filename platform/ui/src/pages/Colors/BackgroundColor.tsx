import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export const BackgroundColor = ({ color }) => {
  return (
    <div
      className={classnames(
        `mb-4 flex h-10 w-56 flex-col items-center justify-center text-lg text-white bg-${color} py-8`
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
