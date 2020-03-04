import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const baseClasses =
  'text-center items-center justify-center outline-none transition duration-300 ease-in-out font-bold focus:outline-none';

const defaults = {
  color: 'default',
  disabled: false,
  fullWidth: false,
  rounded: 'medium',
  size: 'medium',
  type: 'button',
  variant: 'contained',
};

const roundedClasses = {
  none: '',
  small: 'rounded',
  medium: 'rounded-md',
  large: 'rounded-lg',
  full: 'rounded-full',
};

const disabledClasses = {
  true: 'cursor-not-allowed',
  false: '',
};

const variantClasses = {
  text: {
    default:
      'text-white hover:bg-custom-aquaBright hover:text-black active:opacity-80 focus:bg-custom-aquaBright focus:text-black',
    primary:
      'text-custom-blue hover:bg-custom-blue hover:text-white active:opacity-80 focus:bg-custom-blue focus:text-white',
    secondary:
      'text-custom-violetPale hover:bg-custom-violetPale hover:text-white active:opacity-80 focus:bg-custom-violetPale focus:text-white',
    white:
      'text-white hover:bg-white hover:text-black active:opacity-80 focus:bg-white focus:text-black',
  },
  outlined: {
    default:
      'border bg-trasparent border-custom-aquaBright text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    primary:
      'border bg-transparent border-custom-blue text-custom-blue hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary:
      'border bg-transparent border-custom-violetPale text-custom-violetPale hover:opacity-80 active:opacity-100 focus:opacity-80',
    white:
      'border bg-transparent border-white text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
  },
  contained: {
    default:
      'bg-custom-aquaBright text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
    primary:
      'bg-custom-blue text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary:
      'bg-custom-violetPale text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    white:
      'bg-white text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
  },
};

const sizeClasses = {
  small: 'py-1 px-3 text-base',
  medium: 'py-3 px-3 text-lg',
  large: 'py-1 px-6 text-xl',
};

const fullWidthClasses = {
  true: 'flex w-full',
  false: 'inline-flex',
};

const IconButton = ({
  children,
  variant = defaults.variant,
  color = defaults.color,
  size = defaults.size,
  rounded = defaults.rounded,
  disabled = defaults.disabled,
  type = defaults.type,
  fullWidth = defaults.fullWidth,
  className,
  ...rest
}) => {
  const buttonElement = useRef(null);

  const handleOnClick = e => {
    buttonElement.current.blur();
    if (rest.onClick) {
      rest.onClick(e);
    }
  };

  return (
    <button
      className={classnames(
        baseClasses,
        variantClasses[variant][color],
        roundedClasses[rounded],
        sizeClasses[size],
        fullWidthClasses[fullWidth],
        disabledClasses[disabled],
        className
      )}
      ref={buttonElement}
      onClick={handleOnClick}
      type={type}
      {...rest}
    >
      {React.cloneElement(children, {
        className: classnames('w-4 h-4 fill-current'),
      })}
    </button>
  );
};

IconButton.propTypes = {
  children: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  rounded: PropTypes.oneOf(['none', 'small', 'medium', 'large', 'full']),
  variant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  color: PropTypes.oneOf(['default', 'primary', 'secondary', 'white']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  className: PropTypes.node,
};

export default IconButton;
