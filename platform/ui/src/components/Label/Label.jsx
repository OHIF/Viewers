import React from 'react';
import t from 'prop-types';

const Label = ({ children, spacing, className, text, ...rest }) => {
  const baseClasses = 'block text-gray-700 text-sm font-bold';

  const getClasses = () => {
    const classes = [];
    classes.push(baseClasses);
    classes.push(className);
    return classes.join(' ');
  };

  return (
    <div>
      <label className={getClasses()}>
        {text}
        {children}
      </label>
    </div>
  );
};

const spacing = {
  small: 'mb-1',
  medium: 'mb-2',
  large: 'mb-3',
};

Label.defaultProps = {};

Label.prototypes = {};

export default Label;
