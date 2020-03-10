import React from 'react';
import Label from '../Label';

const Input = ({
  label,
  containerClassName = '',
  labelClassName = '',
  className = '',
  transparent = defaults.transparent,
  ...rest
}) => {
  const getClasses = () => {
    const classes = [];

    classes.push(transparentClasses[transparent]);

    return classes.join(' ');
  };

  const input = (
    <input
      className={`shadow transition duration-300 appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 hover:border-gray-500 leading-tight focus:border-gray-500 focus:outline-none ${getClasses()} ${className}`}
      id="id"
      {...rest}
    />
  );

  const renderElement = () => {
    return label ? (
      <Label className={labelClassName} text={label}>
        {input}
      </Label>
    ) : (
      input
    );
  };

  return <div className={`flex ${containerClassName}`}>{renderElement()}</div>;
};

const defaults = {
  transparent: true,
};

const transparentClasses = {
  true: 'bg-transparent',
  false: '',
};

export default Input;
