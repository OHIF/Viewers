import React from 'react';
import PropTypes from 'prop-types';

const Label = ({ children, spacing, className, text, ...rest }) => {
  const baseClasses = 'flex flex-1 flex-col text-gray-700 text-sm font-bold';

  const getClasses = () => {
    const classes = [];
    classes.push(baseClasses);
    classes.push(className);
    return classes.join(' ');
  };

  return (
    <label className={getClasses()} {...rest}>
      {text}
      {children}
    </label>
  );
};

const spacing = {
  small: 'mb-1',
  medium: 'mb-2',
  large: 'mb-3',
};

Label.defaultProps = {};

Label.propTypes = {
  children: PropTypes.node,
};

export default Label;
