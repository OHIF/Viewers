import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Label = ({ children, className, text, ...rest }) => {
  const baseClasses = '';

  return (
    <label
      className={classnames(baseClasses, className)}
      {...rest}
    >
      {text}
      {children}
    </label>
  );
};

Label.propTypes = {
  children: PropTypes.node,
};

export default Label;
