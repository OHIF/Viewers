import React from 'react';
import classnames from 'classnames';

interface LabelProps {
  children?: React.ReactNode;
}

const Label = ({
  children,
  className,
  text,
  ...rest
}: LabelProps) => {
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

export default Label;
