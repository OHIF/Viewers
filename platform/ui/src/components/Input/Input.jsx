import React from 'react';
import PropTypes from 'prop-types';
import Label from '../Label';
import classnames from 'classnames';

const baseInputClasses =
  'shadow transition duration-300 appearance-none border rounded w-full py-2 px-3 text-sm text-gray-700 hover:border-gray-500 leading-tight focus:border-gray-500 focus:outline-none';

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
  id,
  ...otherProps
}) => {
  return (
    <div className={classnames('flex flex-col flex-1', containerClassName)}>
      <Label className={labelClassName} text={label} for={id ? id : ''}></Label>
      <input
        className={classnames(
          className,
          baseInputClasses,
          transparentClasses[transparent]
        )}
        id={id ? id : ''}
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
};

export default Input;
