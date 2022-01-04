import React from 'react';
import PropTypes from 'prop-types';
import getIcon from './getIcon';

const Icon = ({ name, className, ...otherProps }) => {
  if (className) {
    return (
      <div className={className}>
        {getIcon(name, className, { ...otherProps })}
      </div>
    );
  }

  return <React.Fragment>{getIcon(name, { ...otherProps })}</React.Fragment>;
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default Icon;
