import React from 'react';
import PropTypes from 'prop-types';
import Label from '../Label';
import classnames from 'classnames';

const baseInputClasses =
  'shadow transition duration-300 appearance-none border rounded w-full py-2 px-3 text-sm text-white hover:border-gray-500 leading-tight focus:border-gray-500 focus:outline-none';

const transparentClasses = {
  true: 'bg-transparent',
  false: '',
};

const Input = ({
  label,
  containerClassName = '',
  labelClassName = '',
  className = '',
  transparent = true,
  type = 'text',
  value,
  onChange,
  onFocus,
  ...otherProps
}) => {
  return (
    <div className={classnames('flex flex-col flex-1', containerClassName)}>
      <Label className={labelClassName} text={label}></Label>
      <input
        className={classnames(
          className,
          baseInputClasses,
          transparentClasses[transparent]
        )}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        {...otherProps}
      />
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  className: PropTypes.string,
  transparent: PropTypes.bool,
  type: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
};

export default Input;
