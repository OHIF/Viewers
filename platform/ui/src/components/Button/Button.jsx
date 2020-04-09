import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const baseClasses =
  'min-w-md leading-none font-sans text-center justify-center items-center outline-none transition duration-300 ease-in-out focus:outline-none';

const defaults = {
  variant: 'contained',
  color: 'default',
  size: 'medium',
  radius: 'medium',
  disabled: false,
  type: 'button',
};

const radiusClasses = {
  none: '',
  small: 'rounded-sm',
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
      'text-primary-light hover:bg-primary-light hover:text-white active:opacity-80 focus:bg-primary-light focus:text-white',
    primary:
      'text-primary-main hover:bg-primary-main hover:text-white active:opacity-80 focus:bg-primary-main focus:text-white',
    secondary:
      'text-secondary-light hover:bg-secondary-light hover:text-white active:opacity-80 focus:bg-secondary-light focus:text-white',
    white:
      'text-white hover:bg-white hover:text-black active:opacity-80 focus:bg-white focus:text-black',
  },
  outlined: {
    default:
      'border bg-trasparent border-primary-light text-primary-light hover:bg-primary-light hover:text-black focus:text-black focus:bg-primary-light active:opacity-80',
    primary:
      'border bg-transparent border-primary-main text-primary-main hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary:
      'border bg-transparent border-secondary-light text-secondary-light hover:opacity-80 active:opacity-100 focus:opacity-80',
    white:
      'border bg-transparent border-white text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
  },
  contained: {
    default:
      'bg-primary-light text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
    primary:
      'bg-primary-main text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    secondary:
      'bg-secondary-light text-white hover:opacity-80 active:opacity-100 focus:opacity-80',
    white:
      'bg-white text-black hover:opacity-80 active:opacity-100 focus:opacity-80',
  },
};

const sizeClasses = {
  small: 'py-2 px-2 text-sm',
  medium: 'py-2 px-2 text-lg',
  large: 'py-2 px-6 text-xl',
  initial: '',
};

const fullWidthClasses = {
  true: 'flex w-full',
  false: 'inline-flex',
};

const Button = ({
  children,
  variant = defaults.variant,
  color = defaults.color,
  size = defaults.size,
  radius = defaults.radius,
  disabled = defaults.disabled,
  type = defaults.type,
  fullWidth = defaults.fullWidth,
  startIcon: startIconProp,
  endIcon: endIconProp,
  className,
  ...rest
}) => {
  const baseClasses =
    'inline-flex items-center outline-none transition duration-300 ease-in-out font-bold focus:outline-none';

  const startIcon = startIconProp && (
    <div className="mr-2">{startIconProp}</div>
  );

  const handleOnClick = e => {
    buttonElement.current.blur();
    if (rest.onClick) {
      rest.onClick(e);
    }
  };

  return (
    <button
      className={classnames(
        className,
        baseClasses,
        variantClasses[variant][color],
        radiusClasses[radius],
        sizeClasses[size],
        fullWidthClasses[fullWidth],
        disabledClasses[disabled]
      )}
      type={type}
      {...rest}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'initial']),
  rounded: PropTypes.oneOf(['none', 'small', 'medium', 'large', 'full']),
  variant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  color: PropTypes.oneOf([
    'default',
    'primary',
    'secondary',
    'white',
    'inherit',
  ]),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.string,
};

export default Button;
