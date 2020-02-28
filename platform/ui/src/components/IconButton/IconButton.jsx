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
      'text-white hover:bg-primary-light hover:text-black active:opacity-80 focus:bg-primary-light focus:text-black',
    primary:
      'text-primary-main hover:bg-primary-main hover:text-white active:opacity-80 focus:bg-primary-main focus:text-white',
    secondary:
      'text-darkBlue-100 hover:bg-darkBlue-100 hover:text-white active:opacity-80 focus:bg-darkBlue-100 focus:text-white',
    white:
      'text-white hover:bg-white hover:text-black active:opacity-80 focus:bg-white focus:text-black',
  },
  outlined: {
    default:
      'border bg-trasparent border-primary-light text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    primary:
      'border bg-transparent border-primary-main text-primary-main hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary:
      'border bg-transparent border-darkBlue-100 text-darkBlue-100 hover:opacity-80 active:opacity-100 focus:opacity-80',
    white:
      'border bg-transparent border-white text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
  },
  contained: {
    default:
      'bg-primary-light text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
    primary:
      'bg-primary-main text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary:
      'bg-darkBlue-100 text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
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
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.node,
};

export default IconButton;
